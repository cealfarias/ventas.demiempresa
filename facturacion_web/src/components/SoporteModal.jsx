import React, { useState, useEffect } from "react";
import { 
  X, MessageSquare, Plus, Send, Headphones, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, User, Building, CornerDownRight, RefreshCw,
  Filter, PhoneCall, ExternalLink, Sparkles, Inbox, Check
} from "lucide-react";
import { api } from "../services/api";

export default function SoporteModal({ isOpen, onClose }) {
  const empresaId = localStorage.getItem("empresa_id");
  const usuarioId = localStorage.getItem("usuario_id") ? parseInt(localStorage.getItem("usuario_id")) : 1;
  const username = localStorage.getItem("username") || "Usuario";
  const userRole = (localStorage.getItem("rol") || "").toLowerCase();

  const isOwner = !userRole || userRole === "admin" || userRole === "administrador" || userRole === "propietario" || userRole === "superadmin";

  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox' | 'nuevo'
  const [filtroEstado, setFiltroEstado] = useState("TODOS"); // 'TODOS' | 'ABIERTO' | 'RESUELTO'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedUserGroup, setSelectedUserGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const [nuevoForm, setNuevoForm] = useState({
    asunto: "",
    categoria: "Soporte Técnico",
    prioridad: "Media",
    mensaje_inicial: ""
  });

  const [nuevoMensaje, setNuevoMensaje] = useState("");

  useEffect(() => {
    if (isOpen) {
      cargarTickets();
    }
  }, [isOpen]);

  const cargarTickets = async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/soporte/tickets?empresa_id=${empresaId}&usuario_id=${usuarioId}`);
      const data = res.data || [];
      setTickets(data);

      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      } else if (data.length > 0 && selectedTicket) {
        const actualizado = data.find(t => t.id === selectedTicket.id);
        if (actualizado) setSelectedTicket(actualizado);
      }
    } catch (err) {
      console.error("Error cargando tickets de soporte:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupedByUser = React.useMemo(() => {
    if (!isOwner) return [];
    const groups = {};

    const ticketsParaAgrupar = tickets.filter(t => {
      if (filtroEstado === "ABIERTO") return t.estado === "ABIERTO" || t.estado === "ESPERANDO RESPUESTA" || t.estado === "REABIERTO";
      if (filtroEstado === "RESUELTO") return t.estado === "RESUELTO";
      return true;
    });

    ticketsParaAgrupar.forEach(t => {
      const key = (t.nombre_usuario || "Usuario") + "_" + (t.nombre_empresa || "Empresa");
      if (!groups[key]) {
        groups[key] = {
          key: key,
          nombre_usuario: t.nombre_usuario,
          nombre_empresa: t.nombre_empresa,
          tickets: [],
          ultimo_mensaje_fecha: t.fecha_actualizacion,
          unread_count: 0
        };
      }
      groups[key].tickets.push(t);
      if (new Date(t.fecha_actualizacion) > new Date(groups[key].ultimo_mensaje_fecha)) {
        groups[key].ultimo_mensaje_fecha = t.fecha_actualizacion;
      }
      if (t.estado === "ABIERTO" || t.estado === "ESPERANDO RESPUESTA" || t.estado === "REABIERTO") {
        groups[key].unread_count += 1;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.ultimo_mensaje_fecha) - new Date(a.ultimo_mensaje_fecha));
  }, [tickets, filtroEstado, isOwner]);

  useEffect(() => {
    if (isOwner && groupedByUser.length > 0) {
      if (!selectedUserGroup) {
        setSelectedUserGroup(groupedByUser[0]);
      } else {
        const updated = groupedByUser.find(g => g.key === selectedUserGroup.key);
        if (updated) setSelectedUserGroup(updated);
      }
    } else if (isOwner && groupedByUser.length === 0) {
      setSelectedUserGroup(null);
    }
  }, [groupedByUser, isOwner]);

  const handleCrearTicket = async (e) => {
    e.preventDefault();
    if (!nuevoForm.asunto.trim() || !nuevoForm.mensaje_inicial.trim()) return;

    try {
      setLoading(true);
      const res = await api.post(`/api/v1/soporte/tickets?empresa_id=${empresaId}&usuario_id=${usuarioId}`, nuevoForm);
      setNuevoForm({ asunto: "", categoria: "Soporte Técnico", prioridad: "Media", mensaje_inicial: "" });
      await cargarTickets();
      setSelectedTicket(res.data);
      setActiveTab("inbox");
      window.dispatchEvent(new CustomEvent("avatar:say", { detail: { text: "Ticket de soporte enviado exitosamente." }}));
    } catch (err) {
      alert("Error al enviar mensaje a soporte: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    let targetTicketId = null;
    if (isOwner) {
      if (!selectedUserGroup) return;
      const lastTicket = [...selectedUserGroup.tickets].sort((a, b) => b.id - a.id)[0];
      if (!lastTicket) return;
      targetTicketId = lastTicket.id;
    } else {
      if (!selectedTicket) return;
      targetTicketId = selectedTicket.id;
    }

    try {
      setSendingMsg(true);
      await api.post(`/api/v1/soporte/tickets/${targetTicketId}/mensajes?empresa_id=${empresaId}&usuario_id=${usuarioId}`, {
        contenido: nuevoMensaje
      });
      setNuevoMensaje("");
      await cargarTickets();
    } catch (err) {
      alert("Error enviando mensaje: " + (err.response?.data?.detail || err.message));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      if (isOwner && selectedUserGroup) {
        for (const t of selectedUserGroup.tickets) {
          if (t.estado !== nuevoEstado) {
            await api.put(`/api/v1/soporte/tickets/${t.id}/estado?nuevo_estado=${nuevoEstado}&empresa_id=${empresaId}&usuario_id=${usuarioId}`);
          }
        }
      } else if (selectedTicket) {
        await api.put(`/api/v1/soporte/tickets/${selectedTicket.id}/estado?nuevo_estado=${nuevoEstado}&empresa_id=${empresaId}&usuario_id=${usuarioId}`);
      }
      await cargarTickets();
    } catch (err) {
      alert("Error al cambiar estado: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!isOpen) return null;

  const ticketsFiltrados = tickets.filter(t => {
    if (filtroEstado === "ABIERTO") return t.estado === "ABIERTO" || t.estado === "RESPONDIDO" || t.estado === "ESPERANDO RESPUESTA";
    if (filtroEstado === "RESUELTO") return t.estado === "RESUELTO";
    return true;
  });

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "RESUELTO":
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resuelto</span>;
      case "EN_PROCESO":
      case "RESPONDIDO":
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Respondido</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Abierto</span>;
    }
  };

  const activeMessages = isOwner
    ? (selectedUserGroup ? selectedUserGroup.tickets.flatMap(t => t.mensajes || []) : [])
    : (selectedTicket ? (selectedTicket.mensajes || []) : []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Superior */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl text-white shadow-md">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Centro de Soporte Técnico
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-400/30">Ventas SaaS</span>
              </h2>
              <p className="text-xs text-slate-400">Atención directa en línea y resolución de incidencias</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={cargarTickets} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors" title="Actualizar">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 flex overflow-hidden">

          {/* Panel Izquierdo: Lista de Tickets o Grupos */}
          <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
            {/* Tabs y Botón Nuevo */}
            <div className="p-3 border-b border-slate-200 space-y-2">
              <button 
                onClick={() => setActiveTab("nuevo")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Nuevo Mensaje de Soporte
              </button>

              <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
                <button 
                  onClick={() => setActiveTab("inbox")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${activeTab === 'inbox' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Mensajes ({isOwner ? groupedByUser.length : tickets.length})
                </button>
              </div>
            </div>

            {/* Filtros de Estado */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px]">Filtro:</span>
              <div className="flex gap-1">
                {['TODOS', 'ABIERTO', 'RESUELTO'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFiltroEstado(f)}
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors ${filtroEstado === f ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200/50 text-slate-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Conversaciones */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading && tickets.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">Cargando conversaciones...</p>
              ) : isOwner ? (
                groupedByUser.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-slate-500 font-semibold">No hay tickets de clientes</p>
                  </div>
                ) : (
                  groupedByUser.map(g => (
                    <button
                      key={g.key}
                      onClick={() => { setSelectedUserGroup(g); setActiveTab("inbox"); }}
                      className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 ${selectedUserGroup?.key === g.key ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{g.nombre_usuario}</span>
                        {g.unread_count > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">{g.unread_count}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{g.nombre_empresa}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{g.tickets.length} ticket(s)</span>
                        <span>{new Date(g.ultimo_mensaje_fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </button>
                  ))
                )
              ) : (
                ticketsFiltrados.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-slate-500 font-semibold">No tienes consultas registradas</p>
                  </div>
                ) : (
                  ticketsFiltrados.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTicket(t); setActiveTab("inbox"); }}
                      className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 ${selectedTicket?.id === t.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[160px]">{t.asunto}</span>
                        {getEstadoBadge(t.estado)}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{t.categoria}</p>
                      <p className="text-[10px] text-slate-400 text-right mt-0.5">{new Date(t.fecha_actualizacion).toLocaleString()}</p>
                    </button>
                  ))
                )
              )}
            </div>
          </div>

          {/* Panel Derecho: Formulario Nuevo o Chat Activo */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {activeTab === "nuevo" ? (
              <form onSubmit={handleCrearTicket} className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Enviar Nueva Consulta a Soporte Técnico</h3>
                  <p className="text-xs text-slate-500">Describa su requerimiento o inconveniente técnico. Le responderemos a la brevedad.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Categoría *</label>
                    <select 
                      value={nuevoForm.categoria}
                      onChange={e => setNuevoForm({ ...nuevoForm, categoria: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Soporte Técnico">Soporte Técnico General</option>
                      <option value="Facturación DTE">Facturación DTE / MH</option>
                      <option value="Control de Caja">Control de Caja y Arqueo</option>
                      <option value="Almacén e Inventarios">Almacén e Inventarios / Kardex</option>
                      <option value="Consulta Licencia">Licencia / Cuenta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Prioridad</label>
                    <select 
                      value={nuevoForm.prioridad}
                      onChange={e => setNuevoForm({ ...nuevoForm, prioridad: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Asunto / Título del Mensaje *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Inconveniente al emitir factura DTE"
                    value={nuevoForm.asunto}
                    onChange={e => setNuevoForm({ ...nuevoForm, asunto: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mensaje Explicativo *</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Escriba aquí en detalle lo que requiere o la descripción de la duda..."
                    value={nuevoForm.mensaje_inicial}
                    onChange={e => setNuevoForm({ ...nuevoForm, mensaje_inicial: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setActiveTab("inbox")}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !nuevoForm.asunto.trim() || !nuevoForm.mensaje_inicial.trim()}
                    className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar Mensaje
                  </button>
                </div>
              </form>
            ) : (
              /* Vista Hilo de Chat */
              (isOwner ? selectedUserGroup : selectedTicket) ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Banner Header Chat */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {isOwner ? selectedUserGroup.nombre_usuario : selectedTicket.asunto}
                        {getEstadoBadge(isOwner ? selectedUserGroup.tickets[0]?.estado : selectedTicket.estado)}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isOwner 
                          ? `Empresa: ${selectedUserGroup.nombre_empresa}` 
                          : `Categoría: ${selectedTicket.categoria} | Prioridad: ${selectedTicket.prioridad}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCambiarEstado("RESUELTO")}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Marcar Resuelto
                      </button>
                    </div>
                  </div>

                  {/* Área Hilo de Mensajes */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                    {activeMessages.length === 0 ? (
                      <p className="text-center py-10 text-xs text-slate-400">Sin mensajes en esta conversación.</p>
                    ) : (
                      activeMessages.map(m => {
                        const esMio = isOwner ? m.es_propietario : !m.es_propietario;
                        return (
                          <div 
                            key={m.id} 
                            className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-600">
                                {m.nombre_remitente || (m.es_propietario ? "Soporte Técnico" : "Cliente")}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {new Date(m.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                              esMio 
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none font-medium' 
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium'
                            }`}>
                              {m.contenido}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Enviar Mensaje */}
                  <form onSubmit={handleEnviarMensaje} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                    <input 
                      type="text"
                      placeholder="Escriba su respuesta o mensaje..."
                      value={nuevoMensaje}
                      onChange={e => setNuevoMensaje(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <button 
                      type="submit"
                      disabled={sendingMsg || !nuevoMensaje.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sendingMsg ? "Enviando..." : "Responder"}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mb-3 opacity-50" />
                  <h4 className="font-bold text-slate-700 text-sm">Seleccione una conversación</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">Elige un ticket de la lista a la izquierda o haz clic en "Nuevo Mensaje de Soporte" para iniciar una consulta.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
