import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Plus, Search, Percent, History, Edit, Calendar, UserCheck, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

export default function Acreedores() {
  const [acreedores, setAcreedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalAcreedor, setModalAcreedor] = useState(false);
  const [acreedorEditando, setAcreedorEditando] = useState(null);
  const [formAcreedor, setFormAcreedor] = useState({
    nombre: '', contacto_telefono: '', dui_nit: '', email: '', tasa_interes_anual: 12.0, saldo_capital: '', notas: ''
  });

  const [modalPago, setModalPago] = useState(false);
  const [modalPrestamo, setModalPrestamo] = useState(false);
  const [acreedorActivo, setAcreedorActivo] = useState(null);
  
  const [formMov, setFormMov] = useState({
    tipo: 'PAGO_MIXTO', monto_capital: '', monto_interes: '', metodo_pago: 'efectivo', referencia: '', notas: ''
  });

  const [modalHistorial, setModalHistorial] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovs, setCargandoMovs] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/finanzas/acreedores?empresa_id=${empresaId()}`);
      setAcreedores(res.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevoAcreedor = () => {
    setAcreedorEditando(null);
    setFormAcreedor({ nombre: '', contacto_telefono: '', dui_nit: '', email: '', tasa_interes_anual: 12.0, saldo_capital: '', notas: '' });
    setModalAcreedor(true);
  };

  const abrirEditarAcreedor = (ac) => {
    setAcreedorEditando(ac);
    setFormAcreedor({
      nombre: ac.nombre || '',
      contacto_telefono: ac.contacto_telefono || '',
      dui_nit: ac.dui_nit || '',
      email: ac.email || '',
      tasa_interes_anual: ac.tasa_interes_anual || 0,
      saldo_capital: (ac.saldo_capital / 100).toFixed(2),
      notas: ac.notas || ''
    });
    setModalAcreedor(true);
  };

  const guardarAcreedor = async () => {
    if (!formAcreedor.nombre) return alert('Ingrese el nombre del acreedor');
    setGuardando(true);
    try {
      const payload = {
        ...formAcreedor,
        tasa_interes_anual: parseFloat(formAcreedor.tasa_interes_anual || 0),
        saldo_capital: Math.round(parseFloat(formAcreedor.saldo_capital || 0) * 100)
      };
      if (acreedorEditando) {
        await api.put(`/api/v1/finanzas/acreedores/${acreedorEditando.id}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/finanzas/acreedores?empresa_id=${empresaId()}`, payload);
      }
      setModalAcreedor(false);
      cargar();
    } catch (e) { alert(e.response?.data?.detail || 'Error al guardar acreedor'); }
    finally { setGuardando(false); }
  };

  const abrirPrestamo = (ac) => {
    setAcreedorActivo(ac);
    setFormMov({ tipo: 'PRESTAMO_RECIBIDO', monto_capital: '', monto_interes: '0', metodo_pago: 'transferencia', referencia: '', notas: '' });
    setModalPrestamo(true);
  };

  const abrirPago = (ac) => {
    setAcreedorActivo(ac);
    setFormMov({ tipo: 'PAGO_MIXTO', monto_capital: '', monto_interes: '', metodo_pago: 'efectivo', referencia: '', notas: '' });
    setModalPago(true);
  };

  const guardarMovimiento = async (tipoOverride) => {
    setGuardando(true);
    try {
      const tipo = tipoOverride || formMov.tipo;
      const payload = {
        tipo,
        monto_capital: Math.round(parseFloat(formMov.monto_capital || 0) * 100),
        monto_interes: Math.round(parseFloat(formMov.monto_interes || 0) * 100),
        metodo_pago: formMov.metodo_pago,
        referencia: formMov.referencia,
        notas: formMov.notas
      };
      await api.post(`/api/v1/finanzas/acreedores/${acreedorActivo.id}/movimiento?empresa_id=${empresaId()}&usuario_id=1`, payload);
      setModalPago(false);
      setModalPrestamo(false);
      cargar();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Movimiento financiero de acreedor registrado exitosamente." }}));
    } catch (e) { alert(e.response?.data?.detail || 'Error al registrar movimiento'); }
    finally { setGuardando(false); }
  };

  const abrirHistorial = async (ac) => {
    setAcreedorActivo(ac);
    setModalHistorial(true);
    setCargandoMovs(true);
    try {
      const res = await api.get(`/api/v1/finanzas/acreedores/${ac.id}/movimientos?empresa_id=${empresaId()}`);
      setMovimientos(res.data);
    } catch (e) { console.error(e); }
    finally { setCargandoMovs(false); }
  };

  const acreedoresFiltrados = acreedores.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.dui_nit && a.dui_nit.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalCapitalPendiente = acreedores.reduce((acc, a) => acc + (a.saldo_capital || 0), 0);
  const totalInteresesAnio = acreedores.reduce((acc, a) => acc + (a.intereses_pagados_anio || 0), 0);
  const totalPagadoHistorico = acreedores.reduce((acc, a) => acc + (a.total_pagado_historico || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" /> Acreedores y Préstamos con Interés
          </h1>
          <p className="text-sm text-slate-500 mt-1">Control maestro de capital prestado, intereses pagados en el año e historial financiero</p>
        </div>
        <button onClick={abrirNuevoAcreedor} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
          <Plus className="w-4 h-4" /> Registrar Acreedor
        </button>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Saldo Capital Pendiente Total</p>
          <p className="text-3xl font-bold text-amber-600">{fmt(totalCapitalPendiente)}</p>
        </div>
        <div className="bg-white border border-indigo-100 bg-indigo-50/30 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Intereses Pagados en {new Date().getFullYear()}</p>
          <p className="text-3xl font-bold text-indigo-700">{fmt(totalInteresesAnio)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pagado Histórico (Cap. + Int.)</p>
          <p className="text-3xl font-bold text-emerald-700">{fmt(totalPagadoHistorico)}</p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre de acreedor o DUI/NIT..."
          className="w-full bg-transparent text-sm font-medium outline-none text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* TABLA DE ACREEDORES */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400 font-medium">Cargando acreedores...</div>
      ) : acreedoresFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white border border-slate-200 rounded-2xl">
          <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-700">No hay acreedores registrados</p>
          <p className="text-sm text-slate-400 mt-1">Agregue un nuevo acreedor para gestionar préstamos e intereses.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Acreedor</th>
                <th className="px-5 py-3.5 text-center">Tasa Interés</th>
                <th className="px-5 py-3.5 text-right">Saldo Capital</th>
                <th className="px-5 py-3.5 text-right">Int. Pagados {new Date().getFullYear()}</th>
                <th className="px-5 py-3.5 text-right">Total Pagado Hist.</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {acreedoresFiltrados.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{a.nombre}</div>
                    <div className="text-xs text-slate-400 flex gap-3 mt-0.5">
                      {a.dui_nit && <span>DUI/NIT: {a.dui_nit}</span>}
                      {a.contacto_telefono && <span>Tel: {a.contacto_telefono}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-100">
                      <Percent className="w-3 h-3" /> {a.tasa_interes_anual}% Anual
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-amber-700 text-base">
                    {fmt(a.saldo_capital)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-indigo-700 text-sm">
                    {fmt(a.intereses_pagados_anio)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-700 text-sm">
                    {fmt(a.total_pagado_historico)}
                  </td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2 items-center">
                    <button onClick={() => abrirPrestamo(a)} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 font-medium flex items-center gap-1 border border-emerald-200">
                      <Plus className="w-3.5 h-3.5" /> Préstamo
                    </button>
                    <button onClick={() => abrirPago(a)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-1 shadow-sm">
                      <DollarSign className="w-3.5 h-3.5" /> Abonar / Pagar
                    </button>
                    <button onClick={() => abrirHistorial(a)} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 font-medium flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Historial
                    </button>
                    <button onClick={() => abrirEditarAcreedor(a)} className="text-xs text-slate-400 hover:text-slate-600 p-1">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR / EDITAR ACREEDOR */}
      {modalAcreedor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{acreedorEditando ? 'Editar Acreedor' : 'Registrar Nuevo Acreedor'}</h2>
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Nombre Completo / Razón Social *</label>
                <input type="text" value={formAcreedor.nombre} onChange={e => setFormAcreedor({...formAcreedor, nombre: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-slate-700" placeholder="Ej: Carlos Alberto Mendoza" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">DUI / NIT</label>
                  <input type="text" value={formAcreedor.dui_nit} onChange={e => setFormAcreedor({...formAcreedor, dui_nit: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-slate-700" placeholder="00000000-0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Teléfono Contacto</label>
                  <input type="text" value={formAcreedor.contacto_telefono} onChange={e => setFormAcreedor({...formAcreedor, contacto_telefono: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-slate-700" placeholder="7000-0000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tasa Interés Anual (%)</label>
                  <input type="number" step="0.1" value={formAcreedor.tasa_interes_anual} onChange={e => setFormAcreedor({...formAcreedor, tasa_interes_anual: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-indigo-700 font-bold" placeholder="12.0" />
                </div>
                {!acreedorEditando && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Préstamo Inicial ($)</label>
                    <input type="number" step="0.01" value={formAcreedor.saldo_capital} onChange={e => setFormAcreedor({...formAcreedor, saldo_capital: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl font-semibold" placeholder="0.00" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Notas / Términos del Préstamo</label>
                <textarea rows="2" value={formAcreedor.notas} onChange={e => setFormAcreedor({...formAcreedor, notas: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="Condiciones de pago, garantías, etc." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAcreedor(false)} className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={guardarAcreedor} disabled={guardando || !formAcreedor.nombre} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 shadow-sm">
                {guardando ? 'Guardando...' : 'Guardar Acreedor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PRÉSTAMO RECIBIDO */}
      {modalPrestamo && acreedorActivo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Registrar Préstamo Recibido</h2>
            <p className="text-xs text-slate-500 mb-4">Acreedor: <span className="font-bold text-slate-700">{acreedorActivo.nombre}</span></p>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Monto Recibido en Préstamo ($)</label>
                <input type="number" min="0.01" step="0.01" value={formMov.monto_capital} onChange={e => setFormMov({...formMov, monto_capital: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-lg font-bold text-emerald-700" placeholder="0.00" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Método de Ingreso</label>
                <select value={formMov.metodo_pago} onChange={e => setFormMov({...formMov, metodo_pago: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo (Caja)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Referencia / No. Comprobante</label>
                <input type="text" value={formMov.referencia} onChange={e => setFormMov({...formMov, referencia: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" placeholder="Ej: Transf. 984123" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Notas / Observaciones</label>
                <input type="text" value={formMov.notas} onChange={e => setFormMov({...formMov, notas: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="Detalles de recepción" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalPrestamo(false)} className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => guardarMovimiento('PRESTAMO_RECIBIDO')} disabled={guardando || !formMov.monto_capital} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-emerald-700 shadow-sm">
                {guardando ? 'Registrando...' : 'Confirmar Préstamo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO (CAPITAL E INTERESES) */}
      {modalPago && acreedorActivo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Registrar Pago a Acreedor</h2>
            <p className="text-xs text-slate-500 mb-4">Acreedor: <span className="font-bold text-slate-700">{acreedorActivo.nombre}</span> (Saldo Cap: {fmt(acreedorActivo.saldo_capital)})</p>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Abono a Capital ($)</label>
                  <input type="number" min="0" step="0.01" value={formMov.monto_capital} onChange={e => setFormMov({...formMov, monto_capital: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-base font-bold text-indigo-700" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Pago Intereses ($)</label>
                  <input type="number" min="0" step="0.01" value={formMov.monto_interes} onChange={e => setFormMov({...formMov, monto_interes: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-base font-bold text-amber-700" placeholder="0.00" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600">Total Egreso Pago:</span>
                <span className="text-lg font-bold text-indigo-700">
                  ${((parseFloat(formMov.monto_capital || 0) + parseFloat(formMov.monto_interes || 0))).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Método de Pago</label>
                <select value={formMov.metodo_pago} onChange={e => setFormMov({...formMov, metodo_pago: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                  <option value="efectivo">Efectivo (Caja)</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Referencia / No. Comprobante</label>
                <input type="text" value={formMov.referencia} onChange={e => setFormMov({...formMov, referencia: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" placeholder="Ej: Recibo No. 104" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Notas</label>
                <input type="text" value={formMov.notas} onChange={e => setFormMov({...formMov, notas: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="Período correspondientes de intereses, etc." />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalPago(false)} className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => guardarMovimiento('PAGO_MIXTO')} disabled={guardando || (!formMov.monto_capital && !formMov.monto_interes)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 shadow-sm">
                {guardando ? 'Registrando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE MOVIMIENTOS */}
      {modalHistorial && acreedorActivo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Historial Financiero de Acreedor</h2>
                <p className="text-sm text-slate-500">Acreedor: <span className="font-semibold text-slate-700">{acreedorActivo.nombre}</span></p>
              </div>
              <button onClick={() => setModalHistorial(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
            </div>

            {cargandoMovs ? (
              <div className="text-center py-10 text-slate-400 font-medium">Cargando movimientos...</div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No hay movimientos registrados para este acreedor.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo Movimiento</th>
                    <th className="px-4 py-3 text-right">Abono Capital</th>
                    <th className="px-4 py-3 text-right">Pago Intereses</th>
                    <th className="px-4 py-3 text-right">Total Transacción</th>
                    <th className="px-4 py-3">Método / Ref.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {movimientos.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{new Date(m.fecha).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.tipo === 'PRESTAMO_RECIBIDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {m.tipo === 'PRESTAMO_RECIBIDO' ? 'Préstamo Recibido' : 'Pago Realizado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">{fmt(m.monto_capital)}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700">{fmt(m.monto_interes)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(m.monto_total)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <div className="capitalize font-semibold text-slate-700">{m.metodo_pago}</div>
                        {m.referencia && <div>Ref: {m.referencia}</div>}
                        {m.notas && <div className="italic text-slate-400">{m.notas}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
