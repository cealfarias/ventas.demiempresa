import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Search, Plus, Calendar, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

export default function Despachos() {
  const [despachos, setDespachos] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('lista'); // lista | nuevo
  
  const [form, setForm] = useState({ motorista: '', vehiculo_placa: '', fecha_programada: '', notas: '', detalles: [] });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/logistica/despachos/?empresa_id=${empresaId()}`);
      setDespachos(res.data);
      
      // Cargar facturas para asignar (en un sistema real se filtrarían las ya despachadas)
      const resF = await api.get(`/api/v1/facturacion/facturas/?empresa_id=${empresaId()}`);
      setFacturasPendientes(resF.data.filter(f => f.estado !== 'anulada'));
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const badgeEstado = (estado) => {
    const s = {
      'programado': 'bg-blue-100 text-blue-700',
      'en_transito': 'bg-amber-100 text-amber-700',
      'entregado': 'bg-emerald-100 text-emerald-700'
    }[estado] || 'bg-slate-100 text-slate-600';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s}`}>{estado.replace('_', ' ').toUpperCase()}</span>;
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.put(`/api/v1/logistica/despachos/${id}/estado?empresa_id=${empresaId()}&estado=${estado}`);
      cargar();
    } catch (e) { alert('Error al cambiar estado'); }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        ...form,
        fecha_programada: form.fecha_programada ? new Date(form.fecha_programada).toISOString() : null,
      };
      await api.post(`/api/v1/logistica/despachos/?empresa_id=${empresaId()}&usuario_id=1`, payload);
      setVista('lista');
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al programar despacho');
    } finally {
      setGuardando(false);
    }
  };

  const agregarFactura = (facturaId) => {
    if (form.detalles.find(d => d.factura_id === parseInt(facturaId))) return;
    setForm({
      ...form, 
      detalles: [...form.detalles, { factura_id: parseInt(facturaId), direccion_entrega: '' }]
    });
  };

  const removerFactura = (facturaId) => {
    setForm({
      ...form,
      detalles: form.detalles.filter(d => d.factura_id !== facturaId)
    });
  };

  if (vista === 'nuevo') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Truck className="w-6 h-6 text-indigo-600" /> Programar Despacho
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Motorista</label>
            <input value={form.motorista} onChange={e => setForm({...form, motorista: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" placeholder="Nombre conductor" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Placa Vehículo</label>
            <input value={form.vehiculo_placa} onChange={e => setForm({...form, vehiculo_placa: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" placeholder="P-000000" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Fecha Programada</label>
            <input type="datetime-local" value={form.fecha_programada} onChange={e => setForm({...form, fecha_programada: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" />
          </div>
          <div className="col-span-3">
            <label className="text-xs font-semibold text-slate-500 uppercase">Notas / Ruta</label>
            <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" rows={2} placeholder="Instrucciones de ruta..." />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-slate-400" /> Facturas a Entregar</h3>
          
          <div className="flex gap-2 mb-4">
            <select id="selFactura" className="flex-1 px-3 py-2 border rounded-xl">
              <option value="">Seleccionar factura pendiente...</option>
              {facturasPendientes.map(f => <option key={f.id} value={f.id}>{f.numero} - {f.cliente_nombre}</option>)}
            </select>
            <button onClick={() => agregarFactura(document.getElementById('selFactura').value)} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100">Agregar</button>
          </div>

          <div className="space-y-3">
            {form.detalles.map((d, i) => {
              const fac = facturasPendientes.find(f => f.id === d.factura_id);
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{fac?.numero} - {fac?.cliente_nombre}</p>
                    <input type="text" placeholder="Dirección de entrega específica..." value={d.direccion_entrega} 
                      onChange={e => { const nd = [...form.detalles]; nd[i].direccion_entrega = e.target.value; setForm({...form, detalles: nd}); }} 
                      className="w-full mt-1 px-2 py-1 text-sm border rounded bg-white" />
                  </div>
                  <button onClick={() => removerFactura(d.factura_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">Quitar</button>
                </div>
              );
            })}
            {form.detalles.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No hay facturas asignadas al despacho</p>}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2.5 rounded-xl border font-medium">Cancelar</button>
          <button onClick={guardar} disabled={guardando || form.detalles.length === 0} className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
            {guardando ? 'Programando...' : 'Programar Despacho'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Truck className="w-6 h-6 text-indigo-600" /> Control de Despachos</h1>
          <p className="text-sm text-slate-500 mt-1">Logística de entregas y seguimiento de rutas</p>
        </div>
        <button onClick={() => { setForm({ motorista: '', vehiculo_placa: '', fecha_programada: '', notas: '', detalles: [] }); setVista('nuevo'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Programar Ruta
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando logística...</div>
      ) : despachos.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay despachos programados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {despachos.map(d => (
            <div key={d.id} className="bg-white border rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800">{d.numero}</h3>
                {badgeEstado(d.estado)}
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-600 flex items-center gap-2"><Truck className="w-4 h-4 text-slate-400" /> {d.motorista || 'Sin motorista'} ({d.vehiculo_placa || 'Sin placa'})</p>
                <p className="text-sm text-slate-600 flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {d.fecha_programada ? new Date(d.fecha_programada).toLocaleDateString() : 'Sin fecha'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Entregas ({d.detalles.length})</p>
                <div className="space-y-1">
                  {d.detalles.map(det => (
                    <div key={det.id} className="text-xs text-slate-700 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span><span className="font-semibold">{det.factura_numero}:</span> {det.cliente_nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {d.estado === 'programado' && (
                  <button onClick={() => cambiarEstado(d.id, 'en_transito')} className="flex-1 py-2 bg-amber-50 text-amber-700 font-medium text-sm rounded-lg hover:bg-amber-100">Iniciar Ruta</button>
                )}
                {d.estado === 'en_transito' && (
                  <button onClick={() => cambiarEstado(d.id, 'entregado')} className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-medium text-sm rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" /> Finalizar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
