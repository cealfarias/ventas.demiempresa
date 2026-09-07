with open('c:/factura/facturacion_web/src/pages/Kardex.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "{m.costo_unitario > 0 ? fmt(m.costo_unitario) : '—'}",
    "{m.costo_unitario > 0 ? '$' + Number(m.costo_unitario).toFixed(4) : '—'}"
)

content = content.replace(
    "{fmt(movimientoActivo.costo_unitario)}",
    "{'$' + Number(movimientoActivo.costo_unitario).toFixed(4)}"
)

content = content.replace(
    "{fmt(movimientoActivo.costo_total || (movimientoActivo.costo_unitario * movimientoActivo.cantidad))}",
    "{'$' + Number(movimientoActivo.costo_total || (movimientoActivo.costo_unitario * movimientoActivo.cantidad)).toFixed(2)}"
)

with open('c:/factura/facturacion_web/src/pages/Kardex.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
