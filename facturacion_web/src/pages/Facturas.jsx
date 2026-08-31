import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, FileText, CheckCircle2, DollarSign, XCircle, FileOutput } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Facturas() {
  
  useEffect(() => {
    const isFirstTime = localStorage.getItem('avatar_facturas_done') !== 'true';
    if (isFirstTime) {
      localStorage.setItem('avatar_facturas_done', 'true');
      
      window.dispatchEvent(new CustomEvent('avatar:say', {
        detail: {
          text: '¡Estás en la pantalla de Facturas! Aquí se registrarán todas tus ventas.',
          highlightId: 'table-facturas',
          options: []
        }
      }));
      
      setTimeout(() => {
        if (window.location.pathname !== '/facturas') return;
        window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: 'Para generar una nueva factura o comprobante de crédito fiscal, debes hacer clic en el botón "Emitir Factura".',
            highlightId: 'btn-emitir-factura',
            options: []
          }
        }));
      }, 7000);
      
      setTimeout(() => {
        if (window.location.pathname !== '/facturas') return;
        window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: 'Una vez emitida, podrás presionar "Transmitir MH" para enviarla inmediatamente al Ministerio de Hacienda, y el PDF se habilitará cuando sea aprobada.',
            highlightId: null,
            options: [{ label: '¡Entendido!', action: null }]
          }
        }));
      }, 15000);
    }
  }, []);

  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('lista'); // lista | nueva

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  
  const [form, setForm] = useState({ cliente_id: '', bodega_salida_id: '', tipo_doc: 'FACTURA', condicion_operacion: 'CONTADO', dias_credito: 30, items: [] });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [resF, resC, resP, resB] = await Promise.all([
        api.get(`/api/v1/facturacion/facturas/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/facturacion/clientes/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`)
      ]);
      setFacturas(resF.data);
      setClientes(resC.data);
      setProductos(resP.data);
      setBodegas(resB.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const agregarLinea = () => setForm({ ...form, items: [...form.items, { producto_id: '', cantidad: 1, precio_unitario: 0 }] });
  const actualizarLinea = (idx, campo, val) => {
    const nuevos = [...form.items];
    nuevos[idx][campo] = val;
    setForm({ ...form, items: nuevos });
  };
  const eliminarLinea = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        ...form,
        subtotal: subtotal,
        iva: iva,
        total: total,
        items: form.items.map(i => ({ ...i, precio_unitario: Math.round(parseFloat(i.precio_unitario) * 100), subtotal: Math.round(i.cantidad * parseFloat(i.precio_unitario) * 100) }))
      };
      await api.post(`/api/v1/facturacion/facturas/?empresa_id=${empresaId()}&usuario_id=1`, payload);
      setVista('lista');
      cargar();
    } catch (e) { alert(e.response?.data?.detail || 'Error al emitir factura'); }
    finally { setGuardando(false); }
  };

  const subtotal = form.items.reduce((acc, i) => acc + (i.cantidad * (parseFloat(i.precio_unitario) || 0) * 100), 0);
  const iva = form.tipo_doc === 'CCF' ? Math.round(subtotal * 0.13) : 0; // Simplificado para DTE
  const total = subtotal + iva;

  if (vista === 'nueva') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-indigo-600" /> Emitir Factura
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Cliente</label>
              <select value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="">Seleccione...</option>
                {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipo Documento DTE</label>
              <select value={form.tipo_doc} onChange={e => setForm({...form, tipo_doc: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="FACTURA">Factura Consumidor Final</option>
                <option value="CCF">Comprobante de Crédito Fiscal (CCF)</option>
                <option value="EXPORTACION">Factura de Exportación</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Bodega de Salida (Inventario)</label>
              <select value={form.bodega_salida_id} onChange={e => setForm({...form, bodega_salida_id: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="">(Sin descontar inventario)</option>
                {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Condición de Operación</label>
              <select value={form.condicion_operacion} onChange={e => setForm({...form, condicion_operacion: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl">
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Crédito (Generar CxC)</option>
              </select>
            </div>
          </div>
          {form.condicion_operacion === 'CREDITO' && (
            <div className="w-1/4">
              <label className="text-xs font-semibold text-slate-500 uppercase">Plazo Crédito (Días)</label>
              <input type="number" value={form.dias_credito} onChange={e => setForm({...form, dias_credito: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl" />
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
          <h3 className="font-bold text-slate-700 mb-4">Líneas de Venta</h3>
          <table className="w-full text-left mb-4">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b">
                <th className="pb-2">Producto</th>
                <th className="pb-2 w-24">Cantidad</th>
                <th className="pb-2 w-32">Precio (USD)</th>
                <th className="pb-2 w-32 text-right">Subtotal</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">
                    <select value={it.producto_id} onChange={e => actualizarLinea(i, 'producto_id', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg">
                      <option value="">Seleccionar...</option>
                      {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>)}
                    </select>
                  </td>
                  <td className="py-2"><input type="number" min="0.1" step="any" value={it.cantidad} onChange={e => actualizarLinea(i, 'cantidad', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" /></td>
                  <td className="py-2"><input type="number" min="0" step="0.01" value={it.precio_unitario} onChange={e => actualizarLinea(i, 'precio_unitario', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg" /></td>
                  <td className="py-2 text-right text-sm font-medium">${((it.cantidad || 0) * (it.precio_unitario || 0)).toFixed(2)}</td>
                  <td className="py-2 text-right"><button onClick={() => eliminarLinea(i)} className="text-red-400"><XCircle className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={agregarLinea} className="text-sm text-indigo-600 font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar Producto</button>
          
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal:</span> <span>${(subtotal/100).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>IVA:</span> <span>${(iva/100).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span> <span>${(total/100).toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2.5 rounded-xl border font-medium">Cancelar</button>
          <button onClick={guardar} disabled={guardando || !form.cliente_id || form.items.length === 0} className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
            {guardando ? 'Emitiendo...' : 'Emitir Factura'}
          </button>
        </div>
      </div>
    );
  }

  const transmitirMH = async (id) => {
    try {
      await api.post(`/api/v1/facturacion/dte/transmitir/${id}?empresa_id=${empresaId()}`);
      alert('DTE transmitido y aceptado exitosamente por el MH.');
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al transmitir DTE al Ministerio de Hacienda');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Receipt className="w-6 h-6 text-indigo-600" /> Facturas DTE</h1>
          <p className="text-sm text-slate-500 mt-1">Historial de ventas y documentos tributarios</p>
        </div>
        <button id="btn-emitir-factura" onClick={() => { setForm({ cliente_id: '', bodega_salida_id: '', tipo_doc: 'FACTURA', condicion_operacion: 'CONTADO', dias_credito: 30, items: [] }); setVista('nueva'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 relative z-0">
          <Plus className="w-4 h-4" /> Emitir Factura
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando facturas...</div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay facturas emitidas</p>
        </div>
      ) : (
        <div id="table-facturas" className="bg-white border rounded-2xl overflow-hidden shadow-sm relative z-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Número</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Documento</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">MH Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facturas.map(f => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-800">{f.numero}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{f.cliente_nombre}</td>
                  <td className="px-5 py-4 text-sm">
                    <div>{f.tipo_doc}</div>
                    <div className="text-xs text-slate-400">{f.condicion_operacion}</div>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-700">{fmt(f.total)}</td>
                  <td className="px-5 py-4 text-center">
                    {f.estado_dte === 'procesado' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Aprobado</span>
                    ) : f.estado_dte === 'rechazado' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Rechazado</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pendiente DTE</span>
                    )}
                  </td>
                  <td className="px-5 py-4 flex justify-end gap-2">
                    {f.estado_dte !== 'procesado' && (
                      <button onClick={() => transmitirMH(f.id)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium">Transmitir MH</button>
                    )}
                    <a href={`http://localhost:8001/api/v1/facturacion/facturas/${f.id}/imprimir?empresa_id=${empresaId()}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 inline-flex items-center p-1"><FileOutput className="w-4 h-4" /></a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
