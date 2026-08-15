import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.value }));
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
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Código 2FA incorrecto');
    } finally {
      setLoading(false);
    }
  };

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
            <h1>Bienvenido de<br />nuevo</h1>
            <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.5 }}>
              Inicia sesión en tu espacio de facturación para gestionar tus ventas e inventario.
            </p>
            <ul className="login-benefits" style={{ marginTop: '3rem' }}>
              <li className="benefit-item">
                <div className="benefit-icon">💳</div>
                <span>Facturas, Créditos Fiscales y Consumidor Final</span>
              </li>
              <li className="benefit-item">
                <div className="benefit-icon">📦</div>
                <span>Kardex en tiempo real</span>
              </li>
              <li className="benefit-item">
                <div className="benefit-icon">📊</div>
                <span>Estadísticas de ventas al instante</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <div className="logo-placeholder" style={{ color: '#4f46e5', fontSize: '2.5rem' }}>📄</div>
              <h2>Iniciar Sesión</h2>
              <p className="text-muted">Ingresa a tu espacio de Facturación</p>
            </div>

            <form onSubmit={handleLoginSubmit}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <a href="#" className="text-muted" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.85rem', fontSize: '1rem' }}>
                {loading ? 'Ingresando...' : 'Ingresar al Dashboard'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                <hr style={{ flex: 1, borderTop: '1px solid #e2e8f0', margin: 0 }} />
                <span style={{ padding: '0 1rem', color: '#64748b', fontSize: '0.875rem' }}>O ingresa con</span>
                <hr style={{ flex: 1, borderTop: '1px solid #e2e8f0', margin: 0 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    // Aquí puedes implementar el Login con Google SSO después
                    console.log(credentialResponse);
                  }}
                  onError={() => {
                    console.log('Login Failed');
                  }}
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
