import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Printer, FileText, User, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CuentasCobrar() {
  const [cuentasRaw, setCuentasRaw] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para modal de cliente (ver sus facturas)
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [clienteActivo, setClienteActivo] = useState(null);

  // Estados para modal de cobro (pagar una factura)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cuentaActiva, setCuentaActiva] = useState(null);
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo', referencia: '', notas: '' });
  const [guardando, setGuardando] = useState(false);
  
  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/facturacion/cuentas-cobrar/?empresa_id=${empresaId()}`);
      setCuentasRaw(res.data);
      
      // Si el modal de cliente está abierto, actualizar sus datos en vivo
      if (clienteActivo) {
        const cuentasActualizadas = res.data.filter(c => c.estado !== 'pagada' && c.cliente_id === clienteActivo.cliente_id);
        if (cuentasActualizadas.length === 0) {
          setModalClienteAbierto(false); // Ya pagó todo
        } else {
          setClienteActivo(prev => ({
            ...prev,
            cuentas: cuentasActualizadas,
            saldo_pendiente_total: cuentasActualizadas.reduce((sum, c) => sum + c.monto_pendiente, 0),
            monto_original_total: cuentasActualizadas.reduce((sum, c) => sum + c.monto_original, 0),
            tiene_mora: cuentasActualizadas.some(c => new Date(c.fecha_vencimiento) < new Date())
          }));
        }
      }
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  // Agrupar cuentas pendientes por cliente
  const agruparPorCliente = () => {
    const mapa = {};
    cuentasRaw.filter(c => c.estado !== 'pagada').forEach(c => {
      if (!mapa[c.cliente_id]) {
        mapa[c.cliente_id] = {
          cliente_id: c.cliente_id,
          cliente_nombre: c.cliente_nombre,
          cuentas: [],
          saldo_pendiente_total: 0,
          monto_original_total: 0,
          tiene_mora: false
        };
      }
      mapa[c.cliente_id].cuentas.push(c);
      mapa[c.cliente_id].saldo_pendiente_total += c.monto_pendiente;
      mapa[c.cliente_id].monto_original_total += c.monto_original;
      if (new Date(c.fecha_vencimiento) < new Date()) {
        mapa[c.cliente_id].tiene_mora = true;
      }
    });
    return Object.values(mapa).sort((a, b) => b.saldo_pendiente_total - a.saldo_pendiente_total);
  };

  const clientesAgrupados = agruparPorCliente();

  const abrirDetallesCliente = (clienteData) => {
    setClienteActivo(clienteData);
    setModalClienteAbierto(true);
  };

  const abrirPago = (cuenta) => {
    setCuentaActiva(cuenta);
    setFormPago({ monto: (cuenta.monto_pendiente / 100).toFixed(2), metodo_pago: 'efectivo', referencia: '', notas: '' });
    setModalAbierto(true);
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

  const imprimirEstadoCuentaCliente = (clienteData) => {
    const printWindow = window.open('', '_blank');
    
    let facturasRows = '';
    let abonosRows = '';

    clienteData.cuentas.forEach(c => {
        const esVencida = new Date(c.fecha_vencimiento) < new Date();
        facturasRows += `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${c.factura_numero || 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(c.fecha_creacion).toLocaleDateString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ${esVencida ? '#b91c1c' : 'inherit'}; font-weight: ${esVencida ? 'bold' : 'normal'}">${c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString() : 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${fmt(c.monto_original)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${fmt(c.monto_pendiente)}</td>
            </tr>
        `;

        if (c.pagos && c.pagos.length > 0) {
            c.pagos.forEach(p => {
                abonosRows += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(p.fecha).toLocaleString()}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${c.factura_numero || 'N/A'}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase;">${p.metodo_pago}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${p.referencia || '—'}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #059669;">${fmt(p.monto)}</td>
                    </tr>
                `;
            });
        }
    });

    if (!abonosRows) {
        abonosRows = '<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b; font-style: italic;">No hay abonos registrados para estas facturas.</td></tr>';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Estado de Cuenta - ${clienteData.cliente_nombre}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 900px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { color: #059669; margin: 0 0 10px 0; font-size: 28px; }
            .summary-box { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; border: 1px solid #e2e8f0; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 40px; font-size: 14px; }
            th { text-align: left; padding: 10px 8px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 12px; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 50px; color: #94a3b8; font-size: 0.85em; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>ESTADO DE CUENTA</h1>
              <p style="font-size: 18px; margin:0;"><strong>Cliente:</strong> ${clienteData.cliente_nombre}</p>
            </div>
            <div class="text-right" style="color: #475569; font-size: 14px;">
              <p style="margin: 3px 0;"><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 3px 0;"><strong>Documentos Pendientes:</strong> ${clienteData.cuentas.length}</p>
            </div>
          </div>

          <div class="summary-box">
            <div>
              <p style="margin:0; color: #64748b; font-size: 14px; text-transform: uppercase;">Total Facturado (Pendientes)</p>
              <h2 style="margin:5px 0 0 0; font-size: 24px;">${fmt(clienteData.monto_original_total)}</h2>
            </div>
            <div class="text-right">
              <p style="margin:0; color: #64748b; font-size: 14px; text-transform: uppercase;">Saldo Actual a Pagar</p>
              <h2 style="margin:5px 0 0 0; color: #b91c1c; font-size: 28px;">${fmt(clienteData.saldo_pendiente_total)}</h2>
            </div>
          </div>

          <h3 style="color: #334155; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">1. Detalle de Facturas Pendientes</h3>
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Emisión</th>
                <th>Vencimiento</th>
                <th class="text-right">Monto Original</th>
                <th class="text-right">Saldo Pendiente</th>
              </tr>
            </thead>
            <tbody>${facturasRows}</tbody>
          </table>

          <h3 style="color: #334155; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">2. Historial de Abonos Recibidos</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Aplicado A</th>
                <th>Método</th>
                <th>Referencia</th>
                <th class="text-right">Monto Depositado</th>
              </tr>
            </thead>
            <tbody>${abonosRows}</tbody>
          </table>
          
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

  const totalPorCobrar = clientesAgrupados.reduce((acc, c) => acc + c.saldo_pendiente_total, 0);
  const totalMora = clientesAgrupados.reduce((acc, c) => {
    const moraCliente = c.cuentas.filter(fact => new Date(fact.fecha_vencimiento) < new Date()).reduce((sum, fact) => sum + fact.monto_pendiente, 0);
    return acc + moraCliente;
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" /> Cuentas por Cobrar
          </h1>
          <p className="text-sm text-slate-500 mt-1">Saldos acumulados y estados de cuenta por cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total por Cobrar</p>
          <p className="text-3xl font-bold text-emerald-700">{fmt(totalPorCobrar)}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm bg-red-50/30">
          <p className="text-sm text-red-500 mb-1">Mora / Vencido</p>
          <p className="text-3xl font-bold text-red-700">{fmt(totalMora)}</p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando saldos...</div>
      ) : clientesAgrupados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay clientes con saldos pendientes</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5 text-center">Facturas Pendientes</th>
                <th className="px-5 py-3.5 text-right">Saldo Original</th>
                <th className="px-5 py-3.5 text-right">Saldo Pendiente Total</th>
                <th className="px-5 py-3.5 text-center">Estado General</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesAgrupados.map(c => (
                <tr key={c.cliente_id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-800">{c.cliente_nombre}</td>
                  <td className="px-5 py-4 text-center text-sm font-semibold text-slate-600 bg-slate-50 w-32">{c.cuentas.length} docs</td>
                  <td className="px-5 py-4 text-right text-sm text-slate-500">{fmt(c.monto_original_total)}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-800 text-lg">{fmt(c.saldo_pendiente_total)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.tiene_mora ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {c.tiene_mora ? 'EN MORA' : 'AL DÍA'}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex justify-end gap-2">
                    <button onClick={() => imprimirEstadoCuentaCliente(c)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-1" title="Imprimir Estado de Cuenta PDF">
                      <Printer className="w-3.5 h-3.5" /> Estado PDF
                    </button>
                    <button onClick={() => abrirDetallesCliente(c)} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 font-medium flex items-center gap-1">
                      Cobrar / Detalles <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detalles del Cliente (Facturas individuales) */}
      {modalClienteAbierto && clienteActivo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Detalles de Facturas</h2>
                <p className="text-sm text-slate-500 mt-1">Cliente: <span className="font-semibold text-slate-700">{clienteActivo.cliente_nombre}</span></p>
              </div>
              <button onClick={() => setModalClienteAbierto(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Monto Orig.</th>
                  <th className="px-4 py-3 text-right">Pendiente</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clienteActivo.cuentas.map(fact => {
                  const esVencida = new Date(fact.fecha_vencimiento) < new Date();
                  return (
                    <tr key={fact.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{fact.factura_numero || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={esVencida ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {fact.fecha_vencimiento ? new Date(fact.fecha_vencimiento).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500">{fmt(fact.monto_original)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(fact.monto_pendiente)}</td>
                      <td className="px-4 py-3 text-center">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${esVencida ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                           {esVencida ? 'VENCIDA' : 'VIGENTE'}
                         </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => abrirPago(fact)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium inline-flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Aplicar Abono
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cobro (Encima del de detalles si está abierto) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Registrar Cobro</h2>
            <p className="text-sm text-slate-500 mb-5">Factura: {cuentaActiva.factura_numero || 'N/A'}</p>

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
              <button onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={registrarPago} disabled={guardando || !formPago.monto} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-emerald-700">
                Confirmar Abono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
