from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import get_db
from models import Caja, SesionCaja, MovimientoCaja
import pytz

router = APIRouter(prefix="/cajas", tags=["Cajas"])

TIMEZONE = pytz.timezone("America/El_Salvador")

@router.get("/")
def listar_cajas(empresa_id: str, db: Session = Depends(get_db)):
    cajas = db.query(Caja).filter(Caja.empresa_id == empresa_id, Caja.activa == True).all()
    res = []
    for c in cajas:
        sesion_activa = db.query(SesionCaja).filter(SesionCaja.caja_id == c.id, SesionCaja.estado == "abierta").first()
        res.append({
            "id": c.id,
            "nombre": c.nombre,
            "bodega_id": c.bodega_id,
            "activa": c.activa,
            "tiene_sesion_activa": sesion_activa is not None,
            "sesion_activa_id": sesion_activa.id if sesion_activa else None,
            "usuario_sesion_activa": sesion_activa.usuario.nombre if sesion_activa else None
        })
    return res

@router.post("/")
def crear_caja(empresa_id: str, nombre: str, bodega_id: Optional[int] = None, db: Session = Depends(get_db)):
    caja = Caja(empresa_id=empresa_id, nombre=nombre, bodega_id=bodega_id)
    db.add(caja)
    db.commit()
    db.refresh(caja)
    return {"id": caja.id, "nombre": caja.nombre}

@router.post("/{caja_id}/abrir")
def abrir_caja(caja_id: int, empresa_id: str, usuario_id: int, saldo_inicial: float = 0.0, db: Session = Depends(get_db)):
    caja = db.query(Caja).filter(Caja.id == caja_id, Caja.empresa_id == empresa_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    
    # Verificar si la caja ya esta abierta
    activa = db.query(SesionCaja).filter(SesionCaja.caja_id == caja_id, SesionCaja.estado == "abierta").first()
    if activa:
        raise HTTPException(status_code=400, detail="La caja ya tiene un turno abierto")
    
    # Verificar si EL USUARIO ya tiene otra caja abierta
    user_activa = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
    if user_activa:
        raise HTTPException(status_code=400, detail=f"Usted ya tiene un turno abierto en la caja: {user_activa.caja.nombre}")

    sesion = SesionCaja(
        caja_id=caja_id,
        usuario_id=usuario_id,
        saldo_inicial=int(saldo_inicial * 100),
        estado="abierta"
    )
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return {"mensaje": "Caja abierta", "sesion_id": sesion.id}

@router.get("/sesion-activa")
def obtener_sesion_activa(empresa_id: str, usuario_id: int, db: Session = Depends(get_db)):
    sesion = db.query(SesionCaja).join(Caja).filter(
        Caja.empresa_id == empresa_id,
        SesionCaja.usuario_id == usuario_id,
        SesionCaja.estado == "abierta"
    ).first()
    
    if not sesion:
        return {"activa": False}
        
    movimientos = db.query(MovimientoCaja).filter(MovimientoCaja.sesion_caja_id == sesion.id).all()
    
    ingresos = sum(m.monto for m in movimientos if m.tipo == "ingreso")
    egresos = sum(m.monto for m in movimientos if m.tipo == "egreso")
    
    total_efectivo = sesion.saldo_inicial + sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "efectivo") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "efectivo")
    total_transferencia = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "transferencia") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "transferencia")
    total_tarjeta = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "tarjeta") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "tarjeta")
    
    saldo_calculado = sesion.saldo_inicial + ingresos - egresos
    
    return {
        "activa": True,
        "sesion_id": sesion.id,
        "caja_nombre": sesion.caja.nombre,
        "fecha_apertura": sesion.fecha_apertura,
        "saldo_inicial": sesion.saldo_inicial,
        "total_efectivo": total_efectivo,
        "total_transferencia": total_transferencia,
        "total_tarjeta": total_tarjeta,
        "saldo_calculado": saldo_calculado,
        "movimientos_count": len(movimientos)
    }

@router.post("/sesiones/{sesion_id}/cerrar")
def cerrar_caja(sesion_id: int, empresa_id: str, notas: str = "", db: Session = Depends(get_db)):
    sesion = db.query(SesionCaja).join(Caja).filter(
        SesionCaja.id == sesion_id,
        Caja.empresa_id == empresa_id
    ).first()
    if not sesion or sesion.estado == "cerrada":
        raise HTTPException(status_code=400, detail="Sesion invalida o ya cerrada")
        
    sesion.estado = "cerrada"
    sesion.fecha_cierre = datetime.now(TIMEZONE)
    sesion.notas = notas
    db.commit()
    return {"mensaje": "Turno cerrado exitosamente"}

@router.get("/sesiones/{sesion_id}/movimientos")
def listar_movimientos(sesion_id: int, empresa_id: str, db: Session = Depends(get_db)):
    # verificar empresa
    sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.id == sesion_id, Caja.empresa_id == empresa_id).first()
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesion no encontrada")
        
    movs = db.query(MovimientoCaja).filter(MovimientoCaja.sesion_caja_id == sesion_id).order_by(MovimientoCaja.id.desc()).all()
    res = []
    for m in movs:
        res.append({
            "id": m.id,
            "tipo": m.tipo,
            "metodo_pago": m.metodo_pago,
            "monto": m.monto,
            "concepto": m.concepto,
            "fecha": m.fecha,
            "referencia_tipo": m.referencia_tipo,
            "referencia_id": m.referencia_id
        })
    return res

