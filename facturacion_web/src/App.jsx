import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Package, Users, Settings, LogOut, Menu,
  Warehouse, BarChart3, ChevronDown, ChevronRight, Truck, ShoppingCart, CreditCard, BookOpen
} from 'lucide-react';
import Productos from './pages/Productos';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Bodegas from './pages/Bodegas';
import Existencias from './pages/Existencias';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Proveedores from './pages/Proveedores';
import OrdenesCompra from './pages/OrdenesCompra';
import CuentasPagar from './pages/CuentasPagar';
import Clientes from './pages/Clientes';
import Facturas from './pages/Facturas';
import CuentasCobrar from './pages/CuentasCobrar';
import ConfiguracionDTE from './pages/ConfiguracionDTE';

import Dashboard from './pages/Dashboard';
import Despachos from './pages/Despachos';
import Kardex from './pages/Kardex';
import { api } from './services/api';

const AvatarTrigger = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isFirstTime = localStorage.getItem('avatar_facturacion_greeted') !== 'true';
    if (isFirstTime) {
      localStorage.setItem('avatar_facturacion_greeted', 'true');
      
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Buenos días' : (hour < 18 ? 'Buenas tardes' : 'Buenas noches');
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: `¡${greeting}! Bienvenido al módulo de Facturación e Inventarios. Soy tu asistente virtual y estoy aquí para ayudarte.`,
            highlightId: null,
            options: []
          }
        }));
      }, 1000);
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('avatar:say', {
          detail: {
            text: 'Te recomiendo revisar primero la Configuración DTE para validar tu certificado de Hacienda.',
            highlightId: null,
            options: [
              { label: 'Ir a Configuración', action: 'navigate:config-dte' },
              { label: 'Explorar por mi cuenta', action: null }
            ]
          }
        }));
      }, 10000);
    }
    
    const handleNav = () => navigate('/configuracion-dte');
    window.addEventListener('navigate:config-dte', handleNav);
    return () => window.removeEventListener('navigate:config-dte', handleNav);
  }, [navigate]);
  return null;
};

const NombreEmpresa = () => {
  const [nombre, setNombre] = useState(localStorage.getItem('empresa_nombre') || 'Mi Empresa');
  useEffect(() => {
    const eid = localStorage.getItem('empresa_id');
    if (eid) {
      api.get(`/api/v1/auth/empresa/${eid}`).then(res => {
        if (res.data?.nombre) {
          setNombre(res.data.nombre);
          localStorage.setItem('empresa_nombre', res.data.nombre);
        }
      }).catch(() => {});
    }
  }, []);
  return <p className="text-sm font-bold text-slate-800">{nombre}</p>;
};

