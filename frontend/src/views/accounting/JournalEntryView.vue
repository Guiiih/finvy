<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue' // Adicionado 'computed'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { JournalEntry, EntryLine as JournalEntryLine } from '@/types/index'
import { useToast } from 'primevue/usetoast'
import Skeleton from 'primevue/skeleton'
import Listbox from 'primevue/listbox'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'

import Paginator from 'primevue/paginator'
import JournalEntryFormModal from '@/components/JournalEntryFormModal.vue'
import JournalEntryAdvancedFiltersModal from '@/components/JournalEntryAdvancedFiltersModal.vue'
import JournalEntryBulkActionsModal from '@/components/JournalEntryBulkActionsModal.vue'

const journalEntryStore = useJournalEntryStore()
const accountStore = useAccountStore()
const productStore = useProductStore()
const toast = useToast()

const showJournalEntryFormModal = ref(false)
const isEditing = ref(false)
const editingEntry = ref<JournalEntry | null>(null)

const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const showDetails = ref<{ [key: string]: boolean }>({})
const op = ref()

const selectedStatus = ref(null)
const statusOptions = ref([
  { label: 'Todos', value: null },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Lançado', value: 'posted' },
  { label: 'Revisado', value: 'reviewed' },
])

const showAdvancedFiltersModal = ref(false)
const advancedFilters = ref({
  dateFrom: null as string | null,
  dateTo: null as string | null,
  amountFrom: null as number | null,
  amountTo: null as number | null,
  createdBy: null as string | null,
  hasProduct: false,
  hasTaxes: false,
  accounts: [] as string[],
})

const showBulkActionsModal = ref(false)
const selectedEntries = ref<string[]>([])

// ----- LÓGICA CORRIGIDA (1/4): Propriedade computada para ver se tudo está selecionado -----
const areAllEntriesSelected = computed(() => {
  const entries = journalEntryStore.journalEntries
  return entries.length > 0 && selectedEntries.value.length === entries.length
})

watch(selectedStatus, (newStatus) => {
  fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    newStatus || null,
    advancedFilters.value,
  )
  op.value.hide()
})

function toggleFilter(event: Event) {
  op.value.toggle(event)
}

function onPageChange(event: { page: number; first: number; rows: number; pageCount?: number }) {
  currentPage.value = event.page + 1
  itemsPerPage.value = event.rows
  fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    selectedStatus.value,
    advancedFilters.value,
  )
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function openNewEntryModal() {
  isEditing.value = false
  editingEntry.value = null
  showJournalEntryFormModal.value = true
}

function startEdit(entry: JournalEntry) {
  isEditing.value = true
  editingEntry.value = { ...entry }
  showJournalEntryFormModal.value = true
}

async function handleModalSubmitSuccess() {
  showJournalEntryFormModal.value = false
  isEditing.value = false
  editingEntry.value = null
  await fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    selectedStatus.value,
    advancedFilters.value,
  )
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

async function handleDuplicate(entry: JournalEntry) {
  try {
    const duplicatedEntry = {
      ...entry,
      id: undefined,
      reference: `${entry.reference}-COPY`,
      description: `[CÓPIA] ${entry.description}`,
      entry_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      lines: entry.lines.map((line) => ({ ...line })),
    }
    await journalEntryStore.addJournalEntry(duplicatedEntry as Omit<JournalEntry, 'id'>)
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Lançamento duplicado com sucesso!',
      life: 3000,
    })
    await fetchEntriesWithFilters(
      currentPage.value,
      itemsPerPage.value,
      selectedStatus.value,
      advancedFilters.value,
    )
  } catch (err: unknown) {
    console.error('Erro ao duplicar lançamento:', err)
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao duplicar.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}

async function handleDelete(id: string | undefined) {
  if (!id) {
    return
  }
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    try {
      await journalEntryStore.deleteEntry(id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento excluído com sucesso!',
        life: 3000,
      })
      editingEntry.value = null
    } catch (err: unknown) {
      console.error('Erro ao deletar lançamento no frontend:', err)
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  }
}

async function fetchEntriesWithFilters(
  page: number,
  limit: number,
  status: string | null,
  filters: typeof advancedFilters.value,
) {
  await journalEntryStore.fetchJournalEntries(page, limit, status, filters)
}

async function handleApplyAdvancedFilters(filters: typeof advancedFilters.value) {
  advancedFilters.value = filters
  await fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    selectedStatus.value,
    advancedFilters.value,
  )
}

function handleClearAdvancedFilters() {
  advancedFilters.value = {
    dateFrom: null,
    dateTo: null,
    amountFrom: null,
    amountTo: null,
    createdBy: null,
    hasProduct: false,
    hasTaxes: false,
    accounts: [],
  }
  fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    selectedStatus.value,
    advancedFilters.value,
  )
}

