from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import bcrypt
from datetime import datetime, timezone
import pytz

from database import get_db
from models import Usuario
from routers.auth import get_current_user, pwd_context

router = APIRouter(prefix="/usuarios", tags=["Gestion de Usuarios y Roles"])

ROLES_PERMITIDOS = [
    "admin",
    "contador",
    "auditor",
    "bodeguero",
    "cajera",
    "encargado_compras",
    "vendedor",
    "despachador"
]

# ================= SCHEMAS =================
class UsuarioOutSchema(BaseModel):
    id: int
    username: str
    email: str
    rol: str
    is_active: bool
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True

class CrearUsuarioSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    rol: str

class EditarUsuarioSchema(BaseModel):
    email: Optional[EmailStr] = None
    rol: Optional[str] = None
    is_active: Optional[bool] = None

class ResetPasswordSchema(BaseModel):
    new_password: str

# ================= ENDPOINTS =================

@router.get("", response_model=List[UsuarioOutSchema])
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar todos los usuarios del sistema (Acceso Admin / Auditor / Contador)"""
    user_rol = (current_user.rol or "").lower()
    if not (user_rol == "admin" or user_rol == "auditor" or user_rol == "contador"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No posee permisos para administrar o ver la lista de usuarios"
        )
    
    usuarios = db.query(Usuario).order_by(Usuario.id.desc()).all()
    return usuarios

@router.post("", response_model=UsuarioOutSchema)
def crear_usuario(
    data: CrearUsuarioSchema,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear un nuevo usuario con rol asignado (Solo Admin)"""
    user_rol = (current_user.rol or "").lower()
    if user_rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un Administrador puede registrar nuevos usuarios"
        )
    
    rol_clean = data.rol.lower().strip()
    if rol_clean not in ROLES_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Rol no válido. Los roles permitidos son: {', '.join(ROLES_PERMITIDOS)}"
        )
        
    # Verificar unicidad de username y email
    existente = db.query(Usuario).filter(
        (Usuario.username == data.username) | (Usuario.email == data.email)
    ).first()
    
    if existente:
        raise HTTPException(
            status_code=400,
            detail="El nombre de usuario o correo ya se encuentra registrado"
        )
        
    hashed_pw = pwd_context.hash(data.password)
    
    nuevo_user = Usuario(
        username=data.username,
        email=data.email,
        hashed_password=hashed_pw,
        rol=rol_clean,
        is_active=True,
        usuario_creacion=current_user.username
    )
    
    db.add(nuevo_user)
    db.commit()
    db.refresh(nuevo_user)
    
    return nuevo_user

@router.put("/{usuario_id}", response_model=UsuarioOutSchema)
def editar_usuario(
    usuario_id: int,
    data: EditarUsuarioSchema,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Modificar rol o estado de un usuario (Solo Admin)"""
    user_rol = (current_user.rol or "").lower()
    if user_rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un Administrador puede modificar datos o roles de usuario"
        )
        
    target_user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if data.email and data.email != target_user.email:
        email_check = db.query(Usuario).filter(Usuario.email == data.email).first()
        if email_check:
            raise HTTPException(status_code=400, detail="El correo ya pertenece a otro usuario")
        target_user.email = data.email
        
    if data.rol:
        rol_clean = data.rol.lower().strip()
        if rol_clean not in ROLES_PERMITIDOS:
            raise HTTPException(
                status_code=400,
                detail=f"Rol no válido. Permisos válidos: {', '.join(ROLES_PERMITIDOS)}"
            )
        target_user.rol = rol_clean
        
    if data.is_active is not None:
        target_user.is_active = data.is_active
        
    target_user.usuario_modificacion = current_user.username
    target_user.fecha_modificacion = datetime.now(pytz.timezone("America/El_Salvador"))
    
    db.commit()
    db.refresh(target_user)
    return target_user

@router.put("/{usuario_id}/reset-password")
def reset_password(
    usuario_id: int,
    data: ResetPasswordSchema,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Restablecer contraseña de un usuario (Solo Admin)"""
    user_rol = (current_user.rol or "").lower()
    if user_rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un Administrador puede restablecer contraseñas de colaboradores"
        )
        
    target_user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if not data.new_password or len(data.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 4 caracteres")
        
    target_user.hashed_password = pwd_context.hash(data.new_password)
    target_user.usuario_modificacion = current_user.username
    target_user.fecha_modificacion = datetime.now(pytz.timezone("America/El_Salvador"))
    
    db.commit()
    return {"message": f"Contraseña del usuario {target_user.username} restablecida exitosamente"}
