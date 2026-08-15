import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, Users, Settings, LogOut, Menu } from 'lucide-react';
import Productos from './pages/Productos';

// Paginas Placeholder
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Panel de Control</h1></div>;
const Facturas = () => <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Módulo de Facturación</h1></div>;
const Clientes = () => <div className="p-8"><h1 className="text-2xl font-bold text-slate-800">Directorio de Clientes</h1></div>;

const SidebarLink = ({ to, icon: Icon, label, expanded }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center px-4 py-3 my-1 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
        {label}
      </span>
    </Link>
  );
};

const Layout = ({ children }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${expanded ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {expanded && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                F
              </div>
              <span className="font-bold text-lg text-slate-800 whitespace-nowrap">Facturación</span>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 ml-auto">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" expanded={expanded} />
          <SidebarLink to="/facturas" icon={Receipt} label="Facturas" expanded={expanded} />
          <SidebarLink to="/productos" icon={Package} label="Productos" expanded={expanded} />
          <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
        </nav>
        
        <div className="p-3 border-t border-slate-200">
          <SidebarLink to="/configuracion" icon={Settings} label="Configuración" expanded={expanded} />
          <button className="w-full flex items-center px-4 py-3 mt-1 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10">
          <h2 className="text-sm font-semibold text-slate-500 tracking-wider uppercase">Ambiente Seguro SaaS</h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">Empresa Demo S.A.</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200">
              AD
            </div>
          </div>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/clientes" element={<Clientes />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
