import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Search, Filter, RefreshCw, TrendingUp, TrendingDown, Warehouse, Package, AlertTriangle, Plus, X } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Existencias() {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroBodega, setFiltroBodega] = useState('');
  const [soloConStock, setSoloConStock] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    producto_id: '',
    bodega_id: '',
    tipo_movimiento: 'AJUSTE_POSITIVO',
    cantidad: '',
    costo_unitario: '',
    notas: 'Inventario Físico Inicial'
  });

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const [resS, resB, resP] = await Promise.all([
        api.get(`/api/v1/almacen/kardex/existencias?empresa_id=${empresaId()}`),
        api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`)
      ]);
      setStock(resS.data);
      setBodegas(resB.data);
      setProductos(resP.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cargar existencias');
    } finally {
      setCargando(false);
    }
  };

  const guardarAjuste = async () => {
    if (!form.producto_id || !form.bodega_id || !form.cantidad || form.cantidad <= 0) {
      return alert('Complete producto, bodega y una cantidad mayor a cero');
    }
    setGuardando(true);
    try {
      const payload = {
        empresa_id: empresaId(),
        bodega_id: parseInt(form.bodega_id),
        producto_id: parseInt(form.producto_id),
        tipo_movimiento: form.tipo_movimiento,
        cantidad: parseFloat(form.cantidad),
        costo_unitario: form.costo_unitario ? Math.round(parseFloat(form.costo_unitario) * 100) : 0,
        usuario_id: 1,
        notas: form.notas
      };
      await api.post('/api/v1/almacen/kardex/ajuste', payload);
      setModalAbierto(false);
      setForm({
        producto_id: '', bodega_id: '', tipo_movimiento: 'AJUSTE_POSITIVO',
        cantidad: '', costo_unitario: '', notas: 'Inventario Físico Inicial'
      });
      cargar(); 
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar el ajuste');
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const datosFiltrados = useMemo(() => {
    return stock.filter(s => {
      const matchBusqueda = !busqueda ||
        s.producto_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.producto_codigo.toLowerCase().includes(busqueda.toLowerCase());
      const matchBodega = !filtroBodega || s.bodega_id === parseInt(filtroBodega);
      const matchStock = !soloConStock || s.stock_actual > 0;
      return matchBusqueda && matchBodega && matchStock;
    });
  }, [stock, busqueda, filtroBodega, soloConStock]);

  const kpis = useMemo(() => {
    const totalProductos = new Set(stock.map(s => s.producto_id)).size;
    const totalBodegas = new Set(stock.map(s => s.bodega_id)).size;
    const valorTotal = stock.reduce((acc, s) => acc + s.valor_total, 0);
    const sinStock = stock.filter(s => s.stock_actual <= 0).length;
    return { totalProductos, totalBodegas, valorTotal, sinStock };
  }, [stock]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Existencias en Tiempo Real
          </h1>
          <p className="text-sm text-slate-500 mt-1">Stock actual por producto y bodega con valorización al costo promedio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalAbierto(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm text-white transition-colors">
            <Plus className="w-4 h-4" /> Ajuste Manual
          </button>
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Productos con registro', valor: kpis.totalProductos, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Bodegas con stock', valor: kpis.totalBodegas, icon: Warehouse, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Valor total inventario', valor: fmt(kpis.valorTotal), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Registros sin stock', valor: kpis.sinStock, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center mb-2`}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{kpi.valor}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Barra de filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filtroBodega}
          onChange={e => setFiltroBodega(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las bodegas</option>
          {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloConStock}
            onChange={e => setSoloConStock(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          Solo con existencias
        </label>
      </div>
      {/* Tabla de existencias */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando existencias...</div>
      ) : datosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm">Ajusta los filtros o registra movimientos de inventario</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-5 py-3.5">Código</th>
                  <th className="px-5 py-3.5">Producto</th>
                  <th className="px-5 py-3.5">Bodega</th>
                  <th className="px-5 py-3.5 text-right">Existencia</th>
                  <th className="px-5 py-3.5 text-right">Costo Unit.</th>
                  <th className="px-5 py-3.5 text-right">Valor Total</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datosFiltrados.map((s, i) => {
                  const stockCritico = s.stock_actual <= 0;
                  const stockBajo = s.stock_actual > 0 && s.stock_actual <= 5;
                  return (
                    <tr 
                      key={i} 
                      onClick={() => navigate('/kardex', { state: { producto_id: s.producto_id } })}
                      className="hover:bg-indigo-50/80 transition-colors cursor-pointer"
                      title="Haz clic para ver el Kardex de este producto"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {s.producto_codigo}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-800">{s.producto_nombre}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" /> {s.bodega_nombre}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-bold ${stockCritico ? 'text-red-600' : stockBajo ? 'text-amber-600' : 'text-slate-800'}`}>
                          {s.stock_actual.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-600">{fmt(s.costo_promedio)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-bold text-emerald-700">{fmt(s.valor_total)}</td>
                      <td className="px-5 py-3.5 text-center">
                        {stockCritico ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                            Sin stock
                          </span>
                        ) : stockBajo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                            Stock bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totales */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-sm">
                  <td colSpan={5} className="px-5 py-3.5 text-slate-600">
                    {datosFiltrados.length} registros
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-700">
                    {fmt(datosFiltrados.reduce((acc, s) => acc + s.valor_total, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ajuste */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Ajuste Manual de Inventario
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
                  <select 
                    value={form.producto_id} 
                    onChange={e => setForm({...form, producto_id: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Seleccione un producto</option>
                    {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.codigo} - {p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bodega</label>
                  <select 
                    value={form.bodega_id} 
                    onChange={e => setForm({...form, bodega_id: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Seleccione bodega</option>
                    {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Movimiento</label>
                  <select 
                    value={form.tipo_movimiento} 
                    onChange={e => setForm({...form, tipo_movimiento: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="AJUSTE_POSITIVO">Entrada (Positivo)</option>
                    <option value="AJUSTE_NEGATIVO">Salida (Negativo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                  <input 
                    type="number" min="0" step="0.01"
                    value={form.cantidad} 
                    onChange={e => setForm({...form, cantidad: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Unitario ($)</label>
                  <input 
                    type="number" min="0" step="0.01" placeholder="Ej: 15.50"
                    value={form.costo_unitario} 
                    onChange={e => setForm({...form, costo_unitario: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas / Justificación</label>
                  <input 
                    type="text" 
                    value={form.notas} 
                    onChange={e => setForm({...form, notas: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarAjuste}
                disabled={guardando}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Guardar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
