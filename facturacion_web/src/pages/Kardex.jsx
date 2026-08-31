import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowRightLeft, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';
const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Kardex() {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtroProd, setFiltroProd] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [resM, resP] = await Promise.all([
          api.get(`/api/v1/almacen/kardex/movimientos?empresa_id=${empresaId()}`),
          api.get(`/api/v1/facturacion/productos/?empresa_id=${empresaId()}`)
        ]);
        setMovimientos(resM.data);
        setProductos(resP.data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const movimientosFiltrados = filtroProd
    ? movimientos.filter(m => m.producto_id.toString() === filtroProd)
    : movimientos;

  const getMovIcon = (tipo) => {
    if (tipo.includes('ENTRADA')) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (tipo.includes('SALIDA')) return <TrendingDown className="w-4 h-4 text-red-500" />;
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

      <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 flex gap-4 items-center">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <select value={filtroProd} onChange={e => setFiltroProd(e.target.value)} className="flex-1 border-none focus:ring-0 text-sm font-medium">
          <option value="">Mostrar historial de todos los productos...</option>
          {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.codigo} - {p.nombre}</option>)}
        </select>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400">Cargando Kardex...</div>
      ) : movimientosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay movimientos registrados</p>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
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
                <th className="px-5 py-3.5 text-right">Costo Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientosFiltrados.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-xs text-slate-500">{new Date(m.fecha).toLocaleString()}</td>
                  <td className="px-5 py-4 font-medium text-slate-800 text-sm">{m.producto_nombre}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{m.bodega_nombre}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {getMovIcon(m.tipo_movimiento)}
                      <span className="text-xs font-bold text-slate-700">{m.tipo_movimiento.replace('_', ' ')}</span>
                    </div>
                    {m.notas && <p className="text-[10px] text-slate-400 mt-1">{m.notas}</p>}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-700">{m.cantidad}</td>
                  <td className="px-5 py-4 text-right text-sm text-slate-500">{m.costo_unitario > 0 ? fmt(m.costo_unitario) : '—'}</td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-700 bg-indigo-50/30">{m.saldo_cantidad}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700 bg-slate-50">{fmt(m.costo_promedio_resultante)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
