<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { JournalEntry, EntryLine as JournalEntryLine } from '@/types/index'
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
  <div class="p-4 sm:p-6">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center">

      </div>

      <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <div class="relative flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque um lançamento"
            class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400"></i>
        </div>
        
        <button
            @click="toggleNewEntryForm"
            class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
          >
          {{ showAddEntryForm ? 'Fechar Formulário' : 'Novo Lançamento' }}
        </button>
        <button
          @click="resetAllData"
          class="bg-surface-500 hover:bg-surface-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Resetar contas
        </button>
      </div>

      <div v-if="showAddEntryForm" class="bg-surface-50 p-6 rounded-lg shadow-inner mb-6">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">
          {{ editingEntryId ? 'Editar Lançamento' : 'Adicionar Lançamento' }}
        </h2>
        <form @submit.prevent="submitEntry" class="space-y-4">
          <div class="flex flex-col">
            <label for="entry-date" class="text-surface-700 font-medium mb-1">Data:</label>
            <input
              type="date"
              id="entry-date"
              v-model="newEntryDate"
              required
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div class="flex flex-col">
            <label for="entry-description" class="text-surface-700 font-medium mb-1"
              >Descrição:</label
            >
            <input
              type="text"
              id="entry-description"
              v-model="newEntryDescription"
              placeholder="Descrição do lançamento"
              required
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div class="space-y-4">
            <h3 class="text-xl font-semibold text-surface-700 border-b border-surface-300 pb-2">
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
                class="md:col-span-5 p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="" disabled>Selecione a Conta</option>
                <optgroup
                  v-for="type in accountStore.accountTypes"
                  :label="type"
                  :key="type"
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
                class="md:col-span-2 p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                class="md:col-span-4 p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div class="md:col-span-1 flex items-center space-x-2">
                <button
                  type="button"
                  @click="removeLine(index)"
                  class="flex justify-center items-center p-2 rounded-full hover:bg-red-100 text-red-600 transition"
                  title="Remover Linha"
                >
                  <i class="pi pi-trash w-5 h-5"></i>
                </button>
                <button
                  type="button"
                  @click="addLine"
                  class="flex justify-center items-center p-2 rounded-full hover:bg-green-100 text-green-600 transition"
                  title="Adicionar Linha"
                >
                  <i class="pi pi-plus w-5 h-5"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="p-4 rounded-lg flex flex-col sm:flex-row justify-around items-center space-y-2 sm:space-y-0">
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

          <div class="flex space-x-4">
            <button
              type="submit"
              :disabled="journalEntryStore.loading || totalDebits !== totalCredits"
              class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
            >
              <ProgressSpinner v-if="journalEntryStore.loading" class="w-5 h-5 mr-2" strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" aria-label="Custom ProgressSpinner" />
              <span v-else>{{ editingEntryId ? 'Atualizar Lançamento' : 'Adicionar Lançamento' }}</span>
            </button>
            
          </div>
        </form>
      </div>

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-2">Data</div>
          <div class="col-span-5">Descrição</div>
          <div class="col-span-3 text-right">Valor Total</div>
          <div class="col-span-2 text-center">Ações</div>
        </div>

        <div v-if="journalEntryStore.loading" class="p-4 space-y-4">
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="bg-surface-200" />
        </div>
        <p v-else-if="journalEntryStore.error" class="text-red-400 text-center p-8">
          {{ journalEntryStore.error }}
        </p>
        <p
          v-else-if="paginatedEntries.length === 0"
          class="text-surface-400 text-center p-8"
        >
          Nenhum lançamento encontrado.
        </p>

        <div v-else>
          <div
            v-for="entry in paginatedEntries"
            :key="entry.id"
            class="border-b border-surface-200 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-50 transition cursor-pointer"
              @click="toggleDetails(entry.id)"
            >
              <div class="md:col-span-2 font-mono text-surface-700">{{ entry.entry_date }}</div>
              <div class="md:col-span-5 text-surface-800">{{ entry.description }}</div>
              <div class="md:col-span-3 text-right text-surface-800">
                {{ formatCurrency(calculateTotal(entry.lines, 'debit')) }}
              </div>
              <div class="md:col-span-2 flex justify-center items-center space-x-2">
                <button
                  @click.stop="startEdit(entry)"
                  class="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-300 ease-in-out"
                  title="Editar"
                >
                  <i class="pi pi-pencil w-5 h-5"></i>
                </button>
                <button
                  @click.stop="handleDelete(entry.id)"
                  class="p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-300 ease-in-out"
                  title="Excluir"
                >
                  <i class="pi pi-trash w-5 h-5"></i>
                </button>
                <button
                  @click.stop="toggleDetails(entry.id)"
                  class="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition duration-300 ease-in-out"
                  title="Ver Detalhes"
                >
                  <i class="pi pi-eye w-5 h-5"></i>
                </button>
              </div>
            </div>

            <div v-if="showDetails[entry.id]">
              <div
                class="grid grid-cols-3 gap-4 p-2 font-medium text-surface-400 border border-surface-200"
              >
                <div>CONTA</div>
                <div>TIPO</div>
                <div class="text-right">VALOR</div>
              </div>
              <div
                v-for="(line, index) in entry.lines"
                :key="index"
                class="grid grid-cols-3 gap-4 p-2 items-center border-b border-surface-200 last:border-b-0 hover:bg-surface-50 transition"
              >
                <div class="text-surface-700">{{ getAccountName(line.account_id) }}</div>
                <div
                  class="capitalize"
                  :class="{
                    'text-emerald-400': line.type === 'debit',
                    'text-red-400': line.type === 'credit',
                  }"
                >
                  {{ line.type }}
                </div>
                <div class="text-right font-mono surface-600">
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
          class="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-surface-50 hover:bg-surface-100 text-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              ? 'bg-primary-600 text-white'
              : 'bg-surface-700 hover:bg-surface-600 text-surface-300',
          ]"
        >
          {{ page }}
        </button>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-surface-700 hover:bg-surface-600 text-surface-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>