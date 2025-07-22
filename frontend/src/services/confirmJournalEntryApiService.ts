import apiClient from './apiClient';

export interface ProposedEntry {
  date: string;
  description: string;
  debits: Array<{ account: string; value: number }>;
  credits: Array<{ account: string; value: number }>;
}

export const confirmJournalEntryApiService = {
  async confirmEntries(proposedEntries: ProposedEntry[]): Promise<any> {
    const response = await apiClient.post('/confirm-journal-entries', { proposedEntries });
    return response.data;
  },
};
