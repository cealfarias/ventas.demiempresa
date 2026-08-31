import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Plus, Search, Calendar, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CuentasPagar() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cuentaPagarActiva, setCuentaPagarActiva] = useState(null);
  
  const [formPago, setFormPago] = useState({ monto: '', metodo_pago: 'efectivo', referencia: '', notas: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/compras/cuentas-pagar/?empresa_id=${empresaId()}`);
      setCuentas(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirPago = (cuenta) => {
    setCuentaPagarActiva(cuenta);
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
      await api.post(`/api/v1/compras/cuentas-pagar/${cuentaPagarActiva.id}/pagar?empresa_id=${empresaId()}`, payload);
      setModalAbierto(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al registrar pago');
    } finally {
      setGuardando(false);
    }
  };

  // KPIs
  const totalPendiente = cuentas.reduce((acc, c) => acc + c.monto_pendiente, 0);
  const vencidas = cuentas.filter(c => new Date(c.fecha_vencimiento) < new Date() && c.estado !== 'pagada');

  const badgeEstado = (estado, vencida) => {
    if (vencida && estado !== 'pagada') return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">VENCIDA</span>;
    const s = {
      'pendiente': 'bg-slate-100 text-slate-600',
      'parcial': 'bg-amber-100 text-amber-700',
      'pagada': 'bg-emerald-100 text-emerald-700'
    }[estado] || 'bg-slate-100 text-slate-600';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s}`}>{estado.toUpperCase()}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" /> Cuentas por Pagar
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de obligaciones y pagos a proveedores</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Pendiente</p>
          <p className="text-3xl font-bold text-indigo-700">{fmt(totalPendiente)}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm bg-red-50/30">
          <p className="text-sm text-red-500 mb-1">Vencido</p>
          <p className="text-3xl font-bold text-red-700">{fmt(vencidas.reduce((acc, c) => acc + c.monto_pendiente, 0))}</p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando cuentas por pagar...</div>
      ) : cuentas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay cuentas por pagar</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Proveedor</th>
                <th className="px-5 py-3.5">Documento</th>
                <th className="px-5 py-3.5 text-right">Monto Original</th>
                <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                <th className="px-5 py-3.5 text-center">Vencimiento</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuentas.map(c => {
                const esVencida = new Date(c.fecha_vencimiento) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">{c.proveedor_nombre}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{c.orden_numero || '—'}</td>
                    <td className="px-5 py-4 text-right text-sm text-slate-500">{fmt(c.monto_original)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">{fmt(c.monto_pendiente)}</td>
                    <td className="px-5 py-4 text-center text-sm">
                      {c.fecha_vencimiento ? (
                        <span className={esVencida && c.estado !== 'pagada' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {new Date(c.fecha_vencimiento).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">{badgeEstado(c.estado, esVencida)}</td>
                    <td className="px-5 py-4 flex justify-end">
                      {c.estado !== 'pagada' && (
                        <button onClick={() => abrirPago(c)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Pago */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Registrar Pago</h2>
            <p className="text-sm text-slate-500 mb-5">Para: {cuentaPagarActiva.proveedor_nombre}</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Monto a Pagar (USD)</label>
                <input type="number" min="0" step="0.01" max={(cuentaPagarActiva.monto_pendiente/100).toFixed(2)} value={formPago.monto} onChange={e => setFormPago({...formPago, monto: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50 text-lg font-bold text-indigo-700" />
                <p className="text-xs text-slate-400 mt-1">Saldo máximo: {fmt(cuentaPagarActiva.monto_pendiente)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                <select value={formPago.metodo_pago} onChange={e => setFormPago({...formPago, metodo_pago: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Referencia</label>
                <input type="text" value={formPago.referencia} onChange={e => setFormPago({...formPago, referencia: e.target.value})} placeholder="Num. comprobante o cheque" className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2.5 border text-slate-600 rounded-xl hover:bg-slate-50 font-medium">Cancelar</button>
              <button onClick={registrarPago} disabled={guardando || !formPago.monto || formPago.monto <= 0} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50">
                {guardando ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
