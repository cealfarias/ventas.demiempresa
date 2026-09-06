import sys

with open("src/pages/Facturas.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# form state
code = code.replace(
    "condicion_operacion: 'CONTADO', dias_credito: 30",
    "condicion_operacion: 'CONTADO', metodo_pago: 'efectivo', dias_credito: 30"
)

# the button reset form
code = code.replace(
    "condicion_operacion: 'CONTADO', dias_credito: 30, items: []",
    "condicion_operacion: 'CONTADO', metodo_pago: 'efectivo', dias_credito: 30, items: []"
)

# The select dropdown for condicion_operacion
old_condicion = """            <div>
              <div className="flex gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Condición de Operación</label>
                <select value={form.condicion_operacion} onChange={e => setForm({...form, condicion_operacion: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito (Generar CxC)</option>
                </select>
              </div>"""

# Wait, let me just replace after Condicion Operacion
old_condicion_2 = """              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Condición de Operación</label>
                <select value={form.condicion_operacion} onChange={e => setForm({...form, condicion_operacion: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito (Generar CxC)</option>
                </select>
              </div>
            </div>
            {form.condicion_operacion === 'CREDITO' && ("""

new_condicion_2 = """              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Condición de Operación</label>
                <select value={form.condicion_operacion} onChange={e => setForm({...form, condicion_operacion: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito (Generar CxC)</option>
                </select>
              </div>
            </div>
            {form.condicion_operacion === 'CONTADO' && (
                <div className="w-1/4">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                  <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                    <option value="efectivo">Efectivo (Caja)</option>
                    <option value="transferencia">Transferencia (Caja)</option>
                    <option value="tarjeta">Tarjeta (Caja)</option>
                  </select>
                </div>
              )}
            {form.condicion_operacion === 'CREDITO' && ("""

code = code.replace(old_condicion_2, new_condicion_2)

with open("src/pages/Facturas.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched Facturas.jsx")

