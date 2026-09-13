import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Package, UploadCloud, Image as ImageIcon, Loader2, FolderPlus, ArrowUpDown, Tag } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

const FORM_VACIO = {
  codigo: '', nombre: '', descripcion: '', imagen_url: '', 
  precio_venta: '', costo_promedio: '', stock: '',
  categoria_id: '', subcategoria: '', marca: '', tipo_item: 'BIEN', unidad_medida: 'UNIDAD'
};

const FORM_CAT_VACIO = {
  nombre: '', codigo_prefijo: '', descripcion: '',
  cuenta_contable_ventas: '510101', cuenta_contable_inventario: '110601', cuenta_contable_costo: '410101'
};

const Field = ({ label, children }) => <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>{children}</div>;
const Input = (props) => <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />;

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [orden, setOrden] = useState('nombre_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [formCat, setFormCat] = useState(FORM_CAT_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [guardandoCat, setGuardandoCat] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resP, resC] = await Promise.all([
        api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`),
        api.get(`/api/v1/facturacion/productos/categorias?empresa_id=${empresaId()}`)
      ]);
      setProductos(resP.data);
      setCategorias(resC.data);
    } catch (error) {
      console.error("Error cargando productos o categorías", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const sugerirCodigo = async (catId) => {
    if (!catId) return;
    try {
      const res = await api.get(`/api/v1/facturacion/productos/siguiente-codigo?empresa_id=${empresaId()}&categoria_id=${catId}`);
      if (res.data && res.data.codigo_sugerido) {
        setForm(f => ({ ...f, codigo: res.data.codigo_sugerido }));
      }
    } catch (e) {
      console.error("Error sugiriendo código", e);
    }
  };

  // Filtrado y Ordenamiento
  const filteredProductos = productos.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || (
      (p.codigo && p.codigo.toLowerCase().includes(term)) ||
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.marca && p.marca.toLowerCase().includes(term)) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(term))
    );
    const matchCat = !filtroCategoria || String(p.categoria_id) === String(filtroCategoria);
    const matchTipo = !filtroTipo || p.tipo_item === filtroTipo;

    return matchSearch && matchCat && matchTipo;
  }).sort((a, b) => {
    if (orden === 'nombre_asc') return a.nombre.localeCompare(b.nombre);
    if (orden === 'nombre_desc') return b.nombre.localeCompare(a.nombre);
    if (orden === 'codigo') return (a.codigo || '').localeCompare(b.codigo || '');
    if (orden === 'categoria') return (a.categoria_nombre || '').localeCompare(b.categoria_nombre || '');
    if (orden === 'stock_desc') return b.stock - a.stock;
    if (orden === 'stock_asc') return a.stock - b.stock;
    if (orden === 'precio_desc') return b.precio_venta - a.precio_venta;
    if (orden === 'precio_asc') return a.precio_venta - b.precio_venta;
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const paginatedProductos = filteredProductos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const abrirNuevo = () => { 
    setEditando(null); 
    setForm(FORM_VACIO); 
    setModalAbierto(true); 
  };
  
  const abrirEditar = (p) => {
    setEditando(p);
    setForm({
      ...FORM_VACIO,
      ...p,
      categoria_id: p.categoria_id || '',
      subcategoria: p.subcategoria || '',
      marca: p.marca || '',
      tipo_item: p.tipo_item || 'BIEN',
      unidad_medida: p.unidad_medida || 'UNIDAD',
      precio_venta: p.precio_venta ? Number(p.precio_venta).toFixed(4) : '',
      costo_promedio: p.costo_promedio ? Number(p.costo_promedio).toFixed(4) : '',
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.codigo || !form.precio_venta) return;
    setGuardando(true);
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
        precio_venta: parseFloat(form.precio_venta),
        costo_promedio: form.costo_promedio ? parseFloat(form.costo_promedio) : 0,
        stock: form.stock ? parseFloat(form.stock) : 0
      };
      
      if (editando) {
        await api.put(`/api/v1/facturacion/productos/${editando.id_producto}?empresa_id=${empresaId()}`, payload);
      } else {
        await api.post(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`, payload);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (e) {
      alert("Error guardando: " + (e.response?.data?.detail || e.message));
    } finally {
      setGuardando(false);
    }
  };

  const guardarCategoria = async () => {
    if (!formCat.nombre) return alert("Ingrese el nombre de la categoría");
    setGuardandoCat(true);
    try {
      await api.post(`/api/v1/facturacion/productos/categorias?empresa_id=${empresaId()}`, formCat);
      setModalCatAbierto(false);
      setFormCat(FORM_CAT_VACIO);
      cargarDatos();
    } catch (e) {
      alert("Error guardando categoría: " + (e.response?.data?.detail || e.message));
    } finally {
      setGuardandoCat(false);
    }
  };

  const eliminar = async (p) => {
    if(!window.confirm(`¿Seguro que deseas eliminar ${p.nombre}?`)) return;
    try {
      await api.delete(`/api/v1/facturacion/productos/${p.id_producto}?empresa_id=${empresaId()}`);
      cargarDatos();
    } catch (e) {
      alert("Error eliminando: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Catálogo de Productos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Administra tu inventario, categorías y precios de venta</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setModalCatAbierto(true)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm">
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            Nueva Categoría
          </button>
          <button onClick={abrirNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 transform hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Toolbar & Filtros Organizados */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por código, nombre, marca o categoría..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filtro Categoría */}
        <div className="w-full md:w-52">
          <select 
            value={filtroCategoria} 
            onChange={(e) => { setFiltroCategoria(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} ({c.codigo_prefijo || 'SIN PREFIJO'})</option>
            ))}
          </select>
        </div>

        {/* Filtro Tipo Ítem */}
        <div className="w-full md:w-40">
          <select 
            value={filtroTipo} 
            onChange={(e) => { setFiltroTipo(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
          >
            <option value="">Todos los Tipos</option>
            <option value="BIEN">Bienes</option>
            <option value="SERVICIO">Servicios</option>
            <option value="INSUMO">Insumos</option>
          </select>
        </div>

        {/* Ordenamiento */}
        <div className="w-full md:w-48 flex items-center gap-1">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
          >
            <option value="nombre_asc">Nombre (A-Z)</option>
            <option value="nombre_desc">Nombre (Z-A)</option>
            <option value="codigo">Código</option>
            <option value="categoria">Categoría</option>
            <option value="stock_desc">Stock (Mayor a Menor)</option>
            <option value="stock_asc">Stock (Menor a Mayor)</option>
            <option value="precio_desc">Precio (Mayor a Menor)</option>
            <option value="precio_asc">Precio (Menor a Mayor)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4 w-16">Foto</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Producto & Marca</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Precio Venta</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Cargando productos organizados...
                  </td>
                </tr>
              ) : paginatedProductos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                    No se encontraron productos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedProductos.map((prod) => (
                  <tr key={prod.id_producto || prod.codigo} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {prod.imagen_url ? (
                          <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {prod.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{prod.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {prod.marca && <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">{prod.marca}</span>}
                        <span className="text-xs text-slate-400">Costo: ${Number(prod.costo_promedio).toFixed(4)}</span>
                        <span className="text-xs text-slate-400">({prod.unidad_medida || 'UNIDAD'})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prod.categoria_nombre ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Tag className="w-3 h-3" />
                          {prod.categoria_nombre}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin Categoría</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${prod.tipo_item === 'SERVICIO' ? 'bg-sky-500' : (prod.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')}`}></div>
                        <span className="text-sm font-medium text-slate-700">
                          {prod.tipo_item === 'SERVICIO' ? 'N/A (Servicio)' : prod.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">${Number(prod.precio_venta).toFixed(4)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${prod.activo ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {prod.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => abrirEditar(prod)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminar(prod)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer paginación */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <span>Mostrando {paginatedProductos.length} de {filteredProductos.length} productos organizados</span>
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

      {/* Modal Crear/Editar Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-5">{editando ? 'Editar Producto' : 'Nuevo Producto Organizado'}</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Categoría del Producto">
                  <select 
                    value={form.categoria_id} 
                    onChange={e => {
                      const catId = e.target.value;
                      setForm({...form, categoria_id: catId});
                      if (!editando) sugerirCodigo(catId);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">Seleccionar Categoría...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.codigo_prefijo || 'SIN PREFIJO'})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Código del Producto *">
                  <div className="flex gap-2">
                    <Input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} placeholder="Ej: BEB-0001" />
                    {!editando && form.categoria_id && (
                      <button 
                        type="button" 
                        onClick={() => sugerirCodigo(form.categoria_id)}
                        className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 shrink-0"
                      >
                        Auto-Código
                      </button>
                    )}
                  </div>
                </Field>
              </div>

              <Field label="Nombre del Producto *">
                <Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: COSCAFE CAJA 40 SOBRES" />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Marca / Fabricante">
                  <Input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} placeholder="Ej: COSCAFÉ" />
                </Field>
                <Field label="Tipo de Ítem (MH DTE)">
                  <select 
                    value={form.tipo_item} 
                    onChange={e => setForm({...form, tipo_item: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BIEN">Bien (Inventariable)</option>
                    <option value="SERVICIO">Servicio (No Inventariable)</option>
                    <option value="INSUMO">Materia Prima / Insumo</option>
                  </select>
                </Field>
                <Field label="Unidad de Medida">
                  <select 
                    value={form.unidad_medida} 
                    onChange={e => setForm({...form, unidad_medida: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UNIDAD">Unidad</option>
                    <option value="FARDO">Fardo</option>
                    <option value="CAJA">Caja</option>
                    <option value="SOBRE">Sobre</option>
                    <option value="LIBRA">Libra (LB)</option>
                    <option value="GALON">Galón</option>
                    <option value="SERVICIO">Servicio</option>
                  </select>
                </Field>
              </div>

              <Field label="Descripción">
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} />
              </Field>
              
              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio de Venta (USD) *">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input type="number" min="0" step="0.0001" value={form.precio_venta} onChange={e => setForm({...form, precio_venta: e.target.value})} className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </Field>
                <Field label="Costo Promedio (USD)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input type="number" min="0" step="0.0001" value={form.costo_promedio} onChange={e => setForm({...form, costo_promedio: e.target.value})} className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </Field>
              </div>

              {!editando && form.tipo_item !== 'SERVICIO' && (
                <Field label="Stock Inicial">
                  <Input type="number" min="0" step="any" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                </Field>
              )}
              
              <Field label="URL de la Imagen">
                <Input value={form.imagen_url} onChange={e => setForm({...form, imagen_url: e.target.value})} placeholder="https://..." />
              </Field>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAbierto(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !form.nombre || !form.codigo || !form.precio_venta} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 font-medium">
                {guardando ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Categoría de Producto */}
      {modalCatAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Nueva Categoría de Producto</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="Nombre de Categoría *">
                    <Input value={formCat.nombre} onChange={e => setFormCat({...formCat, nombre: e.target.value})} placeholder="Ej: Bebidas y Refrescos" />
                  </Field>
                </div>
                <Field label="Prefijo Código">
                  <Input value={formCat.codigo_prefijo} onChange={e => setFormCat({...formCat, codigo_prefijo: e.target.value.toUpperCase()})} placeholder="BEB" maxLength={5} />
                </Field>
              </div>

              <Field label="Descripción">
                <Input value={formCat.descripcion} onChange={e => setFormCat({...formCat, descripcion: e.target.value})} placeholder="Descripción o notas de la categoría" />
              </Field>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mapeo Cuentas Contables (Integración ERP)</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Cuenta Ventas">
                    <Input value={formCat.cuenta_contable_ventas} onChange={e => setFormCat({...formCat, cuenta_contable_ventas: e.target.value})} placeholder="510101" />
                  </Field>
                  <Field label="Cuenta Inventario">
                    <Input value={formCat.cuenta_contable_inventario} onChange={e => setFormCat({...formCat, cuenta_contable_inventario: e.target.value})} placeholder="110601" />
                  </Field>
                  <Field label="Cuenta Costo">
                    <Input value={formCat.cuenta_contable_costo} onChange={e => setFormCat({...formCat, cuenta_contable_costo: e.target.value})} placeholder="410101" />
                  </Field>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalCatAbierto(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">Cancelar</button>
              <button onClick={guardarCategoria} disabled={guardandoCat || !formCat.nombre} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 font-medium">
                {guardandoCat ? 'Guardando...' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

