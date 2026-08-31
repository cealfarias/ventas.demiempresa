from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ConfiguracionDTE
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/configuracion-dte", tags=["Configuración DTE"])

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

class ConfiguracionDTEResponse(ConfiguracionDTEBase):
    id: int
    empresa_id: str
    correlativo_factura: int
    correlativo_ccf: int
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=ConfiguracionDTEResponse)
def obtener_configuracion(empresa_id: str, db: Session = Depends(get_db)):
    config = db.query(ConfiguracionDTE).filter(ConfiguracionDTE.empresa_id == empresa_id).first()
    if not config:
        # Devolver una config vacía si no existe para que el frontend no falle
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
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        # No sobreescribir la contraseña si viene vacía (para no borrarla por error en updates)
        if (campo == 'api_pwd' or campo == 'certificado_pwd') and not valor:
            continue
        setattr(config, campo, valor)
        
    db.commit()
    db.refresh(config)
    return config
