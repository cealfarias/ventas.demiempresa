from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Aportante, MovimientoAportante, SesionCaja, MovimientoCaja, Caja
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/aportantes", tags=["Aportantes y Apoyo Financiero"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class AportanteCreate(BaseModel):
    nombre: str
    tipo_relacion: Optional[str] = "Socio" # Socio | Inversionista | Familiar | Apoyo
    contacto_telefono: Optional[str] = None
    dui_nit: Optional[str] = None
    email: Optional[str] = None
    saldo_inicial: Optional[int] = 0 # centavos si viene con saldo previo
    notas: Optional[str] = None

class MovimientoAportanteCreate(BaseModel):
    tipo: str # APORTE_RECIBIDO | DEVOLUCION_CAPITAL
    monto: int # centavos
    metodo_pago: Optional[str] = "efectivo"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha: Optional[str] = None

class MovimientoAportanteResponse(BaseModel):
    id: int
    aportante_id: int
    tipo: str
    monto: int
    metodo_pago: str
    referencia: Optional[str] = None
    notas: Optional[str] = None
    fecha: datetime
    class Config:
        from_attributes = True

class AportanteResponse(BaseModel):
    id: int
    empresa_id: str
    nombre: str
    tipo_relacion: str
    contacto_telefono: Optional[str] = None
    dui_nit: Optional[str] = None
    email: Optional[str] = None
    notas: Optional[str] = None
    total_aportado: int
    total_devuelto: int
    saldo_pendiente: int
    activo: bool
    fecha_registro: datetime
    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[AportanteResponse])
@router.get("/", response_model=List[AportanteResponse])
def listar_aportantes(empresa_id: str, db: Session = Depends(get_db)):
    aportantes = db.query(Aportante).filter(Aportante.empresa_id == empresa_id, Aportante.activo == True).order_by(Aportante.nombre).all()
    return aportantes


@router.post("", response_model=AportanteResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AportanteResponse, status_code=status.HTTP_201_CREATED)
def crear_aportante(empresa_id: str, data: AportanteCreate, db: Session = Depends(get_db)):
    ap = Aportante(
        empresa_id=empresa_id,
        nombre=data.nombre,
        tipo_relacion=data.tipo_relacion or "Socio",
        contacto_telefono=data.contacto_telefono,
        dui_nit=data.dui_nit,
        email=data.email,
        total_aportado=data.saldo_inicial or 0,
        saldo_pendiente=data.saldo_inicial or 0,
        notas=data.notas
    )
    db.add(ap)
    db.commit()
    db.refresh(ap)
    
    if data.saldo_inicial and data.saldo_inicial > 0:
        mov = MovimientoAportante(
            aportante_id=ap.id,
            empresa_id=empresa_id,
            tipo="APORTE_RECIBIDO",
            monto=data.saldo_inicial,
            metodo_pago="transferencia",
            notas="Saldo de aporte inicial"
        )
        db.add(mov)
        db.commit()

    return ap


@router.put("/{aportante_id}", response_model=AportanteResponse)
def actualizar_aportante(aportante_id: int, empresa_id: str, data: AportanteCreate, db: Session = Depends(get_db)):
    ap = db.query(Aportante).filter(Aportante.id == aportante_id, Aportante.empresa_id == empresa_id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Aportante no encontrado")
    
    ap.nombre = data.nombre
    ap.tipo_relacion = data.tipo_relacion or "Socio"
    ap.contacto_telefono = data.contacto_telefono
    ap.dui_nit = data.dui_nit
    ap.email = data.email
    ap.notas = data.notas
    
    db.commit()
    db.refresh(ap)
    return ap


@router.get("/{aportante_id}/movimientos", response_model=List[MovimientoAportanteResponse])
def listar_movimientos_aportante(aportante_id: int, empresa_id: str, db: Session = Depends(get_db)):
    ap = db.query(Aportante).filter(Aportante.id == aportante_id, Aportante.empresa_id == empresa_id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Aportante no encontrado")
    
    movs = db.query(MovimientoAportante).filter(MovimientoAportante.aportante_id == aportante_id).order_by(MovimientoAportante.fecha.desc()).all()
    return movs


@router.post("/{aportante_id}/movimiento", response_model=MovimientoAportanteResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimiento_aportante(aportante_id: int, empresa_id: str, usuario_id: int, data: MovimientoAportanteCreate, db: Session = Depends(get_db)):
    ap = db.query(Aportante).filter(Aportante.id == aportante_id, Aportante.empresa_id == empresa_id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Aportante no encontrado")
    
    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")

    # Actualizar acumulados del aportante
    if data.tipo == "APORTE_RECIBIDO":
        ap.total_aportado = (ap.total_aportado or 0) + data.monto
        ap.saldo_pendiente = (ap.saldo_pendiente or 0) + data.monto
    elif data.tipo == "DEVOLUCION_CAPITAL":
        ap.total_devuelto = (ap.total_devuelto or 0) + data.monto
        ap.saldo_pendiente = max(0, (ap.saldo_pendiente or 0) - data.monto)

    mov = MovimientoAportante(
        aportante_id=ap.id,
        empresa_id=empresa_id,
        tipo=data.tipo,
        monto=data.monto,
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
        if data.tipo == "APORTE_RECIBIDO":
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=data.monto,
                concepto=f"Aporte de Capital ({ap.tipo_relacion}): {ap.nombre}",
                referencia_tipo="aportante",
                referencia_id=mov.id,
                usuario_id=usuario_id
            ))
        elif data.tipo == "DEVOLUCION_CAPITAL":
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="egreso",
                metodo_pago=data.metodo_pago or "efectivo",
                monto=data.monto,
                concepto=f"Devolución de Aporte a {ap.nombre}",
                referencia_tipo="aportante",
                referencia_id=mov.id,
                usuario_id=usuario_id
            ))

    db.commit()
    db.refresh(mov)
    return mov
