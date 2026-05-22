import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Projects
export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  addMember: (id, userId) => API.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
};

// Tasks
export const tasksAPI = {
  getAll: (params) => API.get('/tasks', { params }),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  getStats: () => API.get('/tasks/stats'),
};

// Users
export const usersAPI = {
  getAll: () => API.get('/users'),
  updateProfile: (data) => API.put('/users/profile', data),
  changePassword: (data) => API.put('/users/password', data),
};
// Attendance
export const attendanceAPI = {
  getByDate: (date) => API.get('/attendance', { params: { date } }),
  mark: (data) => API.post('/attendance', data),
  checkOut: (id) => API.put(`/attendance/${id}/checkout`),
  getHistory: (userId) => API.get(`/attendance/history/${userId}`),
};

export default API;
