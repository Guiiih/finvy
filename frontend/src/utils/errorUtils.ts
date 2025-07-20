import axios from 'axios'

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return 'Ocorreu um erro desconhecido.'
}
