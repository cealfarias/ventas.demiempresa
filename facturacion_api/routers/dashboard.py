from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Factura, Cliente, Proveedor, CuentaPorCobrar, CuentaPorPagar, Producto
from typing import Dict, Any

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

from datetime import datetime
import pytz

TIMEZONE = pytz.timezone("America/El_Salvador")

@router.get("/kpis", response_model=Dict[str, Any])
def obtener_kpis(empresa_id: str, periodo: str = "dia", db: Session = Depends(get_db)):
    hoy = datetime.now(TIMEZONE)
    
    # Total de Ventas (Facturas no anuladas)
    query_ventas = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado != "anulada"
    )
    
    if periodo == "dia":
        inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
    elif periodo == "semana":
        from datetime import timedelta
        inicio = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
    elif periodo == "mes":
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
    elif periodo == "anio":
        inicio = hoy.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        query_ventas = query_ventas.filter(Factura.fecha_emision >= inicio)
        
    ventas = query_ventas.scalar() or 0

    # Cuentas por Cobrar Pendientes
    cxc = db.query(func.sum(CuentaPorCobrar.monto_pendiente)).filter(
        CuentaPorCobrar.empresa_id == empresa_id,
        CuentaPorCobrar.estado != "pagada"
    ).scalar() or 0

    # Cuentas por Pagar Pendientes
    cxp = db.query(func.sum(CuentaPorPagar.monto_pendiente)).filter(
        CuentaPorPagar.empresa_id == empresa_id,
        CuentaPorPagar.estado != "pagada"
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
        "cuentas_por_cobrar": cxc,
        "cuentas_por_pagar": cxp,
        "clientes_activos": clientes_activos,
        "proveedores_activos": proveedores_activos,
        "productos_bajo_stock": productos_bajo_stock
    }

@router.get("/grafico-ventas", response_model=list[Dict[str, Any]])
def obtener_grafico_ventas(empresa_id: str, periodo: str = "anio", anio: int = None, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    import calendar
    hoy = datetime.now(TIMEZONE)
    if not anio:
        anio = hoy.year

    query = db.query(Factura.fecha_emision, Factura.total).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado != "anulada"
    )
    resultado = []

    if periodo == "dia":
        inicio = hoy.replace(hour=7, minute=0, second=0, microsecond=0)
        fin = hoy.replace(hour=22, minute=59, second=59, microsecond=0)
        facturas = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin).all()
        ventas_por_hora = {h: 0 for h in range(7, 23)}
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            h = f_fecha.hour
            if 7 <= h <= 22:
                ventas_por_hora[h] += f_total
        for h in range(7, 23):
            label = f"{h} AM" if h < 12 else ("12 PM" if h == 12 else f"{h-12} PM")
            resultado.append({"mes": label, "ventas": ventas_por_hora[h]})

    elif periodo == "semana":
        start_of_week = (hoy - timedelta(days=hoy.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
        facturas = query.filter(Factura.fecha_emision >= start_of_week, Factura.fecha_emision <= end_of_week).all()
        dias_nombres = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        ventas_por_dia = {i: 0 for i in range(7)}
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            ventas_por_dia[f_fecha.weekday()] += f_total
        for i in range(7):
            resultado.append({"mes": dias_nombres[i], "ventas": ventas_por_dia[i]})

    elif periodo == "mes":
        _, last_day = calendar.monthrange(hoy.year, hoy.month)
        inicio = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin = hoy.replace(day=last_day, hour=23, minute=59, second=59, microsecond=0)
        facturas = query.filter(Factura.fecha_emision >= inicio, Factura.fecha_emision <= fin).all()
        ventas_por_dia = {d: 0 for d in range(1, last_day + 1)}
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            ventas_por_dia[f_fecha.day] += f_total
        for d in range(1, last_day + 1):
            resultado.append({"mes": str(d), "ventas": ventas_por_dia[d]})

    else:
        inicio_anio = datetime(anio, 1, 1, 0, 0, 0, tzinfo=TIMEZONE)
        fin_anio = datetime(anio, 12, 31, 23, 59, 59, tzinfo=TIMEZONE)
        facturas = query.filter(Factura.fecha_emision >= inicio_anio, Factura.fecha_emision <= fin_anio).all()
        meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        ventas_por_mes = {i: 0 for i in range(1, 13)}
        for f_fecha, f_total in facturas:
            if f_fecha.tzinfo:
                f_fecha = f_fecha.astimezone(TIMEZONE)
            mes = f_fecha.month
            ventas_por_mes[mes] += f_total
        for i in range(1, 13):
            resultado.append({"mes": meses_nombres[i-1], "ventas": ventas_por_mes[i]})
            
    return resultado
