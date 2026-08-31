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
