import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Share2 } from 'lucide-react';
import TerminosFacturacion from '../components/TerminosFacturacion';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

export default function Registro() {
  const navigate = useNavigate();
  const [googleToken, setGoogleToken] = useState(null);
  const [formData, setFormData] = useState({
    empresa_nombre: '',
    empresa_nit: '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    aceptar_terminos: false,
    aceptar_publicidad: false
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      if (googleToken) {
        // En un escenario real, pasarías el token de Google al backend para crear la empresa ligada a esa cuenta
        // await api.post('/api/v1/auth/registro-google', { ...formData, token: googleToken });
        await api.post('/api/v1/auth/registro', formData); // Fallback temporal para la demostración
      } else {
        await api.post('/api/v1/auth/registro', formData);
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la empresa.');
    } finally {
      setLoading(false);
    }
  };

  const shareText = "¡Acabo de registrar mi empresa en el Sistema de Facturación SaaS! Gestiona tus ventas fácilmente.";
  const shareUrl = "https://ventas.demiempresa.online"; 
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  if (success) {
    return (
      <div className="login-container">
        <div className="login-wrapper" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="login-right" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div className="logo-placeholder" style={{ color: '#4f46e5', fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>¡Empresa Registrada!</h2>
            <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1.125rem' }}>
              Tu espacio de facturación ha sido creado con éxito. <br/>Serás redirigido al inicio de sesión en unos segundos...
            </p>
            
            <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.125rem', color: '#0f172a' }}>
                <Share2 size={24} className="text-indigo-600" /> ¡Comparte con otros empresarios!
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" 
                   style={{ padding: '0.75rem 1.5rem', background: '#25D366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(37, 211, 102, 0.2)' }}>
                  WhatsApp
                </a>
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" 
                   style={{ padding: '0.75rem 1.5rem', background: '#0088cc', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px rgba(0, 136, 204, 0.2)' }}>
                  Telegram
                </a>
              </div>
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
            <h1>Facturación de<br />Próxima Generación</h1>
            <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.5 }}>
              Crea tu espacio de trabajo y transforma la gestión de tus ventas e inventarios en minutos.
            </p>
            <ul className="login-benefits" style={{ marginTop: '3rem' }}>
              <li className="benefit-item">
                <div className="benefit-icon">🏢</div>
                <span>Espacios Multi-Tenant Criptográficamente Aislados</span>
              </li>
              <li className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <span>Tus datos seguros con autenticación JWT y 2FA</span>
              </li>
              <li className="benefit-item">
                <div className="benefit-icon">📈</div>
                <span>Control total de ventas e inventarios</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="login-right">
          <div className="login-card" style={{ maxWidth: '420px' }}>
            <div className="login-header">
              <h2>Crear nueva Empresa</h2>
              <p className="text-muted">Ingresa los datos para crear tu espacio de facturación</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="login-error">{error}</div>}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre Empresa</label>
                  <input type="text" name="empresa_nombre" className="form-input" required value={formData.empresa_nombre} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">NIT (Opcional)</label>
                  <input type="text" name="empresa_nit" className="form-input" placeholder="0614-..." value={formData.empresa_nit} onChange={handleChange} />
                </div>
              </div>

              {googleToken ? (
                <div style={{ background: '#eef2ff', color: '#4f46e5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Autenticado con Google. Por favor completa los datos de tu empresa para finalizar el registro.
                </div>
              ) : null}

              {!googleToken && (
                <>
                  <div className="form-group">
                    <label className="form-label">Usuario Administrador</label>
                    <input type="text" name="admin_username" className="form-input" required value={formData.admin_username} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" name="admin_email" className="form-input" required value={formData.admin_email} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contraseña Maestra</label>
                    <input type="password" name="admin_password" className="form-input" required minLength={6} value={formData.admin_password} onChange={handleChange} />
                  </div>
                </>
              )}

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input type="checkbox" name="aceptar_terminos" id="terminos" required checked={formData.aceptar_terminos} onChange={handleChange} style={{ marginTop: '0.25rem' }} />
                  <label htmlFor="terminos" style={{ fontSize: '0.85rem', cursor: 'pointer', color: '#334155', lineHeight: 1.4 }}>
                    He leído y acepto los <strong onClick={(e) => { e.preventDefault(); setShowTerminos(true); }} style={{ color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }}>Términos de Referencia y el Contrato de Servicio</strong> de Facturación e Inventario SaaS.
                  </label>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: 0 }}>
                  <input type="checkbox" name="aceptar_publicidad" id="marketing" checked={formData.aceptar_publicidad} onChange={handleChange} style={{ marginTop: '0.25rem' }} />
                  <label htmlFor="marketing" className="text-muted" style={{ fontSize: '0.85rem', cursor: 'pointer', lineHeight: 1.4 }}>
                    Acepto recibir correos con actualizaciones y novedades de facturación electrónica.
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.85rem', fontSize: '1rem' }}>
                {loading ? 'Creando espacio...' : 'Registrar Empresa'}
              </button>
              
              {!googleToken && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <hr style={{ flex: 1, borderTop: '1px solid #e2e8f0', margin: 0 }} />
                    <span style={{ padding: '0 1rem', color: '#64748b', fontSize: '0.875rem' }}>O regístrate con</span>
                    <hr style={{ flex: 1, borderTop: '1px solid #e2e8f0', margin: 0 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        setGoogleToken(credentialResponse.credential);
                        setError(null);
                        setFormData(prev => ({
                          ...prev,
                          admin_username: 'google_sso_user',
                          admin_email: 'google@sso.com',
                          admin_password: 'GOOGLE_SSO_NO_PASSWORD'
                        }));
                      }}
                      onError={() => setError('Fallo la autenticación con Google')}
                      theme="outline"
                      size="large"
                      width="100%"
                      text="signup_with"
                    />
                  </div>
                </>
              )}
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <Link to="/login" className="text-muted" style={{ textDecoration: 'none' }}>
                ¿Ya tienes un espacio? <strong style={{ color: '#4f46e5' }}>Inicia Sesión aquí</strong>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {showTerminos && <TerminosFacturacion onClose={() => setShowTerminos(false)} />}
    </div>
  );
}
