from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Cliente, CuentaPorCobrar
from datetime import datetime
import pytz
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
    es_predeterminado: bool = False
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
    es_predeterminado: Optional[bool] = None
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
    if cliente.es_predeterminado:
        db.query(Cliente).filter(Cliente.empresa_id == empresa_id).update({"es_predeterminado": False})
    
    db_cliente = Cliente(**cliente.dict(), empresa_id=empresa_id)
    if db_cliente.saldo_inicial and db_cliente.saldo_inicial > 0:
        db_cliente.saldo_pendiente = (db_cliente.saldo_pendiente or 0) + db_cliente.saldo_inicial
    db.add(db_cliente)
    db.flush() # Para obtener id
    
    if db_cliente.saldo_inicial and db_cliente.saldo_inicial > 0:
        tz = pytz.timezone("America/El_Salvador")
        cxc = CuentaPorCobrar(
            empresa_id=empresa_id,
            cliente_id=db_cliente.id_cliente,
            factura_id=None,
            fecha_vencimiento=datetime.now(tz),
            monto_original=db_cliente.saldo_inicial,
            monto_pendiente=db_cliente.saldo_inicial,
            estado="pendiente"
        )
        db.add(cxc)

    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, empresa_id: str, datos: ClienteUpdate, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.empresa_id == empresa_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    if datos.es_predeterminado:
        db.query(Cliente).filter(Cliente.empresa_id == empresa_id, Cliente.id_cliente != cliente_id).update({"es_predeterminado": False})
        
    saldo_inicial_antiguo = c.saldo_inicial or 0
    
    for campo, valor in datos.dict(exclude_unset=True).items():
        setattr(c, campo, valor)
        
    saldo_inicial_nuevo = c.saldo_inicial or 0
    
    if saldo_inicial_nuevo != saldo_inicial_antiguo:
        # Ajustar saldo_pendiente
        diferencia = saldo_inicial_nuevo - saldo_inicial_antiguo
        c.saldo_pendiente = (c.saldo_pendiente or 0) + diferencia
        if c.saldo_pendiente < 0: c.saldo_pendiente = 0
        
        # Buscar cxc de saldo inicial (sin factura)
        cxc = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.cliente_id == c.id_cliente, CuentaPorCobrar.factura_id == None).first()
        if cxc:
            cxc.monto_original += diferencia
            cxc.monto_pendiente += diferencia
            if cxc.monto_pendiente <= 0:
                cxc.monto_pendiente = 0
                cxc.estado = "pagada"
            else:
                cxc.estado = "pendiente" if cxc.monto_pendiente == cxc.monto_original else "parcial"
        elif saldo_inicial_nuevo > 0:
            tz = pytz.timezone("America/El_Salvador")
            nueva_cxc = CuentaPorCobrar(
                empresa_id=empresa_id,
                cliente_id=c.id_cliente,
                factura_id=None,
                fecha_vencimiento=datetime.now(tz),
                monto_original=saldo_inicial_nuevo,
                monto_pendiente=saldo_inicial_nuevo,
                estado="pendiente"
            )
            db.add(nueva_cxc)

    db.commit()
    db.refresh(c)
    return c
