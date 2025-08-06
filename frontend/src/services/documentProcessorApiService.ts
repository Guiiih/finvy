import apiClient from './apiClient'

export const documentProcessorApiService = {
  async uploadDocument(file: File): Promise<{ extractedText: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post('/document-processor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
