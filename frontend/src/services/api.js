import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  getMe: () => api.get('/api/auth/me')
};

export const employeeAPI = {
  getProfile: () => api.get('/api/employee/profile'),
  updateProfile: (data) => api.put('/api/employee/profile', data)
};

export const taskAPI = {
  getTasks: (params) => api.get('/api/tasks', { params }),
  createTask: (data) => api.post('/api/tasks', data),
  updateTask: (id, data) => api.put(`/api/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`)
};

export const progressAPI = {
  getProgress: () => api.get('/api/progress')
};

export const aiAPI = {
  chat: (data) => api.post('/api/ai/chat', data),
  getNextAction: () => api.post('/api/ai/next-action', {}),
  getLearningPath: () => api.get('/api/ai/learning-path'),
  toggleLearningModule: (stageIndex, moduleIndex) =>
    api.put('/api/ai/learning-path/module', { stageIndex, moduleIndex }),
  getHealth: () => api.get('/api/ai/health'),
  getConversations: () => api.get('/api/ai/conversations'),
  getConversation: (id) => api.get(`/api/ai/conversations/${id}`),
  createConversation: (data) => api.post('/api/ai/conversations', data),
  updateConversation: (id, data) => api.put(`/api/ai/conversations/${id}`, data),
  clearConversation: (id) => api.delete(`/api/ai/conversations/${id}`)
};

export const documentAPI = {
  getDocuments: (params) => api.get('/api/documents', { params }),
  uploadDocument: (formData) =>
    api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteDocument: (id) => api.delete(`/api/documents/${id}`),
  seedDocuments: () => api.post('/api/documents/seed')
};

export const adminAPI = {
  getAnalytics: () => api.get('/api/admin/analytics'),
  getEmployees: () => api.get('/api/admin/employees')
};

export default api;
