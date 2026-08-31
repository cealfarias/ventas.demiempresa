from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import CuentaPorCobrar, PagoCxC, Cliente
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/cuentas-cobrar", tags=["Cuentas por Cobrar"])

class PagoCxCRequest(BaseModel):
    monto: int                    # centavos
    metodo_pago: str = "efectivo" # efectivo|transferencia|cheque|tarjeta
    referencia: Optional[str] = None
    notas: Optional[str] = None
    usuario_id: Optional[int] = None

class PagoCxCResponse(BaseModel):
    id: int
    monto: int
    metodo_pago: str
    referencia: Optional[str]
    fecha: datetime
    notas: Optional[str]

    class Config:
        from_attributes = True

class CuentaCobrarResponse(BaseModel):
    id: int
    empresa_id: str
    cliente_id: int
    cliente_nombre: str
    factura_id: Optional[int]
    factura_numero: Optional[str]
    monto_original: int
    monto_pendiente: int
    fecha_vencimiento: Optional[datetime]
    estado: str
    fecha_creacion: datetime
    pagos: List[PagoCxCResponse] = []

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CuentaCobrarResponse])
def listar_cuentas(empresa_id: str, estado: Optional[str] = None, cliente_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.empresa_id == empresa_id)
    if estado:
        query = query.filter(CuentaPorCobrar.estado == estado)
    if cliente_id:
        query = query.filter(CuentaPorCobrar.cliente_id == cliente_id)
    
    cuentas = query.order_by(CuentaPorCobrar.fecha_vencimiento.asc()).all()
    
    return [
        CuentaCobrarResponse(
            id=c.id, empresa_id=c.empresa_id,
            cliente_id=c.cliente_id,
            cliente_nombre=c.cliente.nombre if c.cliente else "",
            factura_id=c.factura_id,
            factura_numero=c.factura.numero if c.factura else None,
            monto_original=c.monto_original, monto_pendiente=c.monto_pendiente,
            fecha_vencimiento=c.fecha_vencimiento, estado=c.estado,
            fecha_creacion=c.fecha_creacion,
            pagos=[PagoCxCResponse(id=p.id, monto=p.monto, metodo_pago=p.metodo_pago,
                                   referencia=p.referencia, fecha=p.fecha, notas=p.notas)
                   for p in c.pagos]
        ) for c in cuentas
    ]


@router.post("/{cuenta_id}/pagar", response_model=CuentaCobrarResponse)
def registrar_pago(cuenta_id: int, empresa_id: str, pago: PagoCxCRequest, db: Session = Depends(get_db)):
    cuenta = db.query(CuentaPorCobrar).filter(
        CuentaPorCobrar.id == cuenta_id,
        CuentaPorCobrar.empresa_id == empresa_id
    ).first()
    
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta por cobrar no encontrada")
    if cuenta.estado == "pagada":
        raise HTTPException(status_code=400, detail="Esta cuenta ya está pagada")
    if pago.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a cero")
    if pago.monto > cuenta.monto_pendiente:
        raise HTTPException(status_code=400, detail=f"El pago ({pago.monto/100:.2f}) supera el saldo pendiente ({cuenta.monto_pendiente/100:.2f})")

    nuevo_pago = PagoCxC(
        cuenta_cobrar_id=cuenta_id,
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

    if cuenta.cliente:
        cuenta.cliente.saldo_pendiente = max(0, (cuenta.cliente.saldo_pendiente or 0) - pago.monto)

    db.commit()
    db.refresh(cuenta)
    
    return CuentaCobrarResponse(
        id=cuenta.id, empresa_id=cuenta.empresa_id,
        cliente_id=cuenta.cliente_id,
        cliente_nombre=cuenta.cliente.nombre if cuenta.cliente else "",
        factura_id=cuenta.factura_id,
        factura_numero=cuenta.factura.numero if cuenta.factura else None,
        monto_original=cuenta.monto_original, monto_pendiente=cuenta.monto_pendiente,
        fecha_vencimiento=cuenta.fecha_vencimiento, estado=cuenta.estado,
        fecha_creacion=cuenta.fecha_creacion,
        pagos=[PagoCxCResponse(id=p.id, monto=p.monto, metodo_pago=p.metodo_pago,
                               referencia=p.referencia, fecha=p.fecha, notas=p.notas)
               for p in cuenta.pagos]
    )
