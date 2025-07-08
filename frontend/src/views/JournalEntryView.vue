<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { JournalEntry, EntryLine as JournalEntryLine, Product } from '@/types/index'
import { useToast } from 'primevue/usetoast'
import ProgressSpinner from 'primevue/progressspinner'
import Skeleton from 'primevue/skeleton'

const journalEntryStore = useJournalEntryStore()
const accountStore = useAccountStore()
const productStore = useProductStore()
const toast = useToast()

const showAddEntryForm = ref(false)
const newEntryDate = ref(new Date().toISOString().split('T')[0])
const newEntryDescription = ref('')
const editingEntryId = ref<string | null>(null)

type EntryLine = {
  account_id: string
  type: 'debit' | 'credit'
  amount: number
  product_id?: string
  quantity?: number
  unit_cost?: number
  icms_rate?: number
  total_gross?: number
  icms_value?: number
  total_net?: number
}

const newEntryLines = ref<EntryLine[]>([])

const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const showDetails = ref<{ [key: string]: boolean }>({})

const sortedJournalEntries = computed(() => {
  return [...journalEntryStore.journalEntries].sort((a, b) => {
    if (a.entry_date > b.entry_date) return -1
    if (a.entry_date < b.entry_date) return 1
    return (b.id ?? '').localeCompare(a.id ?? '')
  })
})

const filteredEntries = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase()
  if (!lowerCaseSearchTerm) {
    return sortedJournalEntries.value
  }
  return sortedJournalEntries.value.filter(
    (entry) =>
      entry.description.toLowerCase().includes(lowerCaseSearchTerm) ||
      entry.entry_date.includes(lowerCaseSearchTerm),
  )
})

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEntries.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredEntries.value.length / itemsPerPage)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const totalDebits = computed(() =>
  newEntryLines.value.reduce(
    (sum, line) => (line.type === 'debit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)

const totalCredits = computed(() =>
  newEntryLines.value.reduce(
    (sum, line) => (line.type === 'credit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function calculateLineTotals(line: EntryLine) {
  const icms_rate = line.icms_rate || 0
  line.total_gross = line.amount
  line.icms_value = line.total_gross * (icms_rate / 100)
  line.total_net = line.total_gross - line.icms_value
}

function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0]
  newEntryDescription.value = ''
  newEntryLines.value = [
    { account_id: '', type: 'debit', amount: 0 },
    { account_id: '', type: 'credit', amount: 0 },
  ]
  editingEntryId.value = null
  showAddEntryForm.value = false
}

function toggleNewEntryForm() {
  // If the form is shown for a new entry (not editing), toggle it off.
  if (showAddEntryForm.value && !editingEntryId.value) {
    showAddEntryForm.value = false
  } else {
    // Otherwise, open a fresh form for a new entry.
    // This handles cases where the form is closed, or was open for editing.
    editingEntryId.value = null
    newEntryDate.value = new Date().toISOString().split('T')[0]
    newEntryDescription.value = ''
    newEntryLines.value = [
      { account_id: '', type: 'debit', amount: 0 },
      { account_id: '', type: 'credit', amount: 0 },
    ]
    showAddEntryForm.value = true
  }
}

function addLine() {
  newEntryLines.value.push({ account_id: '', type: 'debit', amount: 0 })
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1)
}

function calculateTotal(lines: JournalEntryLine[], type: 'debit' | 'credit'): number {
  return lines.reduce((sum, line) => (line.type === type ? sum + (line.amount || 0) : sum), 0)
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'N/A'
}

function toggleDetails(id: string | undefined) {
  if (id) {
    showDetails.value[id] = !showDetails.value[id]
  }
}

function handleProductChange(line: EntryLine) {
  const product: Product | undefined = productStore.getProductById(line.product_id || '')
  if (product) {
    line.unit_cost = product.unit_cost
    line.icms_rate = product.icms_rate || 0
    line.quantity = 1
    calculateLineTotals(line)
  }
}

async function submitEntry() {
  if (totalDebits.value !== totalCredits.value) {
    toast.add({
      severity: 'error',
      summary: 'Erro de Validação',
      detail: 'O total de débitos e créditos deve ser igual.',
      life: 3000,
    })
    return
  }
  if (newEntryLines.value.length < 2) {
    toast.add({
      severity: 'error',
      summary: 'Erro de Validação',
      detail: 'Um lançamento deve ter pelo menos duas linhas.',
      life: 3000,
    })
    return
  }

  const entryData = {
    entry_date: newEntryDate.value,
    description: newEntryDescription.value,
    lines: newEntryLines.value.map((line) => ({ ...line })),
  }

  try {
    if (editingEntryId.value) {
      await journalEntryStore.updateEntry({ id: editingEntryId.value, ...entryData })
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento atualizado com sucesso!',
        life: 3000,
      })
    } else {
      await journalEntryStore.addJournalEntry(entryData)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento adicionado com sucesso!',
        life: 3000,
      })
    }
    resetForm()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}

