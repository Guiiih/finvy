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
    // NEW: Add updateEntry action
    updateEntry(updatedEntry: JournalEntry) {
      const index = this.journalEntries.findIndex(entry => entry.id === updatedEntry.id);
      if (index !== -1) {
        this.journalEntries[index] = updatedEntry;
      }
    },
    // NEW: Add deleteEntry action
    deleteEntry(id: string) {
      this.journalEntries = this.journalEntries.filter(entry => entry.id !== id);
    },
    // NEW: Add reset action for Pinia stores
    $reset() {
      this.journalEntries = [];
    }
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