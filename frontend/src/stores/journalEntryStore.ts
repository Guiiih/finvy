import { defineStore } from 'pinia';
import type { JournalEntry } from '../types/index';

interface JournalEntryState {
  journalEntries: JournalEntry[];
}

export const useJournalEntryStore = defineStore('journalEntry', {
  state: (): JournalEntryState => ({
    journalEntries: [],
  }),
  actions: {
    addJournalEntry(entry: JournalEntry) {
      this.journalEntries.push(entry);
    },
  },
  getters: {
    getAllJournalEntries(state) {
      return state.journalEntries;
    },
    getJournalEntryById: (state) => (id: string) => {
      return state.journalEntries.find(entry => entry.id === id);
    },
  },
});