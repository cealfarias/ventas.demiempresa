import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, Send, CheckCircle2, AlertTriangle, RefreshCw, FileText, Clock, RotateCcw } from 'lucide-react';

export default function ResumenDiarioContable() {
  const [empresaId] = useState(localStorage.getItem('empresa_id') || '');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [bitacora, setBitacora] = useState([]);
  const [reintentandoId, setReintentandoId] = useState(null);

  useEffect(() => {
    cargarBitacora();
  }, []);

  const cargarBitacora = async () => {
    try {
      const res = await api.get(`/api/v1/integracion-contable/bitacora?empresa_id=${empresaId}&limit=30`);
      if (res.data && Array.isArray(res.data)) {
        setBitacora(res.data);
      }
    } catch (err) {
      console.error("Error al cargar bitacora", err);
    }
  };

  const handleGenerarResumen = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setError(null);
    try {
      const res = await api.post(`/api/v1/integracion-contable/generar-resumen-diario?empresa_id=${empresaId}`, { fecha });
      if (res.data?.exito) {
        setMensaje(`¡Resumen Diario procesado! (${res.data.facturas_procesadas} facturas procesadas, Total: $${res.data.total_ventas || 0})`);
        cargarBitacora();
      } else {
        setError(res.data?.mensaje || "No se pudo generar el resumen diario");
      }
    } catch (err) {
      setError("Error al procesar resumen diario: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReintentar = async (bitacoraId) => {
    setReintentandoId(bitacoraId);
    try {
      const res = await api.post(`/api/v1/integracion-contable/reintentar/${bitacoraId}?empresa_id=${empresaId}`);
      if (res.data?.exito) {
        cargarBitacora();
      } else {
        alert("Error al reintentar envío: " + (res.data?.mensaje || "Error desconocido"));
      }
    } catch (err) {
      alert("Error al conectar con servidor: " + (err.response?.data?.detail || err.message));
    } finally {
      setReintentandoId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Resumen Diario Contable (Consumidor Final)
          </h1>
          <p className="text-sm text-slate-500">
            Consolida las ventas a Consumidor Final de una fecha en **1 sola partida contable** enviada a la Contabilidad.
          </p>
        </div>
      </div>

      {/* Card Generación bajo demanda */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" />
          Procesar Resumen Diario de Ventas
        </h2>
        <form onSubmit={handleGenerarResumen} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Fecha de Ventas
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generando Asiento...' : 'Generar y Enviar Partida Diaria'}
          </button>
        </form>

        {mensaje && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {mensaje}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Bitacora de envíos */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Bitácora de Integración Contable
          </h2>
          <button
            onClick={cargarBitacora}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase text-[10px] font-extrabold text-slate-500 border-b">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Tipo Origen</th>
                <th className="p-3">Fecha Partida</th>
                <th className="p-3">Concepto</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Detalle / Error</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bitacora.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-400 italic">
                    No se registran transacciones contables transmitidas aún.
                  </td>
                </tr>
              ) : (
                bitacora.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">#{item.id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                        item.tipo_origen === 'ccf_individual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.tipo_origen}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{item.fecha_partida}</td>
                    <td className="p-3 font-medium max-w-xs truncate">{item.concepto}</td>
                    <td className="p-3">
                      {item.estado === 'enviado' ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enviado
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Error
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs truncate font-mono text-[11px] text-slate-500">
                      {item.estado === 'enviado' ? item.respuesta_contabilidad : item.mensaje_error}
                    </td>
                    <td className="p-3 text-right">
                      {item.estado !== 'enviado' && (
                        <button
                          onClick={() => handleReintentar(item.id)}
                          disabled={reintentandoId === item.id}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px] border border-amber-200 inline-flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className={`w-3 h-3 ${reintentandoId === item.id ? 'animate-spin' : ''}`} />
                          Reintentar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
