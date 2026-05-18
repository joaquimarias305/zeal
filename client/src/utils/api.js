import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 60000, // 60s  -  Render free tier needs up to 50s to wake up
});

// Wake up Render backend on first load (prevents cold-start timeout on first user action)
if (process.env.NODE_ENV === 'production') {
  const healthUrl = BASE.replace('/api', '/health');
  fetch(healthUrl).catch(() => {});
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zeal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('zeal_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
