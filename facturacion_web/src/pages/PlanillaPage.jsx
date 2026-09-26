import React, { useState, useEffect } from 'react';
import { 
  Users, Calculator, FileText, Download, Plus, CheckCircle2, 
  DollarSign, Building2, ShieldCheck, RefreshCw, AlertCircle, Send, UserCheck, Calendar, BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function PlanillaPage() {
  const empresaId = localStorage.getItem('empresa_id') || '1';
  
  const [activeTab, setActiveTab] = useState('empleados'); // 'empleados', 'procesar', 'exportar', 'contabilidad'
  const [empleados, setEmpleados] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [boletas, setBoletas] = useState([]);
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Form Nuevo Empleado
  const [modalEmpleadoOpen, setModalEmpleadoOpen] = useState(false);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    dui: '',
    nit: '',
    nup_afp: '',
    isss_afiliacion: '',
    cargo: 'Colaborador',
    departamento: 'Administrativo',
    salario_base: 365.00,
    banco_nombre: 'Banco Agrícola',
    numero_cuenta: '',
    email: '',
    telefono: ''
  });

  // Form Nuevo Periodo Planilla
  const [modalPeriodoOpen, setModalPeriodoOpen] = useState(false);
  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    codigo_periodo: `PLANILLA-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-M`,
    tipo_planilla: 'MENSUAL',
    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fecha_fin: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [resEmp, resPer] = await Promise.all([
        api.get(`/api/v1/planilla/empleados?empresa_id=${empresaId}`),
        api.get(`/api/v1/planilla/periodos?empresa_id=${empresaId}`)
      ]);
      setEmpleados(resEmp.data || []);
      setPeriodos(resPer.data || []);
      
      if (resPer.data && resPer.data.length > 0 && !selectedPeriodoId) {
        setSelectedPeriodoId(resPer.data[0].id);
      }
    } catch (err) {
      console.error("Error cargando planilla:", err);
      setError("Fallo al conectar con el módulo de planillas.");
    } finally {
      setCargando(false);
    }
  };

  const cargarBoletas = async (periodoId) => {
    if (!periodoId) return;
    try {
      const res = await api.get(`/api/v1/planilla/boletas/${periodoId}?empresa_id=${empresaId}`);
      setBoletas(res.data || []);
    } catch (err) {
      console.error("Error cargando boletas:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (selectedPeriodoId) {
      cargarBoletas(selectedPeriodoId);
    }
  }, [selectedPeriodoId]);

  const handleCrearEmpleado = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/api/v1/planilla/empleados?empresa_id=${empresaId}`, nuevoEmpleado);
      setMensajeExito("Empleado registrado exitosamente.");
      setModalEmpleadoOpen(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error registrando empleado");
    }
  };

  const handleProcesarPlanilla = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post(`/api/v1/planilla/procesar-periodo?empresa_id=${empresaId}`, nuevoPeriodo);
      setMensajeExito(`¡Planilla ${res.data.codigo_periodo} procesada y calculada exitosamente!`);
      setModalPeriodoOpen(false);
      cargarDatos();
      setSelectedPeriodoId(res.data.id);
      setActiveTab('procesar');
    } catch (err) {
      setError(err.response?.data?.detail || "Error procesando planilla");
    }
  };

  const handleContabilizarNomenclatura = async (periodoId) => {
    setError(null);
    try {
      const res = await api.post(`/api/v1/planilla/contabilizar/${periodoId}?empresa_id=${empresaId}`);
      setMensajeExito(res.data.mensaje);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al contabilizar la nómina.");
    }
  };

  const descargarISSSTxt = (periodoId) => {
    const url = `${import.meta.env.VITE_API_URL || 'https://ventas-demiempresa.onrender.com'}/api/v1/planilla/exportar/isss-txt?periodo_id=${periodoId}&empresa_id=${empresaId}`;
    window.open(url, '_blank');
  };

  const descargarAFPCsv = (periodoId) => {
    const url = `${import.meta.env.VITE_API_URL || 'https://ventas-demiempresa.onrender.com'}/api/v1/planilla/exportar/afp-csv?periodo_id=${periodoId}&empresa_id=${empresaId}`;
    window.open(url, '_blank');
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  const periodoSeleccionado = periodos.find(p => p.id === selectedPeriodoId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Corporativo */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Módulo de Nómina & Recursos Humanos — El Salvador</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            Gestión de Planillas, ISSS, AFP & Retención ISR (MH)
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Cálculo automatizado de sueldos con leyes laborales vigentes de El Salvador (ISSS 3%, AFP 7.25%, Tabla ISR MH, Aportes Patronales).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalEmpleadoOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Empleado</span>
          </button>

          <button
            onClick={() => setModalPeriodoOpen(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition-all"
          >
            <Calculator className="w-4 h-4" />
            <span>Procesar Planilla</span>
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-500 font-bold">&times;</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold">&times;</button>
        </div>
      )}

      {/* Cards KPI / Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Empleados Activos</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{empleados.length}</p>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">Expediente Digital Registrado</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Planillas Procesadas</span>
          <p className="text-2xl font-black text-indigo-900 mt-1">{periodos.length}</p>
          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Historial de Nóminas</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Monto Planilla Último Mes</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {formatMoney(periodoSeleccionado?.total_neto_liquido || 0)}
          </p>
          <span className="text-[10px] text-emerald-800 font-semibold mt-1 block">Sueldos Líquidos a Pagar</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">Aportes Patronales (ISSS+AFP)</span>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {formatMoney((periodoSeleccionado?.total_isss_patronal || 0) + (periodoSeleccionado?.total_afp_patronal || 0))}
          </p>
          <span className="text-[10px] text-amber-800 font-semibold mt-1 block">Costo Patronal de Ley (16.25%)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('empleados')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'empleados'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Expedientes de Empleados ({empleados.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('procesar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'procesar'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Detalle de Boletas & Nómina</span>
        </button>

        <button
          onClick={() => setActiveTab('exportar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'exportar'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Archivos Oficiales (ISSS & AFP)</span>
        </button>

        <button
          onClick={() => setActiveTab('contabilidad')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'contabilidad'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Asiento Contable Nómina</span>
        </button>
      </div>

      {/* PESTAÑA 1: EMPLEADOS */}
      {activeTab === 'empleados' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Directorio y Expedientes Digitales de Empleados
            </h2>
            <button
              onClick={() => setModalEmpleadoOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              + Agregar Empleado
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b">
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">DUI</th>
                  <th className="p-3">NUP AFP</th>
                  <th className="p-3">ISSS</th>
                  <th className="p-3">Cargo / Depto</th>
                  <th className="p-3 text-right">Salario Base ($)</th>
                  <th className="p-3">Banco / Cuenta</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empleados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                      No hay empleados registrados en la empresa. Haga clic en "+ Agregar Empleado" para registrar el primero.
                    </td>
                  </tr>
                ) : (
                  empleados.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        {emp.primer_nombre} {emp.segundo_nombre || ''} {emp.primer_apellido} {emp.segundo_apellido || ''}
                      </td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">{emp.dui}</td>
                      <td className="p-3 font-mono text-slate-500">{emp.nup_afp || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-500">{emp.isss_afiliacion || 'N/A'}</td>
                      <td className="p-3 font-semibold text-slate-700">
                        {emp.cargo} <span className="text-slate-400 font-normal">({emp.departamento})</span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatMoney(emp.salario_base)}</td>
                      <td className="p-3 text-slate-600">
                        <div className="font-semibold">{emp.banco_nombre}</div>
                        <div className="font-mono text-[10px] text-slate-400">{emp.numero_cuenta || 'Sin registrar'}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                          {emp.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DETALLE DE BOLETAS Y NÓMINA */}
      {activeTab === 'procesar' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                Planilla Procesada — Desglose de Boletas de Pago
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Cálculo de deducciones de ley (ISSS 3%, AFP 7.25%, ISR MH) y sueldo neto a pagar.
              </p>
            </div>

            {/* Selector de Periodo */}
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-slate-200">Periodo:</span>
              <select
                value={selectedPeriodoId || ''}
                onChange={(e) => setSelectedPeriodoId(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none"
              >
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_periodo} ({p.tipo_planilla}) — {formatMoney(p.total_neto_liquido)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b">
                  <th className="p-3">Empleado</th>
                  <th className="p-3 text-right">Devengado ($)</th>
                  <th className="p-3 text-right text-rose-700">ISSS 3% ($)</th>
                  <th className="p-3 text-right text-rose-700">AFP 7.25% ($)</th>
                  <th className="p-3 text-right text-rose-700">ISR MH ($)</th>
                  <th className="p-3 text-right font-black">Tot. Deducciones ($)</th>
                  <th className="p-3 text-right text-emerald-700">Líquido a Pagar ($)</th>
                  <th className="p-3 text-right text-amber-700">Patronal ISSS+AFP ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boletas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                      No hay boletas de pago registradas en el periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  boletas.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        {b.empleado ? `${b.empleado.primer_nombre} ${b.empleado.primer_apellido}` : `Empleado #${b.empleado_id}`}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">{formatMoney(b.total_devengado)}</td>
                      <td className="p-3 text-right font-semibold text-rose-600">{formatMoney(b.isss_empleado)}</td>
                      <td className="p-3 text-right font-semibold text-rose-600">{formatMoney(b.afp_empleado)}</td>
                      <td className="p-3 text-right font-semibold text-rose-600">{formatMoney(b.isr_empleado)}</td>
                      <td className="p-3 text-right font-black text-rose-800">{formatMoney(b.total_deducciones)}</td>
                      <td className="p-3 text-right font-black text-emerald-600 text-sm">{formatMoney(b.salario_liquido)}</td>
                      <td className="p-3 text-right font-semibold text-amber-700">
                        {formatMoney((b.isss_patronal || 0) + (b.afp_patronal || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {periodoSeleccionado && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="p-3 uppercase">Totales del Periodo:</td>
                    <td className="p-3 text-right">{formatMoney(periodoSeleccionado.total_bruto)}</td>
                    <td className="p-3 text-right text-rose-300">{formatMoney(periodoSeleccionado.total_isss_empleados)}</td>
                    <td className="p-3 text-right text-rose-300">{formatMoney(periodoSeleccionado.total_afp_empleados)}</td>
                    <td className="p-3 text-right text-rose-300">{formatMoney(periodoSeleccionado.total_isr_empleados)}</td>
                    <td className="p-3 text-right text-rose-400">{formatMoney(periodoSeleccionado.total_descuentos)}</td>
                    <td className="p-3 text-right text-emerald-400 text-sm">{formatMoney(periodoSeleccionado.total_neto_liquido)}</td>
                    <td className="p-3 text-right text-amber-400">
                      {formatMoney((periodoSeleccionado.total_isss_patronal || 0) + (periodoSeleccionado.total_afp_patronal || 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: EXPORTACIONES OFICIALES */}
      {activeTab === 'exportar' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              Generación de Archivos Oficiales de Presentación (El Salvador)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Descarga directa de los archivos de cumplimiento legal requeridos por el ISSS y AFP Crecer/Confia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card ISSS */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                  ISSS
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Planilla Única ISSS (.TXT)</h3>
                  <p className="text-[11px] text-slate-500">Formato oficial OIR para carga masiva en el portal del ISSS.</p>
                </div>
              </div>

              <button
                onClick={() => selectedPeriodoId && descargarISSSTxt(selectedPeriodoId)}
                disabled={!selectedPeriodoId}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo TXT para ISSS</span>
              </button>
            </div>

            {/* Card AFP */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                  AFP
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Planilla AFP Crecer / Confia (.CSV)</h3>
                  <p className="text-[11px] text-slate-500">Formato estandarizado de cotizaciones NUP para administradoras de fondos.</p>
                </div>
              </div>

              <button
                onClick={() => selectedPeriodoId && descargarAFPCsv(selectedPeriodoId)}
                disabled={!selectedPeriodoId}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo CSV para AFP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: INTEGRACIÓN CONTABLE */}
      {activeTab === 'contabilidad' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Integración Ecosistema Contable (Partida Doble Nómina)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Genera la partida contable automática de sueldos, pasivos de retenidos y gasto de aportes patronales.
              </p>
            </div>

            <button
              onClick={() => selectedPeriodoId && handleContabilizarNomenclatura(selectedPeriodoId)}
              disabled={!selectedPeriodoId || periodoSeleccionado?.estado === 'contabilizada'}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              <span>
                {periodoSeleccionado?.estado === 'contabilizada' 
                  ? '✓ Partida Ya Transmitida a Contabilidad' 
                  : 'Transmitir Partida Contable'}
              </span>
            </button>
          </div>

          {periodoSeleccionado && (
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Pre-visualización de Asiento Contable Doble — {periodoSeleccionado.codigo_periodo}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="p-2">Código Cuenta</th>
                      <th className="p-2">Nombre Cuenta</th>
                      <th className="p-2 text-right">Cargo (Debe $)</th>
                      <th className="p-2 text-right">Abono (Haber $)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="p-2 font-mono text-amber-300">510101</td>
                      <td className="p-2 font-bold">Gastos de Sueldos y Salarios</td>
                      <td className="p-2 text-right font-bold text-emerald-400">{formatMoney(periodoSeleccionado.total_bruto)}</td>
                      <td className="p-2 text-right">$0.00</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-amber-300">510102</td>
                      <td className="p-2 font-bold">Gastos Aporte Patronal ISSS (7.5%)</td>
                      <td className="p-2 text-right font-bold text-emerald-400">{formatMoney(periodoSeleccionado.total_isss_patronal)}</td>
                      <td className="p-2 text-right">$0.00</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-amber-300">510103</td>
                      <td className="p-2 font-bold">Gastos Aporte Patronal AFP (8.75%)</td>
                      <td className="p-2 text-right font-bold text-emerald-400">{formatMoney(periodoSeleccionado.total_afp_patronal)}</td>
                      <td className="p-2 text-right">$0.00</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-amber-300">210201</td>
                      <td className="p-2">ISSS por Pagar (Empleado + Patronal)</td>
                      <td className="p-2 text-right">$0.00</td>
                      <td className="p-2 text-right font-bold text-amber-300">
                        {formatMoney((periodoSeleccionado.total_isss_empleados || 0) + (periodoSeleccionado.total_isss_patronal || 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-amber-300">210202</td>
                      <td className="p-2">AFP por Pagar (Empleado + Patronal)</td>
                      <td className="p-2 text-right">$0.00</td>
                      <td className="p-2 text-right font-bold text-amber-300">
                        {formatMoney((periodoSeleccionado.total_afp_empleados || 0) + (periodoSeleccionado.total_afp_patronal || 0))}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-amber-300">210203</td>
                      <td className="p-2">Retención ISR por Pagar</td>
                      <td className="p-2 text-right">$0.00</td>
                      <td className="p-2 text-right font-bold text-amber-300">{formatMoney(periodoSeleccionado.total_isr_empleados)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono text-amber-300">210101</td>
                      <td className="p-2 font-bold">Sueldos y Salarios por Pagar (Líquido)</td>
                      <td className="p-2 text-right">$0.00</td>
                      <td className="p-2 text-right font-bold text-emerald-400">{formatMoney(periodoSeleccionado.total_neto_liquido)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700 font-black text-sm text-white">
                      <td colSpan="2" className="p-2 uppercase">Totales Partida Doble:</td>
                      <td className="p-2 text-right text-emerald-400">
                        {formatMoney((periodoSeleccionado.total_bruto || 0) + (periodoSeleccionado.total_isss_patronal || 0) + (periodoSeleccionado.total_afp_patronal || 0))}
                      </td>
                      <td className="p-2 text-right text-emerald-400">
                        {formatMoney((periodoSeleccionado.total_neto_liquido || 0) + (periodoSeleccionado.total_isss_empleados || 0) + (periodoSeleccionado.total_isss_patronal || 0) + (periodoSeleccionado.total_afp_empleados || 0) + (periodoSeleccionado.total_afp_patronal || 0) + (periodoSeleccionado.total_isr_empleados || 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL NUEVO EMPLEADO */}
      {modalEmpleadoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 text-base">Registrar Nuevo Empleado (Expediente RRHH)</h3>
              <button onClick={() => setModalEmpleadoOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleCrearEmpleado} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primer Nombre *</label>
                  <input
                    type="text"
                    required
                    value={nuevoEmpleado.primer_nombre}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, primer_nombre: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Segundo Nombre</label>
                  <input
                    type="text"
                    value={nuevoEmpleado.segundo_nombre}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, segundo_nombre: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primer Apellido *</label>
                  <input
                    type="text"
                    required
                    value={nuevoEmpleado.primer_apellido}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, primer_apellido: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Segundo Apellido</label>
                  <input
                    type="text"
                    value={nuevoEmpleado.segundo_apellido}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, segundo_apellido: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">DUI *</label>
                  <input
                    type="text"
                    required
                    placeholder="00000000-0"
                    value={nuevoEmpleado.dui}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, dui: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIT</label>
                  <input
                    type="text"
                    placeholder="0000-000000-000-0"
                    value={nuevoEmpleado.nit}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, nit: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NUP AFP</label>
                  <input
                    type="text"
                    placeholder="12 dígitos"
                    value={nuevoEmpleado.nup_afp}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, nup_afp: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número Afiliación ISSS</label>
                  <input
                    type="text"
                    placeholder="9 dígitos"
                    value={nuevoEmpleado.isss_afiliacion}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, isss_afiliacion: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={nuevoEmpleado.cargo}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, cargo: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salario Base Mensual ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoEmpleado.salario_base}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, salario_base: parseFloat(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Banco de Depósito</label>
                  <input
                    type="text"
                    value={nuevoEmpleado.banco_nombre}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, banco_nombre: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número de Cuenta Bancaria</label>
                  <input
                    type="text"
                    value={nuevoEmpleado.numero_cuenta}
                    onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, numero_cuenta: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalEmpleadoOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROCESAR PLANILLA */}
      {modalPeriodoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 text-base">Procesar & Liquidar Planilla de Ley</h3>
              <button onClick={() => setModalPeriodoOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleProcesarPlanilla} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código del Periodo *</label>
                <input
                  type="text"
                  required
                  value={nuevoPeriodo.codigo_periodo}
                  onChange={(e) => setNuevoPeriodo({...nuevoPeriodo, codigo_periodo: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Planilla</label>
                <select
                  value={nuevoPeriodo.tipo_planilla}
                  onChange={(e) => setNuevoPeriodo({...nuevoPeriodo, tipo_planilla: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold"
                >
                  <option value="MENSUAL">MENSUAL (30 Días)</option>
                  <option value="QUINCENAL">QUINCENAL (15 Días)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={nuevoPeriodo.fecha_inicio}
                    onChange={(e) => setNuevoPeriodo({...nuevoPeriodo, fecha_inicio: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    required
                    value={nuevoPeriodo.fecha_fin}
                    onChange={(e) => setNuevoPeriodo({...nuevoPeriodo, fecha_fin: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[11px] text-indigo-900 leading-relaxed">
                <b>📌 Liquidación Legal Automática:</b> El sistema procesará el sueldo devengado de todos los empleados activos, aplicará retención del ISSS (3%), AFP (7.25%), Tabla de Renta MH y calculará el costo patronal.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalPeriodoOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-md"
                >
                  Calcular y Procesar Planilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
