import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Wallet, X, Check, DollarSign } from 'lucide-react';

export default function AperturaCajaModal({ onClose, onSuccess }) {
  const [cajas, setCajas] = useState([]);
  const [cajaId, setCajaId] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('0.00');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const empresaId = localStorage.getItem('empresa_id');
  const usuarioId = localStorage.getItem('usuario_id') ? parseInt(localStorage.getItem('usuario_id')) : 1;

  useEffect(() => {
    if (empresaId) {
      api.get(`/api/v1/cajas?empresa_id=${empresaId}`).then(res => {
        setCajas(res.data || []);
        const libre = res.data.find(c => !c.tiene_sesion_activa);
        if (libre) setCajaId(libre.id.toString());
        else if (res.data.length > 0) setCajaId(res.data[0].id.toString());
      }).catch(e => console.error(e));
    }
  }, [empresaId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cajaId) {
      setError('Por favor seleccione una caja');
      return;
    }
    setError(null);
    setCargando(true);

    try {
      await api.post(`/api/v1/cajas/${cajaId}/abrir?empresa_id=${empresaId}&usuario_id=${usuarioId}&saldo_inicial=${saldoInicial}`);
      window.dispatchEvent(new CustomEvent('caja:updated'));
      window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: 'Apertura de caja realizada exitosamente.' } }));
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al abrir la caja');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Apertura de Turno de Caja</h3>
              <p className="text-xs text-indigo-100">Establece el fondo inicial para operar en efectivo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Seleccionar Caja Fisica</label>
            <select
              value={cajaId}
              onChange={e => setCajaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Seleccionar --</option>
              {cajas.map(c => (
                <option key={c.id} value={c.id} disabled={c.tiene_sesion_activa}>
                  {c.nombre} {c.tiene_sesion_activa ? `(Ocupada por ${c.usuario_sesion_activa || 'otro usuario'})` : '(Disponible)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Monto / Fondo Inicial ($ USD)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={saldoInicial}
                onChange={e => setSaldoInicial(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Efectivo físico inicial disponible en la gaveta.</p>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{cargando ? 'Abriendo...' : 'Confirmar Apertura'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
