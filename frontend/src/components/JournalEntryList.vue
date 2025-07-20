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

function getAccountCode(accountId: string): string | undefined {
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
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold text-surface-700 mb-4">Lançamentos Registrados</h2>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-surface-200">
        <thead class="bg-surface-100">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Data
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Descrição
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Débitos
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Créditos
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
            >
              Ações
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-surface-200">
          <template v-if="sortedEntries.length > 0">
            <template v-for="entry in sortedEntries" :key="entry.id">
              <tr class="hover:bg-surface-50 transition">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                  {{ entry.entry_date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                  {{ entry.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                  R$ {{ calculateTotal(entry.lines, 'debit').toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                  R$ {{ calculateTotal(entry.lines, 'credit').toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    @click="emit('reverse', entry.id)"
                    class="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
                    title="Estornar este lançamento"
                  >
                    Estornar
                  </button>
                  <button
                    @click="toggleDetails(entry.id)"
                    class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                  >
                    {{ showDetails[entry.id] ? 'Ocultar' : 'Detalhes' }}
                  </button>
                </td>
              </tr>
              <tr v-if="showDetails[entry.id]" class="bg-surface-100">
                <td colspan="5" class="p-4">
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-surface-200">
                      <thead class="bg-surface-200">
                        <tr>
                          <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                          >
                            Conta
                          </th>
                          <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                          >
                            Cód. Conta
                          </th>
                          <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                          >
                            Tipo
                          </th>
                          <th
                            scope="col"
                            class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                          >
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-surface-200">
                        <tr v-for="(line, lineIndex) in entry.lines" :key="lineIndex">
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                            {{ getAccountName(line.account_id) }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                            {{ getAccountCode(line.account_id) }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                            {{ line.type === 'debit' ? 'Débito' : 'Crédito' }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                            R$ {{ line.amount.toFixed(2) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </template>
          <template v-else>
            <tr>
              <td colspan="5" class="px-6 py-4 text-center text-surface-500 italic">
                Nenhum lançamento encontrado.
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
