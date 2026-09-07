import sys
import re
with open('src/pages/Facturas.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(
    r'(<SearchableSelect\s+value=\{it\.producto_id\})',
    r'<SearchableSelect autoFocus={i === form.items.length - 1} value={it.producto_id}',
    code
)

with open('src/pages/Facturas.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched SearchableSelect regex successfully')