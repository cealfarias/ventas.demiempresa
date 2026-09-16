from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ContratoArrendamiento, PagoArrendamiento, SesionCaja, MovimientoCaja, Caja
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/arrendamientos", tags=["Contratos de Arrendamiento"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class ContratoArrendamientoCreate(BaseModel):
    inmueble_nombre: str
    tipo: Optional[str] = "ARRENDATARIO" # ARRENDATARIO (Nosotros pagamos) | ARRENDADOR (Nosotros cobramos)
    contraparte_nombre: str # Propietario o Inquilino
    dui_nit: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    canon_mensual: int # centavos
    dia_pago_limite: Optional[int] = 5 # 1-31
    deposito_garantia: Optional[int] = 0 # centavos
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    estado: Optional[str] = "activo" # activo | finalizado | suspendido
    notas: Optional[str] = None

class PagoArrendamientoCreate(BaseModel):
    tipo: Optional[str] = "PAGO_ALQUILER" # PAGO_ALQUILER | COBRO_ALQUILER
    monto: int # centavos
    fecha_pago: Optional[str] = None
    metodo_pago: Optional[str] = "efectivo"
    referencia: Optional[str] = None
    notas: Optional[str] = None

class PagoArrendamientoResponse(BaseModel):
    id: int
    contrato_id: int
    empresa_id: str
    tipo: str
    monto: int
    fecha_pago: datetime
    metodo_pago: str
    referencia: Optional[str] = None
    notas: Optional[str] = None
    usuario_id: Optional[int] = None

    class Config:
        from_attributes = True

class ContratoArrendamientoResponse(BaseModel):
    id: int
    empresa_id: str
    inmueble_nombre: str
    tipo: str
    contraparte_nombre: str
    dui_nit: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    canon_mensual: int
    dia_pago_limite: int
    deposito_garantia: int
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: str
    notas: Optional[str] = None
    fecha_registro: datetime
    total_pagado_historico: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ContratoArrendamientoResponse])
@router.get("/", response_model=List[ContratoArrendamientoResponse])
def listar_contratos(empresa_id: str, db: Session = Depends(get_db)):
    contratos = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.empresa_id == empresa_id
    ).order_by(ContratoArrendamiento.fecha_registro.desc()).all()
    
    res = []
    for c in contratos:
        total_p = sum(p.monto for p in c.pagos)
        c_dict = {
            "id": c.id,
            "empresa_id": c.empresa_id,
            "inmueble_nombre": c.inmueble_nombre,
            "tipo": c.tipo or "ARRENDATARIO",
            "contraparte_nombre": c.contraparte_nombre,
            "dui_nit": c.dui_nit,
            "telefono": c.telefono,
            "email": c.email,
            "canon_mensual": c.canon_mensual or 0,
            "dia_pago_limite": c.dia_pago_limite or 5,
            "deposito_garantia": c.deposito_garantia or 0,
            "fecha_inicio": c.fecha_inicio,
            "fecha_fin": c.fecha_fin,
            "estado": c.estado or "activo",
            "notas": c.notas,
            "fecha_registro": c.fecha_registro,
            "total_pagado_historico": total_p
        }
        res.append(c_dict)
    return res


@router.post("", response_model=ContratoArrendamientoResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ContratoArrendamientoResponse, status_code=status.HTTP_201_CREATED)
def crear_contrato(empresa_id: str, data: ContratoArrendamientoCreate, db: Session = Depends(get_db)):
    f_inicio = None
    f_fin = None
    if data.fecha_inicio:
        try:
            f_inicio = datetime.fromisoformat(data.fecha_inicio)
        except Exception:
            pass
    if data.fecha_fin:
        try:
            f_fin = datetime.fromisoformat(data.fecha_fin)
        except Exception:
            pass

    contrato = ContratoArrendamiento(
        empresa_id=empresa_id,
        inmueble_nombre=data.inmueble_nombre,
        tipo=data.tipo or "ARRENDATARIO",
        contraparte_nombre=data.contraparte_nombre,
        dui_nit=data.dui_nit,
        telefono=data.telefono,
        email=data.email,
        canon_mensual=data.canon_mensual or 0,
        dia_pago_limite=data.dia_pago_limite or 5,
        deposito_garantia=data.deposito_garantia or 0,
        fecha_inicio=f_inicio,
        fecha_fin=f_fin,
        estado=data.estado or "activo",
        notas=data.notas
    )
    db.add(contrato)
    db.commit()
    db.refresh(contrato)
    
    contrato.total_pagado_historico = 0
    return contrato


