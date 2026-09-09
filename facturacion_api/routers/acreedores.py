from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Acreedor, MovimientoAcreedor, SesionCaja, MovimientoCaja, Caja
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/finanzas/acreedores", tags=["Acreedores y Préstamos"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class AcreedorCreate(BaseModel):
    nombre: str
    contacto_telefono: Optional[str] = None
    dui_nit: Optional[str] = None
    email: Optional[str] = None
    tasa_interes_anual: Optional[float] = 0.0
    saldo_capital: Optional[int] = 0 # centavos iniciales si aplica
    notas: Optional[str] = None

class MovimientoAcreedorCreate(BaseModel):
    tipo: str # PRESTAMO_RECIBIDO | PAGO_CAPITAL | PAGO_INTERES | PAGO_MIXTO
    monto_capital: Optional[int] = 0
    monto_interes: Optional[int] = 0
    metodo_pago: Optional[str] = "efectivo"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha: Optional[str] = None

class MovimientoAcreedorResponse(BaseModel):
    id: int
    acreedor_id: int
    tipo: str
    monto_capital: int
    monto_interes: int
    monto_total: int
    metodo_pago: str
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha: datetime
    class Config:
        from_attributes = True

class AcreedorResponse(BaseModel):
    id: int
    empresa_id: str
    nombre: str
    contacto_telefono: Optional[str] = None
    dui_nit: Optional[str] = None
    email: Optional[str] = None
    notas: Optional[str] = None
    tasa_interes_anual: float
    saldo_capital: int
    saldo_interes: int
    intereses_pagados_anio: int
    total_pagado_historico: int
    activo: bool
    fecha_registro: datetime
    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[AcreedorResponse])
def listar_acreedores(empresa_id: str, db: Session = Depends(get_db)):
    acreedores = db.query(Acreedor).filter(Acreedor.empresa_id == empresa_id, Acreedor.activo == True).order_by(Acreedor.nombre).all()
    anio_actual = datetime.now().year
    
    resultado = []
    for a in acreedores:
        # Calcular intereses pagados en el año actual y total pagado histórico
        movs = db.query(MovimientoAcreedor).filter(MovimientoAcreedor.acreedor_id == a.id).all()
        intereses_anio = sum(m.monto_interes for m in movs if m.fecha and m.fecha.year == anio_actual)
        total_pagado = sum(m.monto_total for m in movs if m.tipo in ["PAGO_CAPITAL", "PAGO_INTERES", "PAGO_MIXTO"])
        
        resultado.append(AcreedorResponse(
            id=a.id,
            empresa_id=a.empresa_id,
            nombre=a.nombre,
            contacto_telefono=a.contacto_telefono,
            dui_nit=a.dui_nit,
            email=a.email,
            notas=a.notas,
            tasa_interes_anual=a.tasa_interes_anual or 0.0,
            saldo_capital=a.saldo_capital or 0,
            saldo_interes=a.saldo_interes or 0,
            intereses_pagados_anio=intereses_anio,
            total_pagado_historico=total_pagado,
            activo=a.activo,
            fecha_registro=a.fecha_registro
        ))
    return resultado


