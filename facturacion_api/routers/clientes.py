from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Cliente
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/clientes", tags=["Clientes"])


class ClienteBase(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    nombre_comercial: Optional[str] = None
    nit: Optional[str] = None
    nrc: Optional[str] = None
    dui: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    es_gran_contribuyente: bool = False
    actividad_economica_cod: Optional[str] = None
    limite_credito: int = 0
    saldo_inicial: int = 0

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    nombre_comercial: Optional[str] = None
    nit: Optional[str] = None
    nrc: Optional[str] = None
    dui: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    es_gran_contribuyente: Optional[bool] = None
    actividad_economica_cod: Optional[str] = None
    limite_credito: Optional[int] = None
    saldo_inicial: Optional[int] = None
    activo: Optional[bool] = None

class ClienteResponse(ClienteBase):
    id_cliente: int
    empresa_id: str
    saldo_pendiente: int
    activo: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(empresa_id: str, solo_activos: bool = True, db: Session = Depends(get_db)):
    query = db.query(Cliente).filter(Cliente.empresa_id == empresa_id)
    if solo_activos:
        query = query.filter(Cliente.activo == True)
    return query.order_by(Cliente.nombre).all()


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(empresa_id: str, cliente: ClienteCreate, db: Session = Depends(get_db)):
    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, empresa_id: str, datos: ClienteUpdate, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.empresa_id == empresa_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(c, campo, valor)
        
    db.commit()
    db.refresh(c)
    return c
