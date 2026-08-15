from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Cliente
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/clientes", tags=["Clientes"])

class ClienteBase(BaseModel):
    nombre: str
    nombre_comercial: Optional[str] = None
    nit: Optional[str] = None
    dui: Optional[str] = None
    email: Optional[str] = None
    limite_credito: int = 0

class ClienteCreate(ClienteBase):
    pass

class ClienteResponse(ClienteBase):
    id_cliente: int
    empresa_id: int
    saldo_pendiente: int
    activo: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(empresa_id: int, db: Session = Depends(get_db)):
    return db.query(Cliente).filter(Cliente.empresa_id == empresa_id, Cliente.activo == True).all()

@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(empresa_id: int, cliente: ClienteCreate, db: Session = Depends(get_db)):
    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente
