import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Search, FileText, CheckCircle2, AlertCircle, XCircle, FileJson, Clock, UploadCloud } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('lista'); // lista | nueva | recibir
  const [error, setError] = useState('');

  // Estados para vista "nueva"
  const [proveedores, setProveedores] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [formOC, setFormOC] = useState({ proveedor_id: '', tipo_doc: 'CCF', bodega_destino_id: '', fecha_esperada_entrega: '', notas: '', detalles: [] });
  const [guardando, setGuardando] = useState(false);
  const [dteJson, setDteJson] = useState('');
  const [mostrarDte, setMostrarDte] = useState(false);

  // Estados para vista "recibir"
  const [ocActiva, setOcActiva] = useState(null);
  const [recepcion, setRecepcion] = useState({ bodega_destino_id: '', crear_cuenta_pagar: false, dias_credito: 30, detalles: [] });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resOC, resProv, resBod, resProd] = await Promise.all([
        api.get(`/api/v1/compras/ordenes-compra/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/compras/proveedores/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`)
      ]);
      setOrdenes(resOC.data);
      setProveedores(resProv.data);
      setBodegas(resBod.data);
      setProductos(resProd.data);
    } catch (e) {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const badgeEstado = (estado) => {
    const s = {
      'borrador': 'bg-slate-100 text-slate-600',
      'enviada': 'bg-blue-100 text-blue-700',
      'recibida_parcial': 'bg-amber-100 text-amber-700',
      'recibida': 'bg-emerald-100 text-emerald-700',
      'anulada': 'bg-red-100 text-red-700 line-through'
    }[estado] || 'bg-slate-100 text-slate-600';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s}`}>{estado.replace('_', ' ').toUpperCase()}</span>;
  };

  // ── ACCIONES NUEVA OC ────────────────────────────────────────────────────────

  const agregarLinea = () => {
    setFormOC({ ...formOC, detalles: [...formOC.detalles, { producto_id: '', cantidad_pedida: 1, precio_unitario: 0 }] });
  };

  const actualizarLinea = (index, campo, valor) => {
    const nuevos = [...formOC.detalles];
    nuevos[index][campo] = valor;
    setFormOC({ ...formOC, detalles: nuevos });
  };

  const removerLinea = (index) => {
    setFormOC({ ...formOC, detalles: formOC.detalles.filter((_, i) => i !== index) });
  };

  const guardarOC = async () => {
    setGuardando(true);
    try {
      const payload = {
        ...formOC,
        fecha_esperada_entrega: formOC.fecha_esperada_entrega ? new Date(formOC.fecha_esperada_entrega).toISOString() : null,
        detalles: formOC.detalles.map(d => ({ ...d, precio_unitario: Math.round(parseFloat(d.precio_unitario) * 100) }))
      };
      const res = await api.post(`/api/v1/compras/ordenes-compra/?empresa_id=${empresaId()}&usuario_id=1`, payload);
      
      if (mostrarDte && dteJson) {
        await api.post(`/api/v1/compras/ordenes-compra/${res.data.id}/importar-dte?empresa_id=${empresaId()}`, { json_dte: dteJson });
      }

      setVista('lista');
      cargarDatos();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar la orden');
    } finally {
      setGuardando(false);
    }
  };

  // ── ACCIONES RECEPCIÓN ───────────────────────────────────────────────────────

  const abrirRecepcion = (oc) => {
    setOcActiva(oc);
    setRecepcion({
      bodega_destino_id: oc.bodega_destino_id || (bodegas.find(b => b.es_principal)?.id || ''),
      crear_cuenta_pagar: false,
      dias_credito: 30,
      detalles: oc.detalles.filter(d => d.pendiente > 0).map(d => ({
        detalle_id: d.id,
        producto_nombre: d.producto_nombre,
        pendiente: d.pendiente,
        cantidad_recibida: d.pendiente
      }))
    });
    setVista('recibir');
  };

  const confirmarRecepcion = async () => {
    setGuardando(true);
    try {
      const payload = {
        empresa_id: empresaId(),
        bodega_destino_id: recepcion.bodega_destino_id,
        usuario_id: 1,
        crear_cuenta_pagar: recepcion.crear_cuenta_pagar,
        dias_credito: recepcion.dias_credito,
        detalles: recepcion.detalles.map(d => ({ detalle_id: d.detalle_id, cantidad_recibida: parseFloat(d.cantidad_recibida) }))
      };
      await api.post(`/api/v1/compras/ordenes-compra/${ocActiva.id}/recibir`, payload);
      setVista('lista');
      cargarDatos();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al recibir');
    } finally {
      setGuardando(false);
    }
  };


  if (vista === 'nueva') {
    const subtotal = formOC.detalles.reduce((acc, d) => acc + (d.cantidad_pedida * (parseFloat(d.precio_unitario) || 0)), 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-indigo-600" /> Nueva Orden de Compra
        </h1>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Proveedor</label>
              <select value={formOC.proveedor_id} onChange={e => setFormOC({...formOC, proveedor_id: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50">
                <option value="">Seleccione...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Bodega Destino</label>
              <select value={formOC.bodega_destino_id} onChange={e => setFormOC({...formOC, bodega_destino_id: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50">
                <option value="">Seleccione...</option>
                {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipo Documento</label>
              <select value={formOC.tipo_doc} onChange={e => setFormOC({...formOC, tipo_doc: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50">
                <option value="CCF">Comprobante de Crédito Fiscal (CCF)</option>
                <option value="FACTURA_CONSUMIDOR">Factura Consumidor Final</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Fecha Esperada</label>
              <input type="date" value={formOC.fecha_esperada_entrega} onChange={e => setFormOC({...formOC, fecha_esperada_entrega: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-xl bg-slate-50" />
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-sm text-indigo-600 font-medium cursor-pointer mt-4">
            <input type="checkbox" checked={mostrarDte} onChange={e => setMostrarDte(e.target.checked)} className="rounded" />
            Importar DTE (JSON) de proveedor
          </label>
          
          {mostrarDte && (
            <textarea placeholder="Pegue aquí el JSON recibido del proveedor..." value={dteJson} onChange={e => setDteJson(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-mono" />
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-slate-700 mb-4">Líneas de Detalle</h3>
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
              {formOC.detalles.map((d, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2">
                    <select value={d.producto_id} onChange={e => actualizarLinea(i, 'producto_id', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm bg-slate-50">
                      <option value="">Seleccionar...</option>
                      {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>)}
                    </select>
                  </td>
                  <td className="py-2"><input type="number" min="0.1" step="any" value={d.cantidad_pedida} onChange={e => actualizarLinea(i, 'cantidad_pedida', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm bg-slate-50" /></td>
                  <td className="py-2"><input type="number" min="0" step="0.01" value={d.precio_unitario} onChange={e => actualizarLinea(i, 'precio_unitario', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm bg-slate-50" /></td>
                  <td className="py-2 text-right text-sm font-medium text-slate-700">${((d.cantidad_pedida || 0) * (d.precio_unitario || 0)).toFixed(2)}</td>
                  <td className="py-2 text-right"><button onClick={() => removerLinea(i)} className="text-red-400 hover:text-red-600"><XCircle className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={agregarLinea} className="text-sm text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar Producto</button>
          
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>IVA (13%):</span> <span>${iva.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg text-slate-800 border-t pt-2"><span>Total:</span> <span>${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
          <button onClick={guardarOC} disabled={guardando || !formOC.proveedor_id || formOC.detalles.length === 0} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium disabled:opacity-50 flex-1">
            {guardando ? 'Guardando...' : 'Guardar Orden de Compra'}
          </button>
        </div>
      </div>
    );
  }

  if (vista === 'recibir') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Recibir Mercancía: {ocActiva.numero}
        </h1>
        <p className="text-slate-500 mb-6">Proveedor: {ocActiva.proveedor_nombre}</p>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Bodega de Destino</label>
          <select value={recepcion.bodega_destino_id} onChange={e => setRecepcion({...recepcion, bodega_destino_id: e.target.value})} className="w-full px-3 py-2 border rounded-xl bg-slate-50 mb-6">
            <option value="">Seleccionar bodega...</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>

          <table className="w-full text-left mb-6">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b">
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-right">Pendiente</th>
                <th className="pb-2 w-32 text-right">Recibir Ahora</th>
              </tr>
            </thead>
            <tbody>
              {recepcion.detalles.map((d, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-3 text-sm font-medium text-slate-800">{d.producto_nombre}</td>
                  <td className="py-3 text-right text-sm text-slate-500">{d.pendiente}</td>
                  <td className="py-3 text-right">
                    <input type="number" min="0" max={d.pendiente} step="any" value={d.cantidad_recibida} 
                      onChange={e => {
                        const nuevos = [...recepcion.detalles];
                        nuevos[i].cantidad_recibida = e.target.value;
                        setRecepcion({...recepcion, detalles: nuevos});
                      }} 
                      className="w-full px-2 py-1 border rounded-lg text-sm bg-slate-50 text-right font-bold text-emerald-700" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={recepcion.crear_cuenta_pagar} onChange={e => setRecepcion({...recepcion, crear_cuenta_pagar: e.target.checked})} className="rounded text-indigo-600" />
              Generar Cuenta por Pagar automáticamente al recibir
            </label>
            {recepcion.crear_cuenta_pagar && (
              <div className="mt-3 flex items-center gap-2 pl-6">
                <span className="text-sm text-slate-500">Días de crédito:</span>
                <input type="number" value={recepcion.dias_credito} onChange={e => setRecepcion({...recepcion, dias_credito: e.target.value})} className="w-20 px-2 py-1 border rounded-lg text-sm" />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
          <button onClick={confirmarRecepcion} disabled={guardando || !recepcion.bodega_destino_id} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium disabled:opacity-50 flex-1">
            {guardando ? 'Procesando...' : 'Confirmar Recepción en Kardex'}
          </button>
        </div>
      </div>
    );
  }

  const importarDteAutomatico = async () => {
    setGuardando(true);
    try {
      await api.post(`/api/v1/compras/ordenes-compra/desde-dte?empresa_id=${empresaId()}`, { json_dte: dteJson });
      setVista('lista');
      cargarDatos();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al procesar el JSON del DTE');
    } finally {
      setGuardando(false);
    }
  };

  if (vista === 'importar') {
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setDteJson(ev.target.result);
      };
      reader.readAsText(file);
    };

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <FileJson className="w-6 h-6 text-emerald-600" /> Importación Inteligente de DTE
        </h1>
        <p className="text-slate-500 mb-6">Sube el archivo JSON del Comprobante de Crédito Fiscal que te envió tu proveedor. El sistema creará automáticamente la orden, el proveedor y los productos si no existen.</p>
        
        <div className="bg-white p-12 rounded-2xl shadow-sm border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors mb-6 flex flex-col items-center justify-center cursor-pointer relative group">
          <input 
            type="file" 
            accept=".json,application/json" 
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Selecciona o arrastra el archivo JSON</h3>
          <p className="text-slate-500 mt-2 text-sm text-center">
            {dteJson ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1 justify-center"><CheckCircle2 className="w-4 h-4"/> ¡Archivo cargado con éxito! Listo para procesar.</span>
            ) : (
              'Solo archivos .json generados por el Ministerio de Hacienda'
            )}
          </p>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
          <button onClick={importarDteAutomatico} disabled={guardando || !dteJson} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium disabled:opacity-50 flex-1 flex items-center justify-center gap-2">
            {guardando ? 'Analizando JSON y Creando Orden...' : <><CheckCircle2 className="w-5 h-5"/> Procesar e Importar DTE</>}
          </button>
        </div>
      </div>
    );
  }

  // Vista lista (default)
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" /> Órdenes de Compra
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de abastecimiento e ingreso de inventario</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setDteJson(''); setVista('importar'); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/30">
            <FileJson className="w-4 h-4" /> Importar DTE
          </button>
          <button onClick={() => { setFormOC({ proveedor_id: '', tipo_doc: 'CCF', bodega_destino_id: '', fecha_esperada_entrega: '', notas: '', detalles: [] }); setDteJson(''); setMostrarDte(false); setVista('nueva'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30">
            <Plus className="w-4 h-4" /> Nueva Orden
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando órdenes...</div>
      ) : ordenes.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay órdenes de compra</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                <th className="px-5 py-3.5">Número</th>
                <th className="px-5 py-3.5">Proveedor</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordenes.map(oc => (
                <tr key={oc.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-800">{oc.numero}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{oc.proveedor_nombre}</td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-700">{fmt(oc.total)}</td>
                  <td className="px-5 py-4 text-center">{badgeEstado(oc.estado)}</td>
                  <td className="px-5 py-4 flex gap-2 justify-end">
                    {['borrador', 'enviada', 'recibida_parcial'].includes(oc.estado) && (
                      <button onClick={() => abrirRecepcion(oc)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
                        Recibir
                      </button>
                    )}
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
