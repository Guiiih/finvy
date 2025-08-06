import apiClient from './apiClient'

export const journalEntryValidatorApiService = {
  async validateJournalEntry(journalEntryDescription: string): Promise<string> {
    const response = await apiClient.post('/journal-entry-validator', { journalEntryDescription })
    return response.data.validationResult
  },
}
