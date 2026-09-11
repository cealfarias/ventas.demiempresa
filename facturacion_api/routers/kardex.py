from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Kardex, StockBodega, Bodega, Producto, Factura, ItemFactura
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
    costo_unitario: float           # centavos
    usuario_id: Optional[int] = None
    notas: Optional[str] = None

class RecalcularSaldosRequest(BaseModel):
    empresa_id: str
    producto_id: Optional[int] = None
    bodega_id: Optional[int] = None
    incluir_ventas_sin_bodega: bool = True
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None

class KardexResponse(BaseModel):
    id: int
    bodega_nombre: str
    producto_id: int
    producto_codigo: str
    producto_nombre: str
    tipo_movimiento: str
    referencia_tipo: Optional[str]
    referencia_id: Optional[int]
    cantidad: float
    costo_unitario: float
    costo_total: float
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
    costo_promedio: float
    valor_total: float              # stock_actual × costo_promedio (centavos)

# ── Helper interno (reutilizable desde otros routers) ─────────────────────────

def registrar_movimiento(
    db: Session,
    empresa_id: str,
    bodega_id: int,
    producto_id: int,
    tipo_movimiento: str,
    cantidad: float,
    costo_unitario: float,
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
            saldo.costo_promedio = (
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
        # Método de Promedio Ponderado: las salidas toman el costo promedio actual de la bodega
        costo_unitario = saldo.costo_promedio
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
        costo_total=cantidad * costo_unitario,
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
            producto_id=m.producto_id,
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
            valor_total=r.stock_actual * r.costo_promedio
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


@router.post("/recalcular-saldos")
def recalcular_saldos(req: RecalcularSaldosRequest, db: Session = Depends(get_db)):
    """
    Recalcula cronológicamente los saldos de Kardex y actualiza las existencias maestras
    en StockBodega y Producto.
    Si el saldo recalculado es negativo (< 0), NO modifica el stock maestro a negativo
    y genera un informe de auditoría con la inconsistencia para revisión del usuario.
    """
    query_prod = db.query(Producto).filter(Producto.empresa_id == req.empresa_id)
    if req.producto_id:
        query_prod = query_prod.filter(Producto.id_producto == req.producto_id)
    
    productos = query_prod.all()
    if not productos and req.producto_id:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    query_bodegas = db.query(Bodega).filter(Bodega.empresa_id == req.empresa_id)
    if req.bodega_id:
        query_bodegas = query_bodegas.filter(Bodega.id == req.bodega_id)
    bodegas = query_bodegas.all()
    
    if not bodegas:
        bodega_ids = [r[0] for r in db.query(Kardex.bodega_id).filter(Kardex.empresa_id == req.empresa_id).distinct().all()]
        if bodega_ids:
            bodegas = db.query(Bodega).filter(Bodega.id.in_(bodega_ids)).all()

    # ── Retrofit: Asignar bodega a ventas huérfanas y registrar movimientos de Kardex faltantes (Si Admin lo autoriza) ──
    if req.incluir_ventas_sin_bodega:
        bodega_principal = db.query(Bodega).filter(Bodega.empresa_id == req.empresa_id, Bodega.es_principal == True).first()
        if not bodega_principal:
            bodega_principal = db.query(Bodega).filter(Bodega.empresa_id == req.empresa_id).first()
        if not bodega_principal:
            bodega_principal = Bodega(empresa_id=req.empresa_id, codigo="BOD-01", nombre="Bodega Principal", es_principal=True, activa=True)
            db.add(bodega_principal)
            db.flush()

        query_fac = db.query(Factura).filter(
            Factura.empresa_id == req.empresa_id,
            Factura.estado != "anulada"
        )
        if req.fecha_desde:
            inicio_dt = datetime.combine(req.fecha_desde, datetime.min.time())
            query_fac = query_fac.filter(Factura.fecha_emision >= inicio_dt)
        if req.fecha_hasta:
            fin_dt = datetime.combine(req.fecha_hasta, datetime.max.time())
            query_fac = query_fac.filter(Factura.fecha_emision <= fin_dt)

        facturas_sin_kardex = query_fac.all()

        for f in facturas_sin_kardex:
            if not f.bodega_salida_id:
                f.bodega_salida_id = bodega_principal.id
            
            for item in f.items:
                if req.producto_id and item.producto_id != req.producto_id:
                    continue

                existe = db.query(Kardex).filter(
                    Kardex.empresa_id == req.empresa_id,
                    Kardex.referencia_tipo == "factura",
                    Kardex.referencia_id == f.id,
                    Kardex.producto_id == item.producto_id
                ).first()

                if not existe:
                    m_retro = Kardex(
                        empresa_id=req.empresa_id,
                        bodega_id=f.bodega_salida_id,
                        producto_id=item.producto_id,
                        tipo_movimiento="SALIDA_VENTA",
                        referencia_tipo="factura",
                        referencia_id=f.id,
                        cantidad=item.cantidad,
                        costo_unitario=0.0,
                        costo_total=0.0,
                        stock_anterior=0.0,
                        stock_resultante=0.0,
                        usuario_id=f.usuario_id,
                        fecha=f.fecha_emision,
                        notas=f"Venta con {f.tipo_doc} {f.numero} (Recalculado de ventas sin bodega por Administrador)"
                    )
                    db.add(m_retro)

        db.flush()

        # Re-consultar bodegas por si se creó la bodega principal en esta transacción
        query_bodegas = db.query(Bodega).filter(Bodega.empresa_id == req.empresa_id)
        if req.bodega_id:
            query_bodegas = query_bodegas.filter(Bodega.id == req.bodega_id)
        bodegas = query_bodegas.all()

    informe_negativos = []
    productos_actualizados = 0

    for prod in productos:
        prod_tiene_negativo = False
        
        for bod in bodegas:
            movimientos = db.query(Kardex).filter(
                Kardex.empresa_id == req.empresa_id,
                Kardex.producto_id == prod.id_producto,
                Kardex.bodega_id == bod.id
            ).order_by(Kardex.fecha.asc(), Kardex.id.asc()).all()

            if not movimientos:
                continue

            running_stock = 0.0
            running_costo = 0.0
            total_entradas = 0.0
            total_salidas = 0.0

            for m in movimientos:
                m.stock_anterior = running_stock
                tipo_u = (m.tipo_movimiento or "").upper()
                
                es_entrada = ("ENTRADA" in tipo_u or "POSITIVO" in tipo_u)
                es_salida = ("SALIDA" in tipo_u or "NEGATIVO" in tipo_u)

                if es_entrada:
                    total_entradas += m.cantidad
                    nuevo_stock = running_stock + m.cantidad
                    if nuevo_stock > 0:
                        running_costo = ((running_stock * running_costo) + (m.cantidad * m.costo_unitario)) / nuevo_stock
                    running_stock = nuevo_stock
                elif es_salida:
                    total_salidas += m.cantidad
                    running_stock = running_stock - m.cantidad
                    if not m.costo_unitario or m.costo_unitario == 0:
                        m.costo_unitario = running_costo
                        m.costo_total = m.cantidad * running_costo
                
                m.stock_resultante = running_stock

            if running_stock < 0:
                prod_tiene_negativo = True
                saldo_actual = db.query(StockBodega).filter(
                    StockBodega.empresa_id == req.empresa_id,
                    StockBodega.producto_id == prod.id_producto,
                    StockBodega.bodega_id == bod.id
                ).first()
                
                informe_negativos.append({
                    "producto_id": prod.id_producto,
                    "producto_codigo": prod.codigo,
                    "producto_nombre": prod.nombre,
                    "bodega_id": bod.id,
                    "bodega_nombre": bod.nombre,
                    "stock_actual_registrado": saldo_actual.stock_actual if saldo_actual else 0.0,
                    "stock_calculado": round(running_stock, 4),
                    "total_entradas": round(total_entradas, 4),
                    "total_salidas": round(total_salidas, 4),
                    "diferencia": round(running_stock, 4),
                    "motivo": f"Inconsistencia: Total salidas ({total_salidas}) superan a entradas ({total_entradas}). Stock resultante sería {running_stock}."
                })
            else:
                saldo_bod = db.query(StockBodega).filter(
                    StockBodega.empresa_id == req.empresa_id,
                    StockBodega.producto_id == prod.id_producto,
                    StockBodega.bodega_id == bod.id
                ).first()

                if not saldo_bod:
                    saldo_bod = StockBodega(
                        empresa_id=req.empresa_id,
                        producto_id=prod.id_producto,
                        bodega_id=bod.id,
                        stock_actual=running_stock,
                        costo_promedio=running_costo
                    )
                    db.add(saldo_bod)
                else:
                    saldo_bod.stock_actual = running_stock
                    saldo_bod.costo_promedio = running_costo

        if not prod_tiene_negativo:
            total_stock_global = db.query(func.sum(StockBodega.stock_actual)).filter(
                StockBodega.empresa_id == req.empresa_id,
                StockBodega.producto_id == prod.id_producto
            ).scalar() or 0.0

            prod.stock = total_stock_global
            productos_actualizados += 1

    db.commit()

    return {
        "status": "inconsistencia_detectada" if informe_negativos else "success",
        "mensaje": f"Recálculo completado. {productos_actualizados} productos actualizados." if not informe_negativos else f"Se detectaron {len(informe_negativos)} inconsistencias de stock negativo.",
        "total_procesados": len(productos),
        "total_actualizados": productos_actualizados,
        "tiene_negativos": len(informe_negativos) > 0,
        "informe_negativos": informe_negativos
    }

