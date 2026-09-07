import re

with open('c:/factura/facturacion_web/src/pages/Kardex.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update formatting fixes
content = content.replace(
    "{m.costo_unitario > 0 ? fmt(m.costo_unitario) : '—'}",
    "{m.costo_unitario > 0 ? '$' + Number(m.costo_unitario).toFixed(4) : '—'}"
)

content = content.replace(
    "{fmt(movimientoActivo.costo_unitario)}",
    "{'$' + Number(movimientoActivo.costo_unitario).toFixed(4)}"
)

content = content.replace(
    "{fmt(movimientoActivo.costo_total || (movimientoActivo.costo_unitario * movimientoActivo.cantidad))}",
    "{'$' + Number(movimientoActivo.costo_total || (movimientoActivo.costo_unitario * movimientoActivo.cantidad)).toFixed(2)}"
)


# 2. Add processed movs logic
old_mov_logic = "const movimientosOrdenados = movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));"
new_mov_logic = """const getMovimientosProcesados = () => {
    if (!filtroProd) {
      return movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    const ordenadosAsc = [...movimientosFiltrados].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    let saldo_cant = 0;
    let saldo_valor = 0;
    
    const procesados = ordenadosAsc.map(m => {
      let in_cant = 0, in_unit = 0, in_total = 0;
      let out_cant = 0, out_unit = 0, out_total = 0;
      
      if (m.tipo_movimiento.includes('ENTRADA') || m.tipo_movimiento.includes('POSITIVO')) {
        in_cant = m.cantidad;
        in_unit = m.costo_unitario;
        in_total = (m.costo_total && m.costo_total > 0) ? m.costo_total : (m.cantidad * m.costo_unitario);
        saldo_cant += in_cant;
        saldo_valor += in_total;
      } else {
        out_cant = m.cantidad;
        out_unit = m.costo_unitario > 0 ? m.costo_unitario : (saldo_cant > 0 ? saldo_valor / saldo_cant : 0);
        out_total = out_cant * out_unit;
        saldo_cant -= out_cant;
        saldo_valor -= out_total;
      }
      const saldo_unit = saldo_cant > 0 ? saldo_valor / saldo_cant : 0;
      
      return {
        ...m,
        in_cant, in_unit, in_total,
        out_cant, out_unit, out_total,
        saldo_cant, saldo_unit, saldo_total: saldo_valor
      };
    });
    
    return procesados.reverse();
  };

  const movimientosOrdenados = getMovimientosProcesados();"""

content = content.replace(old_mov_logic, new_mov_logic)

# 3. Carefully replace the table element
# Find the exact table block
table_match = re.search(r'(<table className="w-full text-left">.*?</table\s*>)', content, flags=re.DOTALL)
if table_match:
    old_table = table_match.group(1)
    
    new_table_logic = """{filtroProd ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-2 border-b border-r" rowSpan="2">Fecha / Detalle</th>
                  <th className="px-3 py-2 border-b border-r text-center bg-emerald-50 text-emerald-700" colSpan="3">ENTRADAS</th>
                  <th className="px-3 py-2 border-b border-r text-center bg-rose-50 text-rose-700" colSpan="3">SALIDAS</th>
                  <th className="px-3 py-2 border-b text-center bg-indigo-50 text-indigo-700" colSpan="3">Saldos (Prom. Ponderado)</th>
                </tr>
                <tr className="bg-slate-50 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-2 py-2 border-b border-r bg-emerald-50/50">Cant</th>
                  <th className="px-2 py-2 border-b border-r bg-emerald-50/50">C.Unit</th>
                  <th className="px-2 py-2 border-b border-r bg-emerald-50/50">Total</th>
                  <th className="px-2 py-2 border-b border-r bg-rose-50/50">Cant</th>
                  <th className="px-2 py-2 border-b border-r bg-rose-50/50">C.Unit</th>
                  <th className="px-2 py-2 border-b border-r bg-rose-50/50">Total</th>
                  <th className="px-2 py-2 border-b border-r bg-indigo-50/50">Cant</th>
                  <th className="px-2 py-2 border-b border-r bg-indigo-50/50">C.Prom</th>
                  <th className="px-2 py-2 border-b bg-indigo-50/50">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovimientos.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 text-sm">
                    <td className="px-3 py-2 border-r">
                      <div className="text-xs text-slate-500">{new Date(m.fecha).toLocaleString()}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {getMovIcon(m.tipo_movimiento)}
                        <span className="font-medium text-slate-700 text-[11px]">{m.tipo_movimiento.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[10px] text-indigo-500 font-semibold">{m.referencia_tipo} #{m.referencia_id}</div>
                      <div className="text-[10px] text-slate-400">{m.bodega_nombre}</div>
                    </td>
                    <td className="px-2 py-2 text-right border-r font-medium text-emerald-600 bg-emerald-50/10">{m.in_cant > 0 ? m.in_cant : ''}</td>
                    <td className="px-2 py-2 text-right border-r text-slate-500 bg-emerald-50/10">{m.in_cant > 0 ? '$' + Number(m.in_unit).toFixed(4) : ''}</td>
                    <td className="px-2 py-2 text-right border-r font-medium text-emerald-700 bg-emerald-50/10">{m.in_cant > 0 ? '$' + Number(m.in_total).toFixed(2) : ''}</td>
                    <td className="px-2 py-2 text-right border-r font-medium text-rose-600 bg-rose-50/10">{m.out_cant > 0 ? m.out_cant : ''}</td>
                    <td className="px-2 py-2 text-right border-r text-slate-500 bg-rose-50/10">{m.out_cant > 0 ? '$' + Number(m.out_unit).toFixed(4) : ''}</td>
                    <td className="px-2 py-2 text-right border-r font-medium text-rose-700 bg-rose-50/10">{m.out_cant > 0 ? '$' + Number(m.out_total).toFixed(2) : ''}</td>
                    <td className="px-2 py-2 text-right border-r font-bold text-indigo-600 bg-indigo-50/30">{m.saldo_cant}</td>
                    <td className="px-2 py-2 text-right border-r text-slate-600 bg-indigo-50/30">{'$' + Number(m.saldo_unit).toFixed(4)}</td>
                    <td className="px-2 py-2 text-right font-bold text-indigo-700 bg-indigo-50/30">{'$' + Number(m.saldo_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            """ + old_table + """
          )}"""
          
    content = content.replace(old_table, new_table_logic)

with open('c:/factura/facturacion_web/src/pages/Kardex.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
