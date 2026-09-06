import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Wallet, Plus, Play, Square, RefreshCcw } from "lucide-react";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Cajas() {
  const [cajas, setCajas] = useState([]);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const empresaId = localStorage.getItem("empresa_id");
  const usuarioId = 1; // Simplificacion temporal, deberia venir del auth context

  const cargarCajas = async () => {
    const res = await api.get(`/api/v1/cajas?empresa_id=${empresaId}`);
    setCajas(res.data);
  };

  const cargarSesion = async () => {
    const res = await api.get(`/api/v1/cajas/sesion-activa?empresa_id=${empresaId}&usuario_id=${usuarioId}`);
    setSesionActiva(res.data.activa ? res.data : null);
    if (res.data.activa) {
      const movs = await api.get(`/api/v1/cajas/sesiones/${res.data.sesion_id}/movimientos?empresa_id=${empresaId}`);
      setMovimientos(movs.data);
    } else {
      setMovimientos([]);
    }
  };

  useEffect(() => {
    cargarCajas();
    cargarSesion();
  }, []);

  const abrirCaja = async (caja_id) => {
    const saldoStr = prompt("Ingrese saldo inicial en efectivo (Ej: 50.00)", "0.00");
    if (saldoStr === null) return;
    try {
      await api.post(`/api/v1/cajas/${caja_id}/abrir?empresa_id=${empresaId}&usuario_id=${usuarioId}&saldo_inicial=${saldoStr}`);
      cargarCajas();
      cargarSesion();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Turno abierto exitosamente." }}));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: e.response?.data?.detail || "Error al abrir caja" }}));
    }
  };

  const cerrarCaja = async () => {
    if (!window.confirm("¿Está seguro de cerrar su turno de caja?")) return;
    try {
      await api.post(`/api/v1/cajas/sesiones/${sesionActiva.sesion_id}/cerrar?empresa_id=${empresaId}`);
      cargarCajas();
      cargarSesion();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Turno cerrado exitosamente." }}));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: e.response?.data?.detail || "Error" }}));
    }
  };

  const crearCaja = async () => {
    const nombre = prompt("Nombre de la nueva caja (Ej: Caja Principal)");
    if (!nombre) return;
    try {
      await api.post(`/api/v1/cajas?empresa_id=${empresaId}&nombre=${nombre}`);
      cargarCajas();
    } catch (e) {
      alert("Error al crear");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" /> Control de Caja
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de turnos y flujo de efectivo</p>
        </div>
        <button onClick={crearCaja} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nueva Caja
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Cajas Disponibles</h3>
          {cajas.length === 0 ? <p className="text-slate-400 text-sm">No hay cajas creadas</p> : cajas.map(c => (
            <div key={c.id} className="flex justify-between items-center p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-medium text-slate-700">{c.nombre}</p>
                {c.tiene_sesion_activa && <p className="text-xs text-emerald-600">En uso por {c.usuario_sesion_activa}</p>}
              </div>
              {!sesionActiva && !c.tiene_sesion_activa && (
                <button onClick={() => abrirCaja(c.id)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium flex items-center gap-1">
                  <Play className="w-3 h-3" /> Abrir Turno
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {sesionActiva ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">{sesionActiva.caja_nombre}</h3>
                  <p className="text-sm text-emerald-600 font-medium">Turno Abierto</p>
                </div>
                <button onClick={cerrarCaja} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center gap-2 text-sm">
                  <Square className="w-4 h-4" /> Cerrar Turno
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Inicial (Efectivo)</p>
                  <p className="text-lg font-bold text-slate-700">{fmt(sesionActiva.saldo_inicial)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 uppercase font-semibold">Efectivo Total</p>
                  <p className="text-xl font-bold text-emerald-700">{fmt(sesionActiva.total_efectivo)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-700 uppercase font-semibold">Transferencias</p>
                  <p className="text-xl font-bold text-indigo-700">{fmt(sesionActiva.total_transferencia)}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700 uppercase font-semibold">Tarjetas</p>
                  <p className="text-xl font-bold text-amber-700">{fmt(sesionActiva.total_tarjeta)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No tienes un turno de caja abierto.</p>
              <p className="text-slate-400 text-sm mt-1">Abre una caja en el panel lateral para empezar a cobrar.</p>
            </div>
          )}
        </div>
      </div>

      {sesionActiva && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Movimientos del Turno</h3>
            <button onClick={cargarSesion} className="text-slate-400 hover:text-indigo-600"><RefreshCcw className="w-4 h-4" /></button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Concepto</th>
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3 text-right">Ingreso</th>
                <th className="px-6 py-3 text-right">Egreso</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm text-slate-600">{new Date(m.fecha).toLocaleTimeString()}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-700">{m.concepto}</td>
                  <td className="px-6 py-3 text-sm text-slate-500 capitalize">{m.metodo_pago}</td>
                  <td className="px-6 py-3 text-sm font-bold text-emerald-600 text-right">{m.tipo === "ingreso" ? fmt(m.monto) : ""}</td>
                  <td className="px-6 py-3 text-sm font-bold text-red-500 text-right">{m.tipo === "egreso" ? fmt(m.monto) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

