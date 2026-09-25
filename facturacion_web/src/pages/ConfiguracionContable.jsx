import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Settings, Save, CheckCircle, AlertCircle, RefreshCw, BookOpen, Key, Link2, 
  FolderTree, Search, ChevronRight, ChevronDown, Folder, FileText, X, ExternalLink, Sparkles, Check
} from 'lucide-react';

export default function ConfiguracionContable() {
  const [empresaId] = useState(localStorage.getItem('empresa_id') || '');
  const [loading, setLoading] = useState(false);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [catalogoRemoto, setCatalogoRemoto] = useState([]);

  // Estado para el modal de árbol
  const [modalAbierto, setModalAbierto] = useState(false);
  const [campoActivoModal, setCampoActivoModal] = useState(null); // ej: 'cuenta_caja_general'
  const [tituloCampoModal, setTituloCampoModal] = useState('');

  const [formData, setFormData] = useState({
    url_api_contable: 'http://127.0.0.1:8000',
    api_key_empresa: '',
    cuenta_caja_general: '110101',
    cuenta_bancos: '110201',
    cuenta_iva_debito: '210201',
    cuenta_iva_credito: '110601',
    cuenta_cxc_clientes: '110301',
    cuenta_cxp_proveedores: '210101',
    cuenta_ventas_cf: '410101',
    cuenta_ventas_ccf: '410102',
    cuenta_inventario: '110501',
    cuenta_costo_ventas: '510101'
  });

  useEffect(() => {
    cargarConfiguracion();
    cargarCatalogoRemoto();
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/integracion-contable/configuracion?empresa_id=${empresaId}`);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          url_api_contable: res.data.url_api_contable || 'http://127.0.0.1:8000',
          api_key_empresa: res.data.api_key_empresa || '',
          cuenta_caja_general: res.data.cuenta_caja_general || '110101',
          cuenta_bancos: res.data.cuenta_bancos || '110201',
          cuenta_iva_debito: res.data.cuenta_iva_debito || '210201',
          cuenta_iva_credito: res.data.cuenta_iva_credito || '110601',
          cuenta_cxc_clientes: res.data.cuenta_cxc_clientes || '110301',
          cuenta_cxp_proveedores: res.data.cuenta_cxp_proveedores || '210101',
          cuenta_ventas_cf: res.data.cuenta_ventas_cf || '410101',
          cuenta_ventas_ccf: res.data.cuenta_ventas_ccf || '410102',
          cuenta_inventario: res.data.cuenta_inventario || '110501',
          cuenta_costo_ventas: res.data.cuenta_costo_ventas || '510101'
        }));
      }
    } catch (err) {
      console.error("Error al cargar configuracion contable", err);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogoRemoto = async () => {
    setCargandoCatalogo(true);
    setError(null);
    try {
      const res = await api.get(`/api/v1/integracion-contable/catalogo-remoto?empresa_id=${empresaId}`);
      if (res.data && Array.isArray(res.data)) {
        setCatalogoRemoto(res.data);
        setMensaje(`¡Catálogo contable obtenido con éxito! (${res.data.length} cuentas cargadas)`);
      }
    } catch (err) {
      const detalle = err.response?.data?.detail || err.message || "Error desconocido";
      setError(`No se pudo obtener el catálogo remoto: ${detalle}`);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const res = await api.post(`/api/v1/integracion-contable/configuracion?empresa_id=${empresaId}`, formData);
      if (res.data?.exito) {
        setMensaje("Configuración de Integración Contable guardada exitosamente");
      }
    } catch (err) {
      setError("Error al guardar la configuración: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirModalArbol = (fieldName, labelTitle) => {
    setCampoActivoModal(fieldName);
    setTituloCampoModal(labelTitle);
    setModalAbierto(true);
  };

  const seleccionarCuentaModal = (codigoCuenta) => {
    if (campoActivoModal) {
      setFormData(prev => ({ ...prev, [campoActivoModal]: codigoCuenta }));
    }
    setModalAbierto(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Link2 className="w-7 h-7 text-indigo-600" />
            Integración Contable del Ecosistema
          </h1>
          <p className="text-sm text-slate-500">
            Conecta la Facturación con el Núcleo Contable del Ecosistema (<span className="font-semibold text-indigo-600">demiempresa.online</span>).
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Estado de Conexión */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                1. Estado de Conexión del Servidor Contable
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                La comunicación entre Facturación y Contabilidad está sincronizada automáticamente en el ecosistema.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Conexión Automática Activa
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={cargarCatalogoRemoto}
              disabled={cargandoCatalogo}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors border border-indigo-200"
            >
              <RefreshCw className={`w-4 h-4 ${cargandoCatalogo ? 'animate-spin' : ''}`} />
              Recargar Catálogo Contable ({catalogoRemoto.length} Cuentas)
            </button>
          </div>
        </div>

        {/* Card Mapeo de Cuentas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            2. Mapeo Humanizado de Cuentas Contables
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Asigna el nombre y código de cuenta correspondiente de tu Catálogo para cada concepto operativo. Usa la búsqueda en árbol si necesitas explorar el catálogo completo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <CuentaSelectorHumanizado
              label="Caja General (Efectivo)"
              name="cuenta_caja_general"
              value={formData.cuenta_caja_general}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 110101"
              onAbrirArbol={() => abrirModalArbol("cuenta_caja_general", "Caja General (Efectivo)")}
            />
            <CuentaSelectorHumanizado
              label="Bancos / Transferencias"
              name="cuenta_bancos"
              value={formData.cuenta_bancos}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 110201"
              onAbrirArbol={() => abrirModalArbol("cuenta_bancos", "Bancos / Transferencias")}
            />
            <CuentaSelectorHumanizado
              label="Débito Fiscal IVA (13%)"
              name="cuenta_iva_debito"
              value={formData.cuenta_iva_debito}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 210201"
              onAbrirArbol={() => abrirModalArbol("cuenta_iva_debito", "Débito Fiscal IVA (13%)")}
            />
            <CuentaSelectorHumanizado
              label="Crédito Fiscal IVA (Compras)"
              name="cuenta_iva_credito"
              value={formData.cuenta_iva_credito}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 110601"
              onAbrirArbol={() => abrirModalArbol("cuenta_iva_credito", "Crédito Fiscal IVA (Compras)")}
            />
            <CuentaSelectorHumanizado
              label="Cuentas por Cobrar Clientes"
              name="cuenta_cxc_clientes"
              value={formData.cuenta_cxc_clientes}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 110301"
              onAbrirArbol={() => abrirModalArbol("cuenta_cxc_clientes", "Cuentas por Cobrar Clientes")}
            />
            <CuentaSelectorHumanizado
              label="Cuentas por Pagar Proveedores"
              name="cuenta_cxp_proveedores"
              value={formData.cuenta_cxp_proveedores}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 210101"
              onAbrirArbol={() => abrirModalArbol("cuenta_cxp_proveedores", "Cuentas por Pagar Proveedores")}
            />
            <CuentaSelectorHumanizado
              label="Ventas Consumidor Final"
              name="cuenta_ventas_cf"
              value={formData.cuenta_ventas_cf}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 410101"
              onAbrirArbol={() => abrirModalArbol("cuenta_ventas_cf", "Ventas Consumidor Final")}
            />
            <CuentaSelectorHumanizado
              label="Ventas Crédito Fiscal (CCF)"
              name="cuenta_ventas_ccf"
              value={formData.cuenta_ventas_ccf}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 410102"
              onAbrirArbol={() => abrirModalArbol("cuenta_ventas_ccf", "Ventas Crédito Fiscal (CCF)")}
            />
            <CuentaSelectorHumanizado
              label="Inventario de Mercaderías"
              name="cuenta_inventario"
              value={formData.cuenta_inventario}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 110501"
              onAbrirArbol={() => abrirModalArbol("cuenta_inventario", "Inventario de Mercaderías")}
            />
            <CuentaSelectorHumanizado
              label="Costo de Ventas"
              name="cuenta_costo_ventas"
              value={formData.cuenta_costo_ventas}
              onChange={handleChange}
              catalogoRemoto={catalogoRemoto}
              placeholder="Ej: 510101"
              onAbrirArbol={() => abrirModalArbol("cuenta_costo_ventas", "Costo de Ventas")}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Configuración Contable'}
          </button>
        </div>
      </form>

      {/* MODAL ARBOL DE CATALOGO & BUSQUEDA INTELIGENTE */}
      {modalAbierto && (
        <ModalArbolCatalogo
          titulo={tituloCampoModal}
          valorActual={formData[campoActivoModal]}
          catalogoRemoto={catalogoRemoto}
          onSeleccionar={seleccionarCuentaModal}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}

function CuentaSelectorHumanizado({ label, name, value, onChange, catalogoRemoto, placeholder, onAbrirArbol }) {
  const selectedCuenta = catalogoRemoto.find(c => String(c.cuenta_codigo) === String(value));

  return (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-sm">
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
          <button
            type="button"
            onClick={onAbrirArbol}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg shadow-2xs transition-all hover:bg-indigo-50"
            title="Abrir explorador jerárquico de cuentas"
          >
            <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
            Árbol / Buscar
          </button>
        </div>

        {/* Tarjeta de Nombre Humanizado */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Nombre en Catálogo:</span>
          {selectedCuenta ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-slate-800 line-clamp-1" title={selectedCuenta.nombre}>
                {selectedCuenta.nombre}
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded-md shrink-0">
                {selectedCuenta.cuenta_codigo}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {value ? `Código ${value} no hallado` : 'Sin asignar'}
              </span>
              {value && (
                <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-600 rounded-md">
                  {value}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Select Rápido */}
      {catalogoRemoto.length > 0 ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 bg-white shadow-2xs text-slate-700"
        >
          <option value="">-- Seleccionar de la lista ({catalogoRemoto.length}) --</option>
          {catalogoRemoto.map((c) => (
            <option key={c.cuenta_codigo} value={c.cuenta_codigo}>
              {c.nombre} ({c.cuenta_codigo}) {!c.permite_movimiento ? '- Resumen' : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}


function ModalArbolCatalogo({ titulo, valorActual, catalogoRemoto, onSeleccionar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('');
  const [nodosAbiertos, setNodosAbiertos] = useState({});

  // Construir jerarquía de árbol
  const arbolJerarquico = useMemo(() => {
    if (!catalogoRemoto || catalogoRemoto.length === 0) return [];

    const ordenadas = [...catalogoRemoto].sort((a, b) => 
      String(a.cuenta_codigo).localeCompare(String(b.cuenta_codigo))
    );

    const map = {};
    const raices = [];

    ordenadas.forEach(item => {
      map[item.cuenta_codigo] = { ...item, hijos: [] };
    });

    ordenadas.forEach(item => {
      const node = map[item.cuenta_codigo];
      let parentFound = false;
      const codeStr = String(item.cuenta_codigo);

      for (let len = codeStr.length - 1; len >= 1; len--) {
        const parentCode = codeStr.substring(0, len);
        if (map[parentCode]) {
          map[parentCode].hijos.push(node);
          parentFound = true;
          break;
        }
      }
      if (!parentFound) {
        raices.push(node);
      }
    });

    return raices;
  }, [catalogoRemoto]);

  // Lista de coincidencia filtrada por búsqueda
  const resultadosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return null;
    const term = busqueda.toLowerCase().trim();
    return catalogoRemoto.filter(c => 
      String(c.cuenta_codigo).toLowerCase().includes(term) ||
      String(c.nombre).toLowerCase().includes(term)
    );
  }, [busqueda, catalogoRemoto]);

  const toggleNodo = (codigo) => {
    setNodosAbiertos(prev => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const expandirTodo = () => {
    const todos = {};
    catalogoRemoto.forEach(c => { todos[c.cuenta_codigo] = true; });
    setNodosAbiertos(todos);
  };

  const colapsarTodo = () => {
    setNodosAbiertos({});
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-400/30">
              <FolderTree className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Explorador de Catálogo Contable
              </h3>
              <p className="text-xs text-indigo-200/80">
                Selecciona la cuenta para: <span className="font-bold text-white uppercase">{titulo}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Búsqueda Inteligente */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Búsqueda inteligente por nombre o código (ej: 1101, Caja, IVA, Ventas)..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium shadow-2xs"
              autoFocus
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="absolute right-3 top-3 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {resultadosFiltrados 
                ? `Encontradas ${resultadosFiltrados.length} coincidencia(s)`
                : `Mostrando catálogo completo (${catalogoRemoto.length} cuentas)`
              }
            </span>
            {!resultadosFiltrados && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandirTodo}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Expandir Árbol
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={colapsarTodo}
                  className="text-slate-600 hover:underline font-semibold"
                >
                  Colapsar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cuerpo con Scroll (Resultados o Árbol Jerárquico) */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 font-sans">
          {resultadosFiltrados ? (
            // Vista de Resultados Filtrados por Búsqueda
            resultadosFiltrados.length > 0 ? (
              <div className="space-y-1.5">
                {resultadosFiltrados.map(cuenta => (
                  <ItemCuentaResultado
                    key={cuenta.cuenta_codigo}
                    cuenta={cuenta}
                    seleccionada={String(cuenta.cuenta_codigo) === String(valorActual)}
                    onSeleccionar={() => onSeleccionar(cuenta.cuenta_codigo)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center space-y-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <h4 className="font-bold text-sm">No se encontró la cuenta "{busqueda}"</h4>
                <p className="text-xs text-amber-800 max-w-md mx-auto">
                  Si la cuenta requerida no existe en tu Catálogo, puedes agregarla directamente desde el módulo de Contabilidad.
                </p>
                <a
                  href="https://conta.demiempresa.online"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ir a Contabilidad para Crear Cuenta
                </a>
              </div>
            )
          ) : (
            // Vista de Árbol Jerárquico Completo
            arbolJerarquico.map(nodo => (
              <NodoArbolItem
                key={nodo.cuenta_codigo}
                nodo={nodo}
                nodosAbiertos={nodosAbiertos}
                toggleNodo={toggleNodo}
                valorActual={valorActual}
                onSeleccionar={onSeleccionar}
              />
            ))
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Las cuentas marcadas como <span className="font-semibold text-slate-700">Detalle</span> permiten movimientos contables.
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

function NodoArbolItem({ nodo, nodosAbiertos, toggleNodo, valorActual, onSeleccionar }) {
  const tieneHijos = nodo.hijos && nodo.hijos.length > 0;
  const estaAbierto = !!nodosAbiertos[nodo.cuenta_codigo];
  const esSeleccionado = String(nodo.cuenta_codigo) === String(valorActual);

  return (
    <div className="select-none">
      <div 
        className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
          esSeleccionado 
            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs font-bold' 
            : 'hover:bg-slate-100 border-transparent text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {tieneHijos ? (
            <button
              type="button"
              onClick={() => toggleNodo(nodo.cuenta_codigo)}
              className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors"
            >
              {estaAbierto ? (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}

          {tieneHijos ? (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          )}

          <span className="font-mono text-xs font-bold text-slate-500 shrink-0">
            {nodo.cuenta_codigo}
          </span>
          <span className={`text-xs truncate ${nodo.permite_movimiento ? 'font-semibold text-slate-900' : 'font-bold text-slate-600'}`}>
            {nodo.nombre}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!nodo.permite_movimiento && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
              Resumen
            </span>
          )}
          
          <button
            type="button"
            onClick={() => onSeleccionar(nodo.cuenta_codigo)}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              esSeleccionado
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200'
            }`}
          >
            {esSeleccionado ? (
              <>
                <Check className="w-3.5 h-3.5" /> Seleccionada
              </>
            ) : (
              'Seleccionar'
            )}
          </button>
        </div>
      </div>

      {tieneHijos && estaAbierto && (
        <div className="pl-5 border-l-2 border-indigo-100 ml-4 my-1 space-y-1">
          {nodo.hijos.map(hijo => (
            <NodoArbolItem
              key={hijo.cuenta_codigo}
              nodo={hijo}
              nodosAbiertos={nodosAbiertos}
              toggleNodo={toggleNodo}
              valorActual={valorActual}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCuentaResultado({ cuenta, seleccionada, onSeleccionar }) {
  return (
    <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
      seleccionada 
        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs' 
        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-100 text-indigo-800 rounded-xl shrink-0">
          {cuenta.cuenta_codigo}
        </span>
        <div className="min-w-0">
          <h5 className="text-xs font-bold text-slate-800 truncate">{cuenta.nombre}</h5>
          <span className="text-[10px] text-slate-400">
            {cuenta.permite_movimiento ? 'Cuenta de Detalle (Permite Movimiento)' : 'Cuenta de Resumen (Jerárquica)'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSeleccionar}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
          seleccionada
            ? 'bg-indigo-600 text-white shadow-2xs'
            : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200'
        }`}
      >
        {seleccionada ? (
          <>
            <Check className="w-3.5 h-3.5" /> Seleccionada
          </>
        ) : (
          'Seleccionar'
        )}
      </button>
    </div>
  );
}
