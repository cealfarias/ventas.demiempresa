import sys

with open("src/pages/Facturas.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add state
old_state = "const [editandoId, setEditandoId] = useState(null);"
new_state = """const [editandoId, setEditandoId] = useState(null);
  const [modalVuelto, setModalVuelto] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState("");"""
code = code.replace(old_state, new_state)

# 2. Add intentarGuardar function
old_guardar = "const guardar = async () => {"
new_guardar = """
  const intentarGuardar = () => {
    if (form.condicion_operacion === "CONTADO" && form.metodo_pago === "efectivo") {
      setEfectivoRecibido((total/100).toFixed(2));
      setModalVuelto(true);
    } else {
      guardar();
    }
  };

  const guardar = async () => {
    setModalVuelto(false);
"""
code = code.replace(old_guardar, new_guardar)

# 3. Change onClick={guardar} to onClick={intentarGuardar}
old_button = "onClick={guardar} disabled={guardando || !form.cliente_id || form.items.length === 0}"
new_button = "onClick={intentarGuardar} disabled={guardando || !form.cliente_id || form.items.length === 0}"
code = code.replace(old_button, new_button)

# 4. Add modal HTML right before the end of the `if (vista === "nueva")` block
old_return = "return (\n      <div className=\"p-8 max-w-5xl mx-auto\">"
new_return = """return (
      <div className="p-8 max-w-5xl mx-auto">
        {modalVuelto && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Pago en Efectivo</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">Total a Pagar:</span>
                  <span className="text-xl font-bold text-indigo-600">${(total/100).toFixed(2)}</span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Efectivo Recibido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input 
                      type="number" 
                      min={(total/100).toFixed(2)} 
                      step="any" 
                      value={efectivoRecibido} 
                      onChange={e => setEfectivoRecibido(e.target.value)} 
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                      autoFocus
                      onFocus={e => e.target.select()}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-500 font-medium">Vuelto (Cambio):</span>
                  <span className={`text-xl font-bold ${parseFloat(efectivoRecibido || 0) < total/100 ? "text-red-500" : "text-emerald-500"}`}>
                    ${Math.max(0, parseFloat(efectivoRecibido || 0) - total/100).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalVuelto(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium">Cancelar</button>
                <button 
                  onClick={guardar} 
                  disabled={parseFloat(efectivoRecibido || 0) < total/100 || guardando}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {guardando ? "Cobrando..." : "Cobrar"}
                </button>
              </div>
            </div>
          </div>
        )}
"""
code = code.replace(old_return, new_return)

with open("src/pages/Facturas.jsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Patched Facturas.jsx with Vuelto modal!")

