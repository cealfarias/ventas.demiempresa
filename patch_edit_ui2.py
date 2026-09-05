import re

with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_post = '''      await api.post(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload);'''
new_post = '''      if (editandoId) {
        await api.put(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload);
      } else {
        await api.post(/api/v1/facturacion/facturas/?empresa_id=&usuario_id=1, payload);
      }'''

content = content.replace(old_post, new_post)

old_title = '''          <h1 className="text-2xl font-bold text-slate-800">Nueva Factura</h1>'''
new_title = '''          <h1 className="text-2xl font-bold text-slate-800">{editandoId ? 'Editar Factura' : 'Nueva Factura'}</h1>'''

content = content.replace(old_title, new_title)

# Reset editandoId when clicking "Volver" button
content = content.replace("onClick={() => setVista('lista')}", "onClick={() => { setVista('lista'); setEditandoId(null); }}")

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
