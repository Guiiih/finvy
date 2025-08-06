<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import type { Account, AccountType } from '@/types'
import { accountTypeTranslations } from '@/utils/accountTypeTranslations'

import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'
import Paginator from 'primevue/paginator'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'

import AccountFormModal from '@/components/AccountFormModal.vue'

const accountStore = useAccountStore()
const toast = useToast()

const displayModal = ref(false)
const isEditing = ref(false)
const editingAccount = ref<Account | null>(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const selectedAccountTypes = ref<AccountType[]>([]) // Alterado para array

const op = ref<InstanceType<typeof OverlayPanel> | undefined>()

const toggle = (event: Event) => {
  op.value?.toggle(event)
}

const applyFilter = (type: AccountType) => {
  const index = selectedAccountTypes.value.indexOf(type)
  if (index > -1) {
    selectedAccountTypes.value.splice(index, 1) // Remove se já estiver selecionado
  } else {
    selectedAccountTypes.value.push(type) // Adiciona se não estiver selecionado
  }
  // op.value?.hide() // Manter comentado ou remover se o usuário quiser selecionar múltiplos e depois fechar
}

const groupedAndFilteredAccounts = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase()
  const filtered = accountStore.accounts.filter((account) => {
    const typeMatch =
      selectedAccountTypes.value.length === 0 || selectedAccountTypes.value.includes(account.type)
    const searchMatch =
      !account.is_protected &&
      (account.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        account.code?.toString().includes(lowerCaseSearchTerm) ||
        account.type.toLowerCase().includes(lowerCaseSearchTerm))
    return typeMatch && searchMatch
  })

  const grouped = filtered.reduce(
    (acc, account) => {
      const type = account.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(account)
      return acc
    },
    {} as Record<string, Account[]>,
  )

  for (const type in grouped) {
    grouped[type].sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }),
    )
  }

  return grouped
})

const totalRecords = computed(() => {
  const allAccounts: Account[] = []
  const types = ['asset', 'liability', 'equity', 'revenue', 'expense']

  types.forEach((type) => {
    if (groupedAndFilteredAccounts.value[type]) {
      allAccounts.push(...groupedAndFilteredAccounts.value[type])
    }
  })
  return allAccounts.length
})

const paginatedAccounts = computed(() => {
  const allAccounts: Account[] = []
  const types = ['asset', 'liability', 'equity', 'revenue', 'expense']

  types.forEach((type) => {
    if (groupedAndFilteredAccounts.value[type]) {
      allAccounts.push(...groupedAndFilteredAccounts.value[type])
    }
  })

  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return allAccounts.slice(start, end)
})

function onPageChange(event: { page: number; first: number; rows: number; pageCount?: number }) {
  currentPage.value = event.page + 1
  itemsPerPage.value = event.rows
}

function openNewAccountModal() {
  isEditing.value = false
  editingAccount.value = null
  displayModal.value = true
}

function startEdit(account: Account) {
  if (account.is_protected) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Esta conta é protegida e não pode ser editada.',
      life: 3000,
    })
    return
  }
  isEditing.value = true
  editingAccount.value = { ...account }
  displayModal.value = true
}

function handleModalSubmitSuccess() {
  displayModal.value = false
  isEditing.value = false
  editingAccount.value = null
  accountStore.fetchAccounts() // Refresh accounts after add/edit
}

async function handleDeleteAccount(account: Account) {
  if (account.is_protected) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Esta conta é protegida e não pode ser excluída.',
      life: 3000,
    })
    return
  }

  if (!account.id) {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Não foi possível deletar a conta: ID inválido.',
      life: 3000,
    })
    console.error('Tentativa de deletar conta com ID indefinido.')
    return
  }

  if (confirm('Tem certeza de que deseja excluir esta conta?')) {
    try {
      await accountStore.deleteAccount(account.id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Conta excluída com sucesso!',
        life: 3000,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao deletar.'
      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
      console.error('Erro ao deletar conta:', err)
    }
  }
}

