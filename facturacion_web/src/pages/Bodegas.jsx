import React, { useState, useEffect, useRef } from 'react';
import { Warehouse, Plus, Edit2, CheckCircle2, XCircle, Star, MapPin, User, AlertTriangle, ArrowLeftRight, History, Trash2, Package, Check, Search, X } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

export default function Bodegas() {
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [bodegaEditando, setBodegaEditando] = useState(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', ubicacion: '', es_principal: false });
  const [guardando, setGuardando] = useState(false);

  // Estados para Modal de Transferencia entre Bodegas
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [bodegaOrigen, setBodegaOrigen] = useState('');
  const [bodegaDestino, setBodegaDestino] = useState('');
  const [notasTransferencia, setNotasTransferencia] = useState('');
  const [existenciasOrigen, setExistenciasOrigen] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [productoSeleccionadoObj, setProductoSeleccionadoObj] = useState(null);
  const [busquedaProductoText, setBusquedaProductoText] = useState('');
  const [menuProductoAbierto, setMenuProductoAbierto] = useState(false);
  const [cantidadTransferir, setCantidadTransferir] = useState('');
  const [itemsTransferencia, setItemsTransferencia] = useState([]);
  const [procesandoTransferencia, setProcesandoTransferencia] = useState(false);
  const [cargandoStock, setCargandoStock] = useState(false);

  // Estados para Historial de Transferencias
  const [modalHistorial, setModalHistorial] = useState(false);
  const [historialTransferencias, setHistorialTransferencias] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const cantidadInputRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}&solo_activas=false`);
      setBodegas(res.data);
    } catch {
      setError('No se pudieron cargar las bodegas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Cargar existencias disponibles cuando cambia la bodega de origen
  useEffect(() => {
    if (!bodegaOrigen) {
      setExistenciasOrigen([]);
      setProductoSeleccionado('');
      setProductoSeleccionadoObj(null);
      setBusquedaProductoText('');
      setMenuProductoAbierto(false);
      return;
    }
    const cargarStockOrigen = async () => {
      setCargandoStock(true);
      try {
        const res = await api.get(`/api/v1/almacen/kardex/existencias?empresa_id=${empresaId()}&bodega_id=${bodegaOrigen}&solo_con_stock=true`);
        setExistenciasOrigen(res.data || []);
      } catch (e) {
        console.error("Error al cargar stock de la bodega de origen:", e);
      } finally {
        setCargandoStock(false);
      }
    };
    cargarStockOrigen();
  }, [bodegaOrigen]);

  // Filtrado para Búsqueda Inteligente de productos
  const existenciasFiltradas = existenciasOrigen.filter(e => {
    if (!busquedaProductoText.trim()) return true;
    const term = busquedaProductoText.toLowerCase();
    return (
      (e.producto_nombre && e.producto_nombre.toLowerCase().includes(term)) ||
      (e.producto_codigo && e.producto_codigo.toLowerCase().includes(term))
    );
  });

  const seleccionarProductoInteligente = (prodObj) => {
    setProductoSeleccionado(prodObj.producto_id.toString());
    setProductoSeleccionadoObj(prodObj);
    setBusquedaProductoText(`[${prodObj.producto_codigo}] ${prodObj.producto_nombre}`);
    setMenuProductoAbierto(false);
    if (cantidadInputRef.current) {
      cantidadInputRef.current.focus();
    }
  };

  const abrirNueva = () => {
    setBodegaEditando(null);
    setForm({ codigo: '', nombre: '', ubicacion: '', es_principal: false });
    setModalAbierto(true);
  };

  const abrirEditar = (b) => {
    setBodegaEditando(b);
    setForm({ codigo: b.codigo, nombre: b.nombre, ubicacion: b.ubicacion || '', es_principal: b.es_principal });
    setModalAbierto(true);
  };

  const abrirTransferencia = () => {
    setBodegaOrigen('');
    setBodegaDestino('');
    setNotasTransferencia('');
    setItemsTransferencia([]);
    setProductoSeleccionado('');
    setProductoSeleccionadoObj(null);
    setBusquedaProductoText('');
    setCantidadTransferir('');
    setMenuProductoAbierto(false);
    setModalTransferencia(true);
  };

  const abrirHistorial = async () => {
    setModalHistorial(true);
    setCargandoHistorial(true);
    try {
      const res = await api.get(`/api/v1/almacen/kardex/transferencias?empresa_id=${empresaId()}`);
      setHistorialTransferencias(res.data || []);
    } catch (e) {
      console.error("Error al cargar historial de transferencias:", e);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const agregarItemTransferencia = () => {
    if (!productoSeleccionado || !cantidadTransferir || parseFloat(cantidadTransferir) <= 0) return;
    
    const prodExistencia = existenciasOrigen.find(e => e.producto_id.toString() === productoSeleccionado.toString());
    if (!prodExistencia) return;

    const cant = parseFloat(cantidadTransferir);
    if (cant > prodExistencia.stock_actual) {
      alert(`La cantidad (${cant}) excede el stock disponible en origen (${prodExistencia.stock_actual}).`);
      return;
    }

    const existe = itemsTransferencia.find(i => i.producto_id.toString() === productoSeleccionado.toString());
    if (existe) {
      if (existe.cantidad + cant > prodExistencia.stock_actual) {
        alert(`La cantidad acumulada excede el stock disponible en la bodega de origen.`);
        return;
      }
      setItemsTransferencia(itemsTransferencia.map(i => 
        i.producto_id.toString() === productoSeleccionado.toString()
          ? { ...i, cantidad: i.cantidad + cant }
          : i
      ));
    } else {
      setItemsTransferencia([
        ...itemsTransferencia,
        {
          producto_id: prodExistencia.producto_id,
          producto_codigo: prodExistencia.producto_codigo,
          producto_nombre: prodExistencia.producto_nombre,
          cantidad: cant,
          stock_disponible: prodExistencia.stock_actual
        }
      ]);
    }

    setProductoSeleccionado('');
    setProductoSeleccionadoObj(null);
    setBusquedaProductoText('');
    setCantidadTransferir('');
  };

  const eliminarItemTransferencia = (prodId) => {
    setItemsTransferencia(itemsTransferencia.filter(i => i.producto_id !== prodId));
  };

  const ejecutarTransferencia = async () => {
    if (!bodegaOrigen || !bodegaDestino) {
      alert("Por favor seleccione las bodegas de origen y destino.");
      return;
    }
    if (bodegaOrigen === bodegaDestino) {
      alert("La bodega de origen y destino deben ser diferentes.");
      return;
    }
    if (itemsTransferencia.length === 0) {
      alert("Debe agregar al menos un producto a la lista de transferencia.");
      return;
    }

    setProcesandoTransferencia(true);
    try {
      const body = {
        empresa_id: empresaId(),
        bodega_origen_id: parseInt(bodegaOrigen),
        bodega_destino_id: parseInt(bodegaDestino),
        notas: notasTransferencia,
        items: itemsTransferencia.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad }))
      };

      const res = await api.post('/api/v1/almacen/kardex/transferencia', body);
      alert(res.data?.mensaje || "Transferencia completada con éxito.");
      setModalTransferencia(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || "Error al procesar la transferencia.");
    } finally {
      setProcesandoTransferencia(false);
    }
  };

  const guardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    setGuardando(true);
    try {
      if (bodegaEditando) {
        await api.put(`/api/v1/almacen/bodegas/${bodegaEditando.id}?empresa_id=${empresaId()}`, form);
      } else {
        await api.post(`/api/v1/almacen/bodegas/?empresa_id=${empresaId()}`, form);
      }
      setModalAbierto(false);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar la bodega.');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (b) => {
    if (!confirm(`¿Desactivar la bodega "${b.nombre}"?`)) return;
    try {
      await api.delete(`/api/v1/almacen/bodegas/${b.id}?empresa_id=${empresaId()}`);
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al desactivar.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-indigo-600" /> Bodegas / Almacenes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Administra los puntos de almacenamiento y traspasos entre sucursales</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={abrirHistorial}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-600" /> Historial
          </button>

          <button
            onClick={abrirTransferencia}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transferir Productos
          </button>

          <button
            onClick={abrirNueva}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nueva Bodega
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Grid de bodegas */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando bodegas...</div>
      ) : bodegas.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay bodegas registradas</p>
          <p className="text-sm mt-1">Crea tu primera bodega para comenzar a controlar el inventario</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bodegas.map(b => (
            <div key={b.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${b.activa ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{b.codigo}</span>
                  {b.es_principal && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" /> Principal
                    </span>
                  )}
                </div>
                {b.activa
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <XCircle className="w-5 h-5 text-slate-300" />
                }
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1">{b.nombre}</h3>

              {b.ubicacion && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.ubicacion}
                </p>
              )}
              {b.responsable_nombre && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {b.responsable_nombre}
                </p>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => abrirEditar(b)}
                  className="flex-1 text-sm text-indigo-600 hover:bg-indigo-50 font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                {b.activa && !b.es_principal && (
                  <button
                    onClick={() => desactivar(b)}
                    className="flex-1 text-sm text-red-500 hover:bg-red-50 font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Bodega */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {bodegaEditando ? 'Editar Bodega' : 'Nueva Bodega'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Código *</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                    placeholder="BOD-01"
                    disabled={!!bodegaEditando}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Bodega Central"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                  placeholder="Calle X, Colonia Y, San Salvador"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.es_principal}
                  onChange={e => setForm(f => ({ ...f, es_principal: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Marcar como Bodega Principal</p>
                  <p className="text-xs text-slate-500">Será la bodega por defecto para nuevas facturas y despachos</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.codigo.trim() || !form.nombre.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {guardando ? 'Guardando...' : (bodegaEditando ? 'Guardar Cambios' : 'Crear Bodega')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferencia de Productos entre Bodegas */}
      {modalTransferencia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-600" /> Transferencia de Productos Entre Bodegas
            </h2>
            <p className="text-xs text-slate-500 mb-6">Traspaso directo de inventario manteniendo el valor de costo</p>

            <div className="space-y-5">
              {/* Selección de Bodegas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Bodega de Origen (Salida) *</label>
                  <select
                    value={bodegaOrigen}
                    onChange={e => setBodegaOrigen(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione Origen</option>
                    {bodegas.filter(b => b.activa).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} ({b.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Bodega de Destino (Entrada) *</label>
                  <select
                    value={bodegaDestino}
                    onChange={e => setBodegaDestino(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione Destino</option>
                    {bodegas.filter(b => b.activa && b.id.toString() !== bodegaOrigen.toString()).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} ({b.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Justificación / Notas */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Notas / Observaciones</label>
                <input
                  type="text"
                  value={notasTransferencia}
                  onChange={e => setNotasTransferencia(e.target.value)}
                  placeholder="Ej. Reabastecimiento de mercancía por alta demanda"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Selector Inteligente de Producto a añadir */}
              <div className="border border-indigo-100 bg-indigo-50/30 p-4 rounded-xl relative">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-600" /> Agregar Producto a Transferir
                </h3>
                
                {!bodegaOrigen ? (
                  <p className="text-xs text-amber-600 font-medium">Por favor seleccione primero la Bodega de Origen para ver los productos disponibles.</p>
                ) : cargandoStock ? (
                  <p className="text-xs text-slate-400">Cargando existencias de la bodega de origen...</p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    {/* Búsqueda Inteligente Autocomplete */}
                    <div className="flex-1 w-full relative">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Búsqueda Inteligente de Producto
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={busquedaProductoText}
                          onChange={(e) => {
                            setBusquedaProductoText(e.target.value);
                            setMenuProductoAbierto(true);
                            if (!e.target.value) {
                              setProductoSeleccionado('');
                              setProductoSeleccionadoObj(null);
                            }
                          }}
                          onFocus={() => setMenuProductoAbierto(true)}
                          placeholder="Escriba nombre o código del producto..."
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                        />
                        {busquedaProductoText && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusquedaProductoText('');
                              setProductoSeleccionado('');
                              setProductoSeleccionadoObj(null);
                              setMenuProductoAbierto(false);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown flotante con resultados filtrados */}
                      {menuProductoAbierto && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {existenciasFiltradas.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center">
                              No se encontraron productos coincidentes en la bodega de origen
                            </div>
                          ) : (
                            existenciasFiltradas.map((e) => {
                              const esSel = productoSeleccionado.toString() === e.producto_id.toString();
                              return (
                                <div
                                  key={e.producto_id}
                                  onClick={() => seleccionarProductoInteligente(e)}
                                  className={`p-2.5 hover:bg-indigo-50/70 cursor-pointer flex justify-between items-center transition-colors ${
                                    esSel ? 'bg-indigo-50 text-indigo-900 font-bold' : ''
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                        {e.producto_codigo}
                                      </span>
                                      <span className="text-sm font-semibold text-slate-800">{e.producto_nombre}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      Stock: {e.stock_actual}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Input de Cantidad */}
                    <div className="w-full sm:w-32">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Cantidad</label>
                      <input
                        ref={cantidadInputRef}
                        type="number"
                        min="0.01"
                        step="any"
                        value={cantidadTransferir}
                        onChange={e => setCantidadTransferir(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Botón Agregar */}
                    <button
                      type="button"
                      onClick={agregarItemTransferencia}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                )}

                {/* Badge con el stock del producto seleccionado */}
                {productoSeleccionadoObj && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Seleccionado: <strong className="font-extrabold">{productoSeleccionadoObj.producto_nombre}</strong> — Stock disponible en origen: <strong className="font-extrabold text-emerald-700">{productoSeleccionadoObj.stock_actual} unidades</strong></span>
                  </div>
                )}
              </div>

              {/* Lista de Items a Transferir */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Productos en este Traspaso ({itemsTransferencia.length})</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Código</th>
                        <th className="px-4 py-2.5">Producto</th>
                        <th className="px-4 py-2.5 text-right">Cantidad</th>
                        <th className="px-4 py-2.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemsTransferencia.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-slate-400">No se ha agregado ningún producto a la lista</td>
                        </tr>
                      ) : (
                        itemsTransferencia.map((item) => (
                          <tr key={item.producto_id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold text-slate-700">{item.producto_codigo}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-800">{item.producto_nombre}</td>
                            <td className="px-4 py-2.5 text-right font-extrabold text-emerald-600">{item.cantidad}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => eliminarItemTransferencia(item.producto_id)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setModalTransferencia(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarTransferencia}
                disabled={procesandoTransferencia || itemsTransferencia.length === 0 || !bodegaOrigen || !bodegaDestino}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {procesandoTransferencia ? 'Procesando...' : 'Confirmar Transferencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Transferencias */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" /> Historial de Traspasos Entre Bodegas
                </h2>
                <p className="text-xs text-slate-500">Registro histórico de transferencias procesadas</p>
              </div>
              <button
                onClick={() => setModalHistorial(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1 bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {cargandoHistorial ? (
              <div className="text-center py-12 text-slate-400">Cargando historial...</div>
            ) : historialTransferencias.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No se han registrado transferencias aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historialTransferencias.map((h, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          Ref: #{h.referencia_id}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          Fecha: <span className="font-semibold text-slate-700">{new Date(h.fecha).toLocaleString()}</span> • Operador: <span className="font-semibold text-slate-700">{h.usuario}</span>
                        </p>
                      </div>
                    </div>
                    {h.notas && <p className="text-xs text-slate-600 italic mb-3 bg-white p-2 rounded-lg border border-slate-100">"{h.notas}"</p>}

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                          <tr>
                            <th className="px-3 py-2">Bodega</th>
                            <th className="px-3 py-2">Movimiento</th>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2 text-right">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {h.items.map((it) => (
                            <tr key={it.kardex_id}>
                              <td className="px-3 py-2 font-semibold text-slate-800">{it.bodega_nombre}</td>
                              <td className="px-3 py-2 font-bold">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase ${
                                  it.tipo_movimiento === 'TRANSFERENCIA_ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {it.tipo_movimiento === 'TRANSFERENCIA_ENTRADA' ? 'Entrada (Destino)' : 'Salida (Origen)'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-700">{it.producto_nombre} ({it.producto_codigo})</td>
                              <td className="px-3 py-2 text-right font-extrabold text-slate-800">{it.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
