import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Users, AlertTriangle, Truck, CreditCard, ShoppingCart } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState('dia'); // dia, mes, historico

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await api.get(`/api/v1/dashboard/kpis?empresa_id=${empresaId()}&periodo=${periodo}`);
        setKpis(res.data);
      } catch (e) {
        console.error("Error al cargar KPIs", e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [periodo]);

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
            onClick={() => setPeriodo('mes')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${periodo === 'mes' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mes Actual
          </button>
          <button 
            onClick={() => setPeriodo('historico')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${periodo === 'historico' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Histórico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className={cargando ? 'opacity-50 pointer-events-none' : 'transition-opacity'}>
          <KpiCard 
            title={`Ventas Totales (${periodo === 'dia' ? 'Hoy' : periodo === 'mes' ? 'Mes' : 'Histórico'})`} 
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
