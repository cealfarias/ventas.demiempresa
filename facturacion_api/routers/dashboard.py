from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Factura, Cliente, Proveedor, CuentaPorCobrar, CuentaPorPagar, Producto, OrdenCompra, ItemFactura, Kardex, Bodega, Caja, SesionCaja, MovimientoCaja
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, date
import pytz
import calendar

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

local_tz = pytz.timezone("America/El_Salvador")

def _aplicar_filtros_bodega_caja(query_facturas, query_compras, bodega_id: Optional[int] = None, caja_id: Optional[int] = None):
    if caja_id:
        query_facturas = query_facturas.join(
            MovimientoCaja, (MovimientoCaja.referencia_id == Factura.id) & (MovimientoCaja.referencia_tipo == "factura")
        ).join(
            SesionCaja, MovimientoCaja.sesion_caja_id == SesionCaja.id
        ).filter(SesionCaja.caja_id == caja_id)
        if bodega_id:
            query_facturas = query_facturas.filter(Factura.bodega_salida_id == bodega_id)
            if query_compras is not None:
                query_compras = query_compras.filter(Kardex.bodega_id == bodega_id)
    elif bodega_id:
        query_facturas = query_facturas.filter(Factura.bodega_salida_id == bodega_id)
        if query_compras is not None:
            query_compras = query_compras.filter(Kardex.bodega_id == bodega_id)
            
    return query_facturas, query_compras


@router.get("/ventas-por-bodega", response_model=List[Dict[str, Any]])
def obtener_ventas_por_bodega(
    empresa_id: str, 
    periodo: str = "dia", 
    tz: str = "America/El_Salvador", 
    db: Session = Depends(get_db)
):
    local_tz = pytz.timezone(tz)
    hoy = datetime.now(local_tz)

    bodegas = db.query(Bodega).filter(
        Bodega.empresa_id == empresa_id,
        Bodega.activa == True
    ).order_by(Bodega.es_principal.desc(), Bodega.nombre).all()

    if periodo == "dia":
        inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
    elif periodo == "semana":
        inicio = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    elif periodo == "mes":
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif periodo == "anio":
        inicio = hoy.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        inicio = None

    resultado = []
    for b in bodegas:
        q_ventas = db.query(
            func.sum(Factura.total),
            func.count(Factura.id)
        ).filter(
            Factura.empresa_id == empresa_id,
            Factura.estado != "anulada",
            Factura.bodega_salida_id == b.id
        )
        if inicio:
            q_ventas = q_ventas.filter(Factura.fecha_emision >= inicio)

        row = q_ventas.first()
        total_ventas = row[0] or 0
        cant_facturas = row[1] or 0

        cajas = db.query(Caja).filter(Caja.bodega_id == b.id, Caja.activa == True).all()

        resultado.append({
            "bodega_id": b.id,
            "bodega_nombre": b.nombre,
            "codigo": b.codigo,
            "es_principal": b.es_principal,
            "ventas_totales": total_ventas,
            "cantidad_ventas": cant_facturas,
            "cajas_count": len(cajas)
        })

    return resultado


@router.get("/kpis", response_model=Dict[str, Any])
def obtener_kpis(
    empresa_id: str, 
    periodo: str = "dia", 
    bodega_id: Optional[int] = None, 
    caja_id: Optional[int] = None, 
    tz: str = "America/El_Salvador", 
    db: Session = Depends(get_db)
):
    local_tz = pytz.timezone(tz)
    hoy = datetime.now(local_tz)
    
    # Total de Ventas (Facturas no anuladas)
    query_ventas = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado != "anulada"
    )
    
    # Total de Compras (Basado en el valor real ingresado a Kardex)
    query_compras = db.query(func.sum(Kardex.costo_total)).filter(
        Kardex.empresa_id == empresa_id,
        Kardex.tipo_movimiento == "ENTRADA_COMPRA"
    )

    query_ventas, query_compras = _aplicar_filtros_bodega_caja(query_ventas, query_compras, bodega_id, caja_id)
    
    if periodo == "dia":
        inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
        query_compras = query_compras.filter(Kardex.fecha >= inicio)
    elif periodo == "semana":
        inicio = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
        query_compras = query_compras.filter(Kardex.fecha >= inicio)
    elif periodo == "mes":
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
        query_compras = query_compras.filter(Kardex.fecha >= inicio)
    elif periodo == "anio":
        inicio = hoy.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
        query_compras = query_compras.filter(Kardex.fecha >= inicio)
        
    ventas = query_ventas.scalar() or 0
    compras_float = query_compras.scalar() or 0.0
    compras = int(round(compras_float * 100))

    # Cuentas por Cobrar Pendientes
    cxc = db.query(func.sum(CuentaPorCobrar.monto_pendiente)).filter(
        CuentaPorCobrar.empresa_id == empresa_id,
        CuentaPorCobrar.estado != "pagada",
        CuentaPorCobrar.estado != "anulada"
    ).scalar() or 0

    # Cuentas por Pagar Pendientes
    cxp = db.query(func.sum(CuentaPorPagar.monto_pendiente)).filter(
        CuentaPorPagar.empresa_id == empresa_id,
        CuentaPorPagar.estado != "pagada",
        CuentaPorPagar.estado != "anulada"
    ).scalar() or 0

    # Clientes Activos
    clientes_activos = db.query(Cliente).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.activo == True
    ).count()
    
    # Proveedores Activos
    proveedores_activos = db.query(Proveedor).filter(
        Proveedor.empresa_id == empresa_id,
        Proveedor.activo == True
    ).count()
    
    # Productos con stock bajo (arbitrario: stock < 10)
    productos_bajo_stock = db.query(Producto).filter(
        Producto.empresa_id == empresa_id,
        Producto.activo == True,
        Producto.stock < 10
    ).count()

    return {
        "ventas_totales": ventas,
        "compras_totales": compras,
        "cuentas_por_cobrar": cxc,
        "cuentas_por_pagar": cxp,
        "clientes_activos": clientes_activos,
        "proveedores_activos": proveedores_activos,
        "productos_bajo_stock": productos_bajo_stock
    }


