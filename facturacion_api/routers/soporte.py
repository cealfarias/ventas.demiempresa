from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import pytz

from database import get_db
from models import TicketSoporte, MensajeTicket, Usuario, Empresa
import schemas.soporte as schemas_soporte

TIMEZONE = pytz.timezone("America/El_Salvador")

router = APIRouter(prefix="/soporte", tags=["Soporte Técnico"])

def es_usuario_propietario(usuario: Usuario) -> bool:
    if not usuario:
        return False
    email = (usuario.email or "").lower()
    username = (usuario.username or "").lower()
    return (
        email == "cealfarias@gmail.com" or 
        username in ["cealfarias", "cesararias", "propietario_global"]
    )

@router.post("/tickets", response_model=schemas_soporte.TicketSoporteResponse)
def crear_ticket(
    ticket_in: schemas_soporte.TicketSoporteCreate,
    empresa_id: str = Query(...),
    usuario_id: int = Query(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    ticket = TicketSoporte(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        asunto=ticket_in.asunto,
        categoria=ticket_in.categoria or "Soporte Técnico",
        prioridad=ticket_in.prioridad or "Media",
        estado="ABIERTO",
        fecha_creacion=datetime.now(TIMEZONE),
        fecha_actualizacion=datetime.now(TIMEZONE)
    )
    db.add(ticket)
    db.flush()

    mensaje_inicial = MensajeTicket(
        ticket_id=ticket.id,
        remitente_usuario_id=usuario_id,
        es_propietario=es_usuario_propietario(usuario),
        contenido=ticket_in.mensaje_inicial,
        fecha_envio=datetime.now(TIMEZONE)
    )
    db.add(mensaje_inicial)
    db.commit()
    db.refresh(ticket)

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    res = schemas_soporte.TicketSoporteResponse.from_orm(ticket)
    res.nombre_empresa = empresa.nombre_comercial or empresa.razon_social if empresa else "Empresa"
    res.nombre_usuario = usuario.username if usuario else "Usuario"
    
    mensajes_fmt = []
    for m in ticket.mensajes:
        mf = schemas_soporte.MensajeTicketResponse.from_orm(m)
        mf.nombre_remitente = usuario.username if m.remitente_usuario_id == usuario.id else "Soporte Técnico"
        mensajes_fmt.append(mf)
    res.mensajes = mensajes_fmt
    return res

@router.get("/tickets", response_model=List[schemas_soporte.TicketSoporteResponse])
def listar_tickets(
    empresa_id: str = Query(...),
    usuario_id: int = Query(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    es_prop = es_usuario_propietario(usuario)

    query = db.query(TicketSoporte)
    if not es_prop:
        query = query.filter(TicketSoporte.empresa_id == empresa_id)

    tickets = query.order_by(TicketSoporte.fecha_actualizacion.desc()).all()

    resultado = []
    for t in tickets:
        item = schemas_soporte.TicketSoporteResponse.from_orm(t)
        item.nombre_empresa = t.empresa.nombre_comercial or t.empresa.razon_social if t.empresa else "Empresa"
        item.nombre_usuario = t.usuario.username if t.usuario else "Usuario"

        mensajes_fmt = []
        for m in t.mensajes:
            mf = schemas_soporte.MensajeTicketResponse.from_orm(m)
            if m.remitente:
                mf.nombre_remitente = m.remitente.username
            else:
                mf.nombre_remitente = "Soporte Técnico" if m.es_propietario else "Usuario"
            mensajes_fmt.append(mf)

        item.mensajes = mensajes_fmt
        resultado.append(item)

    return resultado

@router.post("/tickets/{ticket_id}/mensajes", response_model=schemas_soporte.MensajeTicketResponse)
def enviar_mensaje(
    ticket_id: int,
    mensaje_in: schemas_soporte.MensajeTicketCreate,
    empresa_id: str = Query(...),
    usuario_id: int = Query(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    ticket = db.query(TicketSoporte).filter(TicketSoporte.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    es_prop = es_usuario_propietario(usuario)
    if not es_prop and ticket.empresa_id != empresa_id:
        raise HTTPException(status_code=403, detail="No tiene permisos para acceder a este ticket")

    mensaje = MensajeTicket(
        ticket_id=ticket_id,
        remitente_usuario_id=usuario_id,
        es_propietario=es_prop,
        contenido=mensaje_in.contenido,
        fecha_envio=datetime.now(TIMEZONE)
    )
    db.add(mensaje)

    ticket.fecha_actualizacion = datetime.now(TIMEZONE)
    if ticket.estado != "RESUELTO":
        if es_prop:
            ticket.estado = "RESPONDIDO"
        else:
            ticket.estado = "ESPERANDO RESPUESTA"
    else:
        if not es_prop:
            ticket.estado = "REABIERTO"

    db.commit()
    db.refresh(mensaje)

    res = schemas_soporte.MensajeTicketResponse.from_orm(mensaje)
    res.nombre_remitente = usuario.username
    return res

@router.put("/tickets/{ticket_id}/estado", response_model=schemas_soporte.TicketSoporteResponse)
def cambiar_estado(
    ticket_id: int,
    nuevo_estado: str = Query(...),
    empresa_id: str = Query(...),
    usuario_id: int = Query(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    ticket = db.query(TicketSoporte).filter(TicketSoporte.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    ticket.estado = nuevo_estado
    ticket.fecha_actualizacion = datetime.now(TIMEZONE)
    db.commit()
    db.refresh(ticket)

    res = schemas_soporte.TicketSoporteResponse.from_orm(ticket)
    res.nombre_empresa = ticket.empresa.nombre_comercial or ticket.empresa.razon_social if ticket.empresa else "Empresa"
    res.nombre_usuario = ticket.usuario.username if ticket.usuario else "Usuario"
    return res

@router.get("/unread", response_model=int)
def contar_tickets_no_leidos(
    empresa_id: str = Query(...),
    usuario_id: int = Query(...),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        return 0

    es_prop = es_usuario_propietario(usuario)
    query = db.query(TicketSoporte)

    if es_prop:
        query = query.filter(TicketSoporte.estado.in_(["ABIERTO", "ESPERANDO RESPUESTA", "REABIERTO"]))
    else:
        query = query.filter(TicketSoporte.empresa_id == empresa_id)
        query = query.filter(TicketSoporte.estado.in_(["RESPONDIDO", "EN_PROCESO"]))

    return query.count()
