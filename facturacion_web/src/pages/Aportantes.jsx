import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Plus, Search, History, Edit, HeartHandshake, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

export default function Aportantes() {
  const [aportantes, setAportantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalAportante, setModalAportante] = useState(false);
  const [aportanteEditando, setAportanteEditando] = useState(null);
  const [formAportante, setFormAportante] = useState({
    nombre: '', tipo_relacion: 'Socio', contacto_telefono: '', dui_nit: '', email: '', saldo_inicial: '', notas: ''
  });

  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [aportanteActivo, setAportanteActivo] = useState(null);
  const [formMov, setFormMov] = useState({
    tipo: 'APORTE_RECIBIDO', monto: '', metodo_pago: 'efectivo', referencia: '', notas: ''
  });

  const [modalHistorial, setModalHistorial] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovs, setCargandoMovs] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/finanzas/aportantes/?empresa_id=${empresaId()}`);
      setAportantes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevoAportante = () => {
    setAportanteEditando(null);
    setFormAportante({ nombre: '', tipo_relacion: 'Socio', contacto_telefono: '', dui_nit: '', email: '', saldo_inicial: '', notas: '' });
    setModalAportante(true);
  };

  const abrirEditarAportante = (ap) => {
    setAportanteEditando(ap);
    setFormAportante({
      nombre: ap.nombre || '',
      tipo_relacion: ap.tipo_relacion || 'Socio',
      contacto_telefono: ap.contacto_telefono || '',
      dui_nit: ap.dui_nit || '',
      email: ap.email || '',
      saldo_inicial: '',
      notas: ap.notas || ''
    });
    setModalAportante(true);
  };

  const guardarAportante = async () => {
    if (!formAportante.nombre) return alert('Ingrese el nombre del aportante');
    setGuardando(true);
    try {
      const payload = {
        ...formAportante,
        saldo_inicial: formAportante.saldo_inicial ? Math.round(parseFloat(formAportante.saldo_inicial) * 100) : 0
      };
      if (aportanteEditando) {
        await api.put(`/api/v1/finanzas/aportantes/${aportanteEditando.id}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/finanzas/aportantes/?empresa_id=${empresaId()}`, payload);
      }
      setModalAportante(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar aportante');
    } finally {
      setGuardando(false);
    }
  };

  const abrirMovimiento = (ap, tipo) => {
    setAportanteActivo(ap);
    setFormMov({
      tipo: tipo,
      monto: '',
      metodo_pago: tipo === 'APORTE_RECIBIDO' ? 'transferencia' : 'efectivo',
      referencia: '',
      notas: ''
    });
    setModalMovimiento(true);
  };

  const guardarMovimiento = async () => {
    if (!formMov.monto || parseFloat(formMov.monto) <= 0) return alert('Ingrese un monto válido');
    setGuardando(true);
    try {
      const payload = {
        tipo: formMov.tipo,
        monto: Math.round(parseFloat(formMov.monto) * 100),
        metodo_pago: formMov.metodo_pago,
        referencia: formMov.referencia,
        notas: formMov.notas
      };
      await api.post(`/api/v1/finanzas/aportantes/${aportanteActivo.id}/movimiento?empresa_id=${empresaId()}&usuario_id=1`, payload);
      setModalMovimiento(false);
      cargar();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Movimiento de aportante registrado exitosamente." }}));
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al registrar movimiento');
    } finally {
      setGuardando(false);
    }
  };

  const abrirHistorial = async (ap) => {
    setAportanteActivo(ap);
    setModalHistorial(true);
    setCargandoMovs(true);
    try {
      const res = await api.get(`/api/v1/finanzas/aportantes/${ap.id}/movimientos?empresa_id=${empresaId()}`);
      setMovimientos(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoMovs(false);
    }
  };

  const aportantesFiltrados = aportantes.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.dui_nit && a.dui_nit.toLowerCase().includes(busqueda.toLowerCase())) ||
    (a.tipo_relacion && a.tipo_relacion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalSaldoPendiente = aportantes.reduce((acc, a) => acc + (a.saldo_pendiente || 0), 0);
  const totalAportado = aportantes.reduce((acc, a) => acc + (a.total_aportado || 0), 0);
  const totalDevuelto = aportantes.reduce((acc, a) => acc + (a.total_devuelto || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-600" /> Aportantes y Apoyo Financiero (Sin Interés)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Control de aportes de capital de socios, familiares o inversionistas sin intereses y sus devoluciones</p>
        </div>
        <button onClick={abrirNuevoAportante} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Plus className="w-4 h-4" /> Registrar Aportante
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo por Devolver</div>
            <div className="text-2xl font-black text-slate-800">{fmt(totalSaldoPendiente)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Aportado Histórico</div>
            <div className="text-2xl font-black text-emerald-600">{fmt(totalAportado)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Devuelto / Reembolsado</div>
            <div className="text-2xl font-black text-blue-600">{fmt(totalDevuelto)}</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, tipo de relación o DUI/NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-sm outline-none bg-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Aportante / Apoyo</th>
                <th className="py-3 px-4">Relación</th>
                <th className="py-3 px-4">Contacto / Identificación</th>
                <th className="py-3 px-4 text-right">Total Aportado</th>
                <th className="py-3 px-4 text-right">Total Reembolsado</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cargando ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Cargando aportantes...</td></tr>
              ) : aportantesFiltrados.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No hay aportantes registrados</td></tr>
              ) : (
                aportantesFiltrados.map((ap) => (
                  <tr key={ap.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ap.nombre}</div>
                      {ap.notas && <div className="text-xs text-slate-400 truncate max-w-xs">{ap.notas}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {ap.tipo_relacion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {ap.contacto_telefono && <div>Tel: {ap.contacto_telefono}</div>}
                      {ap.dui_nit && <div>DUI/NIT: {ap.dui_nit}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">{fmt(ap.total_aportado)}</td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600">{fmt(ap.total_devuelto)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{fmt(ap.saldo_pendiente)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirMovimiento(ap, 'APORTE_RECIBIDO')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-1"
                          title="Registrar nuevo aporte de dinero"
                        >
                          <Plus className="w-3 h-3" /> Aporte
                        </button>
                        <button
                          onClick={() => abrirMovimiento(ap, 'DEVOLUCION_CAPITAL')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-1"
                          title="Registrar devolución de dinero"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Devolver
                        </button>
                        <button
                          onClick={() => abrirHistorial(ap)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          title="Historial de Movimientos"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirEditarAportante(ap)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          title="Editar Aportante"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR APORTANTE */}
      {modalAportante && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {aportanteEditando ? 'Editar Aportante' : 'Nuevo Aportante / Apoyo Financiero'}
              </h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={formAportante.nombre}
                  onChange={(e) => setFormAportante({ ...formAportante, nombre: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Relación</label>
                <select
                  value={formAportante.tipo_relacion}
                  onChange={(e) => setFormAportante({ ...formAportante, tipo_relacion: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Socio">Socio</option>
                  <option value="Inversionista">Inversionista</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Amigo / Apoyo">Amigo / Apoyo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formAportante.contacto_telefono}
                    onChange={(e) => setFormAportante({ ...formAportante, contacto_telefono: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    placeholder="7000-0000"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DUI / NIT</label>
                  <input
                    type="text"
                    value={formAportante.dui_nit}
                    onChange={(e) => setFormAportante({ ...formAportante, dui_nit: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    placeholder="00000000-0"
                  />
                </div>
              </div>
              {!aportanteEditando && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Saldo de Aporte Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formAportante.saldo_inicial}
                    onChange={(e) => setFormAportante({ ...formAportante, saldo_inicial: e.target.value })}
                    className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    placeholder="0.00 (Opcional)"
                  />
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                <textarea
                  value={formAportante.notas}
                  onChange={(e) => setFormAportante({ ...formAportante, notas: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500 h-20"
                  placeholder="Detalles sobre el acuerdo de apoyo..."
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setModalAportante(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium">Cancelar</button>
              <button onClick={guardarAportante} disabled={guardando} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR MOVIMIENTO (APORTE O DEVOLUCION) */}
      {modalMovimiento && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {formMov.tipo === 'APORTE_RECIBIDO' ? 'Registrar Nuevo Aporte' : 'Registrar Devolución de Capital'}
              </h3>
              <p className="text-xs text-slate-500">Aportante: <span className="font-bold text-slate-700">{aportanteActivo?.nombre}</span></p>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {formMov.tipo === 'APORTE_RECIBIDO' ? 'Monto Aportado ($) *' : 'Monto a Devolver ($) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formMov.monto}
                  onChange={(e) => setFormMov({ ...formMov, monto: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-bold text-slate-800 text-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
                <select
                  value={formMov.metodo_pago}
                  onChange={(e) => setFormMov({ ...formMov, metodo_pago: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nº Referencia / Depósito</label>
                <input
                  type="text"
                  value={formMov.referencia}
                  onChange={(e) => setFormMov({ ...formMov, referencia: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas</label>
                <input
                  type="text"
                  value={formMov.notas}
                  onChange={(e) => setFormMov({ ...formMov, notas: e.target.value })}
                  className="w-full border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  placeholder="Comentarios adicionales"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setModalMovimiento(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium">Cancelar</button>
              <button onClick={guardarMovimiento} disabled={guardando} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm">
                {guardando ? 'Registrando...' : 'Registrar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE MOVIMIENTOS */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Histórico de Movimientos</h3>
                <p className="text-xs text-slate-500">Aportante: <span className="font-bold text-slate-700">{aportanteActivo?.nombre}</span></p>
              </div>
              <button onClick={() => setModalHistorial(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {cargandoMovs ? (
                <div className="text-center py-8 text-slate-400">Cargando movimientos...</div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No hay movimientos registrados para este aportante</div>
              ) : (
                movimientos.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        {m.tipo === 'APORTE_RECIBIDO' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">APORTE RECIBIDO</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">DEVOLUCIÓN DE CAPITAL</span>
                        )}
                        <span className="text-xs text-slate-400">({m.metodo_pago})</span>
                      </div>
                      {m.referencia && <div className="text-xs text-slate-500 mt-1">Ref: {m.referencia}</div>}
                      {m.notas && <div className="text-xs text-slate-500">{m.notas}</div>}
                      <div className="text-[11px] text-slate-400 mt-1">{new Date(m.fecha).toLocaleString()}</div>
                    </div>
                    <div className="text-right font-black text-base text-slate-800">
                      {fmt(m.monto)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setModalHistorial(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
