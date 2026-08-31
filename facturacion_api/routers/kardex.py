from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Kardex, StockBodega, Bodega, Producto
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

router = APIRouter(prefix="/kardex", tags=["Kardex"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class AjusteManualRequest(BaseModel):
    empresa_id: str
    bodega_id: int
    producto_id: int
    tipo_movimiento: str          # AJUSTE_POSITIVO | AJUSTE_NEGATIVO
    cantidad: float
    costo_unitario: int           # centavos
    usuario_id: Optional[int] = None
    notas: Optional[str] = None

class KardexResponse(BaseModel):
    id: int
    bodega_nombre: str
    producto_codigo: str
    producto_nombre: str
    tipo_movimiento: str
    referencia_tipo: Optional[str]
    referencia_id: Optional[int]
    cantidad: float
    costo_unitario: int
    costo_total: int
    stock_anterior: float
    stock_resultante: float
    fecha: datetime
    notas: Optional[str]

    class Config:
        from_attributes = True

class StockResponse(BaseModel):
    producto_id: int
    producto_codigo: str
    producto_nombre: str
    bodega_id: int
    bodega_nombre: str
    stock_actual: float
    costo_promedio: int
    valor_total: int              # stock_actual × costo_promedio (centavos)

# ── Helper interno (reutilizable desde otros routers) ─────────────────────────

def registrar_movimiento(
    db: Session,
    empresa_id: str,
    bodega_id: int,
    producto_id: int,
    tipo_movimiento: str,
    cantidad: float,
    costo_unitario: int,
    referencia_tipo: str = None,
    referencia_id: int = None,
    usuario_id: int = None,
    notas: str = None
) -> Kardex:
    """
    Registra un movimiento en el Kardex y actualiza StockBodega en una transacción.
    Recalcula el costo promedio ponderado en entradas.
    Retorna el registro de Kardex creado.
    """
    # Obtener o crear el saldo de la bodega para este producto
    saldo = db.query(StockBodega).filter(
        StockBodega.empresa_id == empresa_id,
        StockBodega.producto_id == producto_id,
        StockBodega.bodega_id == bodega_id
    ).with_for_update().first()

    if not saldo:
        saldo = StockBodega(
            empresa_id=empresa_id,
            producto_id=producto_id,
            bodega_id=bodega_id,
            stock_actual=0.0,
            costo_promedio=0
        )
        db.add(saldo)
        db.flush()

    stock_anterior = saldo.stock_actual

    # Calcular nuevo stock
    if tipo_movimiento in ("ENTRADA_COMPRA", "AJUSTE_POSITIVO"):
        nuevo_stock = stock_anterior + cantidad
        # Costo promedio ponderado
        if nuevo_stock > 0:
            saldo.costo_promedio = int(
                (stock_anterior * saldo.costo_promedio + cantidad * costo_unitario) / nuevo_stock
            )
        saldo.stock_actual = nuevo_stock
    elif tipo_movimiento in ("SALIDA_VENTA", "AJUSTE_NEGATIVO"):
        if stock_anterior < cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente. Disponible: {stock_anterior}, Solicitado: {cantidad}"
            )
        saldo.stock_actual = stock_anterior - cantidad
    else:
        raise ValueError(f"tipo_movimiento desconocido: {tipo_movimiento}")

    # Registrar en Kardex
    movimiento = Kardex(
        empresa_id=empresa_id,
        bodega_id=bodega_id,
        producto_id=producto_id,
        tipo_movimiento=tipo_movimiento,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
        cantidad=cantidad,
        costo_unitario=costo_unitario,
        costo_total=int(cantidad * costo_unitario),
        stock_anterior=stock_anterior,
        stock_resultante=saldo.stock_actual,
        usuario_id=usuario_id,
        notas=notas
    )
    db.add(movimiento)

    # Actualizar también el stock global del Producto (para compatibilidad)
    producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if producto:
        # Sumar todos los stocks de todas las bodegas de esta empresa
        total_stock = db.query(func.sum(StockBodega.stock_actual)).filter(
            StockBodega.empresa_id == empresa_id,
            StockBodega.producto_id == producto_id
        ).scalar() or 0.0
        producto.stock = total_stock + (cantidad if tipo_movimiento in ("ENTRADA_COMPRA", "AJUSTE_POSITIVO") else -cantidad)

    return movimiento


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/movimientos", response_model=List[KardexResponse])
def listar_movimientos(
    empresa_id: str,
    bodega_id: Optional[int] = None,
    producto_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Kardex).filter(Kardex.empresa_id == empresa_id)

    if bodega_id:
        query = query.filter(Kardex.bodega_id == bodega_id)
    if producto_id:
        query = query.filter(Kardex.producto_id == producto_id)
    if tipo_movimiento:
        query = query.filter(Kardex.tipo_movimiento == tipo_movimiento)
    if fecha_desde:
        query = query.filter(Kardex.fecha >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(Kardex.fecha <= datetime.combine(fecha_hasta, datetime.max.time()))

    movimientos = query.order_by(Kardex.fecha.desc()).limit(limit).all()

    return [
        KardexResponse(
            id=m.id,
            bodega_nombre=m.bodega.nombre if m.bodega else "—",
            producto_codigo=m.producto.codigo if m.producto else "—",
            producto_nombre=m.producto.nombre if m.producto else "—",
            tipo_movimiento=m.tipo_movimiento,
            referencia_tipo=m.referencia_tipo,
            referencia_id=m.referencia_id,
            cantidad=m.cantidad,
            costo_unitario=m.costo_unitario,
            costo_total=m.costo_total,
            stock_anterior=m.stock_anterior,
            stock_resultante=m.stock_resultante,
            fecha=m.fecha,
            notas=m.notas
        )
        for m in movimientos
    ]


@router.get("/existencias", response_model=List[StockResponse])
def ver_existencias(
    empresa_id: str,
    bodega_id: Optional[int] = None,
    producto_id: Optional[int] = None,
    solo_con_stock: bool = False,
    db: Session = Depends(get_db)
):
    """Vista consolidada de existencias actuales por producto × bodega."""
    query = db.query(StockBodega).filter(StockBodega.empresa_id == empresa_id)

    if bodega_id:
        query = query.filter(StockBodega.bodega_id == bodega_id)
    if producto_id:
        query = query.filter(StockBodega.producto_id == producto_id)
    if solo_con_stock:
        query = query.filter(StockBodega.stock_actual > 0)

    registros = query.all()

    return [
        StockResponse(
            producto_id=r.producto_id,
            producto_codigo=r.producto.codigo if r.producto else "—",
            producto_nombre=r.producto.nombre if r.producto else "—",
            bodega_id=r.bodega_id,
            bodega_nombre=r.bodega.nombre if r.bodega else "—",
            stock_actual=r.stock_actual,
            costo_promedio=r.costo_promedio,
            valor_total=int(r.stock_actual * r.costo_promedio)
        )
        for r in registros
    ]


@router.post("/ajuste", status_code=201)
def registrar_ajuste(ajuste: AjusteManualRequest, db: Session = Depends(get_db)):
    """Ajuste manual de inventario (positivo o negativo)."""
    if ajuste.tipo_movimiento not in ("AJUSTE_POSITIVO", "AJUSTE_NEGATIVO"):
        raise HTTPException(status_code=400, detail="tipo_movimiento debe ser AJUSTE_POSITIVO o AJUSTE_NEGATIVO")

    movimiento = registrar_movimiento(
        db=db,
        empresa_id=ajuste.empresa_id,
        bodega_id=ajuste.bodega_id,
        producto_id=ajuste.producto_id,
        tipo_movimiento=ajuste.tipo_movimiento,
        cantidad=ajuste.cantidad,
        costo_unitario=ajuste.costo_unitario,
        referencia_tipo="manual",
        usuario_id=ajuste.usuario_id,
        notas=ajuste.notas
    )
    db.commit()
    return {"mensaje": "Ajuste registrado", "kardex_id": movimiento.id}