@router.get("/grafico-ventas", response_model=list[Dict[str, Any]])
def obtener_grafico_ventas(
    empresa_id: str, 
    periodo: str = "anio", 
    anio: int = None, 
    bodega_id: Optional[int] = None, 
    caja_id: Optional[int] = None, 
    tz: str = "America/El_Salvador", 
    db: Session = Depends(get_db)
):
    local_tz = pytz.timezone(tz)
    hoy = datetime.now(local_tz)
    if not anio:
        anio = hoy.year

    query = db.query(Factura.fecha_emision, Factura.total).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado != "anulada"
    )
    query_compras = db.query(Kardex.fecha, Kardex.costo_total).filter(
        Kardex.empresa_id == empresa_id,
        Kardex.tipo_movimiento == "ENTRADA_COMPRA"
    )

    query, query_compras = _aplicar_filtros_bodega_caja(query, query_compras, bodega_id, caja_id)

    resultado = []

    if periodo == "dia":
        inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(hour=23, minute=59, second=59, microsecond=0)
        facturas = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin).all()
        compras = query_compras.filter(Kardex.fecha >= inicio, Kardex.fecha <= fin).all()
        
        ventas_por_hora = {h: 0 for h in range(0, 24)}
        compras_por_hora = {h: 0 for h in range(0, 24)}
        
        for f_fecha, f_total in facturas:
            if not f_fecha.tzinfo: f_fecha = f_fecha.replace(tzinfo=pytz.UTC)
            f_fecha = f_fecha.astimezone(local_tz)
            if 0 <= f_fecha.hour <= 23: ventas_por_hora[f_fecha.hour] += f_total
            
        for c_fecha, c_total_val in compras:
            c_total = int(round((c_total_val or 0) * 100))
            if not c_fecha.tzinfo: c_fecha = c_fecha.replace(tzinfo=pytz.UTC)
            c_fecha = c_fecha.astimezone(local_tz)
            if 0 <= c_fecha.hour <= 23: compras_por_hora[c_fecha.hour] += c_total
            
        v_0_7 = sum(ventas_por_hora[h] for h in range(0, 8))
        c_0_7 = sum(compras_por_hora[h] for h in range(0, 8))
        resultado.append({"mes": "12 AM - 7:59 AM", "ventas": v_0_7, "compras": c_0_7})
        
        for h in range(8, 23):
            if h < 12: label = f"{h} AM"
            elif h == 12: label = "12 PM"
            else: label = f"{h-12} PM"
            resultado.append({"mes": label, "ventas": ventas_por_hora[h], "compras": compras_por_hora[h]})
            
        resultado.append({"mes": "11 PM - 11:59 PM", "ventas": ventas_por_hora[23], "compras": compras_por_hora[23]})

    elif periodo == "semana":
        start_of_week = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
        facturas = query.filter(Factura.fecha_emision >= start_of_week, Factura.fecha_emision <= end_of_week).all()
        compras = query_compras.filter(Kardex.fecha >= start_of_week, Kardex.fecha <= end_of_week).all()
        
        dias_nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        ventas_por_dia = {i: 0 for i in range(7)}
        compras_por_dia = {i: 0 for i in range(7)}
        
        for f_fecha, f_total in facturas:
            if not f_fecha.tzinfo: f_fecha = f_fecha.replace(tzinfo=pytz.UTC)
            f_fecha = f_fecha.astimezone(local_tz)
            ventas_por_dia[f_fecha.weekday()] += f_total
            
        for c_fecha, c_total_val in compras:
            c_total = int(round((c_total_val or 0) * 100))
            if not c_fecha.tzinfo: c_fecha = c_fecha.replace(tzinfo=pytz.UTC)
            c_fecha = c_fecha.astimezone(local_tz)
            compras_por_dia[c_fecha.weekday()] += c_total
            
        for i in range(7):
            resultado.append({"mes": dias_nombres[i], "ventas": ventas_por_dia[i], "compras": compras_por_dia[i]})

    elif periodo == "mes":
        _, last_day = calendar.monthrange(hoy.year, hoy.month)
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(day=last_day, hour=23, minute=59, second=59, microsecond=0)
        facturas = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin).all()
        compras_list = query_compras.filter(Kardex.fecha >= inicio, Kardex.fecha <= fin).all()
        
        ventas_por_dia = {d: 0 for d in range(1, last_day + 1)}
        compras_por_dia = {d: 0 for d in range(1, last_day + 1)}
        
        for f_fecha, f_total in facturas:
            if not f_fecha.tzinfo: f_fecha = f_fecha.replace(tzinfo=pytz.UTC)
            f_fecha = f_fecha.astimezone(local_tz)
            ventas_por_dia[f_fecha.day] += f_total
            
        for c_fecha, c_total_val in compras_list:
            c_total = int(round((c_total_val or 0) * 100))
            if not c_fecha.tzinfo: c_fecha = c_fecha.replace(tzinfo=pytz.UTC)
            c_fecha = c_fecha.astimezone(local_tz)
            compras_por_dia[c_fecha.day] += c_total
            
        for d in range(1, last_day + 1):
            resultado.append({"mes": str(d), "ventas": ventas_por_dia[d], "compras": compras_por_dia[d]})

    else:
        inicio_anio = datetime(anio, 1, 1, 0, 0, 0, tzinfo=local_tz)
        fin_anio = datetime(anio, 12, 31, 23, 59, 59, tzinfo=local_tz)
        facturas = query.filter(Factura.fecha_emision >= inicio_anio, Factura.fecha_emision <= fin_anio).all()
        compras_list = query_compras.filter(Kardex.fecha >= inicio_anio, Kardex.fecha <= fin_anio).all()
        
        meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        ventas_por_mes = {i: 0 for i in range(1, 13)}
        compras_por_mes = {i: 0 for i in range(1, 13)}
        
        for f_fecha, f_total in facturas:
            if not f_fecha.tzinfo: f_fecha = f_fecha.replace(tzinfo=pytz.UTC)
            f_fecha = f_fecha.astimezone(local_tz)
            ventas_por_mes[f_fecha.month] += f_total
            
        for c_fecha, c_total_val in compras_list:
            c_total = int(round((c_total_val or 0) * 100))
            if not c_fecha.tzinfo: c_fecha = c_fecha.replace(tzinfo=pytz.UTC)
            c_fecha = c_fecha.astimezone(local_tz)
            compras_por_mes[c_fecha.month] += c_total
            
        for i in range(1, 13):
            resultado.append({"mes": meses_nombres[i-1], "ventas": ventas_por_mes[i], "compras": compras_por_mes[i]})
            
    return resultado


