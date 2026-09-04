import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, Search, ArrowRightLeft, TrendingUp, TrendingDown, RefreshCcw, Eye, Filter, Loader2, X, Package } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

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

  // Estado para el modal de detalles
  const [movimientoActivo, setMovimientoActivo] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [resM, resP, resB] = await Promise.all([
          api.get(`/api/v1/kardex/movimientos?empresa_id=${empresaId()}`),
          api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`),
          api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`)
        ]);
        setMovimientos(resM.data);
        setProductos(resP.data);
        setBodegas(resB.data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // 1. Filtrar por producto, bodega y búsqueda inteligente
  const movimientosFiltrados = movimientos.filter(m => {
    let cumple = true;
    if (filtroProd && m.producto_id.toString() !== filtroProd) cumple = false;
    // Si tenemos bodega.id o comparamos por nombre:
    if (filtroBodega && m.bodega_nombre !== filtroBodega) cumple = false;
    
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

  // 2. Ordenar por fecha (más reciente primero)
  const movimientosOrdenados = movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // 3. Paginación
  const totalPages = Math.ceil(movimientosOrdenados.length / itemsPerPage);
  const paginatedMovimientos = movimientosOrdenados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getMovIcon = (tipo) => {
    if (tipo.includes('ENTRADA') || tipo.includes('COMPRA')) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (tipo.includes('SALIDA') || tipo.includes('VENTA')) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <RefreshCcw className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Kardex (Libro Mayor de Inventario)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Auditoría completa de movimientos de inventario y coste</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selector de Producto */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3">
          <Package className="w-4 h-4 text-slate-400" />
          <select 
            value={filtroProd} 
            onChange={e => { setFiltroProd(e.target.value); setCurrentPage(1); }} 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-2"
          >
            <option value="">Todos los productos...</option>
            {productos.map(p => <option key={p.id_producto || p.codigo} value={p.id_producto || p.id}>{p.codigo} - {p.nombre}</option>)}
          </select>
        </div>

        {/* Selector de Bodega */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filtroBodega} 
            onChange={e => { setFiltroBodega(e.target.value); setCurrentPage(1); }} 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-2"
          >
            <option value="">Todas las bodegas...</option>
            {bodegas.map(b => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
          </select>
        </div>

        {/* Búsqueda inteligente */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por código, nombre o documento..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          Cargando Kardex...
        </div>
      ) : movimientosOrdenados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay movimientos registrados que coincidan con la búsqueda</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                  <th className="px-5 py-3.5">Fecha</th>
                  <th className="px-5 py-3.5">Producto</th>
                  <th className="px-5 py-3.5">Bodega</th>
                  <th className="px-5 py-3.5">Movimiento</th>
                  <th className="px-5 py-3.5 text-right">Cant.</th>
                  <th className="px-5 py-3.5 text-right">Costo Unit.</th>
                  <th className="px-5 py-3.5 text-right">Stock Final</th>
                  <th className="px-5 py-3.5 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovimientos.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-xs text-slate-500">{new Date(m.fecha).toLocaleString()}</td>
                    <td className="px-5 py-4 font-medium text-slate-800 text-sm">
                      <div className="font-bold">{m.producto_codigo}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{m.producto_nombre}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{m.bodega_nombre}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getMovIcon(m.tipo_movimiento)}
                        <span className="text-xs font-bold text-slate-700">{m.tipo_movimiento.replace('_', ' ')}</span>
                      </div>
                      {m.referencia_tipo && <p className="text-[10px] text-indigo-500 mt-1 font-semibold">{m.referencia_tipo} #{m.referencia_id}</p>}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-700">
                      <span className={m.tipo_movimiento.includes('SALIDA') ? 'text-red-500' : 'text-emerald-500'}>
                        {m.tipo_movimiento.includes('SALIDA') ? '-' : '+'}{m.cantidad}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-500">{m.costo_unitario > 0 ? fmt(m.costo_unitario) : '—'}</td>
                    <td className="px-5 py-4 text-right font-bold text-indigo-700 bg-indigo-50/30">{m.stock_resultante || m.saldo_cantidad || 0}</td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => setMovimientoActivo(m)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver Documento"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer paginación */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>Mostrando {paginatedMovimientos.length} de {movimientosOrdenados.length} movimientos</span>
            <div className="flex gap-1 items-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 font-medium">
                {currentPage} / {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {movimientoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Detalle de Movimiento
              </h3>
              <button onClick={() => setMovimientoActivo(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Producto</p>
                <p className="font-semibold text-slate-800">{movimientoActivo.producto_codigo} - {movimientoActivo.producto_nombre}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
                  <p className="font-medium text-slate-700">{new Date(movimientoActivo.fecha).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bodega</p>
                  <p className="font-medium text-slate-700">{movimientoActivo.bodega_nombre}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  {getMovIcon(movimientoActivo.tipo_movimiento)}
                  <span className="font-bold text-slate-800">{movimientoActivo.tipo_movimiento.replace('_', ' ')}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500">Documento:</span>
                  <span className="font-medium text-right">{movimientoActivo.referencia_tipo || 'N/A'} #{movimientoActivo.referencia_id || ''}</span>
                  
                  <span className="text-slate-500">Unidades:</span>
                  <span className="font-medium text-right">{movimientoActivo.cantidad}</span>
                  
                  <span className="text-slate-500">Costo Unitario:</span>
                  <span className="font-medium text-right">{fmt(movimientoActivo.costo_unitario)}</span>
                  
                  <span className="text-slate-500">Valor Total:</span>
                  <span className="font-medium text-right text-indigo-600">{fmt(movimientoActivo.costo_total || (movimientoActivo.costo_unitario * movimientoActivo.cantidad))}</span>
                </div>
              </div>

              {movimientoActivo.notas && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observaciones</p>
                  <p className="text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">{movimientoActivo.notas}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setMovimientoActivo(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
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
