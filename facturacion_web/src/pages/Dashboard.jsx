import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Users, AlertTriangle, Truck, CreditCard, ShoppingCart, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState('dia'); // dia, mes
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [resKpis, resChart] = await Promise.all([
          api.get(`/api/v1/dashboard/kpis?empresa_id=${empresaId()}&periodo=${periodo}`),
          api.get(`/api/v1/dashboard/grafico-ventas?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}`)
        ]);
        setKpis(resKpis.data);
        setChartData(resChart.data.map(d => ({ ...d, ventas: d.ventas / 100 }))); // convertir a dólares para el gráfico
      } catch (e) {
        console.error("Error al cargar KPIs", e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [periodo, anioSeleccionado]);

  const KpiCard = ({ title, value, icon: Icon, color, subValue, subLabel }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-bold mt-1 ${color}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50').replace('700', '50')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {subValue && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{subValue}</span> {subLabel}
        </div>
      )}
    </div>
  );

  if (cargando && !kpis) return <div className="p-8 text-center text-slate-400">Cargando métricas del negocio...</div>;
  if (!kpis) return <div className="p-8 text-center text-red-400">Error de conexión con el servidor</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" /> Panel de Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">Resumen operativo y financiero en tiempo real</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setPeriodo('dia')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${periodo === 'dia' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Hoy
          </button>
          <button 
            onClick={() => setPeriodo('semana')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${periodo === 'semana' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Esta Semana
          </button>
          <button 
            onClick={() => setPeriodo('mes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${periodo === 'mes' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mes Actual
          </button>
          <button 
            onClick={() => setPeriodo('anio')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${periodo === 'anio' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Este Año
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className={cargando ? 'opacity-50 pointer-events-none' : 'transition-opacity'}>
          <KpiCard 
            title={`Ventas Totales (${periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Año'})`} 
            value={fmt(kpis.ventas_totales)} 
            icon={TrendingUp} 
            color="text-emerald-600" 
            subValue="DTE" subLabel="Emitidos"
          />
        </div>
        <KpiCard 
          title="Cuentas por Cobrar" 
          value={fmt(kpis.cuentas_por_cobrar)} 
          icon={CreditCard} 
          color="text-indigo-600" 
          subValue={kpis.clientes_activos} subLabel="Clientes activos"
        />
        <KpiCard 
          title="Cuentas por Pagar" 
          value={fmt(kpis.cuentas_por_pagar)} 
          icon={ShoppingCart} 
          color="text-amber-600" 
          subValue={kpis.proveedores_activos} subLabel="Proveedores activos"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Historial de Ventas</h3>
            <p className="text-sm text-slate-500">Facturación aprobada mes a mes</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select 
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 outline-none"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Ventas']}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.ventas > 0 ? '#4f46e5' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
    </div>
  );
}