function startEdit(entry: JournalEntry) {
  editingEntryId.value = entry.id!
  newEntryDate.value = entry.entry_date
  newEntryDescription.value = entry.description
  newEntryLines.value = JSON.parse(JSON.stringify(entry.lines))
  showAddEntryForm.value = true
  window.scrollTo(0, 0)
}

async function handleDelete(id: string | undefined) {
  console.log('handleDelete chamado com ID:', id);
  if (!id) {
    console.log('ID é indefinido ou nulo, retornando.');
    return;
  }
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    console.log('Confirmação de exclusão aceita para ID:', id);
    try {
      await journalEntryStore.deleteEntry(id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento excluído com sucesso!',
        life: 3000,
      })
    } catch (err: unknown) {
      console.error('Erro ao deletar lançamento no frontend:', err);
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  } else {
    console.log('Confirmação de exclusão cancelada.');
  }
}

const resetAllData = () => {
  if (
    confirm(
      'Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita sem restaurar o banco de dados manualmente.',
    )
  ) {
    alert(
      'A funcionalidade de resetar todos os dados do banco de dados não está implementada via UI. Por favor, gerencie os dados diretamente no Supabase.',
    )
  }
}

onMounted(() => {
  journalEntryStore.fetchJournalEntries()
  accountStore.fetchAccounts()
  productStore.fetchProducts()
  resetForm()
})
</script>

