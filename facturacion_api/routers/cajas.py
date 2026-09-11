from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import get_db
from pydantic import BaseModel
from models import Caja, SesionCaja, MovimientoCaja, Usuario
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
            "usuario_sesion_activa": (sesion_activa.usuario.username if sesion_activa and sesion_activa.usuario else None)
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
def abrir_caja(
    caja_id: int, 
    empresa_id: str, 
    usuario_id: int, 
    saldo_inicial: float = 0.0, 
    force_close: bool = False, 
    db: Session = Depends(get_db)
):
    caja = db.query(Caja).filter(Caja.id == caja_id, Caja.empresa_id == empresa_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    
    if force_close:
        # Cerrar cualquier turno abierto previo para esta caja o usuario en esta empresa
        sesiones_abiertas = db.query(SesionCaja).join(Caja).filter(
            Caja.empresa_id == empresa_id,
            SesionCaja.estado == "abierta",
            (SesionCaja.caja_id == caja_id) | (SesionCaja.usuario_id == usuario_id)
        ).all()
        for s in sesiones_abiertas:
            s.estado = "cerrada"
            s.fecha_cierre = datetime.now(TIMEZONE)
            s.notas = "Cierre forzado de turno anterior al abrir nuevo turno"
        db.commit()
    else:
        # Verificar si la caja ya esta abierta por alguien mas o este usuario
        activa = db.query(SesionCaja).filter(SesionCaja.caja_id == caja_id, SesionCaja.estado == "abierta").first()
        if activa:
            if activa.usuario_id == usuario_id:
                return {"mensaje": "Caja reactivada exitosamente", "sesion_id": activa.id}
            ocupante = activa.usuario.username if activa.usuario else "admin"
            raise HTTPException(status_code=400, detail=f"La caja ya tiene un turno abierto por {ocupante}. Para reiniciar, use la opción de forzar cierre.")
        
        # Verificar si EL USUARIO ya tiene otra caja abierta
        user_activa = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id, 
            SesionCaja.estado == "abierta", 
            Caja.empresa_id == empresa_id
        ).first()
        if user_activa:
            raise HTTPException(status_code=400, detail=f"Usted ya tiene un turno abierto en la caja: {user_activa.caja.nombre}")

    sesion = SesionCaja(
        caja_id=caja_id,
        usuario_id=usuario_id,
        saldo_inicial=int(round(saldo_inicial * 100)),
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
        # Auto-adopción: Si el usuario es admin o se reconnectó tras expirar DB/token,
        # asociar la sesión huérfana de la empresa al usuario actual
        sesion_orfana = db.query(SesionCaja).join(Caja).filter(
            Caja.empresa_id == empresa_id,
            SesionCaja.estado == "abierta"
        ).first()
        
        if sesion_orfana:
            sesion_orfana.usuario_id = usuario_id
            db.commit()
            db.refresh(sesion_orfana)
            sesion = sesion_orfana
        else:
            return {"activa": False}
        
    movimientos = db.query(MovimientoCaja).filter(MovimientoCaja.sesion_caja_id == sesion.id).all()
    
    ingresos = sum(m.monto for m in movimientos if m.tipo == "ingreso")
    egresos = sum(m.monto for m in movimientos if m.tipo == "egreso")
    
    total_efectivo = sesion.saldo_inicial + sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "efectivo") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "efectivo")
    total_transferencia = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "transferencia") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "transferencia")
    total_tarjeta = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "tarjeta") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "tarjeta")
    
    saldo_calculado = sesion.saldo_inicial + ingresos - egresos
    
    # Evaluar si la apertura fue en un día anterior
    hoy = datetime.now(TIMEZONE).date()
    fecha_ap = sesion.fecha_apertura.astimezone(TIMEZONE).date() if sesion.fecha_apertura else hoy
    es_trasnochada = fecha_ap < hoy

    return {
        "activa": True,
        "sesion_id": sesion.id,
        "caja_id": sesion.caja_id,
        "caja_nombre": sesion.caja.nombre,
        "fecha_apertura": sesion.fecha_apertura,
        "saldo_inicial": sesion.saldo_inicial,
        "total_efectivo": total_efectivo,
        "total_transferencia": total_transferencia,
        "total_tarjeta": total_tarjeta,
        "saldo_calculado": saldo_calculado,
        "movimientos_count": len(movimientos),
        "es_trasnochada": es_trasnochada
    }

