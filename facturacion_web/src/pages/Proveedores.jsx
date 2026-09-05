import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Plus, Edit2, Search, Building2, Phone, Mail, CreditCard, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

const FORM_VACIO = {
  codigo: '', nombre: '', nombre_comercial: '', nit: '', nrc: '',
  es_gran_contribuyente: false, email: '', telefono: '', direccion: '',
  contacto_nombre: '', contacto_telefono: '', limite_credito: '', saldo_inicial: ''
};

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const res = await api.get(`/api/v1/compras/proveedores/?empresa_id=${empresaId()}&solo_activos=false`);
      setProveedores(res.data);
    } catch { setError('No se pudieron cargar los proveedores.'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return proveedores.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.nit || '').includes(q) ||
      (p.codigo || '').toLowerCase().includes(q)
    );
  }, [proveedores, busqueda]);

  const abrirNuevo = () => { setEditando(null); setForm(FORM_VACIO); setModalAbierto(true); };
  const abrirEditar = (p) => {
    setEditando(p);
    setForm({ 
      ...FORM_VACIO, ...p, 
      limite_credito: p.limite_credito ? (p.limite_credito / 100).toFixed(2) : '',
      saldo_inicial: p.saldo_inicial ? (p.saldo_inicial / 100).toFixed(2) : ''
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
        await api.put(`/api/v1/compras/proveedores/${editando.id}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/compras/proveedores/?empresa_id=${empresaId()}`, payload);
      }
      setModalAbierto(false); cargar();
    } catch (e) { alert(e.response?.data?.detail || 'Error al guardar.'); }
    finally { setGuardando(false); }
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  );
  const Input = (props) => (
    <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" /> Proveedores
          </h1>
          <p className="text-sm text-slate-500 mt-1">Directorio de proveedores y sus condiciones comerciales</p>
        </div>
        <button onClick={abrirNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3 text-red-700 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}

      {/* Búsqueda */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, NIT o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando proveedores...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin proveedores registrados</p>
          <p className="text-sm">Agrega tu primer proveedor para comenzar a gestionar compras</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Proveedor</th>
                <th className="px-5 py-3.5">NIT / NRC</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5 text-right">Lím. Crédito</th>
                <th className="px-5 py-3.5 text-right">Saldo</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-100 uppercase">
                        {p.nombre.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{p.nombre}</p>
                        {p.nombre_comercial && <p className="text-xs text-slate-500">{p.nombre_comercial}</p>}
                        {p.es_gran_contribuyente && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">GRAN CONTRIBUYENTE</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-600">{p.nit || '—'}</p>
                    <p className="text-xs text-slate-400">{p.nrc ? `NRC: ${p.nrc}` : ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    {p.email && <p className="text-sm text-slate-600 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{p.email}</p>}
                    {p.telefono && <p className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.telefono}</p>}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-slate-600">{p.limite_credito > 0 ? fmt(p.limite_credito) : '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-sm font-bold ${p.saldo_pendiente > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {p.saldo_pendiente > 0 ? fmt(p.saldo_pendiente) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {p.activo
                      ? <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold border border-emerald-200"><CheckCircle2 className="w-3 h-3" />Activo</span>
                      : <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-semibold"><XCircle className="w-3 h-3" />Inactivo</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => abrirEditar(p)} className="text-sm text-indigo-600 hover:bg-indigo-50 font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              {editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Código">
                  <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} placeholder="PROV-01" />
                </Field>
                <div className="col-span-2">
                  <Field label="Razón Social *">
                    <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Empresa Proveedora S.A." />
                  </Field>
                </div>
              </div>
              <Field label="Nombre Comercial">
                <Input value={form.nombre_comercial} onChange={e => setForm(f => ({ ...f, nombre_comercial: e.target.value }))} placeholder="Nombre con el que opera" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="NIT"><Input value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} placeholder="0000-000000-000-0" /></Field>
                <Field label="NRC"><Input value={form.nrc} onChange={e => setForm(f => ({ ...f, nrc: e.target.value }))} placeholder="000000-0" /></Field>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50 transition-colors">
                <input type="checkbox" checked={form.es_gran_contribuyente} onChange={e => setForm(f => ({ ...f, es_gran_contribuyente: e.target.checked }))} className="w-4 h-4 text-amber-500 rounded" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Gran Contribuyente</p>
                  <p className="text-xs text-slate-500">Afecta el tipo de documento (CCF obligatorio)</p>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="facturacion@proveedor.com" /></Field>
                <Field label="Teléfono"><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="2222-3333" /></Field>
              </div>
              <Field label="Dirección">
                <textarea value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Dirección completa..." rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </Field>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Persona de Contacto</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre"><Input value={form.contacto_nombre} onChange={e => setForm(f => ({ ...f, contacto_nombre: e.target.value }))} placeholder="Juan Pérez" /></Field>
                  <Field label="Teléfono"><Input value={form.contacto_telefono} onChange={e => setForm(f => ({ ...f, contacto_telefono: e.target.value }))} placeholder="7777-8888" /></Field>
                </div>
              </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <Field label="Límite de Crédito (USD)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={form.limite_credito}
                        onChange={e => setForm(f => ({ ...f, limite_credito: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </Field>
                  <Field label="Saldo Inicial (USD)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={form.saldo_inicial}
                        onChange={e => setForm(f => ({ ...f, saldo_inicial: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </Field>
                </div>
              {editando && (
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
                  Proveedor activo
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !form.nombre.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50">
                {guardando ? 'Guardando...' : (editando ? 'Guardar Cambios' : 'Crear Proveedor')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
