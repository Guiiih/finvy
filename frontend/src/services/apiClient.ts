import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use(
  async (config) => {
    // Import useAuthStore locally to avoid circular dependency at module initialization
    const { useAuthStore } = await import('@/stores/authStore');
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
  },
);

export default apiClient
