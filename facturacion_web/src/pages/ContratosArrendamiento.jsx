import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Building, Plus, Search, DollarSign, Calendar, FileText,
  CheckCircle, AlertCircle, Edit, Trash2, History, MessageCircle,
  TrendingDown, TrendingUp, User, CreditCard, ShieldCheck,
  ChevronLeft, ChevronRight, AlertTriangle, Clock
} from 'lucide-react';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const usuarioId = () => localStorage.getItem('usuario_id') ? parseInt(localStorage.getItem('usuario_id')) : 1;

const formatMoney = (centavos) => `$${((centavos || 0) / 100).toFixed(2)}`;
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};

export default function ContratosArrendamiento() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // TODOS | ARRENDATARIO | ARRENDADOR

  // Modal para contrato (crear/editar)
  const [modalContratoOpen, setModalContratoOpen] = useState(false);
  const [contratoEdit, setContratoEdit] = useState(null);
  const [formContrato, setFormContrato] = useState({
    inmueble_nombre: '',
    tipo: 'ARRENDATARIO',
    contraparte_nombre: '',
    dui_nit: '',
    telefono: '',
    email: '',
    canon_mensual: '',
    dia_pago_limite: 5,
    deposito_garantia: '',
    aplica_mora: false,
    tipo_mora: 'porcentaje',
    valor_mora: '5.0',
    dias_gracia: 0,
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'activo',
    notas: ''
  });

  // Modal para Tabla Anual (12 Meses)
  const [modalTablaAnualOpen, setModalTablaAnualOpen] = useState(false);
  const [contratoActivoTabla, setContratoActivoTabla] = useState(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [tablaAnualData, setTablaAnualData] = useState(null);
  const [cargandoTabla, setCargandoTabla] = useState(false);

  // Modal para registrar pago/cobro de mes específico
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [mesPagoSeleccionado, setMesPagoSeleccionado] = useState(null);
  const [formPago, setFormPago] = useState({
    monto_canon: '',
    monto_mora: '',
    metodo_pago: 'efectivo',
    referencia: '',
    notas: '',
    fecha_pago: new Date().toISOString().split('T')[0]
  });

  // Modal para historial general
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [contratoActivoHistorial, setContratoActivoHistorial] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const cargarContratos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/finanzas/arrendamientos?empresa_id=${empresaId()}`);
      setContratos(res.data || []);
    } catch (err) {
      console.error('Error cargando contratos de arrendamiento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarContratos();
  }, []);

  // Handlers para Crear/Editar Contrato
  const abrirNuevoContrato = () => {
    setContratoEdit(null);
    setFormContrato({
      inmueble_nombre: '',
      tipo: 'ARRENDATARIO',
      contraparte_nombre: '',
      dui_nit: '',
      telefono: '',
      email: '',
      canon_mensual: '',
      dia_pago_limite: 5,
      deposito_garantia: '',
      aplica_mora: false,
      tipo_mora: 'porcentaje',
      valor_mora: '5.0',
      dias_gracia: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      estado: 'activo',
      notas: ''
    });
    setModalContratoOpen(true);
  };

  const abrirEditarContrato = (contrato) => {
    setContratoEdit(contrato);
    setFormContrato({
      inmueble_nombre: contrato.inmueble_nombre || '',
      tipo: contrato.tipo || 'ARRENDATARIO',
      contraparte_nombre: contrato.contraparte_nombre || '',
      dui_nit: contrato.dui_nit || '',
      telefono: contrato.telefono || '',
      email: contrato.email || '',
      canon_mensual: (contrato.canon_mensual / 100).toString(),
      dia_pago_limite: contrato.dia_pago_limite || 5,
      deposito_garantia: contrato.deposito_garantia ? (contrato.deposito_garantia / 100).toString() : '',
      aplica_mora: contrato.aplica_mora || false,
      tipo_mora: contrato.tipo_mora || 'porcentaje',
      valor_mora: contrato.valor_mora !== undefined ? contrato.valor_mora.toString() : '5.0',
      dias_gracia: contrato.dias_gracia || 0,
      fecha_inicio: contrato.fecha_inicio ? contrato.fecha_inicio.split('T')[0] : '',
      fecha_fin: contrato.fecha_fin ? contrato.fecha_fin.split('T')[0] : '',
      estado: contrato.estado || 'activo',
      notas: contrato.notas || ''
    });
    setModalContratoOpen(true);
  };

  const guardarContrato = async () => {
    if (!formContrato.inmueble_nombre.trim()) return alert('Ingrese el nombre del inmueble o local');
    if (!formContrato.contraparte_nombre.trim()) return alert('Ingrese el nombre del propietario o inquilino');
    if (!formContrato.canon_mensual || parseFloat(formContrato.canon_mensual) <= 0) return alert('Ingrese un canon mensual válido');

    setGuardando(true);
    try {
      const payload = {
        inmueble_nombre: formContrato.inmueble_nombre,
        tipo: formContrato.tipo,
        contraparte_nombre: formContrato.contraparte_nombre,
        dui_nit: formContrato.dui_nit,
        telefono: formContrato.telefono,
        email: formContrato.email,
        canon_mensual: Math.round(parseFloat(formContrato.canon_mensual) * 100),
        dia_pago_limite: parseInt(formContrato.dia_pago_limite) || 5,
        deposito_garantia: formContrato.deposito_garantia ? Math.round(parseFloat(formContrato.deposito_garantia) * 100) : 0,
        aplica_mora: formContrato.aplica_mora,
        tipo_mora: formContrato.tipo_mora,
        valor_mora: parseFloat(formContrato.valor_mora) || 0,
        dias_gracia: parseInt(formContrato.dias_gracia) || 0,
        fecha_inicio: formContrato.fecha_inicio || null,
        fecha_fin: formContrato.fecha_fin || null,
        estado: formContrato.estado,
        notas: formContrato.notas
      };

      if (contratoEdit) {
        await api.put(`/api/v1/finanzas/arrendamientos/${contratoEdit.id}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/finanzas/arrendamientos?empresa_id=${empresaId()}`, payload);
      }

      setModalContratoOpen(false);
      await cargarContratos();
      window.dispatchEvent(new CustomEvent('avatar:say', {
        detail: { text: `Contrato de arrendamiento ${contratoEdit ? 'actualizado' : 'registrado'} exitosamente.` }
      }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar contrato de arrendamiento');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarContrato = async (contrato) => {
    if (!confirm(`¿Está seguro de eliminar el contrato de "${contrato.inmueble_nombre}"? Esta acción eliminará también sus registros de pagos.`)) return;
    try {
      await api.delete(`/api/v1/finanzas/arrendamientos/${contrato.id}?empresa_id=${empresaId()}`);
      await cargarContratos();
      window.dispatchEvent(new CustomEvent('avatar:say', {
        detail: { text: 'Contrato de arrendamiento eliminado correctamente.' }
      }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar contrato');
    }
  };

  // Handlers para Tabla Anual (12 Meses)
  const cargarTablaAnual = async (contratoId, anio) => {
    setCargandoTabla(true);
    try {
      const res = await api.get(`/api/v1/finanzas/arrendamientos/${contratoId}/tabla-anual?anio=${anio}&empresa_id=${empresaId()}`);
      setTablaAnualData(res.data);
    } catch (err) {
      console.error('Error cargando tabla anual de arrendamiento:', err);
    } finally {
      setCargandoTabla(false);
    }
  };

  const abrirTablaAnual = (contrato) => {
    setContratoActivoTabla(contrato);
    const anioActual = new Date().getFullYear();
    setAnioSeleccionado(anioActual);
    setModalTablaAnualOpen(true);
    cargarTablaAnual(contrato.id, anioActual);
  };

  const cambiarAnio = (nuevoAnio) => {
    if (nuevoAnio < 2020 || nuevoAnio > 2040) return;
    setAnioSeleccionado(nuevoAnio);
    if (contratoActivoTabla) {
      cargarTablaAnual(contratoActivoTabla.id, nuevoAnio);
    }
  };

  // Handlers para Registrar Pago de Mes Específico
  const abrirPagoMes = (mesItem) => {
    setMesPagoSeleccionado(mesItem);
    setFormPago({
      monto_canon: (mesItem.canon_base / 100).toFixed(2),
      monto_mora: (mesItem.mora_calculada / 100).toFixed(2),
      metodo_pago: 'efectivo',
      referencia: '',
      notas: `Pago alquiler ${mesItem.nombre_mes} ${mesItem.anio}`,
      fecha_pago: new Date().toISOString().split('T')[0]
    });
    setModalPagoOpen(true);
  };

  const guardarPagoMes = async () => {
    const canonVal = parseFloat(formPago.monto_canon || '0');
    const moraVal = parseFloat(formPago.monto_mora || '0');
    if (canonVal <= 0 && moraVal <= 0) return alert('Ingrese un monto válido');

    setGuardando(true);
    try {
      const payload = {
        tipo: contratoActivoTabla.tipo === 'ARRENDADOR' ? 'COBRO_ALQUILER' : 'PAGO_ALQUILER',
        anio: mesPagoSeleccionado.anio,
        mes: mesPagoSeleccionado.mes,
        monto: Math.round((canonVal + moraVal) * 100),
        monto_mora: Math.round(moraVal * 100),
        metodo_pago: formPago.metodo_pago,
        referencia: formPago.referencia,
        notas: formPago.notas,
        fecha_pago: formPago.fecha_pago || null
      };

      await api.post(`/api/v1/finanzas/arrendamientos/${contratoActivoTabla.id}/pagos?empresa_id=${empresaId()}&usuario_id=${usuarioId()}`, payload);
      setModalPagoOpen(false);
      
      // Recargar tabla anual y lista principal
      await cargarTablaAnual(contratoActivoTabla.id, anioSeleccionado);
      await cargarContratos();

      window.dispatchEvent(new CustomEvent('avatar:say', {
        detail: { text: `Cuota de ${mesPagoSeleccionado.nombre_mes} ${mesPagoSeleccionado.anio} por $${(canonVal + moraVal).toFixed(2)} registrada con éxito.` }
      }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al registrar pago de cuota');
    } finally {
      setGuardando(false);
    }
  };

  // Handlers para Histórico General
  const abrirHistorial = async (contrato) => {
    setContratoActivoHistorial(contrato);
    setModalHistorialOpen(true);
    setCargandoHistorial(true);
    try {
      const res = await api.get(`/api/v1/finanzas/arrendamientos/${contrato.id}/pagos?empresa_id=${empresaId()}`);
      setHistorialPagos(res.data || []);
    } catch (err) {
      console.error('Error cargando historial de pagos:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Compartir Comprobante por WhatsApp
  const compartirWhatsApp = (contrato, mesItem = null) => {
    const esArrendador = contrato.tipo === 'ARRENDADOR';
    let texto = '';
    if (mesItem && mesItem.estado === 'pagado') {
      texto = encodeURIComponent(
        `*RECIBO DE ARRENDAMIENTO*\n\n` +
        `🏢 *Inmueble:* ${contrato.inmueble_nombre}\n` +
        `👤 *${esArrendador ? 'Inquilino' : 'Propietario'}:* ${contrato.contraparte_nombre}\n` +
        `📅 *Periodo:* ${mesItem.nombre_mes} ${mesItem.anio}\n` +
        `💵 *Canon Base:* ${formatMoney(mesItem.canon_base)}\n` +
        (mesItem.mora_calculada > 0 ? `⚠️ *Recargo por Mora:* ${formatMoney(mesItem.mora_calculada)}\n` : '') +
        `✅ *Total Pagado:* ${formatMoney(mesItem.monto_total_estimado)}\n` +
        `🗓️ *Fecha Pago Real:* ${mesItem.fecha_pago_real || 'Registrado'}\n\n` +
        `_Comprobante emitido desde la Plataforma SaaS Corporativa._`
      );
    } else {
      texto = encodeURIComponent(
        `*ESTADO DE CONTRATO DE ARRENDAMIENTO*\n\n` +
        `🏢 *Inmueble:* ${contrato.inmueble_nombre}\n` +
        `👤 *${esArrendador ? 'Inquilino' : 'Propietario'}:* ${contrato.contraparte_nombre}\n` +
        `💵 *Canon Mensual:* ${formatMoney(contrato.canon_mensual)}\n` +
        `📅 *Día Límite de Pago:* Día ${contrato.dia_pago_limite} de cada mes\n` +
        `📊 *Total Historico Pagado:* ${formatMoney(contrato.total_pagado_historico)}\n\n` +
        `_Mensaje enviado desde la Plataforma Corporativa de Facturación._`
      );
    }
    const phone = contrato.telefono ? contrato.telefono.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone ? '503' + phone : ''}?text=${texto}`, '_blank');
  };

  // Filtrado de contratos
  const contratosFiltrados = contratos.filter(c => {
    const matchSearch =
      c.inmueble_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contraparte_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.dui_nit && c.dui_nit.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (filtroTipo === 'TODOS') return true;
    return c.tipo === filtroTipo;
  });

  // KPIs
  const totalActivos = contratos.filter(c => c.estado === 'activo').length;
  const canonTotalArrendatario = contratos
    .filter(c => c.estado === 'activo' && c.tipo === 'ARRENDATARIO')
    .reduce((acc, c) => acc + (c.canon_mensual || 0), 0);
  const canonTotalArrendador = contratos
    .filter(c => c.estado === 'activo' && c.tipo === 'ARRENDADOR')
    .reduce((acc, c) => acc + (c.canon_mensual || 0), 0);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24 font-sans">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <Building className="w-7 h-7 text-indigo-600" />
            Contratos de Arrendamiento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de alquileres de inmuebles, locales y bodegas (cronogramas anuales de 12 meses, fechas límites y recargos por mora).
          </p>
        </div>
        <button
          onClick={abrirNuevoContrato}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Registrar Contrato
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contratos Activos</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalActivos}</p>
          </div>
        </div>

        <div className="bg-white border border-rose-100 bg-rose-50/30 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100/60 rounded-xl flex items-center justify-center text-rose-600 font-bold shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Canon Pagado (Arrendatario)</p>
            <p className="text-2xl font-black text-rose-700 mt-0.5">{formatMoney(canonTotalArrendatario)}/mes</p>
          </div>
        </div>

        <div className="bg-white border border-emerald-100 bg-emerald-50/30 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100/60 rounded-xl flex items-center justify-center text-emerald-600 font-bold shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Canon Cobrado (Arrendador)</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{formatMoney(canonTotalArrendador)}/mes</p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por inmueble, propietario, inquilino o DUI/NIT..."
            className="w-full bg-transparent text-sm font-medium outline-none text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroTipo === 'TODOS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo('ARRENDATARIO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroTipo === 'ARRENDATARIO' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Arrendatario (Pago)
          </button>
          <button
            onClick={() => setFiltroTipo('ARRENDADOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filtroTipo === 'ARRENDADOR' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Arrendador (Cobro)
          </button>
        </div>
      </div>

      {/* Tabla Principal de Contratos */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Cargando contratos de arrendamiento...</div>
      ) : contratosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white border border-slate-200 rounded-2xl">
          <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-700">No se encontraron contratos de arrendamiento</p>
          <p className="text-sm text-slate-400 mt-1">Haga clic en "Registrar Contrato" para agregar el primero.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="px-5 py-3.5">Inmueble / Propiedad</th>
                  <th className="px-5 py-3.5">Rol / Tipo</th>
                  <th className="px-5 py-3.5">Propietario / Inquilino</th>
                  <th className="px-5 py-3.5 text-right">Canon Mensual</th>
                  <th className="px-5 py-3.5 text-center">Día Límite</th>
                  <th className="px-5 py-3.5 text-center">Mora Config.</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {contratosFiltrados.map((c) => {
                  const esArrendador = c.tipo === 'ARRENDADOR';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{c.inmueble_nombre}</span>
                        </div>
                        {c.notas && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{c.notas}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                          esArrendador
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {esArrendador ? 'Arrendador (Cobramos)' : 'Arrendatario (Pagamos)'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-700">{c.contraparte_nombre}</div>
                        <div className="text-xs text-slate-400 flex gap-2 mt-0.5">
                          {c.dui_nit && <span>NIT/DUI: {c.dui_nit}</span>}
                          {c.telefono && <span>Tel: {c.telefono}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-slate-800 text-base">
                        {formatMoney(c.canon_mensual)}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-indigo-600">
                        Día {c.dia_pago_limite}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {c.aplica_mora ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {c.tipo_mora === 'monto_fijo' ? `$${c.valor_mora}` : `${c.valor_mora}%`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin mora</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          c.estado === 'activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.estado ? c.estado.toUpperCase() : 'ACTIVO'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* Botón Principal: Tabla Anual 12 Meses */}
                          <button
                            onClick={() => abrirTablaAnual(c)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all"
                            title="Ver Cronograma Anual de 12 Meses"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Tabla 12 Meses</span>
                          </button>

                          <button
                            onClick={() => abrirHistorial(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Historial General"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => compartirWhatsApp(c)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Compartir por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => abrirEditarContrato(c)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar Contrato"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => eliminarContrato(c)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar Contrato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tabla Anual (Cronograma de 12 Meses de Enero a Diciembre con Spinner de Año) */}
      {modalTablaAnualOpen && contratoActivoTabla && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 border border-slate-100 my-6 max-h-[92vh] flex flex-col">
            
            {/* Header del Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    contratoActivoTabla.tipo === 'ARRENDADOR' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {contratoActivoTabla.tipo === 'ARRENDADOR' ? 'Arrendador (Cobros)' : 'Arrendatario (Pagos)'}
                  </span>
                  <h2 className="text-xl font-bold text-slate-800">
                    Cronograma de Arrendamiento: {contratoActivoTabla.inmueble_nombre}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Contraparte: <span className="font-semibold text-slate-700">{contratoActivoTabla.contraparte_nombre}</span> | Canon Base: <span className="font-bold text-slate-800">{formatMoney(contratoActivoTabla.canon_mensual)}/mes</span> | Día Límite: <span className="font-bold text-indigo-600">Día {contratoActivoTabla.dia_pago_limite}</span>
                </p>
              </div>

              {/* Selector / Spinner de Año */}
              <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
                <button
                  onClick={() => cambiarAnio(anioSeleccionado - 1)}
                  className="p-1.5 bg-white rounded-xl text-slate-700 hover:bg-slate-200 font-bold transition-all shadow-xs"
                  title="Año Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1 px-3 py-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <select
                    value={anioSeleccionado}
                    onChange={(e) => cambiarAnio(parseInt(e.target.value))}
                    className="bg-transparent font-black text-lg text-slate-800 outline-none cursor-pointer"
                  >
                    {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>Año {y}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => cambiarAnio(anioSeleccionado + 1)}
                  className="p-1.5 bg-white rounded-xl text-slate-700 hover:bg-slate-200 font-bold transition-all shadow-xs"
                  title="Año Siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Configuración de Mora Info Banner */}
            {contratoActivoTabla.aplica_mora && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Recargo por Mora Activo:</strong> Se aplicará un recargo del{' '}
                    <strong>{contratoActivoTabla.tipo_mora === 'monto_fijo' ? `$${contratoActivoTabla.valor_mora}` : `${contratoActivoTabla.valor_mora}%`}</strong>{' '}
                    después del día {contratoActivoTabla.dia_pago_limite} de cada mes.
                  </span>
                </div>
                {contratoActivoTabla.dias_gracia > 0 && (
                  <span className="bg-amber-100 font-bold px-2 py-0.5 rounded text-amber-900 shrink-0">
                    {contratoActivoTabla.dias_gracia} días de gracia
                  </span>
                )}
              </div>
            )}

            {/* Tabla de 12 Meses */}
            <div className="mt-4 overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              {cargandoTabla ? (
                <div className="text-center py-16 text-slate-400 font-medium">Cargando cronograma anual del año {anioSeleccionado}...</div>
              ) : !tablaAnualData ? (
                <div className="text-center py-16 text-slate-400">No se pudieron cargar los datos de la tabla anual.</div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs uppercase text-slate-600 font-bold tracking-wider sticky top-0 z-10">
                      <th className="px-4 py-3">Mes (1-12)</th>
                      <th className="px-4 py-3 text-center">Fecha Límite Pago</th>
                      <th className="px-4 py-3 text-right">Canon Base</th>
                      <th className="px-4 py-3 text-right">Recargo por Mora</th>
                      <th className="px-4 py-3 text-right">Monto Total</th>
                      <th className="px-4 py-3 text-center">Fecha Pago Real</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tablaAnualData.tabla.map((item) => {
                      const esPagado = item.estado === 'pagado';
                      const esVencido = item.estado === 'vencido';

                      return (
                        <tr
                          key={item.mes}
                          className={`transition-colors ${
                            esPagado
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                              : esVencido
                              ? 'bg-rose-50/40 hover:bg-rose-50/70'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-800">
                            {item.nombre_mes} {item.anio}
                          </td>

                          <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600">
                            {item.fecha_limite ? formatDate(item.fecha_limite) : 'N/A'}
                          </td>

                          <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                            {formatMoney(item.canon_base)}
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold">
                            {item.mora_calculada > 0 ? (
                              <span className="text-rose-600 font-black flex items-center justify-end gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                +{formatMoney(item.mora_calculada)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">$0.00</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right font-black text-slate-900 text-base">
                            {formatMoney(item.monto_total_estimado)}
                          </td>

                          <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-700">
                            {item.fecha_pago_real ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-bold">
                                <CheckCircle className="w-3 h-3" />
                                {item.fecha_pago_real}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Pendiente</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {esPagado ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                PAGADO
                              </span>
                            ) : esVencido ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                VENCIDO ({item.dias_atraso} días)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                PENDIENTE
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            {!esPagado ? (
                              <button
                                onClick={() => abrirPagoMes(item)}
                                className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 mx-auto shadow-xs transition-all ${
                                  contratoActivoTabla.tipo === 'ARRENDADOR'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                {contratoActivoTabla.tipo === 'ARRENDADOR' ? 'Cobrar Cuota' : 'Pagar Cuota'}
                              </button>
                            ) : (
                              <button
                                onClick={() => compartirWhatsApp(contratoActivoTabla, item)}
                                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-bold border border-emerald-200 inline-flex items-center gap-1"
                                title="Enviar Recibo WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Recibo
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 mt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setModalTablaAnualOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
              >
                Cerrar Cronograma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar / Editar Contrato */}
      {modalContratoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 my-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {contratoEdit ? 'Editar Contrato de Arrendamiento' : 'Nuevo Contrato de Arrendamiento'}
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Inmueble / Propiedad *</label>
                <input
                  type="text"
                  value={formContrato.inmueble_nombre}
                  onChange={(e) => setFormContrato({ ...formContrato, inmueble_nombre: e.target.value })}
                  placeholder="Ej: Local Comercial #4 San Miguelito"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo de Rol *</label>
                  <select
                    value={formContrato.tipo}
                    onChange={(e) => setFormContrato({ ...formContrato, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="ARRENDATARIO">Arrendatario (Nosotros pagamos)</option>
                    <option value="ARRENDADOR">Arrendador (Nosotros cobramos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Día Límite Pago (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formContrato.dia_pago_limite}
                    onChange={(e) => setFormContrato({ ...formContrato, dia_pago_limite: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  {formContrato.tipo === 'ARRENDADOR' ? 'Inquilino / Contraparte *' : 'Propietario / Arrendador *'}
                </label>
                <input
                  type="text"
                  value={formContrato.contraparte_nombre}
                  onChange={(e) => setFormContrato({ ...formContrato, contraparte_nombre: e.target.value })}
                  placeholder="Ej: Inmobiliaria San José S.A. de C.V. / Carlos Pérez"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">DUI / NIT</label>
                  <input
                    type="text"
                    value={formContrato.dui_nit}
                    onChange={(e) => setFormContrato({ ...formContrato, dui_nit: e.target.value })}
                    placeholder="00000000-0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Teléfono Contacto</label>
                  <input
                    type="text"
                    value={formContrato.telefono}
                    onChange={(e) => setFormContrato({ ...formContrato, telefono: e.target.value })}
                    placeholder="7000-0000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Canon Mensual ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formContrato.canon_mensual}
                    onChange={(e) => setFormContrato({ ...formContrato, canon_mensual: e.target.value })}
                    placeholder="500.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Depósito Garantía ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formContrato.deposito_garantia}
                    onChange={(e) => setFormContrato({ ...formContrato, deposito_garantia: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sección de Configuración de Mora */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <label className="flex items-center gap-2 font-bold text-amber-900 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formContrato.aplica_mora}
                    onChange={(e) => setFormContrato({ ...formContrato, aplica_mora: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>Aplicar Recargo por Mora si se vence el día límite</span>
                </label>

                {formContrato.aplica_mora && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Tipo Mora</label>
                      <select
                        value={formContrato.tipo_mora}
                        onChange={(e) => setFormContrato({ ...formContrato, tipo_mora: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white font-semibold text-amber-900"
                      >
                        <option value="porcentaje">Porcentaje (%)</option>
                        <option value="monto_fijo">Monto Fijo ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">
                        {formContrato.tipo_mora === 'monto_fijo' ? 'Monto ($)' : 'Tasa (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formContrato.valor_mora}
                        onChange={(e) => setFormContrato({ ...formContrato, valor_mora: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg font-bold text-amber-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Días Gracia</label>
                      <input
                        type="number"
                        min="0"
                        value={formContrato.dias_gracia}
                        onChange={(e) => setFormContrato({ ...formContrato, dias_gracia: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg font-bold text-amber-900 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formContrato.fecha_inicio}
                    onChange={(e) => setFormContrato({ ...formContrato, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha Fin (Vencimiento)</label>
                  <input
                    type="date"
                    value={formContrato.fecha_fin}
                    onChange={(e) => setFormContrato({ ...formContrato, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas / Observaciones</label>
                <textarea
                  rows="2"
                  value={formContrato.notas}
                  onChange={(e) => setFormContrato({ ...formContrato, notas: e.target.value })}
                  placeholder="Detalles adicionales del contrato..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalContratoOpen(false)}
                className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarContrato}
                disabled={guardando}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar Contrato'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago / Cobro de Mes Específico */}
      {modalPagoOpen && mesPagoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              {contratoActivoTabla.tipo === 'ARRENDADOR' ? 'Registrar Cobro de Cuota' : 'Registrar Pago de Cuota'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Periodo: <span className="font-bold text-indigo-700">{mesPagoSeleccionado.nombre_mes} {mesPagoSeleccionado.anio}</span> | Inmueble: <span className="font-bold text-slate-700">{contratoActivoTabla.inmueble_nombre}</span>
            </p>

            <div className="space-y-3.5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Canon Base ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPago.monto_canon}
                    onChange={(e) => setFormPago({ ...formPago, monto_canon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Recargo Mora ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPago.monto_mora}
                    onChange={(e) => setFormPago({ ...formPago, monto_mora: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-rose-600 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-200">
                <span className="text-xs font-bold text-slate-600 uppercase">Monto Total a Aplicar:</span>
                <span className="text-xl font-black text-slate-900">
                  ${((parseFloat(formPago.monto_canon || '0') + parseFloat(formPago.monto_mora || '0'))).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Método de Pago</label>
                <select
                  value={formPago.metodo_pago}
                  onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="efectivo">Efectivo (Impacta Caja Activa)</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nº Referencia</label>
                  <input
                    type="text"
                    value={formPago.referencia}
                    onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fecha Pago Real</label>
                  <input
                    type="date"
                    value={formPago.fecha_pago}
                    onChange={(e) => setFormPago({ ...formPago, fecha_pago: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notas / Concepto</label>
                <input
                  type="text"
                  value={formPago.notas}
                  onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalPagoOpen(false)}
                className="flex-1 py-2.5 border rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPagoMes}
                disabled={guardando}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {guardando ? 'Registrando...' : 'Confirmar Transacción'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico General */}
      {modalHistorialOpen && contratoActivoHistorial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Historial General de Transacciones</h3>
                <p className="text-xs text-slate-500">
                  Inmueble: <span className="font-bold text-slate-700">{contratoActivoHistorial.inmueble_nombre}</span> ({contratoActivoHistorial.contraparte_nombre})
                </p>
              </div>
              <button onClick={() => setModalHistorialOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {cargandoHistorial ? (
                <div className="text-center py-8 text-slate-400">Cargando historial de pagos...</div>
              ) : historialPagos.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No hay pagos o cobros registrados para este contrato</div>
              ) : (
                historialPagos.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.tipo === 'COBRO_ALQUILER' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.tipo === 'COBRO_ALQUILER' ? 'COBRO RECIBIDO' : 'PAGO REALIZADO'}
                        </span>
                        {p.mes && p.anio && (
                          <span className="text-xs font-bold text-indigo-700">
                            Mes {p.mes}/{p.anio}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">({p.metodo_pago})</span>
                      </div>
                      {p.monto_mora > 0 && (
                        <div className="text-xs text-rose-600 font-bold mt-0.5">
                          Incluye Recargo por Mora: {formatMoney(p.monto_mora)}
                        </div>
                      )}
                      {p.referencia && <div className="text-xs text-slate-500 mt-1">Ref: {p.referencia}</div>}
                      {p.notas && <div className="text-xs text-slate-500">{p.notas}</div>}
                      <div className="text-[11px] text-slate-400 mt-1">{formatDate(p.fecha_pago)}</div>
                    </div>
                    <div className="text-right font-black text-base text-slate-800">
                      {formatMoney(p.monto)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalHistorialOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
