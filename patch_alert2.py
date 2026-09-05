import re
with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("alert(e.response?.data?.detail || 'Error al guardar la orden');", "const detail = e.response?.data?.detail;\n        alert(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Error al guardar la orden');")

with open('facturacion_web/src/pages/OrdenesCompra.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
