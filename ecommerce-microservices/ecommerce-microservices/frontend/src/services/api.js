import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (data) => api.post('/api/auth/register', data),
};

// Products
export const productsAPI = {
  getAll: () => api.get('/api/products'),
  getById: (id) => api.get(`/api/products/${id}`),
  getByCategory: (cat) => api.get(`/api/products/category/${cat}`),
  search: (name) => api.get('/api/products/search', { params: { name } }),
  getAvailable: () => api.get('/api/products/available'),
  getStats: () => api.get('/api/products/stats'),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
};

// Orders
export const ordersAPI = {
  create: (data) => api.post('/api/orders', data),
  getMyOrders: () => api.get('/api/orders'),
  getById: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/api/orders/${id}/status`, null, { params: { status } }),
  getStats: () => api.get('/api/orders/stats'),
};

// Chatbot
export const chatbotAPI = {
  ask: (question, sessionId) =>
    api.post('/api/chatbot/chat/', { question, session_id: sessionId }),
  getHistory: (sessionId) => api.get(`/api/chatbot/chat/history/${sessionId}`),
};

export default api;
