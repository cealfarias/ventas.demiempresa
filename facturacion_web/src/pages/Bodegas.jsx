import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Edit2, CheckCircle2, XCircle, Star, MapPin, User, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

export default function Bodegas() {
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [bodegaEditando, setBodegaEditando] = useState(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', ubicacion: '', es_principal: false });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}&solo_activas=false`);
      setBodegas(res.data);
    } catch {
      setError('No se pudieron cargar las bodegas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNueva = () => {
    setBodegaEditando(null);
    setForm({ codigo: '', nombre: '', ubicacion: '', es_principal: false });
    setModalAbierto(true);
  };

  const abrirEditar = (b) => {
    setBodegaEditando(b);
    setForm({ codigo: b.codigo, nombre: b.nombre, ubicacion: b.ubicacion || '', es_principal: b.es_principal });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    setGuardando(true);
    try {
      if (bodegaEditando) {
        await api.put(`/api/v1/almacen/bodegas/${bodegaEditando.id}?empresa_id=${empresaId()}`, form);
      } else {
        await api.post(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`, form);
      }
      setModalAbierto(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar la bodega.');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (b) => {
    if (!confirm(`¿Desactivar la bodega "${b.nombre}"?`)) return;
    try {
      await api.delete(`/api/v1/almacen/bodegas/${b.id}?empresa_id=${empresaId()}`);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al desactivar.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-indigo-600" /> Bodegas / Almacenes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Administra los puntos de almacenamiento de tu empresa</p>
        </div>
        <button
          onClick={abrirNueva}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Nueva Bodega
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Grid de bodegas */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando bodegas...</div>
      ) : bodegas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay bodegas registradas</p>
          <p className="text-sm mt-1">Crea tu primera bodega para comenzar a controlar el inventario</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bodegas.map(b => (
            <div key={b.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${b.activa ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{b.codigo}</span>
                  {b.es_principal && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Principal
                    </span>
                  )}
                </div>
                {b.activa
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <XCircle className="w-5 h-5 text-slate-300" />
                }
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1">{b.nombre}</h3>

              {b.ubicacion && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> {b.ubicacion}
                </p>
              )}
              {b.responsable_nombre && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {b.responsable_nombre}
                </p>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => abrirEditar(b)}
                  className="flex-1 text-sm text-indigo-600 hover:bg-indigo-50 font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                {b.activa && !b.es_principal && (
                  <button
                    onClick={() => desactivar(b)}
                    className="flex-1 text-sm text-red-500 hover:bg-red-50 font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {bodegaEditando ? 'Editar Bodega' : 'Nueva Bodega'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Código *</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                    placeholder="BOD-01"
                    disabled={!!bodegaEditando}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Bodega Central"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                  placeholder="Calle X, Colonia Y, San Salvador"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.es_principal}
                  onChange={e => setForm(f => ({ ...f, es_principal: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Marcar como Bodega Principal</p>
                  <p className="text-xs text-slate-500">Será la bodega por defecto para nuevas facturas y despachos</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.codigo.trim() || !form.nombre.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : (bodegaEditando ? 'Guardar Cambios' : 'Crear Bodega')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
