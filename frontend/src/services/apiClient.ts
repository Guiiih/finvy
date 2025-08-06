import { useAuthStore } from '@/stores/authStore'
import { showToast } from './notificationService'

const handleResponse = async (response: Response) => {
  if (response.ok) {
    return response.json()
  }

  const errorData = await response.json()
  const authStore = useAuthStore()

  if (response.status === 401) {
    showToast('error', 'Sessão Expirada', 'Sua sessão expirou. Por favor, faça login novamente.')
    await authStore.signOut()
    window.location.href = '/login'
  } else if (response.status === 422 && errorData.errors) {
    const errorMessages = errorData.errors.map((err: { message: string }) => err.message).join('\n')
    showToast('error', 'Erro de Validação', errorMessages)
  } else if (response.status >= 500) {
    showToast(
      'error',
      'Erro no Servidor',
      'Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.',
    )
  } else if (errorData && errorData.message) {
    showToast('error', 'Erro', errorData.message)
  }

  throw new Error(errorData.message || 'Erro na requisição')
}

const createApiClient = () => {
  const getHeaders = () => {
    const authStore = useAuthStore()
    const token = authStore.token
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  return {
    get: async (url: string, options?: RequestInit) => {
      try {
        const response = await fetch(`/api${url}`, {
          ...options,
          headers: getHeaders(),
        })
        return handleResponse(response)
      } catch (error) {
        showToast('error', 'Erro de Rede', 'Não foi possível conectar ao servidor.')
        throw error
      }
    },
    post: async (url: string, body: unknown, options?: RequestInit) => {
      try {
        const response = await fetch(`/api${url}`, {
          ...options,
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        })
        return handleResponse(response)
      } catch (error) {
        showToast('error', 'Erro de Rede', 'Não foi possível conectar ao servidor.')
        throw error
      }
    },
    put: async (url: string, body: unknown, options?: RequestInit) => {
      try {
        const response = await fetch(`/api${url}`, {
          ...options,
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(body),
        })
        return handleResponse(response)
      } catch (error) {
        showToast('error', 'Erro de Rede', 'Não foi possível conectar ao servidor.')
        throw error
      }
    },
    delete: async (url: string, options?: RequestInit) => {
      try {
        const response = await fetch(`/api${url}`, {
          ...options,
          method: 'DELETE',
          headers: getHeaders(),
        })
        return handleResponse(response)
      } catch (error) {
        showToast('error', 'Erro de Rede', 'Não foi possível conectar ao servidor.')
        throw error
      }
    },
  }
}

export default createApiClient()
