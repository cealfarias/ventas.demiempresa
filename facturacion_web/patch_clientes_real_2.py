import sys
import re
with open('src/pages/Clientes.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add Checkbox
if 'es_predeterminado: e.target.checked' not in code:
    code = re.sub(
        r'(Gran Contribuyente\s*</label>)',
        r'\1\n                  <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">\n                    <input type="checkbox" checked={form.es_predeterminado || false} onChange={e => setForm({...form, es_predeterminado: e.target.checked})} className="rounded text-emerald-600" />\n                    Predeterminado (Contado)\n                  </label>',
        code
    )

with open('src/pages/Clientes.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched Clientes.jsx successfully')