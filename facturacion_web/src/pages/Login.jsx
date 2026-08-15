import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ShieldAlert, LogIn, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formParams = new URLSearchParams();
      formParams.append('username', formData.username);
      formParams.append('password', formData.password);

      // Asumiendo que el backend corre en el mismo dominio o tenemos un proxy
      const res = await api.post('/api/v1/auth/login', formParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (res.data.require_2fa) {
        setRequires2FA(true);
      } else {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('rol', res.data.rol);
        localStorage.setItem('empresa_id', res.data.empresa_id);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post(`/api/v1/auth/2fa/verify?username=${formData.username}&token=${otpCode}`);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('rol', res.data.rol);
      localStorage.setItem('empresa_id', res.data.empresa_id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Banner Visual */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 text-white relative">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-bold text-xl shadow-lg">
              F
            </div>
            <div>
              <h1 className="font-black text-xl leading-none">Facturación SaaS</h1>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Motor Multi-Tenant</span>
            </div>
          </div>

          <div className="relative z-10 my-auto text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-indigo-800/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-indigo-500/30">
              <ShieldAlert className="w-16 h-16 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Acceso Seguro</h2>
              <p className="text-indigo-200 text-sm mt-2 px-8">
                Ingresa a tu espacio de trabajo para administrar inventarios, clientes y emitir facturas al instante.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-extrabold text-slate-800">Bienvenido de vuelta</h3>
            <p className="text-sm text-slate-500 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Usuario</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="ej: juan.perez"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Contraseña</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg shadow-indigo-500/30"
              >
                {loading ? 'Verificando...' : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-4 text-sm text-indigo-700 font-medium">
                Tu cuenta tiene la Verificación en 2 Pasos activada. Abre tu aplicación autenticadora (ej. Google Authenticator) e ingresa el código.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Código OTP (6 dígitos)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-lg tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl mt-4"
              >
                {loading ? 'Validando...' : 'Verificar e Ingresar'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setRequires2FA(false)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
              >
                Volver atrás
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes una cuenta de empresa?{' '}
              <Link to="/registro" className="text-indigo-600 font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
