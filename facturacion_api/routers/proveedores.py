from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Proveedor
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

class ProveedorBase(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    nombre_comercial: Optional[str] = None
    nit: Optional[str] = None
    nrc: Optional[str] = None
    es_gran_contribuyente: bool = False
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    limite_credito: int = 0

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    nombre_comercial: Optional[str] = None
    nit: Optional[str] = None
    nrc: Optional[str] = None
    es_gran_contribuyente: Optional[bool] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    limite_credito: Optional[int] = None
    activo: Optional[bool] = None

class ProveedorResponse(ProveedorBase):
    id: int
    empresa_id: str
    saldo_pendiente: int
    activo: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProveedorResponse])
def listar_proveedores(empresa_id: str, solo_activos: bool = True, db: Session = Depends(get_db)):
    query = db.query(Proveedor).filter(Proveedor.empresa_id == empresa_id)
    if solo_activos:
        query = query.filter(Proveedor.activo == True)
    return query.order_by(Proveedor.nombre).all()


@router.get("/{proveedor_id}", response_model=ProveedorResponse)
def obtener_proveedor(proveedor_id: int, empresa_id: str, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id, Proveedor.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return p


@router.post("/", response_model=ProveedorResponse, status_code=status.HTTP_201_CREATED)
def crear_proveedor(empresa_id: str, proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    if proveedor.nit:
        existente = db.query(Proveedor).filter(
            Proveedor.empresa_id == empresa_id,
            Proveedor.nit == proveedor.nit
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"Ya existe un proveedor con NIT '{proveedor.nit}'")

    nuevo = Proveedor(**proveedor.dict(), empresa_id=empresa_id)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{proveedor_id}", response_model=ProveedorResponse)
def actualizar_proveedor(proveedor_id: int, empresa_id: str, datos: ProveedorUpdate, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id, Proveedor.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(p, campo, valor)
    
    db.commit()
    db.refresh(p)
    return p
