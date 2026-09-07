import re

with open('c:/factura/facturacion_api/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace query_compras base query in grafico-ventas
old_query = """    query_compras = db.query(OrdenCompra.fecha_emision, OrdenCompra.total).filter(
        OrdenCompra.empresa_id == empresa_id,
        OrdenCompra.estado != "anulada",
        OrdenCompra.estado != "borrador"
    )"""

new_query = """    query_compras = db.query(Kardex.fecha, Kardex.costo_total).filter(
        Kardex.empresa_id == empresa_id,
        Kardex.tipo_movimiento == "ENTRADA_COMPRA"
    )"""

content = content.replace(old_query, new_query)

# Replace 'OrdenCompra.fecha_emision' with 'Kardex.fecha' in the rest of grafico-ventas
content = content.replace('OrdenCompra.fecha_emision', 'Kardex.fecha')

# Fix the c_total assignments in the loops
content = re.sub(r'for c_fecha, c_total in compras(_list)?:\s+if not c_fecha', r'for c_fecha, c_total_val in compras\1:\n            c_total = int(round((c_total_val or 0) * 100))\n            if not c_fecha', content)

with open('c:/factura/facturacion_api/routers/dashboard.py', 'w', encoding='utf-8') as f:
    f.write(content)
