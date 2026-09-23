import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const LOADING_STEPS = [
  { title: "Verificando credenciales...", sub: "Iniciando protocolo de seguridad SSL 256-Bit" },
  { title: "Conectando con el Servidor Render Cloud...", sub: "Estableciendo sesión segura de alta velocidad" },
  { title: "Sincronizando espacio de Facturación...", sub: "Cargando inventario, cajas y permisos de usuario" },
  { title: "¡Autenticación exitosa! Entrando al Dashboard...", sub: "Abriendo la plataforma principal" }
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const isExpired = new URLSearchParams(location.search).get('expired');

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (!loading) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1300);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (isExpired) {
      const speechText = "Hola, tu sesión ha sido cerrada automáticamente por inactividad para proteger la seguridad de tu empresa. Por favor, ingresa tus credenciales nuevamente.";
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = 'es-ES';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.error("Error al sintetizar voz del avatar", e);
        }
      }
    }
  }, [isExpired]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formParams = new URLSearchParams();
      formParams.append('username', formData.username);
      formParams.append('password', formData.password);

      const res = await api.post('/api/v1/auth/login', formParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (res.data.require_2fa) {
        setShow2FA(true);
      } else {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('rol', res.data.rol);
        localStorage.setItem('empresa_id', res.data.empresa_id);
        if (res.data.usuario_id) localStorage.setItem('usuario_id', res.data.usuario_id.toString());
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales inválidas');
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
      if (res.data.usuario_id) localStorage.setItem('usuario_id', res.data.usuario_id.toString());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Código 2FA incorrecto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    const step = LOADING_STEPS[loadingStepIdx] || LOADING_STEPS[0];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white font-sans p-4">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300 mb-8 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Servidor Render • Conexión Segura</span>
          </div>

          {/* Círculo Animado con Flecha Recorriendo el Borde */}
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
            {/* Anillo de fondo resplandeciente */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-pulse border border-indigo-500/20" />

            {/* SVG Anillo Giratorio Gradient */}
            <svg className="w-full h-full animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '2.2s' }}>
              <defs>
                <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
                  <stop offset="50%" stopColor="#c084fc" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="5.5"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#spinnerGradient)"
                strokeWidth="5.5"
                strokeDasharray="180"
                strokeDashoffset="60"
                strokeLinecap="round"
              />
            </svg>

            {/* Flecha Orbitando Recorriendo el Círculo */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.2s' }}>
              <div className="absolute top-[3px] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white p-1 rounded-full shadow-lg shadow-indigo-500/80">
                <ArrowRight className="w-3.5 h-3.5 rotate-[-45deg]" />
              </div>
            </div>

            {/* Logo Central Resplandeciente */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 border border-indigo-300/30">
                <ShieldCheck className="w-7 h-7 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Textos Informativos Profesionales */}
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight transition-all duration-300">
            {step.title}
          </h3>
          <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
            {step.sub}
          </p>

          {/* Barra de Progreso Dinámica */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Pie de página */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Facturación SaaS
            </span>
            <span className="font-mono text-slate-400">v2.4 • Render Cloud</span>
          </div>
        </div>
      </div>
    );
  }

  if (show2FA) {
    return (
      <div className="login-container">
        <div className="login-wrapper" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div className="login-right" style={{ padding: '3rem 2rem', width: '100%' }}>
            <div className="login-card">
              <div className="login-header">
                <div className="logo-placeholder" style={{ color: '#4f46e5' }}>🔐</div>
                <h2>Verificación en 2 Pasos</h2>
                <p className="text-muted">Abre Google Authenticator e ingresa el código de 6 dígitos.</p>
              </div>

              <form onSubmit={handle2FASubmit}>
                {error && <div className="login-error">{error}</div>}
                
                <div className="form-group" style={{ textAlign: 'center' }}>
                  <input 
                    type="text" 
                    value={otpCode} 
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-input" 
                    placeholder="000000"
                    style={{ fontSize: '2rem', letterSpacing: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '1rem' }}>
                  {loading ? 'Verificando...' : 'Verificar y Entrar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Lado izquierdo */}
        <div className="login-left">
          <div className="login-left-content">
            <h1>El Control Total<br />de tu Empresa</h1>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.45 }}>
              Accede a tu plataforma y unifica la administración de todas tus áreas y sucursales.
            </p>
            <ul className="login-benefits" style={{ marginTop: '1.75rem' }}>
              <li className="benefit-item">
                <div className="benefit-icon">🤝</div>
                <span>Conecta Ventas, Inventario y Contabilidad</span>
              </li>
              <li className="benefit-item">
                <div className="benefit-icon">📦</div>
                <span>Kardex Sincronizado en Tiempo Real</span>
              </li>
              <li className="benefit-item">
                <div className="benefit-icon">📊</div>
                <span>Toma de Decisiones Basada en Datos Reales</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <div className="logo-placeholder" style={{ color: '#4f46e5', fontSize: '1.75rem' }}>📄</div>
              <h2>Iniciar Sesión</h2>
              <p className="text-muted">Ingresa a tu espacio de Facturación</p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              {isExpired && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '1.0rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                  }}>
                    🤖
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                      <span>Avatar IA Asistente</span>
                      <span style={{ fontSize: '0.6rem', background: '#dcfce7', color: '#15803d', padding: '0.05rem 0.35rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seguridad</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#15803d', lineHeight: '1.35', margin: 0 }}>
                      ¡Hola! Se ha cerrado tu sesión automáticamente por inactividad para proteger los datos de tu empresa. Por favor, ingresa tus credenciales para continuar.
                    </p>
                  </div>
                </div>
              )}
              {error && <div className="login-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Correo Electrónico / Usuario</label>
                <input 
                  type="text" 
                  name="username" 
                  className="form-input" 
                  required 
                  value={formData.username} 
                  onChange={handleChange} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input 
                  type="password" 
                  name="password" 
                  className="form-input" 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <a href="#" className="text-muted" style={{ fontSize: '0.8rem', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.6rem', fontSize: '0.875rem' }}>
                {loading ? 'Ingresando...' : 'Ingresar al Dashboard'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                <hr style={{ flex: 1, borderTop: '1px solid #e2e8f0', margin: 0 }} />
                <span style={{ padding: '0 0.75rem', color: '#64748b', fontSize: '0.8rem' }}>O ingresa con</span>
                <hr style={{ flex: 1, borderTop: '1px solid #e2e8f0', margin: 0 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setLoading(true);
                      const token = credentialResponse.credential;
                      const base64Url = token.split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                      const decoded = JSON.parse(jsonPayload);
                      
                      const res = await api.post('/api/v1/auth/google-login', { email: decoded.email });
                      
                      if (res.data.registered === false) {
                        window.dispatchEvent(new CustomEvent('avatar:say', {
                          detail: { text: 'Su usuario no está registrado, pasamos a registrarlo.', options: [] }
                        }));
                        navigate('/registro', {
                          state: {
                            googleEmail: decoded.email,
                            googleName: decoded.name || decoded.given_name,
                            googleToken: token,
                            userExists: false
                          }
                        });
                        return;
                      }

                      if (res.data.has_empresa === false) {
                        window.dispatchEvent(new CustomEvent('avatar:say', {
                          detail: { text: 'Su usuario no tiene una empresa registrada. Pasemos a registrar su empresa.', options: [] }
                        }));
                        navigate('/registro', {
                          state: {
                            googleEmail: decoded.email,
                            googleUsername: res.data.username,
                            googleToken: token,
                            userExists: true
                          }
                        });
                        return;
                      }

                      localStorage.setItem('token', res.data.access_token);
                      localStorage.setItem('rol', res.data.rol);
                      localStorage.setItem('empresa_id', res.data.empresa_id);
                      if (res.data.usuario_id) localStorage.setItem('usuario_id', res.data.usuario_id.toString());
                      navigate('/');
                    } catch (err) {
                      setError(err.response?.data?.detail || 'Error al autenticar con Google. Por favor, intenta de nuevo.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => setError('Fallo al conectar con Google')}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signin_with"
                />
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <Link to="/registro" className="text-muted" style={{ textDecoration: 'none' }}>
                ¿No tienes un espacio? <strong style={{ color: '#4f46e5' }}>Crea tu Empresa aquí</strong>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