<template>
    <div class="max-w-7xl mx-auto p-8 rounded-lg">
    <div class="max-w-screen-xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        
      </div>

      <div class="mb-6 flex items-center space-x-4">
        <div class="relative flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque um lançamento"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        
        <button
          @click="toggleNewEntryForm"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          {{ showAddEntryForm ? 'Fechar Formulário' : 'Novo Lançamento' }}
        </button>
        <button
          @click="resetAllData"
          class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Resetar contas
        </button>
      </div>

      <div v-if="showAddEntryForm" class="bg-gray-50 p-6 mb-8">
        <h2 class="text-2xl font-semibold text-gray-700 mb-6">
          {{ editingEntryId ? 'Editar Lançamento' : 'Adicionar Lançamento' }}
        </h2>
        <form @submit.prevent="submitEntry" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col">
              <label for="entry-date" class="text-gray-700 font-medium mb-2">Data:</label>
              <input
                type="date"
                id="entry-date"
                v-model="newEntryDate"
                required
                class="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex flex-col">
              <label for="entry-description" class="text-gray-700 font-medium mb-2"
                >Descrição:</label
              >
              <input
                type="text"
                id="entry-description"
                v-model="newEntryDescription"
                placeholder="Descrição do lançamento"
                required
                class="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 "
              />
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-xl font-semibold text-gray-700 border-b border-gray-300 pb-2">
              Linhas do Lançamento
            </h3>
            <div
              v-for="(line, index) in newEntryLines"
              :key="index"
              class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
            >
              <select
                v-model="line.account_id"
                required
                class="md:col-span-5 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Selecione a Conta</option>
                <optgroup
                  v-for="type in accountStore.accountTypes"
                  :label="type"
                  :key="type"
                  class="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option
                    v-for="account in accountStore.getAccountsByType(type)"
                    :value="account.id"
                    :key="account.id"
                  >
                    {{ account.name }}
                  </option>
                </optgroup>
              </select>
              <select
                v-model="line.type"
                required
                class="md:col-span-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="debit">Débito</option>
                <option value="credit">Crédito</option>
              </select>
              <input
                type="number"
                v-model.number="line.amount"
                placeholder="Valor"
                step="0.01"
                min="0"
                required
                class="md:col-span-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div class="md:col-span-1 flex items-center space-x-2">
                <button
                  type="button"
                  @click="removeLine(index)"
                  class="flex justify-center items-center p-2 rounded-full hover:bg-red-500/20 text-red-500 transition"
                  title="Remover Linha"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </button>
                <button
                  type="button"
                  @click="addLine"
                  class="flex justify-center items-center w-8 h-8 bg-green-400 hover:bg-green-300 text-white font-bold rounded-full transition"
                  title="Adicionar Linha"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div class="p-4 rounded-lg flex justify-around items-center">
            <p class="text-lg">
              Total Débitos:
              <span class="font-bold text-green-400">{{ formatCurrency(totalDebits) }}</span>
            </p>
            <p class="text-lg">
              Total Créditos:
              <span class="font-bold text-red-400">{{ formatCurrency(totalCredits) }}</span>
            </p>
            <p
              class="text-lg"
              :class="{
                'text-green-400': totalDebits === totalCredits,
                'text-yellow-400': totalDebits !== totalCredits,
              }"
            >
              Diferença:
              <span class="font-bold">{{ formatCurrency(totalDebits - totalCredits) }}</span>
            </p>
          </div>

          <div class="flex space-x-4 pt-4">
            <button
              type="submit"
              :disabled="journalEntryStore.loading || totalDebits !== totalCredits"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              <ProgressSpinner
                v-if="journalEntryStore.loading"
                class="w-5 h-5 mr-2"
                strokeWidth="8"
              />
              <span>{{ editingEntryId ? 'Atualizar Lançamento' : 'Adicionar Lançamento' }}</span>
            </button>
            
          </div>
        </form>
      </div>

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-gray-400 border border-gray-200 uppercase text-sm"
        >
          <div class="col-span-2">Data</div>
          <div class="col-span-5">Descrição</div>
          <div class="col-span-3 text-right">Valor Total</div>
          <div class="col-span-2 text-center">Ações</div>
        </div>

        <div v-if="journalEntryStore.loading" class="p-4 space-y-4">
          <Skeleton height="3rem" class="mb-2 bg-gray-700" />
          <Skeleton height="3rem" class="mb-2 bg-gray-700" />
          <Skeleton height="3rem" class="bg-gray-700" />
        </div>
        <p v-else-if="journalEntryStore.error" class="text-red-400 text-center p-8">
          {{ journalEntryStore.error }}
        </p>
        <p
          v-else-if="paginatedEntries.length === 0"
          class="text-gray-400 text-center p-8"
        >
          Nenhum lançamento encontrado.
        </p>

        <div v-else>
          <div
            v-for="entry in paginatedEntries"
            :key="entry.id"
            class="border-b border-gray-700 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-700/50 transition cursor-pointer"
              @click="toggleDetails(entry.id)"
            >
              <div class="md:col-span-2 font-medium text-white">{{ entry.entry_date }}</div>
              <div class="md:col-span-5 text-gray-300">{{ entry.description }}</div>
              <div class="md:col-span-3 text-right font-mono text-white">
                {{ formatCurrency(calculateTotal(entry.lines, 'debit')) }}
              </div>
              <div class="md:col-span-2 flex justify-center items-center space-x-2">
                <button
                  @click.stop="startEdit(entry)"
                  class="p-2 rounded-full hover:bg-yellow-500/20 text-yellow-500 transition"
                  title="Editar"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"
                    ></path>
                    <path
                      fill-rule="evenodd"
                      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </button>
                <button
                  @click.stop="handleDelete(entry.id)"
                  class="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition"
                  title="Excluir"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </button>
                <button
                  @click.stop="toggleDetails(entry.id)"
                  class="p-2 rounded-full hover:bg-blue-500/20 text-blue-500 transition"
                  title="Ver Detalhes"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M10 12a2 2 0 100-4 2 2 0 000 4z"
                    ></path>
                    <path
                      fill-rule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="showDetails[entry.id]" class="bg-gray-700/50 p-4">
              <div
                class="grid grid-cols-3 gap-4 p-2 font-semibold text-gray-300 border-b border-gray-600"
              >
                <div>CONTA</div>
                <div>TIPO</div>
                <div class="text-right">VALOR</div>
              </div>
              <div
                v-for="(line, index) in entry.lines"
                :key="index"
                class="grid grid-cols-3 gap-4 p-2 items-center border-b border-gray-600/50 last:border-b-0"
              >
                <div class="text-white">{{ getAccountName(line.account_id) }}</div>
                <div
                  class="capitalize"
                  :class="{
                    'text-green-400': line.type === 'debit',
                    'text-red-400': line.type === 'credit',
                  }"
                >
                  {{ line.type }}
                </div>
                <div class="text-right font-mono text-white">
                  {{ formatCurrency(line.amount) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-6 space-x-2" v-if="totalPages > 1">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-4 py-2 w-10 h-10 flex items-center justify-center rounded-full font-semibold',
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300',
          ]"
        >
          {{ page }}
        </button>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>