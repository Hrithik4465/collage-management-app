import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  `http://${typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost'}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
