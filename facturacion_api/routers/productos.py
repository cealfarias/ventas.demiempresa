from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Producto
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/productos", tags=["Productos"])

class ProductoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    precio_venta: int
    costo_promedio: int = 0
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
def listar_productos(empresa_id: str, db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.empresa_id == empresa_id, Producto.activo == True).all()

@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(empresa_id: str, producto: ProductoCreate, db: Session = Depends(get_db)):
    db_producto = Producto(**producto.dict(), empresa_id=empresa_id)
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto
