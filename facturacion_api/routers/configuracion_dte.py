from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ConfiguracionDTE
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from dte_service.security.crypto_vault import cifrar_texto
from dte_service.notifications.email_sender import auto_detectar_smtp_config, probar_conexion_smtp

router = APIRouter(prefix="/configuracion-dte", tags=["Configuración DTE y Correo"])

class ConfiguracionDTEBase(BaseModel):
    nit: Optional[str] = None
    nrc: Optional[str] = None
    nombre_comercial: Optional[str] = None
    actividad_economica_cod: Optional[str] = None
    desc_actividad_economica: Optional[str] = None
    direccion_municipio: Optional[str] = None
    direccion_departamento: Optional[str] = None
    direccion_complemento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    establecimiento_tipo: Optional[str] = "02"
    establecimiento_cod: Optional[str] = "0000"
    
    ambiente: Optional[str] = "00"
    api_pwd: Optional[str] = None
    
    certificado_p12_base64: Optional[str] = None
    certificado_pwd: Optional[str] = None

    # Configuración de Correo Saliente (SMTP)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = True
    smtp_from_email: Optional[str] = None

class ConfiguracionDTEResponse(ConfiguracionDTEBase):
    id: int
    empresa_id: str
    correlativo_factura: int
    correlativo_ccf: int
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

class AutoDetectarSMTPRequest(BaseModel):
    email: str

class ProbarSMTPRequest(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_use_tls: bool = True
    smtp_from_email: Optional[str] = None

@router.get("/", response_model=ConfiguracionDTEResponse)
def obtener_configuracion(empresa_id: str, db: Session = Depends(get_db)):
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    if not config:
        config = ConfiguracionDTE(empresa_id=empresa_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/", response_model=ConfiguracionDTEResponse)
def actualizar_configuracion(empresa_id: str, datos: ConfiguracionDTEBase, db: Session = Depends(get_db)):
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    if not config:
        config = ConfiguracionDTE(empresa_id=empresa_id)
        db.add(config)
    
    dict_datos = datos.dict(exclude_unset=True)
    
    # Manejar cifrado de contraseñas de API, Certificado y SMTP
    if "api_pwd" in dict_datos and dict_datos["api_pwd"]:
        config.api_pwd = cifrar_texto(dict_datos["api_pwd"])
        dict_datos.pop("api_pwd")

    if "certificado_pwd" in dict_datos and dict_datos["certificado_pwd"]:
        config.certificado_pwd = cifrar_texto(dict_datos["certificado_pwd"])
        dict_datos.pop("certificado_pwd")

    if "smtp_password" in dict_datos and dict_datos["smtp_password"]:
        config.smtp_password_encrypted = cifrar_texto(dict_datos["smtp_password"])
        dict_datos.pop("smtp_password")

    for campo, valor in dict_datos.items():
        if hasattr(config, campo):
            setattr(config, campo, valor)

    db.commit()
    db.refresh(config)
    return config

@router.post("/auto-detectar-smtp")
def auto_detectar_smtp(payload: AutoDetectarSMTPRequest):
    """Auto-detecta el servidor SMTP y devuelve instrucciones visuales según el dominio."""
    return auto_detectar_smtp_config(payload.email)

@router.post("/probar-smtp")
def probar_smtp(payload: ProbarSMTPRequest):
    """Prueba la conexión SMTP en tiempo real y envía un correo de verificación."""
    exito, mensaje = probar_conexion_smtp(payload.dict())
    if not exito:
        raise HTTPException(status_code=400, detail=mensaje)
    return {"status": "OK", "mensaje": mensaje}
