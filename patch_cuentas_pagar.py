import re

with open('c:/factura/facturacion_web/src/pages/CuentasPagar.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update registrarPago logic to do waterfall payment
old_registrar = """const registrarPago = async () => {
    setGuardando(true);
    try {
      const payload = {
        monto: Math.round(parseFloat(formPago.monto) * 100),
        metodo_pago: formPago.metodo_pago,
        referencia: formPago.referencia,
        notas: formPago.notas,
        usuario_id: 1
      };
      await api.post(`/api/v1/compras/cuentas-pagar/${cuentaPagarActiva.id}/pagar?empresa_id=${empresaId()}`, payload);
      setModalAbierto(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al registrar pago');
    } finally {
      setGuardando(false);
    }
  };"""

new_registrar = """const registrarPago = async () => {
    setGuardando(true);
    try {
      let montoDisponible = Math.round(parseFloat(formPago.monto) * 100);
      
      // Ordenar las facturas de la más antigua a la más nueva según fecha_vencimiento
      const cuentasOrdenadas = [...cuentaPagarActiva.cuentas].sort((a, b) => new Date(a.fecha_vencimiento || a.fecha_creacion) - new Date(b.fecha_vencimiento || b.fecha_creacion));
      
      for (const c of cuentasOrdenadas) {
        if (montoDisponible <= 0) break;
        
        const montoAPagar = Math.min(montoDisponible, c.monto_pendiente);
        const payload = {
          monto: montoAPagar,
          metodo_pago: formPago.metodo_pago,
          referencia: formPago.referencia,
          notas: formPago.notas,
          usuario_id: 1
        };
        
        await api.post(`/api/v1/compras/cuentas-pagar/${c.id}/pagar?empresa_id=${empresaId()}`, payload);
        montoDisponible -= montoAPagar;
      }
      
      setModalAbierto(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al registrar pago consolidado');
    } finally {
      setGuardando(false);
    }
  };"""

content = content.replace(old_registrar, new_registrar)

# 2. Add consolidado logic before "const totalPendiente"
old_kpi_start = "// KPIs"
new_kpi_start = """// Consolidar por proveedor
  const consolidado = {};
  cuentas.filter(c => c.estado !== 'pagada').forEach(c => {
    if (!consolidado[c.proveedor_id]) {
      consolidado[c.proveedor_id] = {
        proveedor_id: c.proveedor_id,
        proveedor_nombre: c.proveedor_nombre,
        monto_original: 0,
        monto_pendiente: 0,
        cuentas: [],
        vencido: 0
      };
    }
    consolidado[c.proveedor_id].monto_original += c.monto_original;
    consolidado[c.proveedor_id].monto_pendiente += c.monto_pendiente;
    consolidado[c.proveedor_id].cuentas.push(c);
    if (c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()) {
      consolidado[c.proveedor_id].vencido += c.monto_pendiente;
    }
  });
  const cuentasConsolidadas = Object.values(consolidado);

  // KPIs"""
content = content.replace(old_kpi_start, new_kpi_start)

# 3. Update table rendering
table_match = re.search(r'(<table className="w-full text-left">.*?</table\s*>)', content, flags=re.DOTALL)
if table_match:
    new_table = """<table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Proveedor</th>
                <th className="px-5 py-3.5 text-center">Docs Pendientes</th>
                <th className="px-5 py-3.5 text-right">Saldo Original</th>
                <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                <th className="px-5 py-3.5 text-right">Vencido</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuentasConsolidadas.map(prov => {
                const esVencida = prov.vencido > 0;
                return (
                  <tr key={prov.proveedor_id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-800">{prov.proveedor_nombre}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full text-xs">
                        {prov.cuentas.length} DOCS
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-500">{fmt(prov.monto_original)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800 text-base">{fmt(prov.monto_pendiente)}</td>
                    <td className="px-5 py-4 text-right text-sm">
                      {esVencida ? (
                        <span className="text-red-600 font-bold">{fmt(prov.vencido)}</span>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-4 text-center">{badgeEstado(esVencida ? 'vencida' : 'pendiente', esVencida)}</td>
                    <td className="px-5 py-4 flex justify-end">
                      <button onClick={() => abrirPago(prov)} className="text-xs bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-100 font-semibold transition-colors flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> Pago / Abono
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>"""
    content = content.replace(table_match.group(1), new_table)

# 4. Update the maximum message in the modal
content = re.sub(
    r'<p className="text-xs text-slate-400 mt-1">Saldo m.ximo: \{fmt\(cuentaPagarActiva\.monto_pendiente\)\}</p>',
    '<p className="text-xs text-slate-400 mt-1">Saldo máximo consolidado: {fmt(cuentaPagarActiva.monto_pendiente)}</p>',
    content
)

content = content.replace(
    '<p className="text-sm text-slate-500 mb-5">Para: {cuentaPagarActiva.proveedor_nombre}</p>',
    '<p className="text-sm text-slate-500 mb-2">Abono consolidado para: <span className="font-bold text-slate-700">{cuentaPagarActiva.proveedor_nombre}</span></p><div className="mb-5 bg-indigo-50 text-indigo-700 text-xs px-3 py-2 rounded-lg border border-indigo-100 font-medium">El abono ingresado se distribuirá automáticamente llenando primero las facturas más antiguas.</div>'
)

with open('c:/factura/facturacion_web/src/pages/CuentasPagar.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
