import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Package, Users, Settings, LogOut, Menu,
  Warehouse, BarChart3, ChevronDown, ChevronRight, Truck, ShoppingCart, CreditCard, BookOpen
, Wallet, DollarSign, Calculator, ShieldCheck, UserCheck, Headphones, Building, Sparkles } from 'lucide-react';
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
import Cajas from './pages/Cajas';
import Gastos from './pages/Gastos';
import CuentasCobrar from './pages/CuentasCobrar';
import ConfiguracionDTE from './pages/ConfiguracionDTE';
import Usuarios from './pages/Usuarios';
import AvatarWidget from './components/AvatarWidget';
import CajaStateBanner from './components/CajaStateBanner';
import Acreedores from './pages/Acreedores';
import Aportantes from './pages/Aportantes';
import PagoPrestamos from './pages/PagoPrestamos';
import ContratosArrendamiento from './pages/ContratosArrendamiento';
import BackupRecovery from './pages/BackupRecovery';
import SoporteModal from './components/SoporteModal';

import Dashboard from './pages/Dashboard';
import Despachos from './pages/Despachos';
import Vendedores from './pages/Vendedores';
import Kardex from './pages/Kardex';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './services/api';

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
  return <p className="text-xs font-bold text-slate-800 truncate max-w-[160px] sm:max-w-[220px]">{nombre}</p>;
};

// ── Componentes del Sidebar ───────────────────────────────────────────────────
const SidebarLink = ({ to, icon: Icon, label, expanded }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-3 py-2.5 my-0.5 rounded-xl transition-all ${isActive
        ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-lg shadow-indigo-600/30 font-semibold border-l-4 border-amber-400'
        : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-white'}`} />
      {expanded && <span className="ml-3 text-xs whitespace-nowrap tracking-wide">{label}</span>}
    </Link>
  );
};

const SidebarSection = ({ label, expanded, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      {expanded ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 pt-3 pb-1 text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest hover:text-white transition-colors text-left"
        >
          <span>{label}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      ) : (
        <div className="border-t border-slate-800 my-2" />
      )}
      {(!expanded || isOpen) && (
        <div className="transition-all duration-200">{children}</div>
      )}
    </div>
  );
};

// ── Listener de Inactividad de Sesión (15 Minutos) ────────────────────────────
const SessionTimeoutListener = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
    let timer = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      const token = localStorage.getItem('token');
      if (token && location.pathname !== '/login' && location.pathname !== '/registro') {
        timer = setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('rol');
          localStorage.removeItem('empresa_id');
          localStorage.removeItem('usuario_id');
          sessionStorage.removeItem('avatar_session_greeted');
          navigate('/login?expired=true');
        }, TIMEOUT_MS);
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [location.pathname, navigate]);

  return null;
};

