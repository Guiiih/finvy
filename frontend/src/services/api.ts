import apiClient from './apiClient'
import { AxiosError, type AxiosRequestConfig } from 'axios'

// Helper para extrair a mensagem de erro de forma mais robusta
// Trata erros de Axios (respostas de API com dados de erro específicos) e erros genéricos.
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response) {
    // Prioriza a mensagem de erro vinda do seu backend
    if (error.response.data && typeof error.response.data.error === 'string') {
      return error.response.data.error
    }
    // Caso contrário, usa a mensagem de status ou a mensagem geral do erro
    return error.response.statusText || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocorreu um erro desconhecido na API.'
}

export const api = {
  get: async <T>(endpoint: string, options?: { params?: Record<string, unknown> }): Promise<T> => {
    try {
      const response = await apiClient.get<T>(endpoint, options)
      return response.data
    } catch (error) {
      // Sempre lança um novo erro com uma mensagem clara
      throw new Error(getErrorMessage(error))
    }
  },
  post: async <T, U>(endpoint: string, data: U, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  put: async <T, U>(endpoint: string, data: U): Promise<T> => {
    try {
      const response = await apiClient.put<T>(endpoint, data)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
  delete: async <T>(
    endpoint: string,
    options?: { params?: Record<string, unknown> },
  ): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(endpoint, options)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
}
