import axios from 'axios';

// La URL base por defecto será localhost para desarrollo
// En producción, tomaremos la variable de entorno de Vercel
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
});

// Interceptor para inyectar el Token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar expiracion de sesion (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/registro') {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        localStorage.removeItem('empresa_id');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);
