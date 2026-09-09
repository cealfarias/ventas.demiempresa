from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Vendedor, Factura, Cliente
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import calendar
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")
router = APIRouter(prefix="/vendedores", tags=["Vendedores"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class VendedorBase(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    dui: Optional[str] = None
    direccion: Optional[str] = None
    porcentaje_comision: float = 0.0
    activo: bool = True

class VendedorCreate(VendedorBase):
    pass

class VendedorUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    dui: Optional[str] = None
    direccion: Optional[str] = None
    porcentaje_comision: Optional[float] = None
    activo: Optional[bool] = None

class VendedorResponse(VendedorBase):
    id: int
    empresa_id: str
    fecha_creacion: datetime
    total_ventas_historico: int = 0
    cantidad_facturas_historico: int = 0

    class Config:
        from_attributes = True

class VentaItemResponse(BaseModel):
    id: int
    numero: str
    tipo_doc: str
    cliente_nombre: str
    fecha_emision: datetime
    condicion_operacion: str
    total: int # centavos
    estado: str
    estado_dte: str

    class Config:
        from_attributes = True

class VentasVendedorDetalleResponse(BaseModel):
    vendedor_id: int
    vendedor_nombre: str
    codigo: Optional[str]
    porcentaje_comision: float
    periodo: str
    anio: int
    total_ventas: int # centavos
    cantidad_facturas: int
    ticket_promedio: int # centavos
    comision_estimada: int # centavos
    facturas: List[VentaItemResponse]


# ── Helper ────────────────────────────────────────────────────────────────────

def _generar_codigo_vendedor(db: Session, empresa_id: str) -> str:
    total = db.query(Vendedor).filter(Vendedor.empresa_id == empresa_id).count()
    return f"VEN-{str(total + 1).zfill(3)}"


# ── Endpoints CRUD ────────────────────────────────────────────────────────────

@router.get("/", response_model=List[VendedorResponse])
@router.get("", response_model=List[VendedorResponse])
def listar_vendedores(
    empresa_id: str, 
    solo_activos: bool = False, 
    busqueda: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Vendedor).filter(Vendedor.empresa_id == empresa_id)
    if solo_activos:
        query = query.filter(Vendedor.activo == True)
    
    if busqueda:
        term = f"%{busqueda.strip()}%"
        query = query.filter(
            (Vendedor.nombre.ilike(term)) |
            (Vendedor.codigo.ilike(term)) |
            (Vendedor.dui.ilike(term)) |
            (Vendedor.email.ilike(term)) |
            (Vendedor.telefono.ilike(term))
        )
    
    vendedores = query.order_by(Vendedor.nombre).all()
    resultado = []
    
    for v in vendedores:
        totales = db.query(
            func.coalesce(func.sum(Factura.total), 0).label("total"),
            func.count(Factura.id).label("count")
        ).filter(
            Factura.empresa_id == empresa_id,
            Factura.vendedor_id == v.id,
            Factura.estado != "anulada"
        ).first()

        resultado.append(VendedorResponse(
            id=v.id,
            empresa_id=v.empresa_id,
            codigo=v.codigo,
            nombre=v.nombre,
            telefono=v.telefono,
            email=v.email,
            dui=v.dui,
            direccion=v.direccion,
            porcentaje_comision=v.porcentaje_comision or 0.0,
            activo=v.activo,
            fecha_creacion=v.fecha_creacion,
            total_ventas_historico=int(totales.total) if totales else 0,
            cantidad_facturas_historico=int(totales.count) if totales else 0
        ))
    return resultado


@router.post("/", response_model=VendedorResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=VendedorResponse, status_code=status.HTTP_201_CREATED)
def crear_vendedor(empresa_id: str, data: VendedorCreate, db: Session = Depends(get_db)):
    codigo = data.codigo.strip() if data.codigo and data.codigo.strip() else _generar_codigo_vendedor(db, empresa_id)
    
    v = Vendedor(
        empresa_id=empresa_id,
        codigo=codigo,
        nombre=data.nombre.strip(),
        telefono=data.telefono.strip() if data.telefono else None,
        email=data.email.strip() if data.email else None,
        dui=data.dui.strip() if data.dui else None,
        direccion=data.direccion.strip() if data.direccion else None,
        porcentaje_comision=data.porcentaje_comision or 0.0,
        activo=data.activo
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return VendedorResponse(
        id=v.id,
        empresa_id=v.empresa_id,
        codigo=v.codigo,
        nombre=v.nombre,
        telefono=v.telefono,
        email=v.email,
        dui=v.dui,
        direccion=v.direccion,
        porcentaje_comision=v.porcentaje_comision or 0.0,
        activo=v.activo,
        fecha_creacion=v.fecha_creacion,
        total_ventas_historico=0,
        cantidad_facturas_historico=0
    )


@router.get("/{vendedor_id}", response_model=VendedorResponse)
def obtener_vendedor(vendedor_id: int, empresa_id: str, db: Session = Depends(get_db)):
    v = db.query(Vendedor).filter(Vendedor.id == vendedor_id, Vendedor.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    totales = db.query(
        func.coalesce(func.sum(Factura.total), 0).label("total"),
        func.count(Factura.id).label("count")
    ).filter(
        Factura.empresa_id == empresa_id,
        Factura.vendedor_id == v.id,
        Factura.estado != "anulada"
    ).first()

    return VendedorResponse(
        id=v.id,
        empresa_id=v.empresa_id,
        codigo=v.codigo,
        nombre=v.nombre,
        telefono=v.telefono,
        email=v.email,
        dui=v.dui,
        direccion=v.direccion,
        porcentaje_comision=v.porcentaje_comision or 0.0,
        activo=v.activo,
        fecha_creacion=v.fecha_creacion,
        total_ventas_historico=int(totales.total) if totales else 0,
        cantidad_facturas_historico=int(totales.count) if totales else 0
    )


@router.put("/{vendedor_id}", response_model=VendedorResponse)
def actualizar_vendedor(vendedor_id: int, empresa_id: str, data: VendedorUpdate, db: Session = Depends(get_db)):
    v = db.query(Vendedor).filter(Vendedor.id == vendedor_id, Vendedor.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    for campo, valor in data.dict(exclude_unset=True).items():
        setattr(v, campo, valor)
    
    db.commit()
    db.refresh(v)

    totales = db.query(
        func.coalesce(func.sum(Factura.total), 0).label("total"),
        func.count(Factura.id).label("count")
    ).filter(
        Factura.empresa_id == empresa_id,
        Factura.vendedor_id == v.id,
        Factura.estado != "anulada"
    ).first()

    return VendedorResponse(
        id=v.id,
        empresa_id=v.empresa_id,
        codigo=v.codigo,
        nombre=v.nombre,
        telefono=v.telefono,
        email=v.email,
        dui=v.dui,
        direccion=v.direccion,
        porcentaje_comision=v.porcentaje_comision or 0.0,
        activo=v.activo,
        fecha_creacion=v.fecha_creacion,
        total_ventas_historico=int(totales.total) if totales else 0,
        cantidad_facturas_historico=int(totales.count) if totales else 0
    )


@router.delete("/{vendedor_id}")
def toggle_estado_vendedor(vendedor_id: int, empresa_id: str, db: Session = Depends(get_db)):
    v = db.query(Vendedor).filter(Vendedor.id == vendedor_id, Vendedor.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    v.activo = not v.activo
    db.commit()
    return {"message": f"Vendedor {'activado' if v.activo else 'desactivado'} exitosamente", "activo": v.activo}


# ── Detalle de Ventas del Vendedor (Patrón Dashboard) ──────────────────────────

@router.get("/{vendedor_id}/ventas", response_model=VentasVendedorDetalleResponse)
def detalle_ventas_vendedor(
    vendedor_id: int,
    empresa_id: str,
    periodo: str = "dia", # dia | semana | mes | anio
    anio: Optional[int] = None,
    tz: str = "America/El_Salvador",
    db: Session = Depends(get_db)
):
    v = db.query(Vendedor).filter(Vendedor.id == vendedor_id, Vendedor.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    try:
        local_tz = pytz.timezone(tz)
    except Exception:
        local_tz = TIMEZONE

    hoy = datetime.now(local_tz)
    if not anio:
        anio = hoy.year

    query = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.vendedor_id == vendedor_id
    )

    if periodo == "dia":
        inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
    elif periodo == "semana":
        inicio = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        fin = inicio + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
    elif periodo == "mes":
        _, last_day = calendar.monthrange(hoy.year, hoy.month)
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
    elif periodo == "anio":
        inicio_anio = datetime(anio, 1, 1, 0, 0, 0, tzinfo=local_tz)
        fin_anio = datetime(anio, 12, 31, 23, 59, 59, 999999, tzinfo=local_tz)
        query = query.filter(Factura.fecha_emision >= inicio_anio, Factura.fecha_emision <= fin_anio)
    else:
        # Fallback a todo el año seleccionado
        inicio_anio = datetime(anio, 1, 1, 0, 0, 0, tzinfo=local_tz)
        fin_anio = datetime(anio, 12, 31, 23, 59, 59, 999999, tzinfo=local_tz)
        query = query.filter(Factura.fecha_emision >= inicio_anio, Factura.fecha_emision <= fin_anio)

    facturas_db = query.order_by(Factura.fecha_emision.desc()).all()

    total_ventas = 0
    cantidad_validas = 0
    lista_items = []

    for f in facturas_db:
        cliente_nombre = f.cliente.nombre if f.cliente else "Cliente General"
        lista_items.append(VentaItemResponse(
            id=f.id,
            numero=f.numero,
            tipo_doc=f.tipo_doc,
            cliente_nombre=cliente_nombre,
            fecha_emision=f.fecha_emision,
            condicion_operacion=f.condicion_operacion,
            total=f.total,
            estado=f.estado,
            estado_dte=f.estado_dte or "pendiente"
        ))
        if f.estado != "anulada":
            total_ventas += f.total
            cantidad_validas += 1

    ticket_promedio = int(round(total_ventas / cantidad_validas)) if cantidad_validas > 0 else 0
    comision_pct = v.porcentaje_comision or 0.0
    comision_estimada = int(round(total_ventas * (comision_pct / 100.0)))

    return VentasVendedorDetalleResponse(
        vendedor_id=v.id,
        vendedor_nombre=v.nombre,
        codigo=v.codigo,
        porcentaje_comision=comision_pct,
        periodo=periodo,
        anio=anio,
        total_ventas=total_ventas,
        cantidad_facturas=cantidad_validas,
        ticket_promedio=ticket_promedio,
        comision_estimada=comision_estimada,
        facturas=lista_items
    )
