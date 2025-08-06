<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { JournalEntry, EntryLine as JournalEntryLine } from '@/types/index'
import { useToast } from 'primevue/usetoast'
import Skeleton from 'primevue/skeleton'
import Listbox from 'primevue/listbox'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'

import Paginator from 'primevue/paginator'
import JournalEntryFormModal from '@/components/JournalEntryFormModal.vue'

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

watch(selectedStatus, (newStatus) => {
  journalEntryStore.fetchJournalEntries(currentPage.value, itemsPerPage.value, newStatus || null)
  op.value.hide() // Hide the overlay after selection
})

function toggleFilter(event: Event) {
  op.value.toggle(event)
}

function onPageChange(event: { page: number; first: number; rows: number; pageCount?: number }) {
  currentPage.value = event.page + 1
  itemsPerPage.value = event.rows
  journalEntryStore.fetchJournalEntries(currentPage.value, itemsPerPage.value, selectedStatus.value)
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
  await journalEntryStore.fetchJournalEntries(currentPage.value, itemsPerPage.value, selectedStatus.value) // Refresh entries after add/edit
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

async function handleDelete(id: string | undefined) {
  console.log('handleDelete chamado com ID:', id)
  if (!id) {
    console.log('ID é indefinido ou nulo, retornando.')
    return
  }
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    console.log('Confirmação de exclusão aceita para ID:', id)
    try {
      await journalEntryStore.deleteEntry(id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento excluído com sucesso!',
        life: 3000,
      })
      editingEntry.value = null // Reset editingEntry after successful deletion
    } catch (err: unknown) {
      console.error('Erro ao deletar lançamento no frontend:', err)
      const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
    }
  } else {
    console.log('Confirmação de exclusão cancelada.')
  }
}

onMounted(async () => {
  await journalEntryStore.fetchJournalEntries(currentPage.value, itemsPerPage.value, selectedStatus.value)
  accountStore.fetchAccounts()
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

      <JournalEntryFormModal
        :visible="showJournalEntryFormModal"
        :isEditing="isEditing"
        :editingEntry="editingEntry"
        @update:visible="showJournalEntryFormModal = $event"
        @submitSuccess="handleModalSubmitSuccess"
      />

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-2">Data</div>
          <div class="col-span-2">Referência</div>
          <div class="col-span-3">Descrição</div>
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
            <div class="md:col-span-2">
              <Skeleton height="1rem" width="70%" class="bg-surface-200" />
            </div>
            <div class="md:col-span-2">
              <Skeleton height="1rem" width="70%" class="bg-surface-200" />
            </div>
            <div class="md:col-span-3"><Skeleton height="1rem" class="bg-surface-200" /></div>
            <div class="md:col-span-2">
              <Skeleton height="1rem" width="50%" class="bg-surface-200" />
            </div>
            <div class="md:col-span-2">
              <Skeleton height="1rem" width="80%" class="bg-surface-200" />
            </div>
            <div class="md:col-span-1 flex justify-center items-center space-x-2">
              <Skeleton shape="circle" size="1.5rem" class="bg-surface-200" />
              <Skeleton shape="circle" size="1.5rem" class="bg-surface-200" />
              <Skeleton shape="circle" size="1.5rem" class="bg-surface-200" />
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
              <div class="md:col-span-2 font-mono text-surface-700">{{ entry.entry_date }}</div>
              <div class="md:col-span-2 text-surface-800">{{ entry.reference }}</div>
              <div class="md:col-span-3 text-surface-800">{{ entry.description }}</div>
              <div class="md:col-span-2 text-right text-surface-800">
                {{ calculateTotal(entry.lines, 'debit') }}
              </div>
              <div class="md:col-span-2 text-center text-surface-800 capitalize">
                {{ entry.status }}
              </div>
              <div class="md:col-span-1 flex justify-center items-center space-x-2">
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