@router.put("/{contrato_id}", response_model=ContratoArrendamientoResponse)
def actualizar_contrato(contrato_id: int, empresa_id: str, data: ContratoArrendamientoCreate, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato de arrendamiento no encontrado")

    f_inicio = contrato.fecha_inicio
    f_fin = contrato.fecha_fin
    if data.fecha_inicio:
        try:
            f_inicio = datetime.fromisoformat(data.fecha_inicio)
        except Exception:
            pass
    if data.fecha_fin:
        try:
            f_fin = datetime.fromisoformat(data.fecha_fin)
        except Exception:
            pass

    contrato.inmueble_nombre = data.inmueble_nombre
    contrato.tipo = data.tipo or "ARRENDATARIO"
    contrato.contraparte_nombre = data.contraparte_nombre
    contrato.dui_nit = data.dui_nit
    contrato.telefono = data.telefono
    contrato.email = data.email
    contrato.canon_mensual = data.canon_mensual or 0
    contrato.dia_pago_limite = data.dia_pago_limite or 5
    contrato.deposito_garantia = data.deposito_garantia or 0
    contrato.fecha_inicio = f_inicio
    contrato.fecha_fin = f_fin
    contrato.estado = data.estado or "activo"
    contrato.notas = data.notas

    db.commit()
    db.refresh(contrato)
    contrato.total_pagado_historico = sum(p.monto for p in contrato.pagos)
    return contrato


@router.delete("/{contrato_id}")
def eliminar_contrato(contrato_id: int, empresa_id: str, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    db.delete(contrato)
    db.commit()
    return {"message": "Contrato eliminado con éxito"}


@router.get("/{contrato_id}/pagos", response_model=List[PagoArrendamientoResponse])
def listar_pagos_contrato(contrato_id: int, empresa_id: str, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    pagos = db.query(PagoArrendamiento).filter(
        PagoArrendamiento.contrato_id == contrato_id
    ).order_by(PagoArrendamiento.fecha_pago.desc()).all()
    return pagos


@router.post("/{contrato_id}/pagos", response_model=PagoArrendamientoResponse, status_code=status.HTTP_201_CREATED)
def registrar_pago_arrendamiento(contrato_id: int, empresa_id: str, usuario_id: int, data: PagoArrendamientoCreate, db: Session = Depends(get_db)):
    contrato = db.query(ContratoArrendamiento).filter(
        ContratoArrendamiento.id == contrato_id,
        ContratoArrendamiento.empresa_id == empresa_id
    ).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero")

    tipo_transaccion = data.tipo or ("COBRO_ALQUILER" if contrato.tipo == "ARRENDADOR" else "PAGO_ALQUILER")

    pago = PagoArrendamiento(
        contrato_id=contrato.id,
        empresa_id=empresa_id,
        tipo=tipo_transaccion,
        monto=data.monto,
        metodo_pago=data.metodo_pago or "efectivo",
        referencia=data.referencia,
        notas=data.notas,
        usuario_id=usuario_id
    )

    if data.fecha_pago:
        try:
            pago.fecha_pago = datetime.fromisoformat(data.fecha_pago)
        except Exception:
            pass

    db.add(pago)
    db.flush()

    # Integración con Caja Activa si aplica
    if (data.metodo_pago or "efectivo").lower() == "efectivo":
        sesion = db.query(SesionCaja).join(Caja).filter(
            SesionCaja.usuario_id == usuario_id,
            SesionCaja.estado == "abierta",
            Caja.empresa_id == empresa_id
        ).first()
        
        if sesion:
            es_ingreso = tipo_transaccion == "COBRO_ALQUILER"
            db.add(MovimientoCaja(
                sesion_caja_id=sesion.id,
                tipo="ingreso" if es_ingreso else "egreso",
                metodo_pago="efectivo",
                monto=data.monto,
                concepto=f"Arrendamiento ({contrato.inmueble_nombre}): {contrato.contraparte_nombre}",
                referencia_tipo="arrendamiento",
                referencia_id=pago.id,
                usuario_id=usuario_id
            ))

    db.commit()
    db.refresh(pago)
    return pago
