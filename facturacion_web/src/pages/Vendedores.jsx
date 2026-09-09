import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Edit2, Search, Phone, Mail, FileText, CheckCircle2, 
  XCircle, TrendingUp, Calendar, DollarSign, Receipt, Eye, X, AlertTriangle,
  BadgePercent, MapPin, Award
} from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  telefono: '',
  email: '',
  dui: '',
  direccion: '',
  porcentaje_comision: 0,
  activo: true
};

export default function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);
  
  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  // Modal Detalle de Ventas
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
  const [detalleVentas, setDetalleVentas] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [periodo, setPeriodo] = useState('dia'); // dia, semana, mes, anio
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const anosDisponibles = [currentYear, currentYear - 1, currentYear - 2];

  const cargarVendedores = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/api/v1/logistica/vendedores/?empresa_id=${empresaId()}&solo_activos=false`);
      setVendedores(res.data);
    } catch (e) {
      console.error("Error al cargar vendedores", e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVendedores();
  }, []);

  // Cargar detalle de ventas cuando cambia el vendedor, período o año
  useEffect(() => {
    if (!modalDetalleAbierto || !vendedorSeleccionado) return;

    const cargarDetalle = async () => {
      setCargandoDetalle(true);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await api.get(
          `/api/v1/logistica/vendedores/${vendedorSeleccionado.id}/ventas?empresa_id=${empresaId()}&periodo=${periodo}&anio=${anioSeleccionado}&tz=${tz}`
        );
        setDetalleVentas(res.data);
      } catch (e) {
        console.error("Error al cargar detalle de ventas", e);
      } finally {
        setCargandoDetalle(false);
      }
    };

    cargarDetalle();
  }, [modalDetalleAbierto, vendedorSeleccionado, periodo, anioSeleccionado]);

  // Vendedores filtrados en la tabla
  const vendedoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return vendedores.filter(v => {
      if (soloActivos && !v.activo) return false;
      if (!q) return true;
      return (
        (v.nombre && v.nombre.toLowerCase().includes(q)) ||
        (v.codigo && v.codigo.toLowerCase().includes(q)) ||
        (v.dui && v.dui.toLowerCase().includes(q)) ||
        (v.telefono && v.telefono.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q))
      );
    });
  }, [vendedores, busqueda, soloActivos]);

  // Totales generales para tarjetas superiores
  const totalVentasGlobales = useMemo(() => {
    return vendedores.reduce((acc, v) => acc + (v.total_ventas_historico || 0), 0);
  }, [vendedores]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  };

  const abrirEditar = (v) => {
    setEditando(v);
    setForm({
      codigo: v.codigo || '',
      nombre: v.nombre || '',
      telefono: v.telefono || '',
      email: v.email || '',
      dui: v.dui || '',
      direccion: v.direccion || '',
      porcentaje_comision: v.porcentaje_comision || 0,
      activo: v.activo !== undefined ? v.activo : true
    });
    setModalAbierto(true);
  };

  const abrirDetalle = (v) => {
    setVendedorSeleccionado(v);
    setPeriodo('dia');
    setAnioSeleccionado(currentYear);
    setDetalleVentas(null);
    setModalDetalleAbierto(true);
  };

  const guardarVendedor = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert("El nombre del vendedor es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        ...form,
        porcentaje_comision: parseFloat(form.porcentaje_comision) || 0
      };

      if (editando) {
        await api.put(`/api/v1/logistica/vendedores/${editando.id}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/logistica/vendedores/?empresa_id=${empresaId()}`, payload);
      }

      setModalAbierto(false);
      cargarVendedores();
    } catch (e) {
      alert(e.response?.data?.detail || "Error al guardar el vendedor");
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (v) => {
    const accion = v.activo ? "desactivar" : "activar";
    if (!confirm(`¿Está seguro de ${accion} al vendedor "${v.nombre}"?`)) return;

    try {
      await api.delete(`/api/v1/logistica/vendedores/${v.id}?empresa_id=${empresaId()}`);
      cargarVendedores();
    } catch (e) {
      alert(e.response?.data?.detail || "Error al cambiar estado del vendedor");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" /> Vendedores y Comerciales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maestro del equipo de ventas, control de comisiones e historial de facturación
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Nuevo Vendedor
        </button>
      </div>

      {/* KPI Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Vendedores</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{vendedores.length}</h3>
            <p className="text-xs text-slate-400 mt-1">Registrados en la empresa</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendedores Activos</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">
              {vendedores.filter(v => v.activo).length}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Habilitados para facturar</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ventas Acumuladas</p>
            <h3 className="text-3xl font-bold text-indigo-600 mt-1">{fmt(totalVentasGlobales)}</h3>
            <p className="text-xs text-slate-400 mt-1">Facturado por el equipo</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código, DUI, teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer bg-white px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-stretch sm:self-auto justify-center">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
          Solo activos
        </label>
      </div>

      {/* Tabla de Vendedores */}
      {cargando ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
          Cargando vendedores...
        </div>
      ) : vendedoresFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="font-semibold text-slate-700">No se encontraron vendedores</p>
          <p className="text-sm mt-1">Crea tu primer vendedor o ajusta los criterios de búsqueda</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Comisión</th>
                  <th className="px-6 py-4 text-right">Ventas Totales</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendedoresFiltrados.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100">
                          {v.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800 text-sm">{v.nombre}</p>
                            {v.codigo && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {v.codigo}
                              </span>
                            )}
                          </div>
                          {v.direccion && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {v.direccion}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {v.telefono && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {v.telefono}
                        </div>
                      )}
                      {v.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {v.email}
                        </div>
                      )}
                      {v.dui && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          DUI: {v.dui}
                        </div>
                      )}
                      {!v.telefono && !v.email && !v.dui && (
                        <span className="text-xs text-slate-400 italic">Sin datos de contacto</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                        <BadgePercent className="w-3.5 h-3.5" />
                        {v.porcentaje_comision || 0}%
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {fmt(v.total_ventas_historico)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {v.cantidad_facturas_historico || 0} {v.cantidad_facturas_historico === 1 ? 'factura' : 'facturas'}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        v.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Acción: Ver Detalle de Ventas */}
                        <button
                          onClick={() => abrirDetalle(v)}
                          title="Ver detalle de ventas"
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>

                        {/* Botón Editar */}
                        <button
                          onClick={() => abrirEditar(v)}
                          title="Editar vendedor"
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Botón Alternar Estado */}
                        <button
                          onClick={() => toggleEstado(v)}
                          title={v.activo ? "Desactivar vendedor" : "Activar vendedor"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            v.activo ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {v.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETALLE DE VENTAS DEL VENDEDOR (PATRÓN DASHBOARD)                   */}
      {/* ========================================================================= */}
      {modalDetalleAbierto && vendedorSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-800">
                    Ventas de {vendedorSeleccionado.nombre}
                  </h2>
                  {vendedorSeleccionado.codigo && (
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                      {vendedorSeleccionado.codigo}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comisión configurada: <span className="font-semibold text-amber-700">{vendedorSeleccionado.porcentaje_comision || 0}%</span>
                </p>
              </div>
              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Filtros idéntica al Dashboard */}
            <div className="p-6 pb-2 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Botones de Período */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setPeriodo('dia')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    periodo === 'dia' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setPeriodo('semana')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    periodo === 'semana' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => setPeriodo('mes')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    periodo === 'mes' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mes Actual
                </button>
                <button
                  onClick={() => setPeriodo('anio')}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    periodo === 'anio' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Este Año
                </button>
              </div>

              {/* Selector de Año para consultar otros años */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Año:</span>
                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                  className="border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 outline-none cursor-pointer"
                >
                  {anosDisponibles.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contenido scrolleable del Detalle */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {cargandoDetalle && !detalleVentas ? (
                <div className="py-16 text-center text-slate-400">Cargando ventas del vendedor...</div>
              ) : detalleVentas ? (
                <>
                  {/* Tarjetas de Métricas del Período */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Ventas Totales</p>
                      <h4 className="text-2xl font-bold text-emerald-800 mt-1">{fmt(detalleVentas.total_ventas)}</h4>
                      <p className="text-[11px] text-emerald-600 mt-0.5">En el período seleccionado</p>
                    </div>

                    <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">DTEs Emitidos</p>
                      <h4 className="text-2xl font-bold text-indigo-800 mt-1">{detalleVentas.cantidad_facturas}</h4>
                      <p className="text-[11px] text-indigo-600 mt-0.5">Comprobantes válidos</p>
                    </div>

                    <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Ticket Promedio</p>
                      <h4 className="text-2xl font-bold text-purple-800 mt-1">{fmt(detalleVentas.ticket_promedio)}</h4>
                      <p className="text-[11px] text-purple-600 mt-0.5">Promedio por comprobante</p>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl">
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Comisión Estimada</p>
                      <h4 className="text-2xl font-bold text-amber-800 mt-1">{fmt(detalleVentas.comision_estimada)}</h4>
                      <p className="text-[11px] text-amber-600 mt-0.5">Al {detalleVentas.porcentaje_comision}% de comisión</p>
                    </div>
                  </div>

                  {/* Tabla de Facturas del Vendedor */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-indigo-600" />
                        Comprobantes Emitidos ({detalleVentas.facturas.length})
                      </span>
                      <span className="text-xs text-slate-500">
                        {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : periodo === 'mes' ? 'Este mes' : `Año ${anioSeleccionado}`}
                      </span>
                    </div>

                    {detalleVentas.facturas.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No hay ventas registradas para este vendedor en el período seleccionado.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-white border-b border-slate-100 text-slate-500 font-semibold uppercase">
                              <th className="px-4 py-3">Número DTE</th>
                              <th className="px-4 py-3">Tipo</th>
                              <th className="px-4 py-3">Cliente</th>
                              <th className="px-4 py-3">Fecha y Hora</th>
                              <th className="px-4 py-3">Condición</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detalleVentas.facturas.map((fac) => (
                              <tr key={fac.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {fac.numero}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    fac.tipo_doc === 'CCF' 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : fac.tipo_doc === 'EXPORTACION' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {fac.tipo_doc}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {fac.cliente_nombre}
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                  {new Date(fac.fecha_emision).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    fac.condicion_operacion === 'CREDITO' 
                                      ? 'bg-amber-100 text-amber-700' 
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {fac.condicion_operacion}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    fac.estado === 'anulada' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {fac.estado.toUpperCase()}
                                  </span>
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${
                                  fac.estado === 'anulada' ? 'text-slate-400 line-through' : 'text-slate-800'
                                }`}>
                                  {fmt(fac.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR VENDEDOR                                            */}
      {/* ========================================================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                {editando ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarVendedor} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Código Vendedor
                  </label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="Auto (Ej: VEN-001)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.porcentaje_comision}
                    onChange={(e) => setForm({ ...form, porcentaje_comision: e.target.value })}
                    placeholder="Ej: 5.0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Carlos Gómez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="7000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    DUI
                  </label>
                  <input
                    type="text"
                    value={form.dui}
                    onChange={(e) => setForm({ ...form, dui: e.target.value })}
                    placeholder="00000000-0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vendedor@empresa.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Dirección o Zona de Venta
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Ej: Zona Central / San Salvador"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Vendedor Activo</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear Vendedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
