import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
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
    } catch (e) { alert(e.response?.data?.detail || 'Error al registrar cobro'); }
    finally { setGuardando(false); }
  };

  const totalPorCobrar = cuentas.reduce((acc, c) => acc + c.monto_pendiente, 0);
  const vencidas = cuentas.filter(c => new Date(c.fecha_vencimiento) < new Date() && c.estado !== 'pagada');

  return (
    <div className="p-8 max-w-7xl mx-auto">
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
      ) : cuentas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay cuentas por cobrar</p>
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
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuentas.map(c => {
                const esVencida = new Date(c.fecha_vencimiento) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">{c.cliente_nombre}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{c.factura_numero || '—'}</td>
                    <td className="px-5 py-4 text-right text-sm text-slate-500">{fmt(c.monto_original)}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">{fmt(c.monto_pendiente)}</td>
                    <td className="px-5 py-4 text-center text-sm">
                      {c.fecha_vencimiento ? (
                        <span className={esVencida && c.estado !== 'pagada' ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {new Date(c.fecha_vencimiento).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {c.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex justify-end">
                      {c.estado !== 'pagada' && (
                        <button onClick={() => abrirPago(c)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Cobrar
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
