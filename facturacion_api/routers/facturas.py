from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Factura, ItemFactura, Cliente
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/facturas", tags=["Facturas"])

class ItemFacturaBase(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: int
    subtotal: int

class FacturaBase(BaseModel):
    numero: str
    cliente_id: int
    subtotal: int
    iva: int
    total: int
    items: List[ItemFacturaBase]

class FacturaCreate(FacturaBase):
    pass

class FacturaResponse(BaseModel):
    id: int
    numero: str
    cliente_id: int
    subtotal: int
    iva: int
    total: int
    estado: str
    fecha_emision: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[FacturaResponse])
def listar_facturas(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(Factura).filter(Factura.empresa_id == empresa_id).all()

@router.post("/", response_model=FacturaResponse, status_code=status.HTTP_201_CREATED)
def crear_factura(empresa_id: int, usuario_id: int, factura: FacturaCreate, db: Session = Depends(get_db)):
    # Verificar cliente
    cliente = db.query(Cliente).filter(Cliente.id_cliente == factura.cliente_id, Cliente.empresa_id == empresa_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db_factura = Factura(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        numero=factura.numero,
        cliente_id=factura.cliente_id,
        subtotal=factura.subtotal,
        iva=factura.iva,
        total=factura.total
    )
    db.add(db_factura)
    db.flush() # Para obtener db_factura.id

    for item in factura.items:
        db_item = ItemFactura(
            factura_id=db_factura.id,
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            precio_unitario=item.precio_unitario,
            subtotal=item.subtotal
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_factura)
    return db_factura
