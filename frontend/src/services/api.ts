import apiClient from './apiClient';
import { AxiosError } from 'axios';

// Helper to extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.error || error.message || 'Erro desconhecido na API';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido na API';
};

export const api = {
  get: async <T>(endpoint: string, options?: { params?: Record<string, unknown> }): Promise<T> => {
    try {
      const response = await apiClient.get<T>(endpoint, options);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  post: async <T>(endpoint: string, data: unknown): Promise<T> => {
    try {
      const response = await apiClient.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  put: async <T>(endpoint: string, data: unknown): Promise<T> => {
    try {
      const response = await apiClient.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
  delete: async <T>(endpoint: string, options?: { params?: Record<string, unknown> }): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};