from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import CuentaPorPagar, PagoCxP, Proveedor
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/cuentas-pagar", tags=["Cuentas por Pagar"])

class PagoRequest(BaseModel):
    monto: int                    # centavos
    metodo_pago: str = "efectivo" # efectivo|transferencia|cheque|deposito
    referencia: Optional[str] = None
    notas: Optional[str] = None
    usuario_id: Optional[int] = None

class PagoResponse(BaseModel):
    id: int
    monto: int
    metodo_pago: str
    referencia: Optional[str]
    fecha: datetime
    notas: Optional[str]

    class Config:
        from_attributes = True

class CuentaPagarResponse(BaseModel):
    id: int
    empresa_id: str
    proveedor_id: int
    proveedor_nombre: str
    orden_compra_id: Optional[int]
    orden_numero: Optional[str]
    monto_original: int
    monto_pendiente: int
    fecha_vencimiento: Optional[datetime]
    estado: str
    fecha_creacion: datetime
    pagos: List[PagoResponse] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CuentaPagarResponse])
def listar_cuentas(empresa_id: str, estado: Optional[str] = None, proveedor_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(CuentaPorPagar).filter(CuentaPorPagar.empresa_id == empresa_id)
    if estado:
        query = query.filter(CuentaPorPagar.estado == estado)
    if proveedor_id:
        query = query.filter(CuentaPorPagar.proveedor_id == proveedor_id)
    cuentas = query.order_by(CuentaPorPagar.fecha_vencimiento.asc()).all()
    
    return [
        CuentaPagarResponse(
            id=c.id, empresa_id=c.empresa_id,
            proveedor_id=c.proveedor_id,
            proveedor_nombre=c.proveedor.nombre if c.proveedor else "",
            orden_compra_id=c.orden_compra_id,
            orden_numero=c.orden.numero if c.orden else None,
            monto_original=c.monto_original, monto_pendiente=c.monto_pendiente,
            fecha_vencimiento=c.fecha_vencimiento, estado=c.estado,
            fecha_creacion=c.fecha_creacion,
            pagos=[PagoResponse(id=p.id, monto=p.monto, metodo_pago=p.metodo_pago,
                                referencia=p.referencia, fecha=p.fecha, notas=p.notas)
                   for p in c.pagos]
        ) for c in cuentas
    ]


@router.post("/{cuenta_id}/pagar", response_model=CuentaPagarResponse)
def registrar_pago(cuenta_id: int, empresa_id: str, pago: PagoRequest, db: Session = Depends(get_db)):
    cuenta = db.query(CuentaPorPagar).filter(
        CuentaPorPagar.id == cuenta_id,
        CuentaPorPagar.empresa_id == empresa_id
    ).first()
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta por pagar no encontrada")
    if cuenta.estado == "pagada":
        raise HTTPException(status_code=400, detail="Esta cuenta ya está pagada")
    if pago.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a cero")
    if pago.monto > cuenta.monto_pendiente:
        raise HTTPException(status_code=400, detail=f"El pago ({pago.monto/100:.2f}) supera el saldo pendiente ({cuenta.monto_pendiente/100:.2f})")

    nuevo_pago = PagoCxP(
        cuenta_pagar_id=cuenta_id,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        referencia=pago.referencia,
        notas=pago.notas,
        usuario_id=pago.usuario_id
    )
    db.add(nuevo_pago)

    cuenta.monto_pendiente -= pago.monto
    if cuenta.monto_pendiente <= 0:
        cuenta.monto_pendiente = 0
        cuenta.estado = "pagada"
    else:
        cuenta.estado = "parcial"

    if cuenta.proveedor:
        cuenta.proveedor.saldo_pendiente = max(0, (cuenta.proveedor.saldo_pendiente or 0) - pago.monto)

    db.commit()
    db.refresh(cuenta)
    
    return CuentaPagarResponse(
        id=cuenta.id, empresa_id=cuenta.empresa_id,
        proveedor_id=cuenta.proveedor_id,
        proveedor_nombre=cuenta.proveedor.nombre if cuenta.proveedor else "",
        orden_compra_id=cuenta.orden_compra_id,
        orden_numero=cuenta.orden.numero if cuenta.orden else None,
        monto_original=cuenta.monto_original, monto_pendiente=cuenta.monto_pendiente,
        fecha_vencimiento=cuenta.fecha_vencimiento, estado=cuenta.estado,
        fecha_creacion=cuenta.fecha_creacion,
        pagos=[PagoResponse(id=p.id, monto=p.monto, metodo_pago=p.metodo_pago,
                            referencia=p.referencia, fecha=p.fecha, notas=p.notas)
               for p in cuenta.pagos]
    )