// ── Componentes del Sidebar ───────────────────────────────────────────────────
const SidebarLink = ({ to, icon: Icon, label, expanded }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2.5 my-0.5 rounded-xl transition-all ${isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {expanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">{label}</span>}
    </Link>
  );
};

const SidebarSection = ({ label, expanded, children }) => (
  <div className="mb-1">
    {expanded && (
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">{label}</p>
    )}
    {!expanded && <div className="border-t border-slate-100 my-2" />}
    {children}
  </div>
);

// ── Guard de autenticación ────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// ── Layout principal ──────────────────────────────────────────────────────────
const Layout = ({ children }) => {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('empresa_id');
    navigate('/login');
  };

  const userRole = (localStorage.getItem('rol') || '').toLowerCase();
  const isAdmin = userRole.includes('admin') || userRole === ''; // Si no hay rol, asumimos admin por ahora
  const isBodeguero = userRole.includes('bodeguero');
  const isCajera = userRole.includes('cajer') || userRole.includes('venta');
  const isAuditor = userRole.includes('auditor');
  const isSecretaria = userRole.includes('secretaria');

  const canSeeVentas = isAdmin || isCajera || isAuditor;
  const canSeeCompras = isAdmin || isBodeguero || isAuditor;
  const canSeeAlmacen = isAdmin || isBodeguero || isAuditor;
  const canSeeLogistica = isAdmin || isBodeguero || isAuditor;
  const canSeeConfiguracion = isAdmin;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${expanded ? 'w-56' : 'w-16'}`}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-slate-200 flex-shrink-0">
          {expanded && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">F</div>
              <span className="font-bold text-base text-slate-800 whitespace-nowrap">Facturación</span>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 ml-auto">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" expanded={expanded} />

          {canSeeVentas && (
            <SidebarSection label="Ventas" expanded={expanded}>
              <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
              <SidebarLink to="/facturas" icon={Receipt} label="Facturación DTE" expanded={expanded} />
              <SidebarLink to="/cuentas-cobrar" icon={CreditCard} label="Cuentas por Cobrar" expanded={expanded} />
            </SidebarSection>
          )}

          {canSeeCompras && (
            <SidebarSection label="Compras" expanded={expanded}>
              <SidebarLink to="/proveedores" icon={Truck} label="Proveedores" expanded={expanded} />
              <SidebarLink to="/ordenes-compra" icon={ShoppingCart} label="Órdenes de Compra" expanded={expanded} />
              <SidebarLink to="/cuentas-pagar" icon={CreditCard} label="Cuentas por Pagar" expanded={expanded} />
            </SidebarSection>
          )}

          {canSeeAlmacen && (
            <SidebarSection label="Almacén" expanded={expanded}>
              <SidebarLink to="/bodegas" icon={Warehouse} label="Bodegas" expanded={expanded} />
              <SidebarLink to="/existencias" icon={BarChart3} label="Existencias" expanded={expanded} />
              <SidebarLink to="/kardex" icon={BookOpen} label="Libro Kardex" expanded={expanded} />
              <SidebarLink to="/productos" icon={Package} label="Productos" expanded={expanded} />
            </SidebarSection>
          )}
          
          {canSeeLogistica && (
            <SidebarSection label="Logística" expanded={expanded}>
              <SidebarLink to="/despachos" icon={Truck} label="Rutas y Entregas" expanded={expanded} />
            </SidebarSection>
          )}

          {canSeeConfiguracion && (
            <SidebarSection label="Configuración" expanded={expanded}>
              <SidebarLink to="/configuracion-dte" icon={Settings} label="Configuración DTE" expanded={expanded} />
            </SidebarSection>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 mt-0.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {expanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between sticky top-0 z-10">
          <h2 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Ambiente Seguro SaaS</h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <NombreEmpresa />
              <p className="text-xs text-slate-500 uppercase">{localStorage.getItem('rol') || 'Usuario'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 text-sm uppercase">
              {localStorage.getItem('rol') ? localStorage.getItem('rol').substring(0, 2) : 'US'}
            </div>
          </div>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "564147336188-mdfp0vsvn8na8bllflsm8ntrv91cfinp.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <AvatarTrigger />
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Fase 1 — Almacén */}
                  <Route path="/bodegas" element={<Bodegas />} />
                  <Route path="/existencias" element={<Existencias />} />
                  <Route path="/kardex" element={<Kardex />} />
                  <Route path="/productos" element={<Productos />} />
                  {/* Fase 2 — Compras */}
                  <Route path="/proveedores" element={<Proveedores />} />
                  <Route path="/ordenes-compra" element={<OrdenesCompra />} />
                  <Route path="/cuentas-pagar" element={<CuentasPagar />} />
                  {/* Fase 3 — Ventas */}
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/facturas" element={<Facturas />} />
                  <Route path="/cuentas-cobrar" element={<CuentasCobrar />} />
                  {/* Fase 4 — DTE */}
                  <Route path="/configuracion-dte" element={<ConfiguracionDTE />} />
                  {/* Fase 5 — Logística */}
                  <Route path="/despachos" element={<Despachos />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
