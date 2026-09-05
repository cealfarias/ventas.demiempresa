import re

with open('facturacion_web/src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace input type
content = content.replace('type="date" value={form.fecha_emision || \'\'}', 'type="datetime-local" value={form.fecha_emision || \'\'}')

# Replace the initial Date
old_init = "fecha_emision: new Date().toISOString().split('T')[0]"
new_init = "fecha_emision: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, 16)"
content = content.replace(old_init, new_init)

with open('facturacion_web/src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
