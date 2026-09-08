import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Key, CheckCircle, XCircle, 
  Search, RefreshCw, AlertCircle, Edit, Check, Lock, UserCheck
} from 'lucide-react';
import { api } from '../services/api';

const ROLES_INFO = {
  admin: { label: 'Administrador / SuperAdmin', color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'Acceso total al sistema, configuración DTE y gestión de usuarios.' },
  contador: { label: 'Contador', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Libros contables, Kardex, Cuentas por Cobrar/Pagar y reportes.' },
  auditor: { label: 'Auditor', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Acceso de solo lectura a todos los módulos para supervisión.' },
  bodeguero: { label: 'Bodeguero / Almacén', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Control de bodegas, entradas/salidas, existencias y recepción de compras.' },
  cajera: { label: 'Cajera / Cajero', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'Turno de caja, facturación DTE rápida, cobros e inyección de capital.' },
  encargado_compras: { label: 'Encargado de Compras', color: 'bg-rose-100 text-rose-700 border-rose-200', desc: 'Gestión de proveedores, emisión de Órdenes de Compra y Cuentas por Pagar.' },
  vendedor: { label: 'Vendedor / Comercial', color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Clientes, cotizaciones, pre-facturas y consulta de stock.' },
  despachador: { label: 'Despachador / Logística', color: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'Rutas de entrega, guías de remisión DTE y despachos.' },
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');

  // Modales
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states
  const [nuevoUser, setNuevoUser] = useState({ username: '', email: '', password: '', rol: 'cajera' });
  const [userEditar, setUserEditar] = useState(null);
  const [editarForm, setEditarForm] = useState({ email: '', rol: 'cajera', is_active: true });
  const [userReset, setUserReset] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/v1/usuarios');
      setUsuarios(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'No se pudo cargar la lista de usuarios. Asegúrate de ser Administrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await api.post('/api/v1/usuarios', nuevoUser);
      setMensajeExito(`Usuario ${nuevoUser.username} creado exitosamente.`);
      setShowCrearModal(false);
      setNuevoUser({ username: '', email: '', password: '', rol: 'cajera' });
      cargarUsuarios();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (u) => {
    setUserEditar(u);
    setEditarForm({ email: u.email, rol: u.rol, is_active: u.is_active });
    setShowEditarModal(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await api.put(`/api/v1/usuarios/${userEditar.id}`, editarForm);
      setMensajeExito(`Usuario ${userEditar.username} actualizado.`);
      setShowEditarModal(false);
      cargarUsuarios();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirReset = (u) => {
    setUserReset(u);
    setNuevaPassword('');
    setShowResetModal(true);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await api.put(`/api/v1/usuarios/${userReset.id}/reset-password`, { new_password: nuevaPassword });
      setMensajeExito(`Contraseña restablecida para ${userReset.username}.`);
      setShowResetModal(false);
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideTexto = u.username.toLowerCase().includes(busqueda.toLowerCase()) || 
                          u.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'todos' || u.rol === filtroRol;
    return coincideTexto && coincideRol;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Gestión de Usuarios y Roles (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra los colaboradores de tu empresa, asigna roles predefinidos y controla el acceso a cada módulo del ERP.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cargarUsuarios}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Refrescar
          </button>
          <button
            onClick={() => setShowCrearModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol:</label>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="todos">Todos los roles</option>
            {Object.keys(ROLES_INFO).map((r) => (
              <option key={r} value={r}>{ROLES_INFO[r].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Cargando colaboradores...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No se encontraron usuarios registrados con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Correo Electrónico</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const rInfo = ROLES_INFO[u.rol] || { label: u.rol, color: 'bg-slate-100 text-slate-700 border-slate-200', desc: '' };
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs uppercase border border-indigo-200">
                          {u.username.substring(0, 2)}
                        </div>
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${rInfo.color}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {rInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs font-medium border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium border border-slate-200">
                            <XCircle className="w-3 h-3" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            title="Editar Rol o Estado"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirReset(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                            title="Restablecer Contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCrearModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Registrar Nuevo Colaborador
              </h3>
              <button onClick={() => setShowCrearModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Usuario (`username`):</label>
                <input
                  type="text"
                  required
                  value={nuevoUser.username}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, username: e.target.value })}
                  placeholder="ej: maria.cajera"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={nuevoUser.email}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, email: e.target.value })}
                  placeholder="colaborador@empresa.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña Inicial:</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={nuevoUser.password}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rol Asignado:</label>
                <select
                  value={nuevoUser.rol}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, rol: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(ROLES_INFO).map((r) => (
                    <option key={r} value={r}>{ROLES_INFO[r].label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  ℹ️ <strong>Alcance:</strong> {ROLES_INFO[nuevoUser.rol]?.desc}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCrearModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30"
                >
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditarModal && userEditar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" /> Modificar Usuario: {userEditar.username}
              </h3>
              <button onClick={() => setShowEditarModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleEditar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={editarForm.email}
                  onChange={(e) => setEditarForm({ ...editarForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rol Asignado:</label>
                <select
                  value={editarForm.rol}
                  onChange={(e) => setEditarForm({ ...editarForm, rol: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(ROLES_INFO).map((r) => (
                    <option key={r} value={r}>{ROLES_INFO[r].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado de la cuenta:</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      checked={editarForm.is_active === true}
                      onChange={() => setEditarForm({ ...editarForm, is_active: true })}
                    />
                    <span className="font-semibold text-emerald-700">Activo</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active"
                      checked={editarForm.is_active === false}
                      onChange={() => setEditarForm({ ...editarForm, is_active: false })}
                    />
                    <span className="font-semibold text-slate-500">Inactivo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditarModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/30"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restablecer Contraseña */}
      {showResetModal && userReset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" /> Restablecer Contraseña
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleReset} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Ingresa la nueva contraseña para el usuario <strong>{userReset.username}</strong>:
              </p>
              <div>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Nueva contraseña..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-600/30"
                >
                  {guardando ? 'Actualizando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
