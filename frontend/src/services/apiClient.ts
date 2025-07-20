import axios from 'axios'

import { useAuthStore } from '@/stores/authStore'
import { showToast } from './notificationService'

interface ApiError {
  message: string
}

const apiClient = axios.create({
  baseURL: '/api',
})

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('Token de autenticação não encontrado.')
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        showToast(
          'error',
          'Sessão Expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
        )
        await authStore.signOut()
        window.location.href = '/login'
      } else if (status === 422 && data.errors) {
        const errorMessages = data.errors.map((err: ApiError) => err.message).join('\n')
        showToast('error', 'Erro de Validação', errorMessages)
      } else if (status >= 500) {
        showToast(
          'error',
          'Erro no Servidor',
          'Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.',
        )
      } else if (data && data.message) {
        showToast('error', 'Erro', data.message)
      }
    } else if (error.request) {
      showToast(
        'error',
        'Erro de Rede',
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      )
    } else {
      showToast('error', 'Erro Inesperado', error.message)
    }

    return Promise.reject(error)
  },
)

export default apiClient
