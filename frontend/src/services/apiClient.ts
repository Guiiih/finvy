
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('Token de autenticação não encontrado.');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
