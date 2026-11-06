import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach admin JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('makeupi_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'حدث خطأ في الاتصال بالخادم';
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('makeupi_admin_token');
      localStorage.removeItem('makeupi_admin_user');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
