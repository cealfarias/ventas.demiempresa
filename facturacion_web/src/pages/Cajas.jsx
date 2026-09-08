import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Wallet, Plus, Play, Square, RefreshCcw, Printer, History, DollarSign, TrendingUp, X } from "lucide-react";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;
const parseCents = (val) => Math.round(val * 100);

export default function Cajas() {
  const [cajas, setCajas] = useState([]);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [activeTab, setActiveTab] = useState("actual"); // 'actual' | 'historial'
  
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [arqueoData, setArqueoData] = useState({
    b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, b1: 0,
    m1: 0, m025: 0, m010: 0, m005: 0, m001: 0
  });

  const [showInyeccionModal, setShowInyeccionModal] = useState(false);
  const [inyeccionForm, setInyeccionForm] = useState({
    monto: "",
    tipo_financiamiento: "aporte_socio",
    acreedor: "",
    tasa_interes: "",
    metodo_pago: "efectivo",
    notas: ""
  });
  const [guardandoInyeccion, setGuardandoInyeccion] = useState(false);

  const empresaId = localStorage.getItem("empresa_id");
  const usuarioId = 1; // Simplificacion temporal

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

  const cargarHistorial = async () => {
    const res = await api.get(`/api/v1/cajas/historial?empresa_id=${empresaId}`);
    setHistorial(res.data);
  };

  useEffect(() => {
    cargarCajas();
    cargarSesion();
    cargarHistorial();
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

  const calculateTotalArqueo = () => {
    return (arqueoData.b100 * 100) + (arqueoData.b50 * 50) + (arqueoData.b20 * 20) +
           (arqueoData.b10 * 10) + (arqueoData.b5 * 5) + (arqueoData.b1 * 1) +
           (arqueoData.m1 * 1) + (arqueoData.m025 * 0.25) + (arqueoData.m010 * 0.10) +
           (arqueoData.m005 * 0.05) + (arqueoData.m001 * 0.01);
  };

  const confirmarCierre = async () => {
    const totalFisicoCents = Math.round(calculateTotalArqueo() * 100);
    const expectedCents = sesionActiva.total_efectivo;
    const diferencia = totalFisicoCents - expectedCents;

    if (diferencia !== 0) {
      const msg = diferencia > 0 ? `sobrante de ${fmt(diferencia)}` : `faltante de ${fmt(Math.abs(diferencia))}`;
      if (!window.confirm(`Hay un ${msg}. ¿Desea cerrar el turno de todos modos y registrar la diferencia?`)) return;
    }

    try {
      await api.post(`/api/v1/cajas/sesiones/${sesionActiva.sesion_id}/cerrar?empresa_id=${empresaId}`, {
        notas: "Arqueo cerrado por el sistema",
        detalle_arqueo: arqueoData,
        diferencia: diferencia
      });
      setShowArqueoModal(false);
      cargarCajas();
      cargarSesion();
      cargarHistorial();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Turno cerrado y arqueo registrado correctamente." }}));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: e.response?.data?.detail || "Error al cerrar" }}));
    }
  };

  const guardarInyeccion = async () => {
    if (!inyeccionForm.monto || parseFloat(inyeccionForm.monto) <= 0) {
      alert("Ingrese un monto válido mayor a 0");
      return;
    }
    if (!inyeccionForm.acreedor.trim()) {
      alert("Ingrese la fuente u origen de los fondos (Ej. Socio, Banco, Financiera)");
      return;
    }

    setGuardandoInyeccion(true);
    try {
      await api.post(`/api/v1/cajas/sesiones/${sesionActiva.sesion_id}/inyectar-capital?empresa_id=${empresaId}&usuario_id=${usuarioId}`, {
        monto: parseFloat(inyeccionForm.monto),
        tipo_financiamiento: inyeccionForm.tipo_financiamiento,
        acreedor: inyeccionForm.acreedor.trim(),
        tasa_interes: inyeccionForm.tasa_interes ? parseFloat(inyeccionForm.tasa_interes) : 0,
        metodo_pago: inyeccionForm.metodo_pago,
        notas: inyeccionForm.notas
      });

      setShowInyeccionModal(false);
      setInyeccionForm({ monto: "", tipo_financiamiento: "aporte_socio", acreedor: "", tasa_interes: "", metodo_pago: "efectivo", notas: "" });
      cargarSesion();
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Inyección de capital registrada correctamente en caja." }}));
    } catch (e) {
      alert(e.response?.data?.detail || "Error al registrar la inyección de capital");
    } finally {
      setGuardandoInyeccion(false);
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
  
  const imprimirArqueo = (sesion) => {
      const printWindow = window.open('', '_blank');
      const det = sesion.detalle_arqueo || {};
      printWindow.document.write(`
        <html>
          <head>
            <title>Arqueo de Caja - ${sesion.caja_nombre}</title>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
              h2, h3 { text-align: center; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .bold { font-weight: bold; }
              .border-top { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <h2>ARQUEO DE CAJA</h2>
            <div class="row"><span>Caja:</span> <span>${sesion.caja_nombre}</span></div>
            <div class="row"><span>Usuario:</span> <span>${sesion.usuario || 'N/A'}</span></div>
            <div class="row"><span>Apertura:</span> <span>${new Date(sesion.fecha_apertura).toLocaleString()}</span></div>
            <div class="row"><span>Cierre:</span> <span>${sesion.fecha_cierre ? new Date(sesion.fecha_cierre).toLocaleString() : 'N/A'}</span></div>
            
            <div class="border-top">
                <div class="row bold"><span>RESUMEN DEL SISTEMA</span></div>
                <div class="row"><span>Fondo Inicial:</span> <span>${fmt(sesion.saldo_inicial)}</span></div>
                <div class="row"><span>Efectivo Total (Sistema):</span> <span>${fmt(sesion.saldo_calculado || 0)}</span></div>
            </div>
            
            <div class="border-top">
                <div class="row bold"><span>DETALLE FISICO (ARQUEO)</span></div>
                <div class="row"><span>Billetes $100:</span> <span>${det.b100 || 0}</span></div>
                <div class="row"><span>Billetes $50:</span> <span>${det.b50 || 0}</span></div>
                <div class="row"><span>Billetes $20:</span> <span>${det.b20 || 0}</span></div>
                <div class="row"><span>Billetes $10:</span> <span>${det.b10 || 0}</span></div>
                <div class="row"><span>Billetes $5:</span> <span>${det.b5 || 0}</span></div>
                <div class="row"><span>Billetes $1:</span> <span>${det.b1 || 0}</span></div>
                <div class="row"><span>Monedas $1:</span> <span>${det.m1 || 0}</span></div>
                <div class="row"><span>Monedas $0.25:</span> <span>${det.m025 || 0}</span></div>
                <div class="row"><span>Monedas $0.10:</span> <span>${det.m010 || 0}</span></div>
                <div class="row"><span>Monedas $0.05:</span> <span>${det.m005 || 0}</span></div>
                <div class="row"><span>Monedas $0.01:</span> <span>${det.m001 || 0}</span></div>
            </div>
            
            <div class="border-top">
                <div class="row bold"><span>DIFERENCIA:</span> <span>${fmt(sesion.diferencia || 0)}</span></div>
            </div>
            
            <br/><br/>
            <div class="text-center">_________________________</div>
            <div class="text-center" style="margin-top: 5px;">Firma de Cajero</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500);
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

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("actual")} 
          className={`pb-2 px-2 font-medium ${activeTab === 'actual' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Turno Actual
        </button>
        <button 
          onClick={() => setActiveTab("historial")} 
          className={`pb-2 px-2 font-medium flex items-center gap-1 ${activeTab === 'historial' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <History className="w-4 h-4" /> Historial de Turnos
        </button>
      </div>

      {activeTab === "actual" && (
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
                  <div className="flex gap-2">
                    <button onClick={() => setShowInyeccionModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm">
                      <TrendingUp className="w-4 h-4" /> Inyectar Capital
                    </button>
                    <button onClick={() => setShowArqueoModal(true)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 flex items-center gap-2 text-sm">
                      <Square className="w-4 h-4" /> Cerrar Turno
                    </button>
                  </div>
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
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Movimientos del Turno</h3>
                    <button onClick={cargarSesion} className="text-slate-400 hover:text-indigo-600"><RefreshCcw className="w-4 h-4" /></button>
                  </div>
                  <div style={{maxHeight: '300px', overflowY: 'auto'}}>
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
      )}

      {activeTab === "historial" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Historial de Turnos Cerrados</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Caja</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Apertura</th>
                <th className="px-4 py-3">Cierre</th>
                <th className="px-4 py-3 text-right">Total Sistema</th>
                <th className="px-4 py-3 text-right">Diferencia</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No hay turnos cerrados</td></tr>
              ) : (
                historial.map(h => (
                  <tr key={h.sesion_id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{h.caja_nombre}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{h.usuario}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(h.fecha_apertura).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(h.fecha_cierre).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{fmt(h.saldo_calculado)}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${h.diferencia < 0 ? 'text-red-500' : h.diferencia > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {fmt(h.diferencia)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => imprimirArqueo(h)} className="text-indigo-600 hover:text-indigo-800">
                        <Printer className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showArqueoModal && sesionActiva && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Arqueo de Caja - Cierre de Turno</h2>
              <button onClick={() => setShowArqueoModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="font-semibold text-emerald-700 mb-3 border-b pb-1">Billetes</h3>
                <div className="space-y-2">
                  {['100', '50', '20', '10', '5', '1'].map(b => (
                    <div key={`b${b}`} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Billete ${b}</span>
                      <input type="number" min="0" className="border border-slate-200 rounded px-2 py-1 w-24 text-right"
                        value={arqueoData[`b${b}`] || ''} 
                        onChange={(e) => setArqueoData({...arqueoData, [`b${b}`]: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-700 mb-3 border-b pb-1">Monedas</h3>
                <div className="space-y-2">
                  {[ {l: '$1', k: 'm1'}, {l: '$0.25', k: 'm025'}, {l: '$0.10', k: 'm010'}, {l: '$0.05', k: 'm005'}, {l: '$0.01', k: 'm001'} ].map(m => (
                    <div key={m.k} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Moneda {m.l}</span>
                      <input type="number" min="0" className="border border-slate-200 rounded px-2 py-1 w-24 text-right"
                        value={arqueoData[m.k] || ''} 
                        onChange={(e) => setArqueoData({...arqueoData, [m.k]: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-600">Total Físico Calculado:</span>
                <span className="text-xl font-bold text-slate-800">${calculateTotalArqueo().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-600">Total Efectivo Sistema:</span>
                <span className="text-xl font-bold text-slate-800">{fmt(sesionActiva.total_efectivo)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-medium text-slate-600">Diferencia:</span>
                <span className={`text-xl font-bold ${Math.round(calculateTotalArqueo()*100) - sesionActiva.total_efectivo < 0 ? 'text-red-500' : Math.round(calculateTotalArqueo()*100) - sesionActiva.total_efectivo > 0 ? 'text-emerald-500' : 'text-slate-800'}`}>
                  {fmt(Math.round(calculateTotalArqueo()*100) - sesionActiva.total_efectivo)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowArqueoModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={confirmarCierre} className="px-4 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg">
                Confirmar y Cerrar Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {showInyeccionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Inyección de Capital / Financiamiento
              </h2>
              <button onClick={() => setShowInyeccionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Origen / Categoría de Fondos</label>
                <select 
                  value={inyeccionForm.tipo_financiamiento} 
                  onChange={e => setInyeccionForm({ ...inyeccionForm, tipo_financiamiento: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="aporte_socio">Aporte de Socios / Capital (0% Interés)</option>
                  <option value="prestamo_sin_interes">Préstamo Sin Interés</option>
                  <option value="prestamo_con_interes">Préstamo Con Interés</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fuente / Socio / Acreedor *</label>
                <input 
                  type="text" 
                  placeholder="Ej: Socio Juan Pérez / Banco Agrícola"
                  value={inyeccionForm.acreedor}
                  onChange={e => setInyeccionForm({ ...inyeccionForm, acreedor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monto Inyectado ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input 
                      type="number" 
                      step="any"
                      min="0.01"
                      placeholder="0.00"
                      value={inyeccionForm.monto}
                      onChange={e => setInyeccionForm({ ...inyeccionForm, monto: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Método de Depósito</label>
                  <select 
                    value={inyeccionForm.metodo_pago} 
                    onChange={e => setInyeccionForm({ ...inyeccionForm, metodo_pago: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="efectivo">Efectivo (Caja)</option>
                    <option value="transferencia">Transferencia (Banco)</option>
                  </select>
                </div>
              </div>

              {inyeccionForm.tipo_financiamiento === 'prestamo_con_interes' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tasa de Interés Anual (%)</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0"
                    placeholder="Ej: 5.5"
                    value={inyeccionForm.tasa_interes}
                    onChange={e => setInyeccionForm({ ...inyeccionForm, tasa_interes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas / Justificación</label>
                <textarea 
                  rows={2}
                  placeholder="Detalles sobre el préstamo o destino de los fondos para compras..."
                  value={inyeccionForm.notas}
                  onChange={e => setInyeccionForm({ ...inyeccionForm, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowInyeccionModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarInyeccion}
                disabled={guardandoInyeccion || !inyeccionForm.monto || !inyeccionForm.acreedor.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20"
              >
                {guardandoInyeccion ? "Registrando..." : "Registrar Inyección"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
