from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
import pyotp
import uuid
from pydantic import BaseModel
from database import get_db
from models import Empresa, Usuario

# ================= CONFIGURACIÓN =================
SECRET_KEY = "FACTURACION_LLAVE_MAESTRA_PARA_JWT" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
router = APIRouter(tags=["Autenticacion"])

# ================= SCHEMAS =================
class RegistroSchema(BaseModel):
    empresa_nombre: str
    empresa_nit: str = None
    admin_username: str
    admin_email: str
    admin_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    rol: str
    empresa_id: str
    require_2fa: bool = False

# ================= UTILIDADES =================
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        empresa_id: str = payload.get("emp")
        if username is None or empresa_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ================= ENDPOINTS =================

@router.post("/registro")
def registrar_empresa(data: RegistroSchema, db: Session = Depends(get_db)):
    # 1. Verificar si el usuario ya existe por email o username
    user = db.query(Usuario).filter((Usuario.username == data.admin_username) | (Usuario.email == data.admin_email)).first()
    
    if user:
        username_asociado = user.username
        mensaje = "Usuario ya registrado, creando empresa..."
    else:
        username_asociado = data.admin_username
        hashed_pw = pwd_context.hash(data.admin_password)
        nuevo_usuario = Usuario(
            username=data.admin_username,
            email=data.admin_email,
            hashed_password=hashed_pw,
            rol="admin",
            two_factor_secret=pyotp.random_base32(),
            usuario_creacion=data.admin_username
        )
        db.add(nuevo_usuario)
        mensaje = "Empresa y administrador creados exitosamente"
        
    # 2. Crear Empresa (Alineado con DB ecosystem)
    empresa_uuid = str(uuid.uuid4())
    nueva_empresa = Empresa(
        id=empresa_uuid,
        razon_social=data.empresa_nombre, 
        nit=data.empresa_nit,
        giro="Actividad no especificada",
        normativa="NIIF para Pymes",
        usuario_creacion=username_asociado,
        terminal_ip="127.0.0.1"
    )
    db.add(nueva_empresa)
    db.commit()
    
    return {"message": mensaje, "empresa_id": empresa_uuid, "username": username_asociado}

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    # Buscar la empresa asociada a este usuario (por usuario_creacion en este MVP)
    empresa = db.query(Empresa).filter(Empresa.usuario_creacion == user.username).first()
    empresa_id = empresa.id if empresa else ""
        
    if user.is_2fa_enabled:
        return {
            "access_token": "REQUIRES_2FA_" + user.username, 
            "token_type": "bearer",
            "rol": user.rol,
            "empresa_id": empresa_id,
            "require_2fa": True
        }
        
    # Flujo normal sin 2FA
    access_token = create_access_token(
        data={"sub": user.username, "emp": empresa_id, "rol": user.rol},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "rol": user.rol,
        "empresa_id": empresa_id,
        "require_2fa": False
    }

@router.post("/2fa/verify")
def verify_2fa(username: str, token: str, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(token):
        empresa = db.query(Empresa).filter(Empresa.usuario_creacion == user.username).first()
        empresa_id = empresa.id if empresa else ""
        
        access_token = create_access_token(
            data={"sub": user.username, "emp": empresa_id, "rol": user.rol},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "rol": user.rol,
            "empresa_id": empresa_id
        }
    else:
        raise HTTPException(status_code=401, detail="Código 2FA inválido")

class GoogleLoginSchema(BaseModel):
    email: str

@router.post("/google-login", response_model=TokenResponse)
def google_login(data: GoogleLoginSchema, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Correo no registrado. Por favor, crea tu empresa primero.")
        
    empresa = db.query(Empresa).filter(Empresa.usuario_creacion == user.username).first()
    empresa_id = empresa.id if empresa else ""
        
    access_token = create_access_token(
        data={"sub": user.username, "emp": empresa_id, "rol": user.rol},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "rol": user.rol,
        "empresa_id": empresa_id,
        "require_2fa": False
    }