@router.get("/estado-usuario")
def obtener_estado_usuario(empresa_id: str, usuario_id: int, db: Session = Depends(get_db)):
    activa_res = obtener_sesion_activa(empresa_id=empresa_id, usuario_id=usuario_id, db=db)
    cajas_disponibles = db.query(Caja).filter(Caja.empresa_id == empresa_id, Caja.activa == True).all()
    
    cajas_list = []
    for c in cajas_disponibles:
        s = db.query(SesionCaja).filter(SesionCaja.caja_id == c.id, SesionCaja.estado == "abierta").first()
        cajas_list.append({
            "id": c.id,
            "nombre": c.nombre,
            "ocupada": s is not None,
            "usuario_ocupante": s.usuario.username if s and s.usuario else None
        })
        
    return {
        "sesion": activa_res,
        "cajas_disponibles": cajas_list
    }
class CerrarTurnoRequest(BaseModel):
    notas: str = ""
    detalle_arqueo: Optional[Dict[str, int]] = None
    diferencia: Optional[int] = None

@router.post("/sesiones/{sesion_id}/cerrar")
def cerrar_caja(sesion_id: int, empresa_id: str, data: CerrarTurnoRequest, db: Session = Depends(get_db)):
    sesion = db.query(SesionCaja).join(Caja).filter(
        SesionCaja.id == sesion_id,
        Caja.empresa_id == empresa_id
    ).first()
    if not sesion or sesion.estado == "cerrada":
        raise HTTPException(status_code=400, detail="Sesion invalida o ya cerrada")
        
    sesion.estado = "cerrada"
    sesion.fecha_cierre = datetime.now(TIMEZONE)
    sesion.notas = data.notas
    sesion.detalle_arqueo = data.detalle_arqueo
    sesion.diferencia = data.diferencia
    db.commit()
    return {"mensaje": "Turno cerrado exitosamente"}

@router.post("/sesiones/{sesion_id}/forzar-cierre")
def forzar_cierre_caja(sesion_id: int, empresa_id: str, db: Session = Depends(get_db)):
    sesion = db.query(SesionCaja).join(Caja).filter(
        SesionCaja.id == sesion_id,
        Caja.empresa_id == empresa_id
    ).first()
    if not sesion or sesion.estado == "cerrada":
        raise HTTPException(status_code=400, detail="Sesion invalida o ya cerrada")
        
    sesion.estado = "cerrada"
    sesion.fecha_cierre = datetime.now(TIMEZONE)
    sesion.notas = "Cierre administrativo forzado"
    db.commit()
    return {"mensaje": "Turno cerrado forzadamente exitosamente"}

@router.get("/historial")
def historial_cajas(empresa_id: str, db: Session = Depends(get_db)):
    sesiones = db.query(SesionCaja).join(Caja).filter(
        Caja.empresa_id == empresa_id, 
        SesionCaja.estado == "cerrada"
    ).order_by(SesionCaja.fecha_cierre.desc()).limit(50).all()
    
    res = []
    for s in sesiones:
        movimientos = db.query(MovimientoCaja).filter(MovimientoCaja.sesion_caja_id == s.id).all()
        ingresos = sum(m.monto for m in movimientos if m.tipo == "ingreso")
        egresos = sum(m.monto for m in movimientos if m.tipo == "egreso")
        saldo_calculado = s.saldo_inicial + ingresos - egresos
        
        total_efectivo = s.saldo_inicial + sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "efectivo") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "efectivo")
        total_transferencia = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "transferencia") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "transferencia")
        total_tarjeta = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "tarjeta") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "tarjeta")
        
        res.append({
            "sesion_id": s.id,
            "caja_nombre": s.caja.nombre if s.caja else "Caja",
            "usuario": s.usuario.username if s.usuario else "Desconocido",
            "fecha_apertura": s.fecha_apertura,
            "fecha_cierre": s.fecha_cierre,
            "saldo_inicial": s.saldo_inicial,
            "saldo_calculado": saldo_calculado,
            "total_efectivo": total_efectivo,
            "total_transferencia": total_transferencia,
            "total_tarjeta": total_tarjeta,
            "ingresos": ingresos,
            "egresos": egresos,
            "diferencia": s.diferencia,
            "detalle_arqueo": s.detalle_arqueo,
            "notas": s.notas
        })
    return res

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

class InyeccionCapitalSchema(BaseModel):
    monto: float
    tipo_financiamiento: str # "aporte_socio" | "prestamo_sin_interes" | "prestamo_con_interes"
    acreedor: str
    tasa_interes: Optional[float] = 0.0
    metodo_pago: str = "efectivo" # "efectivo" | "transferencia"
    notas: Optional[str] = ""

