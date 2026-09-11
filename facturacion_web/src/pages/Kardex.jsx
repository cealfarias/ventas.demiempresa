import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookOpen, Search, ArrowRightLeft, TrendingUp, TrendingDown, RefreshCcw, 
  Eye, Filter, Loader2, X, Package, ChevronDown, Check, Info, DollarSign, Boxes, Tag,
  ShieldAlert, AlertTriangle, CheckCircle2, Lock
} from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

export default function Kardex() {
  const location = useLocation();
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtroProd, setFiltroProd] = useState(location.state?.producto_id?.toString() || '');
  const [filtroBodega, setFiltroBodega] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Estado para buscador de productos tipo Autocomplete/Combobox
  const [prodSearchInput, setProdSearchInput] = useState('');
  const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false);
  const prodDropdownRef = useRef(null);

  // Estado para el modal de detalles
  const [movimientoActivo, setMovimientoActivo] = useState(null);

  // Verificación de Rol del usuario (Administrador vs Empleado)
  const userRole = (localStorage.getItem('rol') || '').toLowerCase();
  const esAdmin = !userRole || userRole === 'admin' || userRole === 'administrador' || userRole === 'propietario' || userRole === 'superadmin';

  // Estado para recalculador de saldos e informe de stock negativo
  const anioActual = new Date().getFullYear();
  const [recalculando, setRecalculando] = useState(false);
  const [informeData, setInformeData] = useState(null);
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [incluirVentasSinBodega, setIncluirVentasSinBodega] = useState(true);
  const [fechaDesdeRetro, setFechaDesdeRetro] = useState(`${anioActual}-01-01`);
  // Filtros de fecha principal en pantalla de Kardex
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(`${anioActual}-01-01`);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const cargarDatos = async (fDesde = filtroFechaDesde, fHasta = filtroFechaHasta) => {
    setCargando(true);
    try {
      let urlMov = `/api/v1/almacen/kardex/movimientos?empresa_id=${empresaId()}`;
      if (fDesde) urlMov += `&fecha_desde=${fDesde}`;
      if (fHasta) urlMov += `&fecha_hasta=${fHasta}`;

      const [resM, resP, resB] = await Promise.all([
        api.get(urlMov),
        api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`)
      ]);
      setMovimientos(resM.data || []);
      setProductos(resP.data || []);
      setBodegas(resB.data || []);
    } catch (e) {
      console.error("Error cargando Kardex:", e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos(filtroFechaDesde, filtroFechaHasta);
  }, [filtroFechaDesde, filtroFechaHasta]);

  const handleRecalcularSaldos = async (incluirVentas = incluirVentasSinBodega) => {
    setShowAdminModal(false);
    setRecalculando(true);
    setMensajeExito('');
    try {
      const payload = {
        empresa_id: empresaId(),
        producto_id: filtroProd ? parseInt(filtroProd) : null,
        bodega_id: filtroBodega ? bodegas.find(b => b.nombre === filtroBodega)?.id : null,
        incluir_ventas_sin_bodega: incluirVentas,
        fecha_desde: incluirVentas && fechaDesdeRetro ? fechaDesdeRetro : null,
        fecha_hasta: incluirVentas && fechaHastaRetro ? fechaHastaRetro : null
      };

      const res = await api.post('/api/v1/almacen/kardex/recalcular-saldos', payload);
      await cargarDatos();

      if (res.data?.tiene_negativos || res.data?.informe_negativos?.length > 0) {
        setInformeData(res.data);
        setShowInformeModal(true);
      } else {
        setMensajeExito(res.data?.mensaje || 'Saldos de kardex y existencias maestras recalculados exitosamente.');
        setTimeout(() => setMensajeExito(''), 6000);
      }
    } catch (e) {
      console.error("Error al recalcular saldos:", e);
      alert("Error al recalcular saldos: " + (e.response?.data?.detail || e.message));
    } finally {
      setRecalculando(false);
    }
  };

  // Cerrar el dropdown de productos al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (prodDropdownRef.current && !prodDropdownRef.current.contains(event.target)) {
        setIsProdDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Producto seleccionado actualmente
  const productoSeleccionado = productos.find(p => 
    (p.id_producto || p.id)?.toString() === filtroProd
  );

  // Filtrado rápido de productos para la lista del Autocomplete (máximo 40 resultados en DOM)
  const productosFiltradosCombobox = productos.filter(p => {
    if (!prodSearchInput.trim()) return true;
    const term = prodSearchInput.toLowerCase();
    const codigo = (p.codigo || '').toLowerCase();
    const nombre = (p.nombre || '').toLowerCase();
    return codigo.includes(term) || nombre.includes(term);
  }).slice(0, 40);

  // Helper seguro para extraer fecha YYYY-MM-DD sin lanzar excepciones
  const getFechaIso = (fecha) => {
    if (!fecha) return '';
    if (typeof fecha === 'string' && fecha.length >= 10 && fecha[4] === '-' && fecha[7] === '-') {
      return fecha.slice(0, 10);
    }
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch (e) {
      return '';
    }
  };

  const getFechaDisplay = (fecha) => {
    if (!fecha) return '-';
    try {
      const d = new Date(fecha);
      return isNaN(d.getTime()) ? String(fecha) : d.toLocaleString();
    } catch (e) {
      return String(fecha || '-');
    }
  };

  // 1. Filtrar por producto, bodega, fecha y búsqueda inteligente
  const movimientosFiltrados = movimientos.filter(m => {
    let cumple = true;
    if (filtroProd && m.producto_id?.toString() !== filtroProd) cumple = false;
    if (filtroBodega && m.bodega_nombre !== filtroBodega) cumple = false;
    
    const fMov = getFechaIso(m.fecha);
    if (filtroFechaDesde && fMov) {
      if (fMov < filtroFechaDesde) cumple = false;
    }
    if (filtroFechaHasta && fMov) {
      if (fMov > filtroFechaHasta) cumple = false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const textMatches = (
        (m.producto_nombre || '').toLowerCase().includes(term) ||
        (m.producto_codigo || '').toLowerCase().includes(term) ||
        (m.notas || '').toLowerCase().includes(term) ||
        (m.referencia_tipo || '').toLowerCase().includes(term)
      );
      if (!textMatches) cumple = false;
    }
    return cumple;
  });

  // 2. Calcular movimientos procesados (Promedio Ponderado / Saldos)
  const getMovimientosProcesados = () => {
    if (!filtroProd) {
      return movimientosFiltrados.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    }

    const ordenadosAsc = [...movimientosFiltrados].sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
    let saldo_cant = 0;
    let saldo_valor = 0;
    
    const procesados = ordenadosAsc.map(m => {
      let in_cant = 0, in_unit = 0, in_total = 0;
      let out_cant = 0, out_unit = 0, out_total = 0;
      const tipoMov = (m.tipo_movimiento || '').toUpperCase();
      
      if (tipoMov.includes('ENTRADA') || tipoMov.includes('POSITIVO')) {
        in_cant = m.cantidad || 0;
        in_unit = m.costo_unitario || 0;
        in_total = (m.costo_total && m.costo_total > 0) ? m.costo_total : (in_cant * in_unit);
        saldo_cant += in_cant;
        saldo_valor += in_total;
      } else {
        out_cant = m.cantidad || 0;
        out_unit = (m.costo_unitario || 0) > 0 ? m.costo_unitario : (saldo_cant > 0 ? saldo_valor / saldo_cant : 0);
        out_total = out_cant * out_unit;
        saldo_cant -= out_cant;
        saldo_valor -= out_total;
      }
      const saldo_unit = saldo_cant > 0 ? saldo_valor / saldo_cant : 0;
      
      return {
        ...m,
        in_cant, in_unit, in_total,
        out_cant, out_unit, out_total,
        saldo_cant, saldo_unit, saldo_total: saldo_valor
      };
    });
    
    return procesados.reverse();
  };

  const movimientosOrdenados = getMovimientosProcesados();

  // Métricas del producto seleccionado (si hay filtroProd activo)
  const ultimoEstadoProd = filtroProd && movimientosOrdenados.length > 0 ? movimientosOrdenados[0] : null;
  const totalEntradasProd = filtroProd ? movimientosOrdenados.reduce((acc, m) => acc + (m.in_cant || 0), 0) : 0;
  const totalSalidasProd = filtroProd ? movimientosOrdenados.reduce((acc, m) => acc + (m.out_cant || 0), 0) : 0;

  // 3. Paginación
  const totalPages = Math.ceil(movimientosOrdenados.length / itemsPerPage);
  const paginatedMovimientos = movimientosOrdenados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getMovIcon = (tipo) => {
    const t = (tipo || '').toUpperCase();
    if (t.includes('ENTRADA') || t.includes('COMPRA')) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (t.includes('SALIDA') || t.includes('VENTA')) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <RefreshCcw className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Kardex (Libro Mayor de Inventario)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Auditoría completa de movimientos de inventario, stock y costeo ponderado</p>
        </div>

        {esAdmin ? (
          <button
            onClick={() => setShowAdminModal(true)}
            disabled={recalculando}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl shadow-md font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50 self-start sm:self-auto"
            title="Configurar y actualizar existencias maestras desde Kardex (Control Administrador)"
          >
            {recalculando ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <RefreshCcw className="w-4 h-4 text-indigo-200" />
            )}
            {recalculando ? 'Recalculando Existencias...' : (filtroProd ? 'Recalcular Saldo (Admin)' : 'Actualizar Saldos (Admin)')}
          </button>
        ) : (
          <div className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs flex items-center gap-1.5 font-medium shadow-sm self-start sm:self-auto">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Recálculo de existencias exclusivo de Administrador</span>
          </div>
        )}
      </div>

      {mensajeExito && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros Inteligente */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-20">
        
        {/* 1. Selector de Producto - Combobox Profesional */}
        <div className="relative" ref={prodDropdownRef}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Buscar Producto ({productos.length} disp.)
          </label>
          <div 
            className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all"
            onClick={() => setIsProdDropdownOpen(true)}
          >
            <Package className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
            
            {productoSeleccionado && !isProdDropdownOpen ? (
              <div className="flex items-center justify-between flex-1 min-w-0 pr-1">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  <span className="font-bold text-indigo-600 mr-1.5">[{productoSeleccionado.codigo}]</span>
                  {productoSeleccionado.nombre}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiltroProd('');
                    setProdSearchInput('');
                    setCurrentPage(1);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-full transition-colors"
                  title="Quitar filtro de producto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder={productoSeleccionado ? `${productoSeleccionado.codigo} - ${productoSeleccionado.nombre}` : "Escriba código o nombre de producto..."}
                value={prodSearchInput}
                onChange={(e) => {
                  setProdSearchInput(e.target.value);
                  setIsProdDropdownOpen(true);
                }}
                onFocus={() => setIsProdDropdownOpen(true)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 focus:ring-0 p-0"
              />
            )}
            
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-1 ${isProdDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Menú desplegable autocomplete */}
          {isProdDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
              <div 
                className={`p-2.5 text-xs font-semibold cursor-pointer flex items-center justify-between hover:bg-indigo-50 transition-colors ${!filtroProd ? 'bg-indigo-50/70 text-indigo-700' : 'text-slate-600'}`}
                onClick={() => {
                  setFiltroProd('');
                  setProdSearchInput('');
                  setIsProdDropdownOpen(false);
                  setCurrentPage(1);
                }}
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-500" />
                  <span>Todos los productos (Vista General)</span>
                </div>
                {!filtroProd && <Check className="w-4 h-4 text-indigo-600" />}
              </div>

              {productosFiltradosCombobox.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron productos con "{prodSearchInput}"
                </div>
              ) : (
                productosFiltradosCombobox.map(p => {
                  const pId = (p.id_producto || p.id)?.toString();
                  const isSelected = pId === filtroProd;
                  return (
                    <div
                      key={pId || p.codigo}
                      onClick={() => {
                        setFiltroProd(pId);
                        setProdSearchInput('');
                        setIsProdDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`p-2.5 text-xs cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/70 font-semibold text-indigo-700' : 'text-slate-700'}`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600 rounded">
                            {p.codigo}
                          </span>
                          <span className="font-medium truncate">{p.nombre}</span>
                        </div>
                        {p.precio_venta && (
                          <span className="text-[10px] text-slate-400 mt-0.5">Precio: ${Number(p.precio_venta).toFixed(2)}</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                    </div>
                  );
                })
              )}
              {productos.length > 40 && !prodSearchInput && (
                <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50 border-t">
                  Mostrando los primeros 40 productos. Escriba para filtrar...
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Selector de Bodega */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Bodega / Almacén
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              value={filtroBodega} 
              onChange={e => { setFiltroBodega(e.target.value); setCurrentPage(1); }} 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium p-0 text-slate-800"
            >
              <option value="">Todas las bodegas...</option>
              {bodegas.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* 3. Selector de Fecha Desde - Hasta */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Periodo (Desde / Hasta)
            </label>
            {filtroFechaDesde && (
              <button 
                type="button" 
                onClick={() => { setFiltroFechaDesde(''); setFiltroFechaHasta(''); }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Limpiar fecha
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <input 
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => { setFiltroFechaDesde(e.target.value); setCurrentPage(1); }}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
              title="Fecha inicial de consulta de Kardex"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input 
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => { setFiltroFechaHasta(e.target.value); setCurrentPage(1); }}
              className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium"
              title="Fecha final (opcional)"
            />
          </div>
        </div>

        {/* 4. Búsqueda por documento / nota */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Búsqueda General
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text"
              placeholder="Buscar doc #, nota o concepto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 focus:ring-0 p-0"
            />
          </div>
        </div>

      </div>

      {/* Tarjeta de Información del Producto Seleccionado */}
      {productoSeleccionado && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md mb-6 border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
            <Package className="w-64 h-64" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Información Principal del Producto */}
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold rounded-lg tracking-wider">
                  CÓD: {productoSeleccionado.codigo}
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" /> Kardex Individual
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{productoSeleccionado.nombre}</h2>
              {productoSeleccionado.descripcion && (
                <p className="text-xs text-slate-300 line-clamp-1">{productoSeleccionado.descripcion}</p>
              )}
            </div>

            {/* KPIs de Stock y Costeo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
              <div className="px-3 border-r border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Stock Actual</p>
                <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
                  {ultimoEstadoProd ? Number(Number(ultimoEstadoProd.saldo_cant).toFixed(4)).toString() : 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">uds</span>
                </p>
              </div>

              <div className="px-3 border-r border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Costo Prom. Ponderado</p>
                <p className="text-lg font-bold text-indigo-300 mt-0.5">
                  ${ultimoEstadoProd ? Number(ultimoEstadoProd.saldo_unit).toFixed(4) : '0.0000'}
                </p>
              </div>

              <div className="px-3 border-r border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Valor Total Inventario</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  ${ultimoEstadoProd ? Number(ultimoEstadoProd.saldo_total).toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="px-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Flujo Entradas / Salidas</p>
                <p className="text-xs font-semibold mt-1.5 flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />+{totalEntradasProd}</span>
                  <span className="text-rose-400 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />-{totalSalidasProd}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Movimientos */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center bg-white rounded-2xl border shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          Cargando Kardex...
        </div>
      ) : movimientosOrdenados.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border shadow-sm">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
          <p className="font-semibold text-slate-700">No hay movimientos registrados que coincidan con la búsqueda</p>
          <p className="text-xs text-slate-400 mt-1">Intenta cambiando de producto, bodega o limpiando los filtros</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {filtroProd ? (
              /* TABLA KARDEX INDIVIDUAL (Promedio Ponderado en 3 Columnas principales) */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b">
                    <th className="px-4 py-3 border-r" rowSpan="2">Fecha / Movimiento</th>
                    <th className="px-3 py-2 border-r text-center bg-emerald-50 text-emerald-700" colSpan="3">ENTRADAS</th>
                    <th className="px-3 py-2 border-r text-center bg-rose-50 text-rose-700" colSpan="3">SALIDAS</th>
                    <th className="px-3 py-2 text-center bg-indigo-50 text-indigo-700" colSpan="3">SALDOS (Prom. Ponderado)</th>
                  </tr>
                  <tr className="bg-slate-50 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b">
                    <th className="px-2 py-2 border-r bg-emerald-50/50">Cant</th>
                    <th className="px-2 py-2 border-r bg-emerald-50/50">C.Unit</th>
                    <th className="px-2 py-2 border-r bg-emerald-50/50">Total</th>
                    <th className="px-2 py-2 border-r bg-rose-50/50">Cant</th>
                    <th className="px-2 py-2 border-r bg-rose-50/50">C.Unit</th>
                    <th className="px-2 py-2 border-r bg-rose-50/50">Total</th>
                    <th className="px-2 py-2 border-r bg-indigo-50/50">Cant</th>
                    <th className="px-2 py-2 border-r bg-indigo-50/50">C.Prom</th>
                    <th className="px-2 py-2 bg-indigo-50/50">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMovimientos.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 text-sm">
                      <td className="px-4 py-3 border-r">
                        <div className="text-xs text-slate-500 font-medium">{getFechaDisplay(m.fecha)}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {getMovIcon(m.tipo_movimiento)}
                          <span className="font-semibold text-slate-700 text-xs">{(m.tipo_movimiento || '').replace('_', ' ')}</span>
                        </div>
                        {m.referencia_tipo && (
                          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">{m.referencia_tipo} #{m.referencia_id}</div>
                        )}
                        <div className="text-[10px] text-slate-400">{m.bodega_nombre}</div>
                      </td>
                      
                      {/* Entradas */}
                      <td className="px-2 py-3 text-right border-r font-semibold text-emerald-600 bg-emerald-50/10">{m.in_cant > 0 ? m.in_cant : ''}</td>
                      <td className="px-2 py-3 text-right border-r text-slate-500 text-xs bg-emerald-50/10">{m.in_cant > 0 ? '$' + Number(m.in_unit || 0).toFixed(4) : ''}</td>
                      <td className="px-2 py-3 text-right border-r font-semibold text-emerald-700 text-xs bg-emerald-50/10">{m.in_cant > 0 ? '$' + Number(m.in_total || 0).toFixed(2) : ''}</td>
                      
                      {/* Salidas */}
                      <td className="px-2 py-3 text-right border-r font-semibold text-rose-600 bg-rose-50/10">{m.out_cant > 0 ? m.out_cant : ''}</td>
                      <td className="px-2 py-3 text-right border-r text-slate-500 text-xs bg-rose-50/10">{m.out_cant > 0 ? '$' + Number(m.out_unit || 0).toFixed(4) : ''}</td>
                      <td className="px-2 py-3 text-right border-r font-semibold text-rose-700 text-xs bg-rose-50/10">{m.out_cant > 0 ? '$' + Number(m.out_total || 0).toFixed(2) : ''}</td>
                      
                      {/* Saldos */}
                      <td className="px-2 py-3 text-right border-r font-bold text-indigo-700 bg-indigo-50/30">{Number(Number(m.saldo_cant || 0).toFixed(4)).toString()}</td>
                      <td className="px-2 py-3 text-right border-r text-slate-700 text-xs bg-indigo-50/30 font-mono">{'$' + Number(m.saldo_unit || 0).toFixed(4)}</td>
                      <td className="px-2 py-3 text-right font-extrabold text-indigo-800 text-xs bg-indigo-50/30">{'$' + Number(m.saldo_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* TABLA KARDEX GENERAL (Todos los productos) */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-5 py-3.5">Bodega</th>
                    <th className="px-5 py-3.5">Movimiento</th>
                    <th className="px-5 py-3.5 text-right">Cant.</th>
                    <th className="px-5 py-3.5 text-right">Costo Unit.</th>
                    <th className="px-5 py-3.5 text-right">Stock Final</th>
                    <th className="px-5 py-3.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMovimientos.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{getFechaDisplay(m.fecha)}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 border text-[11px] font-mono text-slate-600 rounded">
                            {m.producto_codigo}
                          </span>
                          <span className="truncate max-w-[200px]">{m.producto_nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{m.bodega_nombre}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {getMovIcon(m.tipo_movimiento)}
                          <span className="text-xs font-bold text-slate-700">{(m.tipo_movimiento || '').replace('_', ' ')}</span>
                        </div>
                        {m.referencia_tipo && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{m.referencia_tipo} #{m.referencia_id}</p>}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">
                        <span className={(m.tipo_movimiento || '').includes('SALIDA') ? 'text-rose-600' : 'text-emerald-600'}>
                          {(m.tipo_movimiento || '').includes('SALIDA') ? '-' : '+'}{m.cantidad}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-600 font-mono">
                        {m.costo_unitario > 0 ? '$' + Number(m.costo_unitario).toFixed(4) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-indigo-700 bg-indigo-50/30">
                        {m.stock_resultante || m.saldo_cantidad || 0}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => {
                              setFiltroProd(m.producto_id?.toString() || '');
                              setCurrentPage(1);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                            title="Filtrar Kardex de este producto"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            Kardex
                          </button>
                          <button 
                            onClick={() => setMovimientoActivo(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver Detalle Documento"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer paginación */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
            <span className="text-xs font-medium text-slate-600">
              Mostrando <strong className="text-slate-800">{paginatedMovimientos.length}</strong> de <strong className="text-slate-800">{movimientosOrdenados.length}</strong> movimientos
            </span>
            <div className="flex gap-1 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Movimiento */}
      {movimientoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Detalle del Movimiento
              </h3>
              <button onClick={() => setMovimientoActivo(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Producto</p>
                <p className="font-bold text-slate-800 text-sm">
                  <span className="text-indigo-600 font-mono mr-1">[{movimientoActivo.producto_codigo}]</span>
                  {movimientoActivo.producto_nombre}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Fecha</p>
                  <p className="font-medium text-slate-700 text-xs">{getFechaDisplay(movimientoActivo.fecha)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Bodega</p>
                  <p className="font-medium text-slate-700 text-xs">{movimientoActivo.bodega_nombre}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center gap-2 mb-3">
                  {getMovIcon(movimientoActivo.tipo_movimiento)}
                  <span className="font-bold text-slate-800 text-sm">{(movimientoActivo.tipo_movimiento || '').replace('_', ' ')}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-slate-500">Documento Ref:</span>
                  <span className="font-bold text-right text-indigo-600">{movimientoActivo.referencia_tipo || 'N/A'} #{movimientoActivo.referencia_id || ''}</span>
                  
                  <span className="text-slate-500">Unidades:</span>
                  <span className="font-semibold text-right">{movimientoActivo.cantidad}</span>
                  
                  <span className="text-slate-500">Costo Unitario:</span>
                  <span className="font-mono text-right">{'$' + Number(movimientoActivo.costo_unitario).toFixed(4)}</span>
                  
                  <span className="text-slate-500">Costo Total:</span>
                  <span className="font-bold text-right text-indigo-600">{'$' + Number(movimientoActivo.costo_total || (movimientoActivo.costo_unitario * movimientoActivo.cantidad)).toFixed(2)}</span>
                </div>
              </div>

              {movimientoActivo.notas && (
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Notas / Observaciones</p>
                  <p className="text-xs text-slate-700 bg-amber-50/80 p-3 rounded-xl border border-amber-200">{movimientoActivo.notas}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setMovimientoActivo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informe de Stock Negativo / Descuadre */}
      {showInformeModal && informeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-amber-200" />
                <div>
                  <h3 className="font-bold text-base">Informe de Stock Negativo / Descuadre en Kardex</h3>
                  <p className="text-xs text-amber-100">Se detectaron inconsistencias donde las salidas superan a las entradas</p>
                </div>
              </div>
              <button onClick={() => setShowInformeModal(false)} className="text-amber-100 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Protección de existencias maestras activa:
                </p>
                <p>
                  El sistema NO ha modificado las existencias maestras a valores negativos para evitar alterar su inventario real. Por favor revise los siguientes productos y registre un ajuste de entrada o verifique si falta ingresar órdenes de compra:
                </p>
              </div>

              <div className="border rounded-xl overflow-hidden bg-slate-50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b">
                      <th className="p-3">Código</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Bodega</th>
                      <th className="p-3 text-right">Entradas</th>
                      <th className="p-3 text-right">Salidas</th>
                      <th className="p-3 text-right text-rose-700">Stock Resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {informeData.informe_negativos.map((item, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/50">
                        <td className="p-3 font-mono font-bold text-slate-700">{item.producto_codigo}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.producto_nombre}</td>
                        <td className="p-3 text-slate-600">{item.bodega_nombre}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">+{item.total_entradas}</td>
                        <td className="p-3 text-right text-rose-600 font-bold">-{item.total_salidas}</td>
                        <td className="p-3 text-right text-rose-700 font-extrabold bg-rose-50 font-mono">
                          {item.stock_calculado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Total de inconsistencias: <strong className="text-rose-600">{informeData.informe_negativos.length}</strong>
              </span>
              <button
                onClick={() => setShowInformeModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración y Control para Administrador */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Control de Recálculo y Existencias (Admin)</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 leading-relaxed">
                <p className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" /> Autoridad sobre movimientos de inventario:
                </p>
                <span>Como Administrador, usted decide qué movimientos influyen en el saldo final de existencias maestras de sus productos.</span>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={incluirVentasSinBodega}
                    onChange={e => setIncluirVentasSinBodega(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors">
                      Incluir ventas realizadas "Sin descontar inventario"
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Si está marcado, las facturas registradas sin bodega se asignarán a la bodega principal y descontarán existencias en este recálculo.
                    </span>
                  </div>
                </label>

                {incluirVentasSinBodega && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                      Rango de Fechas de las Ventas a Incluir:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">Desde Fecha</span>
                        <input
                          type="date"
                          value={fechaDesdeRetro}
                          onChange={e => setFechaDesdeRetro(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">Hasta Fecha</span>
                        <input
                          type="date"
                          value={fechaHastaRetro}
                          onChange={e => setFechaHastaRetro(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Por defecto predeterminado al año en curso ({anioActual}). Solo se integrarán las facturas emitidas dentro de este periodo.
                    </p>
                  </div>
                )}
              </div>

              {filtroProd && (
                <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium">
                  Se ejecutará el recálculo únicamente para el producto seleccionado: <strong className="text-slate-800">[{productoSeleccionado?.codigo}] {productoSeleccionado?.nombre}</strong>.
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRecalcularSaldos(incluirVentasSinBodega)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Ejecutar Recálculo Maestro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