@router.get("/top-productos", response_model=list[Dict[str, Any]])
def obtener_top_productos(
    empresa_id: str, 
    periodo: str = "anio", 
    anio: int = None, 
    bodega_id: Optional[int] = None, 
    caja_id: Optional[int] = None, 
    tz: str = "America/El_Salvador", 
    db: Session = Depends(get_db)
):
    local_tz = pytz.timezone(tz)
    hoy = datetime.now(local_tz)
    if not anio:
        anio = hoy.year

    query = db.query(
        Producto.nombre.label("producto_nombre"),
        func.sum(ItemFactura.cantidad).label("cantidad"),
        func.sum(ItemFactura.subtotal).label("total")
    ).join(ItemFactura, ItemFactura.producto_id == Producto.id_producto) \
     .join(Factura, Factura.id == ItemFactura.factura_id) \
     .filter(Factura.empresa_id == empresa_id, Factura.estado != "anulada")

    if caja_id:
        query = query.join(
            MovimientoCaja, (MovimientoCaja.referencia_id == Factura.id) & (MovimientoCaja.referencia_tipo == "factura")
        ).join(
            SesionCaja, MovimientoCaja.sesion_caja_id == SesionCaja.id
        ).filter(SesionCaja.caja_id == caja_id)
        if bodega_id:
            query = query.filter(Factura.bodega_salida_id == bodega_id)
    elif bodega_id:
        query = query.filter(Factura.bodega_salida_id == bodega_id)

    if periodo == "dia":
        inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(hour=23, minute=59, second=59, microsecond=0)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
    elif periodo == "semana":
        inicio = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        fin = inicio + timedelta(days=6, hours=23, minutes=59, seconds=59)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
    elif periodo == "mes":
        _, last_day = calendar.monthrange(hoy.year, hoy.month)
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(day=last_day, hour=23, minute=59, second=59, microsecond=0)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)
    else:
        inicio = datetime(anio, 1, 1, 0, 0, 0, tzinfo=local_tz)
        fin = datetime(anio, 12, 31, 23, 59, 59, tzinfo=local_tz)
        query = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin)

    resultados = query.group_by(Producto.id_producto, Producto.nombre).all()
    
    lista = []
    for r in resultados:
        cantidad = float(r.cantidad or 0)
        total = float(r.total or 0)
        precio_promedio = total / cantidad if cantidad > 0 else 0
        lista.append({
            "producto": r.producto_nombre,
            "cantidad": cantidad,
            "precio_promedio": precio_promedio,
            "total": total
        })
        
    return lista