onMounted(() => {
  accountStore.fetchAccounts()
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
            placeholder="Busque uma conta"
            class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <i
            class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-surface-400"
          ></i>
        </div>

        <Button icon="pi pi-filter" class="p-button-secondary p-button-outlined" @click="toggle" />
        <OverlayPanel ref="op" style="min-width: 250px">
          <div class="flex flex-col space-y-2 p-4">
            <div
              v-for="type in Object.keys(accountTypeTranslations)"
              :key="type"
              class="flex items-center justify-between p-2 hover:bg-surface-100 cursor-pointer"
              @click="applyFilter(type as AccountType)"
            >
              <span>{{ accountTypeTranslations[type as AccountType] }}</span>
              <i
                v-if="selectedAccountTypes.includes(type as AccountType)"
                class="pi pi-check text-surface-500"
              ></i>
            </div>
          </div>
        </OverlayPanel>

        <button
          @click="openNewAccountModal"
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Nova Conta
        </button>
      </div>

      <AccountFormModal
        :visible="displayModal"
        :isEditing="isEditing"
        :editingAccount="editingAccount"
        @update:visible="displayModal = $event"
        @submitSuccess="handleModalSubmitSuccess"
      />

      <div class="overflow-hidden">
        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-2">CÓDIGO</div>
          <div class="col-span-5">NOME</div>
          <div class="col-span-3">TIPO</div>
          <div class="col-span-2 text-center">AÇÕES</div>
        </div>

        <div v-if="accountStore.loading" class="p-4 space-y-4">
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="mb-2 bg-surface-200" />
          <Skeleton height="3rem" class="bg-surface-200" />
        </div>
        <p v-else-if="accountStore.error" class="text-red-400 text-center p-8">
          {{ accountStore.error }}
        </p>
        <p v-else-if="paginatedAccounts.length === 0" class="text-surface-400 text-center p-8">
          Nenhuma conta encontrada.
        </p>

        <div v-else>
          <div
            v-for="account in paginatedAccounts"
            :key="account.id"
            class="border-b border-surface-200 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 items-center hover:bg-surface-50 transition"
            >
              <div class="md:col-span-2 font-mono text-surface-700">{{ account.code }}</div>
              <div class="md:col-span-5 text-surface-800">{{ account.name }}</div>
              <div class="md:col-span-3">
                <span
                  :class="{
                    'bg-blue-100 text-blue-800': account.type === 'asset',
                    'bg-red-100 text-red-800': account.type === 'liability',
                    'bg-green-100 text-green-800': account.type === 'equity',
                    'bg-purple-100 text-purple-800': account.type === 'revenue',
                    'bg-yellow-100 text-yellow-800': account.type === 'expense',
                    'px-2.5 py-0.5 rounded-full text-xs font-medium': true,
                  }"
                >
                  {{ accountTypeTranslations[account.type] || account.type }}
                </span>
              </div>
              <div class="md:col-span-2 flex justify-center items-center space-x-2">
                <button
                  @click="startEdit(account)"
                  :class="[
                    'p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-300 ease-in-out',
                    { 'opacity-50 cursor-not-allowed': account.is_protected },
                  ]"
                  title="Editar"
                >
                  <i class="pi pi-pencil w-5 h-5"></i>
                </button>
                <button
                  @click="handleDeleteAccount(account)"
                  :class="[
                    'p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-300 ease-in-out',
                    { 'opacity-50 cursor-not-allowed': account.is_protected },
                  ]"
                  title="Excluir"
                >
                  <i class="pi pi-trash w-5 h-5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <Paginator
          v-if="totalRecords > itemsPerPage"
          :rows="itemsPerPage"
          :totalRecords="totalRecords"
          :rowsPerPageOptions="[10, 20, 50]"
          @page="onPageChange"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          class="mt-6"
        ></Paginator>
      </div>
    </div>
  </div>
</template>
