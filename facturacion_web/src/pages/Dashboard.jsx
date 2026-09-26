import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Users, AlertTriangle, Truck, CreditCard, ShoppingCart, Calendar, ChevronDown, ChevronUp, Package, Store, Warehouse, Filter } from 'lucide-react';
import { api } from '../services/api';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [topProductos, setTopProductos] = useState([]);
  const [sortField, setSortField] = useState('total');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [periodo, setPeriodo] = useState('dia'); // dia, semana, mes, anio
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [error, setError] = useState(null);

  // Filtros de Bodega y Caja
  const [bodegas, setBodegas] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [ventasPorBodega, setVentasPorBodega] = useState([]);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState('');
  const [cajaSeleccionada, setCajaSeleccionada] = useState('');

  // Cargar lista de bodegas y cajas al montar
  useEffect(() => {
    const cargarListas = async () => {
      try {
        const [resBodegas, resCajas] = await Promise.all([
          api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`).catch(() => api.get(`/api/v1/bodegas/?empresa_id=${empresaId()}`)),
          api.get(`/api/v1/cajas/?empresa_id=${empresaId()}`).catch(() => ({ data: [] }))
        ]);
        setBodegas(resBodegas.data || []);
        setCajas(resCajas.data || []);
      } catch (e) {
        console.error("Error al cargar bodegas o cajas:", e);
      }
    };
    cargarListas();
  }, []);

  // Cargar métricas al cambiar periodo, anio, bodegaSeleccionada o cajaSeleccionada
  useEffect(() => {
    const cargarMetrics = async () => {
      setCargando(true);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        let params = `empresa_id=${empresaId()}&periodo=${periodo}&tz=${tz}`;
        if (bodegaSeleccionada) params += `&bodega_id=${bodegaSeleccionada}`;
        if (cajaSeleccionada) params += `&caja_id=${cajaSeleccionada}`;

        let chartParams = `empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}&tz=${tz}`;
        if (bodegaSeleccionada) chartParams += `&bodega_id=${bodegaSeleccionada}`;
        if (cajaSeleccionada) chartParams += `&caja_id=${cajaSeleccionada}`;

        const [resKpis, resChart, resTop, resVentasBod] = await Promise.all([
          api.get(`/api/v1/dashboard/kpis?${params}`),
          api.get(`/api/v1/dashboard/grafico-ventas?${chartParams}`).catch(() => ({ data: [] })),
          api.get(`/api/v1/dashboard/top-productos?${chartParams}`).catch(() => ({ data: [] })),
          api.get(`/api/v1/dashboard/ventas-por-bodega?empresa_id=${empresaId()}&periodo=${periodo}&tz=${tz}`).catch(() => ({ data: [] }))
        ]);

        setKpis(resKpis.data);
        setChartData((resChart.data || []).map(d => ({ ...d, ventas: d.ventas / 100, compras: d.compras / 100 })));
        setTopProductos(resTop.data || []);
        setVentasPorBodega(resVentasBod.data || []);
        setCurrentPage(1);
      } catch (e) {
        console.error("Error al cargar KPIs", e);
        setError('Error al cargar métricas del servidor');
      } finally {
        setCargando(false);
      }
    };
    cargarMetrics();
  }, [periodo, anioSeleccionado, bodegaSeleccionada, cajaSeleccionada]);

  // Al cambiar la bodega seleccionada, limpiar caja si no pertenece
  const handleBodegaChange = (bId) => {
    setBodegaSeleccionada(bId);
    if (!bId) {
      setCajaSeleccionada('');
    } else {
      const cajaPertenece = cajas.find(c => c.id.toString() === cajaSeleccionada.toString() && c.bodega_id?.toString() === bId.toString());
      if (!cajaPertenece) {
        setCajaSeleccionada('');
      }
    }
  };

  const cajasFiltradas = bodegaSeleccionada 
    ? cajas.filter(c => c.bodega_id?.toString() === bodegaSeleccionada.toString()) 
    : cajas;

  const KpiCard = ({ title, value, icon: Icon, color, subValue, subLabel, borderAccent = "border-indigo-500", bgIcon = "bg-indigo-50 text-indigo-600" }) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group border-t-4 ${borderAccent}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-extrabold mt-1 tracking-tight ${color}`}>{value}</h3>
        </div>
        <div className={`p-3.5 rounded-xl shadow-xs transition-transform group-hover:scale-110 ${bgIcon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {subValue && (
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{subValue}</span> {subLabel}
        </div>
      )}
    </div>
  );

  if (cargando && !kpis) return <div className="p-8 text-center text-slate-400">Cargando métricas del negocio...</div>;
  if (!kpis) return <div className="p-8 text-center text-red-400">Error de conexión con el servidor</div>;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedProductos = [...topProductos].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const totalPages = Math.ceil(sortedProductos.length / 10);
  const currentProductos = sortedProductos.slice((currentPage - 1) * 10, currentPage * 10);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header & Main Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" /> Panel de Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">Resumen operativo y financiero en tiempo real</p>
        </div>
        
        {/* Filtros de Bodega, Caja y Tiempo */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Selector de Bodega */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700">
            <Warehouse className="w-4 h-4 text-indigo-600" />
            <select
              value={bodegaSeleccionada}
              onChange={(e) => handleBodegaChange(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-semibold text-slate-800"
            >
              <option value="">Todas las Bodegas</option>
              {bodegas.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nombre} {b.es_principal ? '(Principal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Caja */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700">
            <Store className="w-4 h-4 text-emerald-600" />
            <select
              value={cajaSeleccionada}
              onChange={(e) => setCajaSeleccionada(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-semibold text-slate-800"
            >
              <option value="">Todas las Cajas</option>
              {cajasFiltradas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Tiempo */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setPeriodo('dia')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === 'dia' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hoy
            </button>
            <button 
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === 'semana' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === 'mes' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mes
            </button>
            <button 
              onClick={() => setPeriodo('anio')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === 'anio' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Año
            </button>
          </div>
        </div>
      </div>

      {/* Sección Desglose por Bodega */}
      {ventasPorBodega.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-600" /> Desglose de Ventas por Bodega
              </h2>
              <p className="text-xs text-slate-500">
                Ventas acumuladas {periodo === 'dia' ? 'de Hoy' : periodo === 'semana' ? 'de esta Semana' : periodo === 'mes' ? 'del Mes Actual' : 'de Este Año'}
              </p>
            </div>
            {bodegaSeleccionada && (
              <button
                onClick={() => handleBodegaChange('')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-all flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" /> Ver Todas las Bodegas
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ventasPorBodega.map((b) => {
              const esSeleccionada = bodegaSeleccionada.toString() === b.bodega_id.toString();
              return (
                <div
                  key={b.bodega_id}
                  onClick={() => handleBodegaChange(esSeleccionada ? '' : b.bodega_id.toString())}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all relative overflow-hidden bg-white hover:shadow-md ${
                    esSeleccionada
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-800 text-base">{b.bodega_nombre}</h3>
                        {b.es_principal && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Cód: {b.codigo} • {b.cajas_count} {b.cajas_count === 1 ? 'caja' : 'cajas'}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${esSeleccionada ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Store className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Total Vendido</p>
                      <p className="text-xl font-extrabold text-emerald-600 tracking-tight">{fmt(b.ventas_totales)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {b.cantidad_ventas} {b.cantidad_ventas === 1 ? 'factura' : 'facturas'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={cargando ? 'opacity-50 pointer-events-none' : 'transition-opacity'}>
          <KpiCard 
            title={`Ventas Totales (${periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Año'})`} 
            value={fmt(kpis.ventas_totales)} 
            icon={TrendingUp} 
            color="text-emerald-600" 
            borderAccent="border-emerald-500"
            bgIcon="bg-emerald-50 text-emerald-600"
            subValue="DTE" subLabel="Emitidos"
          />
        </div>
        <div className={cargando ? 'opacity-50 pointer-events-none' : 'transition-opacity'}>
          <KpiCard 
            title={`Compras Totales (${periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Año'})`} 
            value={fmt(kpis.compras_totales || 0)} 
            icon={Package} 
            color="text-indigo-600" 
            borderAccent="border-indigo-500"
            bgIcon="bg-indigo-50 text-indigo-600"
            subValue="Kardex" subLabel="Entradas"
          />
        </div>
        <KpiCard 
          title="Cuentas por Cobrar" 
          value={fmt(kpis.cuentas_por_cobrar)} 
          icon={CreditCard} 
          color="text-violet-600" 
          borderAccent="border-violet-500"
          bgIcon="bg-violet-50 text-violet-600"
          subValue={kpis.clientes_activos} subLabel="Clientes activos"
        />
        <KpiCard 
          title="Cuentas por Pagar" 
          value={fmt(kpis.cuentas_por_pagar)} 
          icon={ShoppingCart} 
          color="text-amber-600" 
          borderAccent="border-amber-500"
          bgIcon="bg-amber-50 text-amber-600"
          subValue={kpis.proveedores_activos} subLabel="Proveedores activos"
        />
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Historial de Ventas y Compras</h3>
            <p className="text-sm text-slate-500">Comparativa de ingresos y abastecimiento</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select 
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 outline-none cursor-pointer"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                formatter={(value, name) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="ventas" name="ventas" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.ventas > 0 ? '#4f46e5' : '#e2e8f0'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="compras" name="compras" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas y Logística */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 rounded-2xl text-red-500">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Alertas de Inventario</h3>
            <p className="text-sm text-slate-600 mt-1">
              Tienes <span className="font-bold text-red-600">{kpis.productos_bajo_stock} productos</span> con stock crítico (menos de 10 unidades).
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-500">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Logística</h3>
            <p className="text-sm text-slate-600 mt-1">
              Las rutas de despacho están listas para revisión en el módulo de <a href="/despachos" className="text-blue-600 font-bold hover:underline">Logística y Despachos</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Top Productos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" /> Estadísticas de Productos Vendidos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Top de ventas {periodo === 'dia' ? 'de Hoy' : periodo === 'semana' ? 'de esta Semana' : periodo === 'mes' ? 'del Mes Actual' : 'de Este Año'}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50" onClick={() => handleSort('producto')}>
                  <div className="flex items-center gap-1">Producto <SortIcon field="producto" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 text-right" onClick={() => handleSort('cantidad')}>
                  <div className="flex items-center justify-end gap-1">Cantidad <SortIcon field="cantidad" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 text-right" onClick={() => handleSort('precio_promedio')}>
                  <div className="flex items-center justify-end gap-1">Valor Unitario <SortIcon field="precio_promedio" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 text-right" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end gap-1">Precio Total <SortIcon field="total" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentProductos.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No hay ventas en este período</td></tr>
              ) : (
                currentProductos.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-700">{p.producto}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{p.cantidad}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{fmt(p.precio_promedio)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{fmt(p.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, topProductos.length)} de {topProductos.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-white bg-slate-100 text-slate-600">Anterior</button>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-white bg-slate-100 text-slate-600">Siguiente</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
