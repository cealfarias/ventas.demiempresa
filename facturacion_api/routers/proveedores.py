from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Proveedor, CuentaPorPagar
from datetime import datetime
import pytz
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
    saldo_inicial: int = 0

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
    saldo_inicial: Optional[int] = None
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
    if nuevo.saldo_inicial and nuevo.saldo_inicial > 0:
        nuevo.saldo_pendiente = (nuevo.saldo_pendiente or 0) + nuevo.saldo_inicial
    db.add(nuevo)
    db.flush() # Para obtener id
    
    if nuevo.saldo_inicial and nuevo.saldo_inicial > 0:
        tz = pytz.timezone("America/El_Salvador")
        cxp = CuentaPorPagar(
            empresa_id=empresa_id,
            proveedor_id=nuevo.id,
            orden_compra_id=None,
            fecha_vencimiento=datetime.now(tz),
            monto_original=nuevo.saldo_inicial,
            monto_pendiente=nuevo.saldo_inicial,
            estado="pendiente"
        )
        db.add(cxp)

    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{proveedor_id}", response_model=ProveedorResponse)
def actualizar_proveedor(proveedor_id: int, empresa_id: str, datos: ProveedorUpdate, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id, Proveedor.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    saldo_inicial_antiguo = p.saldo_inicial or 0
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(p, campo, valor)
        
    saldo_inicial_nuevo = p.saldo_inicial or 0
    
    if saldo_inicial_nuevo != saldo_inicial_antiguo:
        # Ajustar saldo_pendiente
        diferencia = saldo_inicial_nuevo - saldo_inicial_antiguo
        p.saldo_pendiente = (p.saldo_pendiente or 0) + diferencia
        if p.saldo_pendiente < 0: p.saldo_pendiente = 0
        
        # Buscar cxp de saldo inicial (sin orden)
        cxp = db.query(CuentaPorPagar).filter(CuentaPorPagar.proveedor_id == p.id, CuentaPorPagar.orden_compra_id == None).first()
        if cxp:
            cxp.monto_original += diferencia
            cxp.monto_pendiente += diferencia
            if cxp.monto_pendiente <= 0:
                cxp.monto_pendiente = 0
                cxp.estado = "pagada"
            else:
                cxp.estado = "pendiente" if cxp.monto_pendiente == cxp.monto_original else "parcial"
        elif saldo_inicial_nuevo > 0:
            tz = pytz.timezone("America/El_Salvador")
            nueva_cxp = CuentaPorPagar(
                empresa_id=empresa_id,
                proveedor_id=p.id,
                orden_compra_id=None,
                fecha_vencimiento=datetime.now(tz),
                monto_original=saldo_inicial_nuevo,
                monto_pendiente=saldo_inicial_nuevo,
                estado="pendiente"
            )
            db.add(nueva_cxp)

    db.commit()
    db.refresh(p)
    return p
