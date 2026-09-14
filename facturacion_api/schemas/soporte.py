from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MensajeTicketCreate(BaseModel):
    contenido: str

class MensajeTicketResponse(BaseModel):
    id: int
    ticket_id: int
    remitente_usuario_id: int
    nombre_remitente: Optional[str] = "Usuario"
    es_propietario: bool
    contenido: str
    fecha_envio: datetime

    class Config:
        from_attributes = True

class TicketSoporteCreate(BaseModel):
    asunto: str
    categoria: Optional[str] = "Soporte Técnico"
    prioridad: Optional[str] = "Media"
    mensaje_inicial: str

class TicketSoporteResponse(BaseModel):
    id: int
    empresa_id: Optional[str] = None
    nombre_empresa: Optional[str] = "Empresa"
    usuario_id: int
    nombre_usuario: Optional[str] = "Usuario"
    asunto: str
    categoria: str
    prioridad: str
    estado: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    mensajes: List[MensajeTicketResponse] = []

    class Config:
        from_attributes = True
