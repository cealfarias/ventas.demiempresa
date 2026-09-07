with open('c:/factura/facturacion_web/src/pages/Existencias.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "costo_unitario: form.costo_unitario ? Math.round(parseFloat(form.costo_unitario) * 100) : 0",
    "costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario) : 0"
)

content = content.replace(
    "valor: fmt(kpis.valorTotal)",
    "valor: '$' + Number(kpis.valorTotal).toFixed(2)"
)

content = content.replace(
    "{fmt(s.costo_promedio)}",
    "{'$' + Number(s.costo_promedio).toFixed(4)}"
)

content = content.replace(
    "{fmt(s.valor_total)}",
    "{'$' + Number(s.valor_total).toFixed(2)}"
)

content = content.replace(
    "{fmt(datosFiltrados.reduce((acc, s) => acc + s.valor_total, 0))}",
    "{'$' + Number(datosFiltrados.reduce((acc, s) => acc + s.valor_total, 0)).toFixed(2)}"
)

with open('c:/factura/facturacion_web/src/pages/Existencias.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
