import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { DollarSign, Plus, List } from "lucide-react";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const empresaId = localStorage.getItem("empresa_id");
  const usuarioId = localStorage.getItem("usuario_id") ? parseInt(localStorage.getItem("usuario_id")) : 1;

  const [form, setForm] = useState({ monto: "", categoria_id: "", descripcion: "", metodo_pago: "efectivo" });

  const cargar = async () => {
    const resG = await api.get(`/api/v1/gastos?empresa_id=${empresaId}`);
    setGastos(resG.data);
    const resC = await api.get(`/api/v1/gastos/categorias?empresa_id=${empresaId}`);
    setCategorias(resC.data);
  };

  useEffect(() => { cargar(); }, []);

  const crearCat = async () => {
    const nombre = prompt("Nombre de la categoría (Ej: Pago de Servicios)");
    if (!nombre) return;
    try {
      await api.post(`/api/v1/gastos/categorias?empresa_id=${empresaId}&nombre=${nombre}`);
      cargar();
    } catch (e) {
      alert("Error al crear categoría");
    }
  };

  const registrarGasto = async (e) => {
    e.preventDefault();
    if (!form.categoria_id || !form.monto) return alert("Complete los campos obligatorios");
    
    try {
      await api.post(`/api/v1/gastos?empresa_id=${empresaId}&usuario_id=${usuarioId}&categoria_id=${form.categoria_id}&monto=${form.monto}&descripcion=${form.descripcion}&metodo_pago=${form.metodo_pago}`);
      window.dispatchEvent(new CustomEvent("caja:updated"));
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Gasto registrado." }}));
      setForm({ monto: "", categoria_id: "", descripcion: "", metodo_pago: "efectivo" });
      cargar();
    } catch (err) {
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: err.response?.data?.detail || "Error al registrar gasto" }}));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-red-500" /> Gastos Operativos
          </h1>
          <p className="text-sm text-slate-500 mt-1">Registro de egresos y facturas de compras menores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Registrar Nuevo Gasto</h3>
          <form onSubmit={registrarGasto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  value={form.categoria_id}
                  onChange={e => setForm({...form, categoria_id: e.target.value})}
                  required
                >
                  <option value="">Seleccione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <button type="button" onClick={crearCat} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200"><Plus className="w-4 h-4"/></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto ($)</label>
              <input 
                type="number" step="0.01" min="0.01"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.monto}
                onChange={e => setForm({...form, monto: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
              <select 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.metodo_pago}
                onChange={e => setForm({...form, metodo_pago: e.target.value})}
              >
                <option value="efectivo">Efectivo de Caja</option>
                <option value="transferencia">Transferencia de Caja</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Saldrá del turno de caja activo</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea 
                rows="2"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                value={form.descripcion}
                onChange={e => setForm({...form, descripcion: e.target.value})}
                required
              ></textarea>
            </div>
            <button type="submit" className="w-full bg-red-500 text-white font-medium py-2 rounded-lg hover:bg-red-600">
              Registrar Gasto
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden col-span-2">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><List className="w-5 h-5"/> Historial Reciente</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Categoría</th>
                <th className="px-5 py-3">Descripción</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? <tr><td colSpan="5" className="text-center py-10 text-slate-400">No hay gastos</td></tr> : gastos.map(g => (
                <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm text-slate-600">{new Date(g.fecha).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-700">{g.categoria}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{g.descripcion}</td>
                  <td className="px-5 py-3 text-sm text-slate-400 capitalize">{g.metodo_pago}</td>
                  <td className="px-5 py-3 text-sm font-bold text-red-500 text-right">{fmt(g.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

