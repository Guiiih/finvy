<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useJournalEntryStore } from '@/stores/journalEntryStore';
import JournalEntryForm from '@/components/JournalEntryForm.vue';
import JournalEntryList from '@/components/JournalEntryList.vue';
import type { JournalEntry } from '@/types';

const journalEntryStore = useJournalEntryStore();
const showAddEntryForm = ref(false);

const entries = computed(() => journalEntryStore.getAllJournalEntries);

onMounted(() => {
  journalEntryStore.fetchJournalEntries();
});

async function handleAddEntry(entryData: Omit<JournalEntry, 'id' | 'lines'> & { lines: any[] }) {
  try {
    await journalEntryStore.addJournalEntry(entryData as JournalEntry);
    alert('Novo lançamento adicionado com sucesso!');
    showAddEntryForm.value = false;
  } catch (err: unknown) {
    console.error("Erro ao registrar lançamento:", err);
    alert(err instanceof Error ? err.message : 'Erro ao registrar lançamento.');
  }
}

async function handleReverseEntry(entryId: string) {
  if (confirm('Tem a certeza de que deseja estornar este lançamento?')) {
    await journalEntryStore.reverseJournalEntry(entryId);
  }
}
</script>

<template>
  <div class="journal-entry-view">
    <h1>Lançamentos Contábeis</h1>

    <div class="controls">
      <button @click="showAddEntryForm = !showAddEntryForm">
        {{ showAddEntryForm ? 'Fechar Formulário' : 'Novo Lançamento' }}
      </button>
    </div>

    <JournalEntryForm v-if="showAddEntryForm" @submit="handleAddEntry" />

    <p v-if="journalEntryStore.loading" class="loading-message">Carregando lançamentos...</p>
    <p v-else-if="journalEntryStore.error" class="error-message">{{ journalEntryStore.error }}</p>

    <JournalEntryList v-else :entries="entries" @reverse="handleReverseEntry" />
  </div>
</template>

<style scoped>
.journal-entry-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}
h1, h2 {
  color: #333;
}
h1 {
    text-align: center;
    margin-bottom: 20px;
}
.controls {
  margin-bottom: 20px;
}
.controls button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}
.controls button:hover {
  background-color: #0056b3;
}
.loading-message {
    text-align: center;
    color: #666;
}
.error-message {
  color: #dc3545;
  text-align: center;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
}
</style>