@router.post("/sesiones/{sesion_id}/inyectar-capital")
def inyectar_capital(sesion_id: int, empresa_id: str, usuario_id: int, data: InyeccionCapitalSchema, db: Session = Depends(get_db)):
    sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.id == sesion_id, Caja.empresa_id == empresa_id).first()
    if not sesion or sesion.estado != "abierta":
        raise HTTPException(status_code=400, detail="Sesión de caja no válida o cerrada")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto a inyectar debe ser mayor a 0")

    tipo_labels = {
        "aporte_socio": "Aporte de Socios (0% Interés)",
        "prestamo_sin_interes": "Préstamo Sin Interés",
        "prestamo_con_interes": f"Préstamo Con Interés ({data.tasa_interes or 0}%)"
    }
    label = tipo_labels.get(data.tipo_financiamiento, "Financiamiento")
    concepto = f"Inyección de Capital: {label} - {data.acreedor}"
    if data.notas:
        concepto += f" ({data.notas})"

    monto_centavos = int(round(data.monto * 100))

    mov = MovimientoCaja(
        sesion_caja_id=sesion_id,
        tipo="ingreso",
        metodo_pago=data.metodo_pago,
        monto=monto_centavos,
        concepto=concepto,
        referencia_tipo="financiamiento",
        usuario_id=usuario_id
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)

    return {"mensaje": "Inyección de capital registrada exitosamente", "movimiento_id": mov.id}

class EditarMovimientoSchema(BaseModel):
    monto: float
    concepto: str
    metodo_pago: str = "efectivo"

@router.put("/movimientos/{movimiento_id}")
def editar_movimiento(movimiento_id: int, empresa_id: str, data: EditarMovimientoSchema, db: Session = Depends(get_db)):
    mov = db.query(MovimientoCaja).join(SesionCaja).join(Caja).filter(
        MovimientoCaja.id == movimiento_id,
        Caja.empresa_id == empresa_id
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")

    mov.monto = int(round(data.monto * 100))
    mov.concepto = data.concepto
    mov.metodo_pago = data.metodo_pago
    db.commit()
    db.refresh(mov)
    return {"mensaje": "Movimiento actualizado exitosamente", "id": mov.id}

@router.delete("/movimientos/{movimiento_id}")
def eliminar_movimiento(movimiento_id: int, empresa_id: str, db: Session = Depends(get_db)):
    mov = db.query(MovimientoCaja).join(SesionCaja).join(Caja).filter(
        MovimientoCaja.id == movimiento_id,
        Caja.empresa_id == empresa_id
    ).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    db.delete(mov)
    db.commit()
    return {"mensaje": "Movimiento eliminado exitosamente"}

class RecalcularCajasRequest(BaseModel):
    empresa_id: str
    sesion_id: Optional[int] = None

@router.post("/recalcular-saldos")
def recalcular_saldos_caja(req: RecalcularCajasRequest, db: Session = Depends(get_db)):
    """Recalcula los saldos de turnos de caja en base a la sumatoria exacta de sus movimientos."""
    query = db.query(SesionCaja).join(Caja).filter(Caja.empresa_id == req.empresa_id)
    if req.sesion_id:
        query = query.filter(SesionCaja.id == req.sesion_id)
    
    sesiones = query.all()
    if not sesiones:
        return {"mensaje": "No se encontraron turnos de caja para recalcular", "sesiones_recalculadas": 0, "resumen": []}
    
    resumen = []
    for s in sesiones:
        movimientos = db.query(MovimientoCaja).filter(MovimientoCaja.sesion_caja_id == s.id).order_by(MovimientoCaja.fecha.asc(), MovimientoCaja.id.asc()).all()
        
        ingresos = sum(m.monto for m in movimientos if m.tipo == "ingreso")
        egresos = sum(m.monto for m in movimientos if m.tipo == "egreso")
        
        total_efectivo = s.saldo_inicial + sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "efectivo") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "efectivo")
        total_transferencia = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "transferencia") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "transferencia")
        total_tarjeta = sum(m.monto for m in movimientos if m.tipo == "ingreso" and m.metodo_pago == "tarjeta") - sum(m.monto for m in movimientos if m.tipo == "egreso" and m.metodo_pago == "tarjeta")
        
        saldo_calculado = s.saldo_inicial + ingresos - egresos
        
        resumen.append({
            "sesion_id": s.id,
            "caja_nombre": s.caja.nombre if s.caja else "Caja",
            "saldo_inicial": s.saldo_inicial,
            "total_efectivo": total_efectivo,
            "total_transferencia": total_transferencia,
            "total_tarjeta": total_tarjeta,
            "saldo_calculado": saldo_calculado,
            "movimientos_count": len(movimientos)
        })

    db.commit()
    
    return {
        "mensaje": "Saldos de turno de caja recalculados exitosamente.",
        "sesiones_recalculadas": len(sesiones),
        "resumen": resumen
    }



