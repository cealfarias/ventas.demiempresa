import sys
import re

with open("routers/dashboard.py", "r", encoding="utf-8") as f:
    code = f.read()

new_endpoint = """
@router.get("/top-productos", response_model=list[Dict[str, Any]])
def obtener_top_productos(empresa_id: str, periodo: str = "anio", anio: int = None, tz: str = "America/El_Salvador", db: Session = Depends(get_db)):
    local_tz = pytz.timezone(tz)
    from datetime import datetime, timedelta
    import calendar
    hoy = datetime.now(local_tz)
    if not anio:
        anio = hoy.year

    query = db.query(
        Producto.nombre.label("producto_nombre"),
        func.sum(ItemFactura.cantidad).label("cantidad"),
        func.sum(ItemFactura.subtotal).label("total")
    ).join(ItemFactura, ItemFactura.producto_id == Producto.id_producto) \\
     .join(Factura, Factura.id == ItemFactura.factura_id) \\
     .filter(Factura.empresa_id == empresa_id, Factura.estado != "anulada")

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
"""

if "def obtener_top_productos" not in code:
    code = code + "\\n" + new_endpoint
    with open("routers/dashboard.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Endpoint added to dashboard.py")

