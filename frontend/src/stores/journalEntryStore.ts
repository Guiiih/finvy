import { defineStore } from 'pinia';
import type { JournalEntry } from '../types/index';

import { ref, computed } from 'vue';

export const useJournalEntryStore = defineStore('journalEntry', () => {
  const journalEntries = ref<JournalEntry[]>([]);

  async function fetchJournalEntries() {
    try {
      const response = await fetch('/api/journal-entries');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const entriesData: JournalEntry[] = await response.json();

      // Para cada lançamento, buscar suas linhas
      const entriesWithLines = await Promise.all(entriesData.map(async (entry) => {
        const linesResponse = await fetch(`/api/entry-lines?journal_entry_id=${entry.id}`);
        if (!linesResponse.ok) {
          throw new Error(`HTTP error! status: ${linesResponse.status}`);
        }
        const linesData: EntryLine[] = await linesResponse.json();
        return { ...entry, lines: linesData };
      }));

      journalEntries.value = entriesWithLines;
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    }
  }

  const getAllJournalEntries = computed(() => journalEntries.value);

  const getJournalEntryById = computed(() => (id: string) => {
    return journalEntries.value.find(entry => entry.id === id);
  });

  async function addJournalEntry(entry: JournalEntry) {
    try {
      // 1. Criar o cabeçalho do lançamento
      const { lines, ...entryHeader } = entry;
      const response = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryHeader),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newJournalEntry: JournalEntry = await response.json();

      // 2. Criar as linhas do lançamento
      const newLines: EntryLine[] = [];
      for (const line of lines) {
        const lineResponse = await fetch('/api/entry-lines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...line, journal_entry_id: newJournalEntry.id }),
        });
        if (!lineResponse.ok) {
          throw new Error(`HTTP error! status: ${lineResponse.status}`);
        }
        const newLine: EntryLine = await lineResponse.json();
        newLines.push(newLine);
      }

      journalEntries.value.push({ ...newJournalEntry, lines: newLines });
    } catch (error) {
      console.error("Erro ao adicionar lançamento:", error);
    }
  }

  async function updateEntry(updatedEntry: JournalEntry) {
    try {
      // 1. Atualizar o cabeçalho do lançamento
      const { lines, ...entryHeader } = updatedEntry;
      const response = await fetch(`/api/journal-entries?id=${updatedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryHeader),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 2. Deletar linhas existentes e recriar
      // (Abordagem simplificada: deleta todas e recria. Em produção, otimizar para comparar e atualizar/deletar/criar seletivamente)
      await fetch(`/api/entry-lines?journal_entry_id=${updatedEntry.id}`, {
        method: 'DELETE',
      }); // Assumindo que a API de entry-lines pode deletar por journal_entry_id

      const newLines: EntryLine[] = [];
      for (const line of lines) {
        const lineResponse = await fetch('/api/entry-lines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...line, journal_entry_id: updatedEntry.id }),
        });
        if (!lineResponse.ok) {
          throw new Error(`HTTP error! status: ${lineResponse.status}`);
        }
        const newLine: EntryLine = await lineResponse.json();
        newLines.push(newLine);
      }

      const index = journalEntries.value.findIndex(entry => entry.id === updatedEntry.id);
      if (index !== -1) {
        journalEntries.value[index] = { ...updatedEntry, lines: newLines };
      }
    } catch (error) {
      console.error("Erro ao atualizar lançamento:", error);
    }
  }

  async function deleteEntry(id: string) {
    try {
      const response = await fetch(`/api/journal-entries?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      journalEntries.value = journalEntries.value.filter(entry => entry.id !== id);
    } catch (error) {
      console.error("Erro ao deletar lançamento:", error);
    }
  }

  return {
    journalEntries,
    getAllJournalEntries,
    getJournalEntryById,
    fetchJournalEntries,
    addJournalEntry,
    updateEntry,
    deleteEntry,
  };
});