@router.post("/", response_model=AcreedorResponse, status_code=status.HTTP_201_CREATED)
def crear_acreedor(empresa_id: str, data: AcreedorCreate, db: Session = Depends(get_db)):
    a = Acreedor(
        empresa_id=empresa_id,
        nombre=data.nombre,
        contacto_telefono=data.contacto_telefono,
        dui_nit=data.dui_nit,
        email=data.email,
        tasa_interes_anual=data.tasa_interes_anual or 0.0,
        saldo_capital=data.saldo_capital or 0,
        notas=data.notas
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    
    if data.saldo_capital and data.saldo_capital > 0:
        mov = MovimientoAcreedor(
            acreedor_id=a.id,
            empresa_id=empresa_id,
            tipo="PRESTAMO_RECIBIDO",
            monto_capital=data.saldo_capital,
            monto_interes=0,
            monto_total=data.saldo_capital,
            metodo_pago="transferencia",
            notas="Saldo de préstamo inicial"
        )
        db.add(mov)
        db.commit()

    return listar_acreedores(empresa_id, db)[-1]


@router.put("/{acreedor_id}", response_model=AcreedorResponse)
def actualizar_acreedor(acreedor_id: int, empresa_id: str, data: AcreedorCreate, db: Session = Depends(get_db)):
    a = db.query(Acreedor).filter(Acreedor.id == acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")
    
    a.nombre = data.nombre
    a.contacto_telefono = data.contacto_telefono
    a.dui_nit = data.dui_nit
    a.email = data.email
    a.tasa_interes_anual = data.tasa_interes_anual or 0.0
    a.notas = data.notas
    
    db.commit()
    db.refresh(a)
    return [x for x in listar_acreedores(empresa_id, db) if x.id == a.id][0]


@router.get("/{acreedor_id}/movimientos", response_model=List[MovimientoAcreedorResponse])
def listar_movimientos_acreedor(acreedor_id: int, empresa_id: str, db: Session = Depends(get_db)):
    a = db.query(Acreedor).filter(Acreedor.id == acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")
    
    movs = db.query(MovimientoAcreedor).filter(MovimientoAcreedor.acreedor_id == acreedor_id).order_by(MovimientoAcreedor.fecha.desc()).all()
    return movs


@router.post("/{acreedor_id}/movimiento", response_model=MovimientoAcreedorResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimiento_acreedor(acreedor_id: int, empresa_id: str, usuario_id: int, data: MovimientoAcreedorCreate, db: Session = Depends(get_db)):
    a = db.query(Acreedor).filter(Acreedor.id == acreedor_id, Acreedor.empresa_id == empresa_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Acreedor no encontrado")
    
    m_cap = data.monto_capital or 0
    m_int = data.monto_interes or 0
    m_total = m_cap + m_int
    
    if m_total <= 0:
        raise HTTPException(status_code=400, detail="El monto total del movimiento debe ser mayor a cero")

    # Actualizar saldos del acreedor
    if data.tipo == "PRESTAMO_RECIBIDO":
        a.saldo_capital = (a.saldo_capital or 0) + m_cap
    elif data.tipo in ["PAGO_CAPITAL", "PAGO_INTERES", "PAGO_MIXTO"]:
        if m_cap > 0:
            a.saldo_capital = max(0, (a.saldo_capital or 0) - m_cap)
        if m_int > 0 and (a.saldo_interes or 0) > 0:
            a.saldo_interes = max(0, (a.saldo_interes or 0) - m_int)

    mov = MovimientoAcreedor(
        acreedor_id=a.id,
        empresa_id=empresa_id,
        tipo=data.tipo,
        monto_capital=m_cap,
        monto_interes=m_int,
        monto_total=m_total,
        metodo_pago=data.metodo_pago or "efectivo",
        referencia=data.referencia,
        notas=data.notas,
        usuario_id=usuario_id
    )
    if data.fecha:
        try:
            mov.fecha = datetime.fromisoformat(data.fecha)
        except Exception:
            pass

    db.add(mov)
    db.flush()

    # Integración opcional con Movimiento de Caja si hay sesión activa
    sesion = db.query(SesionCaja).join(Caja).filter(SesionCaja.usuario_id == usuario_id, SesionCaja.estado == "abierta", Caja.empresa_id == empresa_id).first()
    if sesion:
        if data.tipo == "PRESTAMO_RECIBIDO":
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=m_total,
                concepto=f"Préstamo Recibido (Acreedor): {a.nombre}",
                referencia_tipo="acreedor",
                referencia_id=mov.id,
                usuario_id=usuario_id
            ))
        elif data.tipo in ["PAGO_CAPITAL", "PAGO_INTERES", "PAGO_MIXTO"]:
            concepto_str = f"Pago a Acreedor: {a.nombre}"
            if m_cap > 0 and m_int > 0:
                concepto_str += f" (Cap: ${m_cap/100:.2f}, Int: ${m_int/100:.2f})"
            elif m_int > 0:
                concepto_str += f" (Intereses: ${m_int/100:.2f})"
            else:
                concepto_str += f" (Capital: ${m_cap/100:.2f})"
                
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="egreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=m_total,
                concepto=concepto_str,
                referencia_tipo="acreedor",
                referencia_id=mov.id,
                usuario_id=usuario_id
            ))

    db.commit()
    db.refresh(mov)
    return mov