// ----- LÓGICA CORRIGIDA (2/4): Função não precisa mais de parâmetro -----
function handleSelectEntry(id: string) {
  const index = selectedEntries.value.indexOf(id)
  if (index > -1) {
    selectedEntries.value.splice(index, 1) // Remove se já existe
  } else {
    selectedEntries.value.push(id) // Adiciona se não existe
  }
}

// ----- LÓGICA CORRIGIDA (3/4): Função não precisa mais de parâmetro -----
function handleSelectAll() {
  if (areAllEntriesSelected.value) {
    selectedEntries.value = [] // Desmarca todos
  } else {
    selectedEntries.value = journalEntryStore.journalEntries.map((entry) => entry.id as string) // Marca todos
  }
}

function handleBulkActionSuccess() {
  selectedEntries.value = []
  fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    selectedStatus.value,
    advancedFilters.value,
  )
}

onMounted(async () => {
  await fetchEntriesWithFilters(
    currentPage.value,
    itemsPerPage.value,
    selectedStatus.value,
    advancedFilters.value,
  )
  await accountStore.fetchAccounts()
  productStore.fetchProducts(currentPage.value, itemsPerPage.value)
})
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center"></div>

      <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <div class="relative flex-grow">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque um lançamento"
            class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <i
            class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400"
          ></i>
        </div>

        <Button
          type="button"
          icon="pi pi-filter"
          @click="toggleFilter"
          aria-haspopup="true"
          aria-controls="overlay_panel"
          class="p-button-outlined p-button-secondary"
        />

        <Button
          type="button"
          icon="pi pi-sliders-h"
          label="Filtros Avançados"
          @click="showAdvancedFiltersModal = true"
          class="p-button-outlined p-button-secondary"
        />

        <button
          @click="openNewEntryModal"
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Novo Lançamento
        </button>

        <OverlayPanel ref="op" appendTo="body" :showCloseIcon="true" id="overlay_panel">
          <Listbox
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </OverlayPanel>
      </div>

      <div
        v-if="selectedEntries.length > 0"
        class="mb-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-blue-900">
            {{ selectedEntries.length }} lançamento(s) selecionado(s)
          </span>
        </div>
        <div class="flex gap-2">
          <Button
            size="small"
            severity="secondary"
            outlined
            @click="showBulkActionsModal = true"
          >
            <i class="pi pi-ellipsis-v mr-2"></i>
            Ações em Lote
          </Button>
          <Button size="small" severity="secondary" text @click="selectedEntries = []">
            Limpar Seleção
          </Button>
        </div>
      </div>

      <div
        v-if="
          advancedFilters.dateFrom ||
          advancedFilters.dateTo ||
          advancedFilters.amountFrom ||
          advancedFilters.amountTo ||
          advancedFilters.createdBy ||
          advancedFilters.hasProduct ||
          advancedFilters.hasTaxes ||
          advancedFilters.accounts.length > 0
        "
        class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-2"
      >
        <span class="font-medium text-blue-900">Filtros Ativos:</span>
        <span v-if="advancedFilters.dateFrom" class="p-tag p-tag-info"
          >De: {{ new Date(advancedFilters.dateFrom).toLocaleDateString('pt-BR') }}</span
        >
        <span v-if="advancedFilters.dateTo" class="p-tag p-tag-info"
          >Até: {{ new Date(advancedFilters.dateTo).toLocaleDateString('pt-BR') }}</span
        >
        <span v-if="advancedFilters.amountFrom" class="p-tag p-tag-info"
          >Valor Min: {{ advancedFilters.amountFrom.toLocaleString('pt-BR') }}</span
        >
        <span v-if="advancedFilters.amountTo" class="p-tag p-tag-info"
          >Valor Max: {{ advancedFilters.amountTo.toLocaleString('pt-BR') }}</span
        >
        <span v-if="advancedFilters.createdBy" class="p-tag p-tag-info"
          >Criado por: {{ advancedFilters.createdBy }}</span
        >
        <span v-if="advancedFilters.hasProduct" class="p-tag p-tag-info">Com Produto</span>
        <span v-if="advancedFilters.hasTaxes" class="p-tag p-tag-info">Com Impostos</span>
        <span v-if="advancedFilters.accounts.length > 0" class="p-tag p-tag-info"
          >Contas: {{ advancedFilters.accounts.join(', ') }}</span
        >
        <Button
          label="Limpar Filtros"
          icon="pi pi-times"
          class="p-button-sm p-button-text p-button-danger ml-auto"
          @click="handleClearAdvancedFilters"
        />
      </div>

      <JournalEntryFormModal
        :visible="showJournalEntryFormModal"
        :isEditing="isEditing"
        :editingEntry="editingEntry"
        @update:visible="showJournalEntryFormModal = $event"
        @submitSuccess="handleModalSubmitSuccess"
      />

      <JournalEntryAdvancedFiltersModal
        :visible="showAdvancedFiltersModal"
        :accounts="accountStore.accounts"
        :initialFilters="advancedFilters"
        @update:visible="showAdvancedFiltersModal = $event"
        @apply-filters="handleApplyAdvancedFilters"
      />

      <JournalEntryBulkActionsModal
        :visible="showBulkActionsModal"
        :selectedEntries="selectedEntries"
        @update:visible="showBulkActionsModal = $event"
        @bulkActionSuccess="handleBulkActionSuccess"
      />

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-1 flex justify-center items-center">
             <Checkbox
              :binary="true"
              :modelValue="areAllEntriesSelected"
              @change="handleSelectAll"
            />
          </div>
          <div class="col-span-2">Data</div>
          <div class="col-span-2">Referência</div>
          <div class="col-span-2">Descrição</div>
          <div class="col-span-2 text-right">Valor</div>
          <div class="col-span-2 text-center">Status</div>
          <div class="col-span-1 text-center">Ações</div>
        </div>

        <div v-if="journalEntryStore.loading" class="p-4 space-y-4">
          <div
            v-for="i in itemsPerPage"
            :key="i"
            class="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 items-center"
          >
            <div class="md:col-span-2"><Skeleton height="1rem" width="70%" /></div>
            <div class="md:col-span-2"><Skeleton height="1rem" width="70%" /></div>
            <div class="md:col-span-3"><Skeleton height="1rem" /></div>
            <div class="md:col-span-2"><Skeleton height="1rem" width="50%" /></div>
            <div class="md:col-span-2"><Skeleton height="1rem" width="80%" /></div>
            <div class="md:col-span-1 flex justify-center items-center space-x-2">
              <Skeleton shape="circle" size="1.5rem" />
              <Skeleton shape="circle" size="1.5rem" />
              <Skeleton shape="circle" size="1.5rem" />
            </div>
          </div>
        </div>
        <p v-else-if="journalEntryStore.error" class="text-red-400 text-center p-8">
          {{ journalEntryStore.error }}
        </p>
        <p
          v-else-if="journalEntryStore.journalEntries.length === 0"
          class="text-surface-400 text-center p-8"
        >
          Nenhum lançamento encontrado.
        </p>

        <div v-else>
          <div
            v-for="entry in journalEntryStore.journalEntries"
            :key="entry.id"
            class="border-b border-surface-200 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-50 transition cursor-pointer"
              @click="toggleDetails(entry.id)"
            >
              <div class="col-span-1 flex justify-center items-center">
                <Checkbox
                  :binary="true"
                  :modelValue="selectedEntries.includes(entry.id)"
                  @change="handleSelectEntry(entry.id)"
                  @click.stop
                />
              </div>
              <div class="md:col-span-2 font-mono text-surface-700">{{ entry.entry_date }}</div>
              <div class="md:col-span-2 text-surface-800">{{ entry.reference }}</div>
              <div class="md:col-span-2 text-surface-800">{{ entry.description }}</div>
              <div class="md:col-span-2 text-right text-surface-800">
                {{ formatCurrency(calculateTotal(entry.lines, 'debit')) }}
              </div>
              <div class="md:col-span-2 text-center text-surface-800 capitalize">
                {{ entry.status }}
              </div>
              <div class="md:col-span-1 flex justify-center items-center space-x-2">
                <button
                  @click.stop="startEdit(entry)"
                  class="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition"
                  title="Editar"
                >
                  <i class="pi pi-pencil w-5 h-5"></i>
                </button>
                <button
                  @click.stop="handleDuplicate(entry)"
                  class="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
                  title="Duplicar"
                >
                  <i class="pi pi-copy w-5 h-5"></i>
                </button>
                <button
                  @click.stop="handleDelete(entry.id)"
                  class="p-2 rounded-full hover:bg-red-100 text-red-600 transition"
                  title="Excluir"
                >
                  <i class="pi pi-trash w-5 h-5"></i>
                </button>
                <button
                  @click.stop="toggleDetails(entry.id)"
                  class="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
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

      <Paginator
        v-if="journalEntryStore.totalJournalEntries > itemsPerPage"
        :rows="itemsPerPage"
        :totalRecords="journalEntryStore.totalJournalEntries"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPageChange"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        class="mt-6"
      ></Paginator>
    </div>
  </div>
</template>