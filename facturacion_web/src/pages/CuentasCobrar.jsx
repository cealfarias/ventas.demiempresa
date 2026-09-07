import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Printer, FileText } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CuentasCobrar() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cuentaActiva, setCuentaActiva] = useState(null);
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo', referencia: '', notas: '' });
  const [guardando, setGuardando] = useState(false);
  
  // Nuevo modal para ver historial y estados de cuenta
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [cuentaDetalle, setCuentaDetalle] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/facturacion/cuentas-cobrar/?empresa_id=${empresaId()}`);
      setCuentas(res.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirPago = (cuenta) => {
    setCuentaActiva(cuenta);
    setFormPago({ monto: (cuenta.monto_pendiente / 100).toFixed(2), metodo_pago: 'efectivo', referencia: '', notas: '' });
    setModalAbierto(true);
  };

  const abrirDetalles = (cuenta) => {
    setCuentaDetalle(cuenta);
    setModalDetallesAbierto(true);
  };

  const registrarPago = async () => {
    setGuardando(true);
    try {
      const payload = {
        monto: Math.round(parseFloat(formPago.monto) * 100),
        metodo_pago: formPago.metodo_pago,
        referencia: formPago.referencia,
        notas: formPago.notas,
        usuario_id: 1
      };
      await api.post(`/api/v1/facturacion/cuentas-cobrar/${cuentaActiva.id}/pagar?empresa_id=${empresaId()}`, payload);
      setModalAbierto(false);
      cargar();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Cobro registrado correctamente." }}));
    } catch (e) { alert(e.response?.data?.detail || 'Error al registrar cobro'); }
    finally { setGuardando(false); }
  };

  const imprimirEstadoCuenta = (cuenta) => {
    const printWindow = window.open('', '_blank');
    const pagosRows = cuenta.pagos.map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${new Date(p.fecha).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.metodo_pago.toUpperCase()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.referencia || 'N/A'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${fmt(p.monto)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Estado de Cuenta - ${cuenta.cliente_nombre}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #059669; margin: 0 0 10px 0; font-size: 28px; }
            .summary-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; border: 1px solid #e2e8f0; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 40px; }
            th { text-align: left; padding: 12px 10px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 12px; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 50px; color: #94a3b8; font-size: 0.85em; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>ESTADO DE CUENTA</h1>
              <p style="font-size: 18px; margin:0;"><strong>Cliente:</strong> ${cuenta.cliente_nombre}</p>
            </div>
            <div class="text-right" style="color: #475569; font-size: 14px;">
              <p style="margin: 3px 0;"><strong>Documento Relacionado:</strong> ${cuenta.factura_numero || 'N/A'}</p>
              <p style="margin: 3px 0;"><strong>Fecha Emisión:</strong> ${new Date(cuenta.fecha_creacion).toLocaleDateString()}</p>
              <p style="margin: 3px 0;"><strong>Vencimiento:</strong> ${cuenta.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento).toLocaleDateString() : 'N/A'}</p>
              <p style="margin: 3px 0;"><strong>Estado:</strong> ${cuenta.estado.toUpperCase()}</p>
            </div>
          </div>

          <div class="summary-box">
            <div>
              <p style="margin:0; color: #64748b; font-size: 14px; text-transform: uppercase;">Monto Original</p>
              <h2 style="margin:5px 0 0 0; font-size: 24px;">${fmt(cuenta.monto_original)}</h2>
            </div>
            <div class="text-right">
              <p style="margin:0; color: #64748b; font-size: 14px; text-transform: uppercase;">Saldo Pendiente</p>
              <h2 style="margin:5px 0 0 0; color: #b91c1c; font-size: 28px;">${fmt(cuenta.monto_pendiente)}</h2>
            </div>
          </div>

          <h3 style="color: #334155; font-size: 18px; margin-bottom: 15px;">Historial de Cobros Recibidos</h3>
          ${cuenta.pagos.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th class="text-right">Monto Cobrado</th>
                </tr>
              </thead>
              <tbody>${pagosRows}</tbody>
            </table>
          ` : '<p style="color: #64748b; font-style: italic;">No se han registrado pagos o abonos para esta cuenta.</p>'}
          
          <div class="footer">
            <p>Estado de cuenta generado automáticamente el ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const totalPorCobrar = cuentas.reduce((acc, c) => acc + c.monto_pendiente, 0);
  const vencidas = cuentas.filter(c => new Date(c.fecha_vencimiento) < new Date() && c.estado !== 'pagada');
  
  // FILTRO: Ya no mostramos las cuentas pagadas en la vista principal
  const cuentasMostrar = cuentas.filter(c => c.estado !== 'pagada');

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" /> Cuentas por Cobrar
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de cobros a clientes y facturas de crédito</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total por Cobrar</p>
          <p className="text-3xl font-bold text-emerald-700">{fmt(totalPorCobrar)}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm bg-red-50/30">
          <p className="text-sm text-red-500 mb-1">Mora / Vencido</p>
          <p className="text-3xl font-bold text-red-700">{fmt(vencidas.reduce((acc, c) => acc + c.monto_pendiente, 0))}</p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando cuentas...</div>
      ) : cuentasMostrar.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay cuentas pendientes por cobrar</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Factura</th>
                <th className="px-5 py-3.5 text-right">Monto Original</th>
                <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                <th className="px-5 py-3.5 text-center">Vencimiento</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuentasMostrar.map(c => {
                const esVencida = new Date(c.fecha_vencimiento) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">{c.cliente_nombre}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{c.factura_numero || '—'}</td>
                    <td className="px-5 py-4 text-right text-sm text-slate-500">{fmt(c.monto_original)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">{fmt(c.monto_pendiente)}</td>
                    <td className="px-5 py-4 text-center text-sm">
                      {c.fecha_vencimiento ? (
                        <span className={esVencida ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {new Date(c.fecha_vencimiento).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700`}>
                        {c.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex justify-end gap-2">
                      <button onClick={() => abrirDetalles(c)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-1" title="Ver Detalles y Estado de Cuenta">
                        <FileText className="w-3.5 h-3.5" /> Estado
                      </button>
                      <button onClick={() => abrirPago(c)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Cobrar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalles y Estado de Cuenta */}
      {modalDetallesAbierto && cuentaDetalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Detalles de Cuenta</h2>
                <p className="text-sm text-slate-500 mt-1">{cuentaDetalle.cliente_nombre} - Factura: {cuentaDetalle.factura_numero || 'N/A'}</p>
              </div>
              <button onClick={() => setModalDetallesAbierto(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-500 uppercase">Monto Original</p><p className="font-bold text-slate-700 text-lg">{fmt(cuentaDetalle.monto_original)}</p></div>
              <div><p className="text-xs text-slate-500 uppercase">Saldo Pendiente</p><p className="font-bold text-red-600 text-lg">{fmt(cuentaDetalle.monto_pendiente)}</p></div>
            </div>

            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2">Historial de Pagos</h3>
            {cuentaDetalle.pagos.length > 0 ? (
              <table className="w-full text-left mb-6">
                <thead>
                  <tr className="text-xs uppercase text-slate-500">
                    <th className="py-2">Fecha y Hora</th>
                    <th className="py-2">Método</th>
                    <th className="py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuentaDetalle.pagos.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 text-sm text-slate-700">{new Date(p.fecha).toLocaleString()}</td>
                      <td className="py-2 text-sm text-slate-500 uppercase">{p.metodo_pago}</td>
                      <td className="py-2 text-sm font-medium text-emerald-600 text-right">{fmt(p.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500 italic mb-6">No hay pagos registrados para esta cuenta.</p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => imprimirEstadoCuenta(cuentaDetalle)} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 rounded-lg flex items-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir Estado de Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobro */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Registrar Cobro</h2>
            <p className="text-sm text-slate-500 mb-5">Cliente: {cuentaActiva.cliente_nombre}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Monto a Cobrar (USD)</label>
                <input type="number" min="0" step="0.01" max={(cuentaActiva.monto_pendiente/100).toFixed(2)} value={formPago.monto} onChange={e => setFormPago({...formPago, monto: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-lg font-bold text-emerald-700" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                <select value={formPago.metodo_pago} onChange={e => setFormPago({...formPago, metodo_pago: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Referencia</label>
                <input type="text" value={formPago.referencia} onChange={e => setFormPago({...formPago, referencia: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2.5 border rounded-xl font-medium">Cancelar</button>
              <button onClick={registrarPago} disabled={guardando || !formPago.monto} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50">
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
