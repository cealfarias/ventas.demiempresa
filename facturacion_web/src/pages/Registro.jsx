import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, KeyRound, CheckSquare, Briefcase, FileText } from 'lucide-react';
import { api } from '../services/api';
import TerminosFacturacion from '../components/TerminosFacturacion';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    empresa_nombre: '',
    empresa_nit: '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    aceptar_terminos: false
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.aceptar_terminos) {
      setError("Debes aceptar los Términos de Referencia.");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      await api.post('/api/v1/auth/registro', formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la empresa.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-800">¡Empresa Creada!</h2>
        <p className="text-slate-500 mt-2 text-center max-w-sm">
          Tu espacio de trabajo aislado está listo. Serás redirigido al inicio de sesión en unos segundos...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-slate-50 border-r border-slate-100">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Únete a la nueva era de Facturación</h1>
            <p className="text-slate-500 mt-3 text-sm">Registra tu empresa y obtén un espacio aislado, seguro y multi-usuario.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Base de Datos Multi-Tenant</h4>
                <p className="text-xs text-slate-500 mt-1">Tus datos están aislados criptográficamente del resto de empresas.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Seguridad 2FA</h4>
                <p className="text-xs text-slate-500 mt-1">Protege el acceso a tu dinero y catálogos con verificación en 2 pasos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="p-8 sm:p-12">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Crear Espacio de Trabajo</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" name="empresa_nombre" required value={formData.empresa_nombre} onChange={handleChange} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIT (Opcional)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" name="empresa_nit" value={formData.empresa_nit} onChange={handleChange} className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-4" />

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Usuario Administrador</label>
              <input type="text" name="admin_username" required value={formData.admin_username} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
              <input type="email" name="admin_email" required value={formData.admin_email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contraseña Maestra</label>
              <input type="password" name="admin_password" minLength={6} required value={formData.admin_password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <input type="checkbox" name="aceptar_terminos" id="terminos" required checked={formData.aceptar_terminos} onChange={handleChange} className="mt-1" />
              <label htmlFor="terminos" className="text-xs text-slate-600 leading-relaxed">
                He leído y acepto los <strong onClick={(e) => { e.preventDefault(); setShowTerminos(true); }} className="text-indigo-600 cursor-pointer hover:underline">Términos de Referencia</strong> para el uso del software de Facturación.
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 mt-2 shadow-lg shadow-indigo-500/30">
              {loading ? 'Creando...' : 'Registrar mi Empresa'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              ¿Ya tienes un espacio? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Inicia Sesión</Link>
            </p>
          </div>
        </div>
      </div>
      
      {showTerminos && <TerminosFacturacion onClose={() => setShowTerminos(false)} />}
    </div>
  );
}
