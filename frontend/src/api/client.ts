import axios from 'axios';

// In production (Vercel): VITE_API_URL = "https://your-app.up.railway.app/api/v1"
// In development: falls back to "/api/v1" (handled by Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT bearer token to requests automatically
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('admin_token');
    const customerToken = localStorage.getItem('afsoo_customer_token');

    // If request already has an Authorization header, don't overwrite it
    if (config.headers.Authorization) {
      return config;
    }

    if (adminToken && (config.url?.includes('/admin') || window.location.pathname.startsWith('/admin'))) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect on 401 Unauthorized ONLY for admin pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
