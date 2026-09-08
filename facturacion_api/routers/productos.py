from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from routers.kardex import registrar_movimiento
from models import Producto, Bodega, StockBodega
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/productos", tags=["Productos"])

class ProductoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_venta: float
    costo_promedio: float = 0.0
    stock: float = 0.0

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id_producto: int
    empresa_id: str
    activo: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductoResponse])
def listar_productos(empresa_id: str, bodega_id: Optional[int] = None, db: Session = Depends(get_db)):
    bodega_target = None
    if bodega_id:
        bodega_target = db.query(Bodega).filter(Bodega.empresa_id == empresa_id, Bodega.id == bodega_id).first()
    if not bodega_target:
        bodega_target = db.query(Bodega).filter(Bodega.empresa_id == empresa_id, Bodega.es_principal == True).first()
    if not bodega_target:
        bodega_target = db.query(Bodega).filter(Bodega.empresa_id == empresa_id).first()

    productos = db.query(Producto).filter(Producto.empresa_id == empresa_id, Producto.activo == True).all()

    if bodega_target:
        stocks_bodega = {
            sb.producto_id: sb.stock_actual
            for sb in db.query(StockBodega).filter(
                StockBodega.empresa_id == empresa_id,
                StockBodega.bodega_id == bodega_target.id
            ).all()
        }
        for p in productos:
            if p.id_producto in stocks_bodega:
                p.stock = stocks_bodega[p.id_producto]

    return productos

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(empresa_id: str, producto: ProductoCreate, db: Session = Depends(get_db)):
    db_producto = Producto(**producto.dict(), empresa_id=empresa_id)
    stock_inicial = db_producto.stock
    db_producto.stock = 0.0  # Se registrar va kardex
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    
    if stock_inicial > 0:
        bodega = db.query(Bodega).filter(Bodega.empresa_id == empresa_id, Bodega.es_principal == True).first()
        if not bodega:
            bodega = db.query(Bodega).filter(Bodega.empresa_id == empresa_id).first()
            
        if bodega:
            registrar_movimiento(
                db=db,
                empresa_id=empresa_id,
                bodega_id=bodega.id,
                producto_id=db_producto.id_producto,
                tipo_movimiento="AJUSTE_POSITIVO",
                cantidad=stock_inicial,
                costo_unitario=db_producto.costo_promedio,
                referencia_tipo="manual",
                notas="Saldo inicial"
            )
            db.commit()
            db.refresh(db_producto)
            
    return db_producto

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_venta: Optional[float] = None
    costo_promedio: Optional[float] = None
    stock: Optional[float] = None
    activo: Optional[bool] = None

@router.put("/{id_producto}", response_model=ProductoResponse)
def actualizar_producto(id_producto: int, empresa_id: str, producto: ProductoUpdate, db: Session = Depends(get_db)):
    db_prod = db.query(Producto).filter(Producto.id_producto == id_producto, Producto.empresa_id == empresa_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = producto.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prod, key, value)
        
    db.commit()
    db.refresh(db_prod)
    return db_prod

@router.delete("/{id_producto}")
def eliminar_producto(id_producto: int, empresa_id: str, db: Session = Depends(get_db)):
    db_prod = db.query(Producto).filter(Producto.id_producto == id_producto, Producto.empresa_id == empresa_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db_prod.activo = False
    db.commit()
    return {"detail": "Producto eliminado (marcado inactivo)"}

