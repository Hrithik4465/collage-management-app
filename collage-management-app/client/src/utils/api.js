import axios from 'axios';

const api = axios.create({
  baseURL: `http://${typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost'}:5000/api`,
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