// ── Guard de autenticación ────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// ── Layout principal ──────────────────────────────────────────────────────────
const Layout = ({ children }) => {
  const [expanded, setExpanded] = useState(true);
  const [showSoporteModal, setShowSoporteModal] = useState(false);
  const [unreadSoporte, setUnreadSoporte] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadSoporte = async () => {
    const eid = localStorage.getItem('empresa_id');
    const uid = localStorage.getItem('usuario_id') ? parseInt(localStorage.getItem('usuario_id')) : 1;
    if (!eid) return;
    try {
      const res = await api.get(`/api/v1/soporte/unread?empresa_id=${eid}&usuario_id=${uid}`);
      setUnreadSoporte(res.data || 0);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnreadSoporte();
    const interval = setInterval(fetchUnreadSoporte, 30000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar - Dark Sapphire Theme */}
      <aside className={`bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 border-r border-slate-800 shadow-2xl transition-all duration-300 flex flex-col ${expanded ? 'w-56' : 'w-16'}`}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-950/60 flex-shrink-0">
          {expanded && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src="/favicon.png" alt="Logo" className="w-8 h-8 rounded-xl object-contain bg-white p-0.5 shadow-md border border-white/20 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white tracking-tight leading-none">Facturación</span>
                <span className="text-[9px] text-amber-300 font-semibold tracking-wider italic mt-0.5">¿Dónde está mi dinero?</span>
              </div>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white ml-auto transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" expanded={expanded} />

          {canSeeVentas && (
            <SidebarSection label="Ventas" expanded={expanded} defaultOpen={true}>
              <SidebarLink to="/clientes" icon={Users} label="Clientes" expanded={expanded} />
              <SidebarLink to="/facturas" icon={Receipt} label="Facturación DTE" expanded={expanded} />
              <SidebarLink to="/cuentas-cobrar" icon={CreditCard} label="Cuentas por Cobrar" expanded={expanded} />
            </SidebarSection>
          )}

          {canSeeCompras && (
            <SidebarSection label="Compras" expanded={expanded} defaultOpen={true}>
              <SidebarLink to="/proveedores" icon={Truck} label="Proveedores" expanded={expanded} />
              <SidebarLink to="/ordenes-compra" icon={ShoppingCart} label="Compra" expanded={expanded} />
              <SidebarLink to="/cuentas-pagar" icon={CreditCard} label="Cuentas por Pagar" expanded={expanded} />
            </SidebarSection>
          )}

          <SidebarSection label="Finanzas" expanded={expanded} defaultOpen={false}>
            <SidebarLink to="/cajas" icon={Wallet} label="Control de Caja" expanded={expanded} />
            <SidebarLink to="/gastos" icon={DollarSign} label="Gastos Operativos" expanded={expanded} />
            <SidebarLink to="/acreedores" icon={CreditCard} label="Acreedores (Maestro)" expanded={expanded} />
            <SidebarLink to="/pago-prestamos" icon={Calculator} label="Préstamos y Amortizaciones" expanded={expanded} />
            <SidebarLink to="/aportantes" icon={Users} label="Aportantes de Capital" expanded={expanded} />
            <SidebarLink to="/arrendamientos" icon={Building} label="Contrato de arrendamiento" expanded={expanded} />
          </SidebarSection>

          {canSeeAlmacen && (
            <SidebarSection label="Almacén" expanded={expanded} defaultOpen={false}>
              <SidebarLink to="/bodegas" icon={Warehouse} label="Bodegas" expanded={expanded} />
              <SidebarLink to="/existencias" icon={BarChart3} label="Existencias" expanded={expanded} />
              <SidebarLink to="/kardex" icon={BookOpen} label="Libro Kardex" expanded={expanded} />
              <SidebarLink to="/productos" icon={Package} label="Productos" expanded={expanded} />
            </SidebarSection>
          )}
          
          {canSeeLogistica && (
            <SidebarSection label="Logística" expanded={expanded} defaultOpen={false}>
              <SidebarLink to="/vendedores" icon={UserCheck} label="Vendedores" expanded={expanded} />
              <SidebarLink to="/despachos" icon={Truck} label="Rutas y Entregas" expanded={expanded} />
            </SidebarSection>
          )}

          <SidebarSection label="Ayuda & Soporte" expanded={expanded} defaultOpen={false}>
            <button
              onClick={() => setShowSoporteModal(true)}
              className="w-full flex items-center px-3 py-2.5 my-0.5 rounded-xl transition-all text-indigo-300 hover:bg-white/10 hover:text-white font-medium relative group"
            >
              <Headphones className="w-5 h-5 flex-shrink-0 text-indigo-400 group-hover:text-white" />
              {expanded && (
                <span className="ml-3 text-xs whitespace-nowrap tracking-wide flex-1 text-left flex items-center justify-between">
                  <span>Soporte Técnico</span>
                  {unreadSoporte > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">{unreadSoporte}</span>
                  )}
                </span>
              )}
            </button>
          </SidebarSection>

          {canSeeConfiguracion && (
            <SidebarSection label="Configuración" expanded={expanded} defaultOpen={false}>
              <SidebarLink to="/configuracion-dte" icon={Settings} label="Configuración DTE" expanded={expanded} />
              <SidebarLink to="/usuarios" icon={Users} label="Gestión de Usuarios" expanded={expanded} />
              <SidebarLink to="/backup-recovery" icon={ShieldCheck} label="Backup y Restauración" expanded={expanded} />
            </SidebarSection>
          )}

          {/* Banner Interactivo de Invitación al Avatar IA */}
          {expanded && (
            <div className="mt-4 p-3 mx-1 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-700/60 shadow-xl text-left">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="text-xs font-bold text-white">¿Tienes dudas de uso?</span>
              </div>
              <p className="text-[10px] text-indigo-200 leading-snug mb-2.5">
                Pregúntale a tu Avatar IA en cualquier momento: <br/>
                <span className="italic text-amber-200 font-semibold">"¿Cómo hago facturas?"</span>
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('avatar:say', { detail: { text: '¡Hola! ¿En qué te puedo colaborar? Puedes preguntarme: ¿Cómo hago facturas?, ¿Cómo hago compras?, ¿Cómo abro caja? o cualquier proceso.' } }))}
                className="w-full text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 px-2 rounded-xl text-center transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1"
              >
                🤖 Preguntar al Avatar IA
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {expanded && <span className="ml-3 font-medium text-xs whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-slate-100">
        <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-[11px] font-extrabold text-indigo-900 tracking-wider uppercase">Plataforma SaaS Corporativa <span className="text-indigo-600 font-bold lowercase italic tracking-normal border-l border-slate-300 pl-2 ml-1">"¿Dónde está mi dinero?"</span></h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSoporteModal(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all relative"
            >
              <Headphones className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Soporte Técnico</span>
              {unreadSoporte > 0 && (
                <span className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full animate-bounce">{unreadSoporte}</span>
              )}
            </button>
            <CajaStateBanner />
            <div className="text-right hidden sm:block">
              <NombreEmpresa />
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{localStorage.getItem('rol') || 'Usuario'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-700 text-white font-black flex items-center justify-center border border-indigo-400 text-xs uppercase shadow-sm">
              {localStorage.getItem('rol') ? localStorage.getItem('rol').substring(0, 2) : 'US'}
            </div>
          </div>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {children}
        </div>

        {/* Widget del Avatar IA Interactivo */}
        <AvatarWidget />

        {/* Modal de Soporte Técnico */}
        <SoporteModal isOpen={showSoporteModal} onClose={() => { setShowSoporteModal(false); fetchUnreadSoporte(); }} />
      </main>

      {/* Barra de Navegación Inferior Móvil (Android / iOS Touch) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around py-1.5 px-2 shadow-lg">
        <NavLink to="/dashboard" className={({isActive}) => `flex flex-col items-center p-1 text-[10px] font-semibold ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/facturas" className={({isActive}) => `flex flex-col items-center p-1 text-[10px] font-semibold ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>POS/DTE</span>
        </NavLink>
        <NavLink to="/cajas" className={({isActive}) => `flex flex-col items-center p-1 text-[10px] font-semibold ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Caja</span>
        </NavLink>
        <NavLink to="/kardex" className={({isActive}) => `flex flex-col items-center p-1 text-[10px] font-semibold ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Kardex</span>
        </NavLink>
        <button onClick={() => setExpanded(!expanded)} className="flex flex-col items-center p-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-600">
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menú</span>
        </button>
      </nav>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "564147336188-mdfp0vsvn8na8bllflsm8ntrv91cfinp.apps.googleusercontent.com";

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <Router>
          <SessionTimeoutListener />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
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
                    <Route path="/cajas" element={<Cajas />} />
                    <Route path="/gastos" element={<Gastos />} />
                    <Route path="/acreedores" element={<Acreedores />} />
                    <Route path="/pago-prestamos" element={<PagoPrestamos />} />
                    <Route path="/aportantes" element={<Aportantes />} />
                    <Route path="/arrendamientos" element={<ContratosArrendamiento />} />
                    {/* Fase 3 — Ventas */}
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/facturas" element={<Facturas />} />
                    <Route path="/cuentas-cobrar" element={<CuentasCobrar />} />
                    {/* Fase 4 — DTE */}
                    <Route path="/configuracion-dte" element={<ConfiguracionDTE />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/backup-recovery" element={<BackupRecovery />} />
                    {/* Fase 5 — Logística */}
                    <Route path="/despachos" element={<Despachos />} />
                    <Route path="/vendedores" element={<Vendedores />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
