import re
with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix guardar
content = re.sub(r'await api\.post\(/api/v1/facturacion/facturas/\?empresa_id=\$\{empresaId\(\)\}&usuario_id=1, payload\);', 
    "if (editandoId) { await api.put(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload); } else { await api.post(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload); }", content)

# Fix title
content = content.replace('<h1 className="text-2xl font-bold text-slate-800">Nueva Factura</h1>', '<h1 className="text-2xl font-bold text-slate-800">{editandoId ? "Editar Factura" : "Nueva Factura"}</h1>')

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
