import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Package, UploadCloud, Image as ImageIcon } from 'lucide-react';

export default function Productos() {
  const [productos] = useState([
    { id: 1, codigo: 'PROD-001', nombre: 'Laptop Dell XPS 15', stock: 12, precio_venta: 150000, costo_promedio: 120000, activo: true, imagen_url: null },
    { id: 2, codigo: 'PROD-002', nombre: 'Mouse Inalámbrico Logitech', stock: 45, precio_venta: 2500, costo_promedio: 1500, activo: true, imagen_url: null },
    { id: 3, codigo: 'PROD-003', nombre: 'Monitor LG 27"', stock: 5, precio_venta: 30000, costo_promedio: 25000, activo: true, imagen_url: null },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Catálogo de Productos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Administra tu inventario y precios de venta</p>
        </div>
        
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm">
            <UploadCloud className="w-4 h-4 text-slate-500" />
            Importar
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 transform hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por código o nombre..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4 w-16">Foto</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Precio Venta</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
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
                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{prod.codigo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{prod.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Costo: ${(prod.costo_promedio / 100).toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${prod.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                      <span className="text-sm font-medium text-slate-700">{prod.stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-emerald-600">${(prod.precio_venta / 100).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer paginación */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <span>Mostrando {productos.length} productos</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-md hover:bg-slate-100 transition-colors">Anterior</button>
            <button className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 font-medium">1</button>
            <button className="px-3 py-1 rounded-md hover:bg-slate-100 transition-colors">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
