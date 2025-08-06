import apiClient from './apiClient'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocorreu um erro desconhecido na API.'
}

export const api = {
  get: async <T>(endpoint: string, options?: { params?: Record<string, unknown> }): Promise<T> => {
    try {
      const url = new URL(endpoint, 'http://localhost')
      if (options?.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }
      return await apiClient.get(url.pathname + url.search)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
  post: async <T, U>(endpoint: string, data: U): Promise<T> => {
    try {
      return await apiClient.post(endpoint, data)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
  put: async <T, U>(endpoint: string, data: U): Promise<T> => {
    try {
      return await apiClient.put(endpoint, data)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
  delete: async <T>(
    endpoint: string,
    options?: { params?: Record<string, unknown> },
  ): Promise<T | null> => {
    try {
      const url = new URL(endpoint, 'http://localhost')
      if (options?.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }
      const response = await apiClient.delete(url.pathname + url.search)
      if (response && response.status === 204) {
        return null
      }
      return response
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
}
