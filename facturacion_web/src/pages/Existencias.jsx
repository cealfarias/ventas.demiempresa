import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Search, Filter, RefreshCw, TrendingUp, TrendingDown, Warehouse, Package, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Existencias() {
  const [stock, setStock] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroBodega, setFiltroBodega] = useState('');
  const [soloConStock, setSoloConStock] = useState(false);
  const [vista, setVista] = useState('tabla'); // tabla | tarjetas

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const [resStock, resBodegas] = await Promise.all([
        api.get(`/api/v1/almacen/kardex/existencias?empresa_id=${empresaId()}`),
        api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`)
      ]);
      setStock(resStock.data);
      setBodegas(resBodegas.data);
    } catch {
      setError('No se pudieron cargar las existencias.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Filtrado local
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

  // KPIs
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
        <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
        </button>
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
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
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
    </div>
  );
}
