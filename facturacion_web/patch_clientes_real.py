import sys
with open('src/pages/Clientes.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add to FORM_VACIO
if 'es_predeterminado' not in code:
    code = code.replace('es_gran_contribuyente: false,', 'es_gran_contribuyente: false, es_predeterminado: false,')

# Add Checkbox
if 'es_predeterminado: e.target.checked' not in code:
    old_check = 'Gran Contribuyente\n                  </label>'
    new_check = old_check + '\n                  <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">\n                    <input type="checkbox" checked={form.es_predeterminado || false} onChange={e => setForm({...form, es_predeterminado: e.target.checked})} className="rounded text-emerald-600" />\n                    Predeterminado (Contado)\n                  </label>'
    code = code.replace(old_check, new_check)

with open('src/pages/Clientes.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched Clientes.jsx successfully')