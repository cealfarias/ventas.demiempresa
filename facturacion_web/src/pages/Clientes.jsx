import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Edit2, Search, Building2, Phone, Mail, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

const FORM_VACIO = {
  codigo: '', nombre: '', nombre_comercial: '', nit: '', nrc: '', dui: '',
  email: '', telefono: '', direccion: '', es_gran_contribuyente: false,
  actividad_economica_cod: '', limite_credito: '', saldo_inicial: ''
};

const Field = ({ label, children }) => <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>{children}</div>;
const Input = (props) => <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  
  const [paginaActiva, setPaginaActiva] = useState(1);
  const [soloConSaldo, setSoloConSaldo] = useState(true);
  const ITEMS_POR_PAGINA = 15;

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/facturacion/clientes/?empresa_id=${empresaId()}&solo_activos=false`);
      setClientes(res.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return clientes.filter(c => {
      if (soloConSaldo && (c.saldo_pendiente || 0) <= 0) return false;
      return c.nombre.toLowerCase().includes(q) ||
             (c.nit || '').includes(q) ||
             (c.dui || '').includes(q);
    });
  }, [clientes, busqueda, soloConSaldo]);

  const totalPaginas = Math.ceil(filtrados.length / ITEMS_POR_PAGINA);
  const clientesPaginados = filtrados.slice((paginaActiva - 1) * ITEMS_POR_PAGINA, paginaActiva * ITEMS_POR_PAGINA);

  const abrirNuevo = () => { setEditando(null); setForm(FORM_VACIO); setModalAbierto(true); };
  const abrirEditar = (c) => {
    setEditando(c);
    setForm({ 
      ...FORM_VACIO, ...c, 
      limite_credito: c.limite_credito ? (c.limite_credito / 100).toFixed(2) : '',
      saldo_inicial: c.saldo_inicial ? (c.saldo_inicial / 100).toFixed(2) : ''
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      const payload = {
        ...form,
        limite_credito: form.limite_credito ? Math.round(parseFloat(form.limite_credito) * 100) : 0,
        saldo_inicial: form.saldo_inicial ? Math.round(parseFloat(form.saldo_inicial) * 100) : 0
      };
      if (editando) {
        await api.put(`/api/v1/facturacion/clientes/${editando.id_cliente}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/facturacion/clientes/?empresa_id=${empresaId()}`, payload);
      }
      setModalAbierto(false); cargar();
    } catch (e) { alert(e.response?.data?.detail || 'Error al guardar.'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Directorio de clientes para facturación electrónica DTE</p>
        </div>
        <button onClick={abrirNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, NIT o DUI..." value={busqueda} onChange={e => {setBusqueda(e.target.value); setPaginaActiva(1);}}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer bg-white px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <input type="checkbox" checked={soloConSaldo} onChange={e => {setSoloConSaldo(e.target.checked); setPaginaActiva(1);}} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
          Solo con saldo pendiente
        </label>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando clientes...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin clientes registrados</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Identificación</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5 text-right">Límite / Saldo</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesPaginados.map(c => (
                <tr key={c.id_cliente} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800 text-sm">{c.nombre}</p>
                    {c.nombre_comercial && <p className="text-xs text-slate-500">{c.nombre_comercial}</p>}
                    {c.es_gran_contribuyente && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md mt-1 inline-block">GRAN CONTRIBUYENTE</span>}
                    {c.es_predeterminado && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md mt-1 ml-1 inline-block">PREDETERMINADO</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {c.nit && <div>NIT: {c.nit}</div>}
                    {c.nrc && <div className="text-xs text-slate-400">NRC: {c.nrc}</div>}
                    {c.dui && <div>DUI: {c.dui}</div>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {c.email && <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {c.email}</div>}
                    {c.telefono && <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.telefono}</div>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-xs text-slate-400">Lím: {c.limite_credito > 0 ? fmt(c.limite_credito) : '—'}</div>
                    <div className={`text-sm font-bold ${c.saldo_pendiente > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
                      Saldo: {c.saldo_pendiente > 0 ? fmt(c.saldo_pendiente) : '$0.00'}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {c.activo ? <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold">Activo</span> : <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold">Inactivo</span>}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => abrirEditar(c)} className="text-sm text-indigo-600 hover:bg-indigo-50 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPaginas > 1 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-500">
                Mostrando {(paginaActiva - 1) * ITEMS_POR_PAGINA + 1} al {Math.min(paginaActiva * ITEMS_POR_PAGINA, filtrados.length)} de {filtrados.length} clientes
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setPaginaActiva(p => Math.max(1, p - 1))} 
                  disabled={paginaActiva === 1}
                  className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setPaginaActiva(p => Math.min(totalPaginas, p + 1))} 
                  disabled={paginaActiva === totalPaginas}
                  className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            
            <div className="space-y-4">
              <Field label="Nombre / Razón Social *"><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></Field>
              <Field label="Nombre Comercial"><Input value={form.nombre_comercial} onChange={e => setForm({...form, nombre_comercial: e.target.value})} /></Field>
              
              <div className="grid grid-cols-3 gap-3">
                <Field label="NIT"><Input value={form.nit} onChange={e => setForm({...form, nit: e.target.value})} /></Field>
                <Field label="NRC"><Input value={form.nrc} onChange={e => setForm({...form, nrc: e.target.value})} /></Field>
                <Field label="DUI"><Input value={form.dui} onChange={e => setForm({...form, dui: e.target.value})} /></Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
                <Field label="Teléfono"><Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></Field>
              </div>

              <Field label="Dirección"><textarea value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" rows={2} /></Field>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border">
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                  <input type="checkbox" checked={form.es_gran_contribuyente} onChange={e => setForm({...form, es_gran_contribuyente: e.target.checked})} className="rounded text-indigo-600" />
                  Gran Contribuyente
                </label>
                <Field label="Actividad Económica (CAT-019)"><Input value={form.actividad_economica_cod} onChange={e => setForm({...form, actividad_economica_cod: e.target.value})} placeholder="Ej: 62010" /></Field>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <Field label="Límite de Crédito (USD)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input type="number" min="0" step="0.01" value={form.limite_credito} onChange={e => setForm({...form, limite_credito: e.target.value})} className="w-full pl-6 pr-3 py-2 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                </Field>
                <Field label="Saldo Inicial (USD)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input type="number" min="0" step="0.01" value={form.saldo_inicial} onChange={e => setForm({...form, saldo_inicial: e.target.value})} className="w-full pl-6 pr-3 py-2 bg-slate-50 border rounded-xl text-sm" />
                  </div>
                </Field>
              </div>

              {editando && (
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} className="rounded text-indigo-600" />
                  Cliente activo
                </label>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2.5 border rounded-xl">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !form.nombre.trim()} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
