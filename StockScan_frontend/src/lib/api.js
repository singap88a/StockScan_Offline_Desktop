import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
// http://localhost:5000
// https://stock-scan-backend.vercel.app
// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockscan_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if it's a 401 and we're NOT on the login page
    if (error.response?.status === 401 && !window.location.hash.includes('/login')) {
      localStorage.removeItem('stockscan_token');
      localStorage.removeItem('stockscan_user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (code) => api.get(`/products/barcode/${code}`),
  getLowStock: () => api.get('/products/low-stock'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getTodayStats: () => api.get('/invoices/today-stats'),
};

// ─── Returns ─────────────────────────────────────────────────────────────────
export const returnsAPI = {
  getAll: (params) => api.get('/returns', { params }),
  create: (data) => api.post('/returns', data),
  getTodayStats: () => api.get('/returns/today-stats'),
  delete: (id) => api.delete(`/returns/${id}`),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getWeeklySales: () => api.get('/dashboard/weekly-sales'),
  getMonthlySales: () => api.get('/dashboard/monthly-sales'),
  getCategorySales: () => api.get('/dashboard/category-sales'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getDailyStats: () => api.get('/dashboard/daily-stats'),
};

export const expensesAPI = {
  getAll: () => api.get('/expenses'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export default api;
