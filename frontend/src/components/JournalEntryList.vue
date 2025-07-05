<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { JournalEntry, EntryLine } from '@/types'

const props = defineProps<{
  entries: JournalEntry[]
}>()

const emit = defineEmits(['reverse'])

const accountStore = useAccountStore()
const showDetails = ref<Record<string, boolean>>({})

const sortedEntries = computed(() => {
  return [...props.entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
  )
})

function toggleDetails(id: string) {
  showDetails.value[id] = !showDetails.value[id]
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'Conta Desconhecida'
}

function getAccountCode(accountId: string): number | undefined {
  return accountStore.getAccountById(accountId)?.code
}

function calculateTotal(lines: EntryLine[], type: 'debit' | 'credit'): number {
  return lines.reduce((sum, line) => {
    if (line.type === type) {
      return sum + (line.amount || 0)
    }
    return sum
  }, 0)
}
</script>

<template>
  <div class="list-section">
    <h2>Lançamentos Registrados</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Débitos</th>
          <th>Créditos</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="sortedEntries.length > 0">
          <template v-for="entry in sortedEntries" :key="entry.id">
            <tr class="entry-summary">
              <td>{{ entry.entry_date }}</td>
              <td>{{ entry.description }}</td>
              <td>R$ {{ calculateTotal(entry.lines, 'debit').toFixed(2) }}</td>
              <td>R$ {{ calculateTotal(entry.lines, 'credit').toFixed(2) }}</td>
              <td>
                <button
                  @click="emit('reverse', entry.id)"
                  class="action-btn reverse-btn"
                  title="Estornar este lançamento"
                >
                  Estornar
                </button>
                <button @click="toggleDetails(entry.id)" class="action-btn details-btn">
                  {{ showDetails[entry.id] ? 'Ocultar' : 'Detalhes' }}
                </button>
              </td>
            </tr>
            <tr v-if="showDetails[entry.id]" class="entry-details">
              <td colspan="5">
                <table>
                  <thead>
                    <tr>
                      <th>Conta</th>
                      <th>Cód. Conta</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, lineIndex) in entry.lines" :key="lineIndex">
                      <td>{{ getAccountName(line.account_id) }}</td>
                      <td>{{ getAccountCode(line.account_id) }}</td>
                      <td>{{ line.type === 'debit' ? 'Débito' : 'Crédito' }}</td>
                      <td>R$ {{ line.amount.toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </template>
        <template v-else>
          <tr>
            <td colspan="5" class="no-entries">Nenhum lançamento encontrado.</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.list-section h2 {
  color: #333;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
th,
td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}
th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
}
.entry-summary td {
  background-color: #ffffff;
}
.no-entries {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}
.action-btn {
  padding: 6px 10px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}
.reverse-btn {
  background-color: #ffc107;
}
.details-btn {
  background-color: #6c757d;
}

.entry-details td {
  background-color: #f0f8ff;
  padding: 10px 20px;
}
.entry-details table {
  width: 100%;
  margin: 0;
  box-shadow: none;
}
.entry-details th,
.entry-details td {
  padding: 8px;
  font-size: 0.9em;
}
</style>