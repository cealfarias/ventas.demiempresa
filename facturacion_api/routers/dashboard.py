from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Factura, Cliente, Proveedor, CuentaPorCobrar, CuentaPorPagar, Producto
from typing import Dict, Any

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=Dict[str, Any])
def obtener_kpis(empresa_id: str, db: Session = Depends(get_db)):
    # Total de Ventas (Facturas no anuladas)
    ventas = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado != "anulada"
    ).scalar() or 0

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
