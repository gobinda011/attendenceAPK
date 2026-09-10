import axios from 'axios';

// The backend base URL. In local development this points at the machine
// running Node/Express (Section 37 of the spec — NOT localhost from a phone,
// but the browser running this dashboard is on the same PC as the backend,
// so localhost is correct here).
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
