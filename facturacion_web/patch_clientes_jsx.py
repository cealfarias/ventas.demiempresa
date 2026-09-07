with open("src/pages/Clientes.jsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("es_gran_contribuyente: false, actividad_economica_cod: '", "es_gran_contribuyente: false, es_predeterminado: false, actividad_economica_cod: '")

badge_old = "{c.es_gran_contribuyente && <span className=\"text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md mt-1 inline-block\">GRAN CONTRIBUYENTE</span>}"
badge_new = "{c.es_gran_contribuyente && <span className=\"text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md mt-1 inline-block\">GRAN CONTRIBUYENTE</span>}\n                    {c.es_predeterminado && <span className=\"text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md mt-1 ml-1 inline-block\">PREDETERMINADO</span>}"
code = code.replace(badge_old, badge_new)

check_old = """                  <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                    <input type="checkbox" checked={form.es_gran_contribuyente} onChange={e => setForm({...form, es_gran_contribuyente: e.target.checked})} className="rounded text-indigo-600" />
                    Gran Contribuyente
                  </label>"""
check_new = check_old + """
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                    <input type="checkbox" checked={form.es_predeterminado} onChange={e => setForm({...form, es_predeterminado: e.target.checked})} className="rounded text-emerald-600" />
                    Predeterminado
                  </label>"""
code = code.replace(check_old, check_new)

with open("src/pages/Clientes.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched Clientes.jsx")

