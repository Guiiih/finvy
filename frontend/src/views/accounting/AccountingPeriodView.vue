<template>
  <div class="p-4 sm:p-4 md:p-6">

    <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
      <div class="relative flex-grow">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Busque um período contábil"
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
        @click="showCreatePeriodForm = true"
        class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
      >
        Novo Período
      </button>
    </div>

    <Dialog
      v-model:visible="showCreatePeriodForm"
      modal
      header="Criar Novo Ano Fiscal"
      class="p-fluid"
    >
      <form @submit.prevent="handleCreatePeriod" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="fiscalYear" class="block text-sm font-medium text-gray-700"
            >Ano Fiscal</label
          >
          <input
            type="number"
            id="fiscalYear"
            v-model="newPeriod.fiscal_year"
            required
            min="1900"
            max="2100"
            step="1"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700"
            >Data de Início</label
          >
          <Calendar
            id="startDate"
            :modelValue="newPeriod.start_date ? new Date(newPeriod.start_date) : null"
            @update:modelValue="(value: Date | null) => newPeriod.start_date = value ? value.toISOString().split('T')[0] : null"
            required
            dateFormat="dd/mm/yy"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700">Data de Fim</label>
          <Calendar
            id="endDate"
            :modelValue="newPeriod.end_date ? new Date(newPeriod.end_date) : null"
            @update:modelValue="(value: Date | null) => newPeriod.end_date = value ? value.toISOString().split('T')[0] : null"
            required
            dateFormat="dd/mm/yy"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="regime" class="block text-sm font-medium text-gray-700"
            >Regime Tributário</label
          >
          <select
            id="regime"
            v-model="newPeriod.regime"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option :value="null" disabled>Selecione um regime</option>
            <option value="simples_nacional">Simples Nacional</option>
            <option value="lucro_presumido">Lucro Presumido</option>
            <option value="lucro_real">Lucro Real</option>
          </select>
        </div>
        <div>
          <label for="annex" class="block text-sm font-medium text-gray-700"
            >Anexo do Simples Nacional</label
          >
          <select
            id="annex"
            v-model="newPeriod.annex"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option :value="null" disabled>Selecione um anexo</option>
            <option value="annex_i">Anexo I - Comércio</option>
            <option value="annex_ii">Anexo II - Indústria</option>
            <option value="annex_iii">Anexo III - Serviços</option>
            <option value="annex_iv">Anexo IV - Serviços</option>
            <option value="annex_v">Anexo V - Serviços</option>
          </select>
        </div>
        <div class="md:col-span-3 flex justify-end">
          <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 w-full" role="alert">
            <p class="font-bold">Atenção</p>
            <p>Os períodos mensais serão criados automaticamente com base nas datas informadas. O regime tributário escolhido será aplicado a todos os cálculos de impostos do ano.</p>
          </div>
        </div>
        <div class="md:col-span-3 flex justify-end space-x-2">
          <button
            type="button"
            @click="showCreatePeriodForm = false"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
          >
            {{ accountingPeriodStore.loading ? 'Criando...' : 'Criar Ano Fiscal' }}
          </button>
        </div>
      </form>
      <p v-if="accountingPeriodStore.error" class="text-red-500 text-sm mt-2">
        {{ accountingPeriodStore.error }}
      </p>
    </Dialog>

    <Dialog
      v-model:visible="showEditPeriodForm"
      modal
      :header="'Editar Ano Fiscal: ' + editingPeriod?.fiscal_year"
      class="p-fluid"
    >
      <form @submit.prevent="handleUpdatePeriod" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="editFiscalYear" class="block text-sm font-medium text-gray-700"
            >Ano Fiscal</label
          >
          <input
            type="number"
            id="editFiscalYear"
            v-model="editingPeriod!.fiscal_year"
            required
            min="1900"
            max="2100"
            step="1"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="editStartDate" class="block text-sm font-medium text-gray-700"
            >Data de Início</label
          >
          <Calendar
            id="editStartDate"
            :modelValue="editingPeriod!.start_date ? new Date(editingPeriod!.start_date) : null"
            @update:modelValue="(value: Date | null) => editingPeriod!.start_date = value ? value.toISOString().split('T')[0] : null"
            required
            dateFormat="dd/mm/yy"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="editEndDate" class="block text-sm font-medium text-gray-700"
            >Data de Fim</label
          >
          <Calendar
            id="editEndDate"
            :modelValue="editingPeriod!.end_date ? new Date(editingPeriod!.end_date) : null"
            @update:modelValue="(value: Date | null) => editingPeriod!.end_date = value ? value.toISOString().split('T')[0] : null"
            required
            dateFormat="dd/mm/yy"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label for="editRegime" class="block text-sm font-medium text-gray-700"
            >Regime Tributário</label
          >
          <select
            id="editRegime"
            v-model="editingPeriod!.regime"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option :value="null" disabled>Selecione um regime</option>
            <option value="simples_nacional">Simples Nacional</option>
            <option value="lucro_presumido">Lucro Presumido</option>
            <option value="lucro_real">Lucro Real</option>
          </select>
        </div>
        <div>
          <label for="editAnnex" class="block text-sm font-medium text-gray-700"
            >Anexo do Simples Nacional</label
          >
          <select
            id="editAnnex"
            v-model="editingPeriod!.annex"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option :value="null" disabled>Selecione um anexo</option>
            <option value="annex_i">Anexo I - Comércio</option>
            <option value="annex_ii">Anexo II - Indústria</option>
            <option value="annex_iii">Anexo III - Serviços</option>
            <option value="annex_iv">Anexo IV - Serviços</option>
            <option value="annex_v">Anexo V - Serviços</option>
          </select>
        </div>
        <div>
          <label for="editCostingMethod" class="block text-sm font-medium text-gray-700"
            >Método de Custeio</label
          >
          <select
            id="editCostingMethod"
            v-model="editingPeriod!.costing_method as 'average' | 'fifo' | 'lifo'"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option v-for="method in costingMethods" :key="method.value" :value="method.value">
              {{ method.label }}
            </option>
          </select>
        </div>
        <div class="md:col-span-3 flex justify-end space-x-2">
          <button
            type="button"
            @click="
              () => {
                showEditPeriodForm = false
                editingPeriod = null
              }
            "
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            {{ accountingPeriodStore.loading ? 'Atualizando...' : 'Atualizar Período' }}
          </button>
        </div>
      </form>
      <p v-if="accountingPeriodStore.error" class="text-red-500 text-sm mt-2">
        {{ accountingPeriodStore.error }}
      </p>
    </Dialog>

    <div class="bg-white p-4 rounded-lg shadow-sm">
      <h2 class="text-xl font-semibold mb-3">Períodos Existentes</h2>
      <p v-if="accountingPeriodStore.loading" class="text-gray-600">Carregando períodos...</p>
      <p v-else-if="accountingPeriodStore.error" class="text-red-500">
        Erro ao carregar períodos: {{ accountingPeriodStore.error }}
      </p>
      <ul v-else-if="filteredAccountingPeriods.length > 0" class="space-y-3">
        <li
          v-for="period in filteredAccountingPeriods"
          :key="period.id"
          class="flex items-center justify-between p-3 border rounded-md bg-gray-50"
        >
          <div>
            <p class="font-medium">
              Ano Fiscal {{ period.fiscal_year }} ({{ formatDate(period.start_date) }} -
              {{ formatDate(period.end_date) }})
            </p>
            <p class="text-sm text-gray-600">Regime: {{ formatRegime(period.regime) }}</p>
            <p class="text-sm text-gray-600">
              Custeio: {{ formatCostingMethod(period.costing_method) }}
            </p>
            <span
              :class="[
                period.is_active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800',
                'px-2 py-0.5 rounded-full text-xs font-semibold',
              ]"
            >
              {{ period.is_active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
          <div class="space-x-2 flex flex-col sm:flex-row items-center">
            <button
              v-if="!period.is_active"
              @click="setActive(period.id)"
              class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
            >
              Definir como Ativo
            </button>
            <button
              @click="startEditPeriod(period)"
              class="p-2 rounded-md hover:bg-surface-100 text-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-400 focus:ring-opacity-50"
              aria-label="Editar Período"
            >
              <i class="pi pi-pen-to-square"></i>
            </button>
            <button
              @click="deletePeriod(period.id)"
              class="p-2 rounded-md hover:bg-surface-100 text-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-400 focus:ring-opacity-50"
              aria-label="Excluir Período"
            >
              <i class="pi pi-trash"></i>
            </button>
            <button
              @click="openShareModal(period)"
              class="p-2 rounded-md hover:bg-surface-100 text-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-400 focus:ring-opacity-50"
              aria-label="Compartilhar Período"
            >
              <i class="pi pi-share-alt"></i>
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="text-gray-600">Nenhum período contábil encontrado. Crie um novo acima.</p>
    </div>

    <div class="bg-white p-4 rounded-lg shadow-sm mt-6">
      <h2 class="text-xl font-semibold mb-3">Histórico de Regimes Tributários</h2>
      <p v-if="!taxRegimeHistory.length" class="text-gray-600">
        Nenhum histórico de regime tributário encontrado.
      </p>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Regime
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Data de Início
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Data de Fim
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Criado Em
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="regimeEntry in taxRegimeHistory" :key="regimeEntry.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ formatRegime(regimeEntry.regime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(regimeEntry.start_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(regimeEntry.end_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(regimeEntry.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Dialog
      v-model:visible="showShareModal"
      modal
      :header="'Compartilhar Ano Fiscal: ' + sharingPeriod?.fiscal_year"
      class="p-fluid"
      @hide="closeShareModal"
    >
      <div class="mt-2">
        <div class="mb-4">
          <label for="shareUserSearch" class="block text-sm font-medium text-gray-700"
            >Buscar Usuário (Email ou Nome):</label
          >
          <input
            type="text"
            id="shareUserSearch"
            v-model="userSearchQuery"
            @input="searchUsers"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Digite email ou nome"
          />
          <ul
            v-if="searchResults.length > 0"
            class="border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto bg-white"
          >
            <li
              v-for="user in searchResults"
              :key="user.id"
              @click="selectUserForSharing(user)"
              class="p-2 cursor-pointer hover:bg-gray-100"
            >
              {{ user.username || user.email }}
            </li>
          </ul>
          <p v-if="sharingUser" class="mt-2 text-sm text-gray-600">
            Usuário selecionado:
            <span class="font-semibold">{{ sharingUser.username || sharingUser.email }}</span>
          </p>
        </div>

        <div class="mb-4">
          <label for="permissionLevel" class="block text-sm font-medium text-gray-700"
            >Nível de Permissão:</label
          >
          <select
            id="permissionLevel"
            v-model="sharingPermissionLevel"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="read">Leitura</option>
            <option value="write">Escrita</option>
          </select>
        </div>

        <div class="flex justify-end space-x-2">
          <button
            @click="sharePeriod"
            :disabled="!sharingUser || !sharingPermissionLevel || sharingStore.loading"
            class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
          >
            {{ sharingStore.loading ? 'Compartilhando...' : 'Compartilhar' }}
          </button>
          <button
            @click="closeShareModal"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Cancelar
          </button>
        </div>

        <div class="mt-6">
          <h4 class="text-md font-semibold mb-2">Compartilhado com:</h4>
          <p v-if="sharedUsers.length === 0" class="text-sm text-gray-600">Nenhum usuário.</p>
          <ul v-else class="space-y-2">
            <li
              v-for="shared in sharedUsers"
              :key="shared.id"
              class="flex justify-between items-center p-2 border rounded-md bg-gray-50"
            >
              <span
                >{{ shared.profiles?.username || shared.profiles?.email }} ({{
                  shared.permission_level
                }})</span
              >
              <button
                @click="unsharePeriod(shared.id)"
                class="px-2 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
              >
                Remover
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useSharingStore } from '@/stores/sharingStore'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import { api } from '@/services/api'
import type {
  AccountingPeriod,
  User,
  SharedPermissionLevel,
  SharedAccountingPeriod,
  TaxRegime,
  TaxRegimeHistory,
} from '@/types'

const accountingPeriodStore = useAccountingPeriodStore()
const sharingStore = useSharingStore()
const { accountingPeriods } = storeToRefs(accountingPeriodStore)
const toast = useToast()

const newPeriod = ref<AccountingPeriod>({
  id: '',
  organization_id: '',
  fiscal_year: new Date().getFullYear(),
  start_date: null,
  end_date: null,
  is_active: false,
  created_at: '',
  regime: null,
  annex: null,
  costing_method: 'average',
})

const taxRegimeHistory = ref<TaxRegimeHistory[]>([])

const searchTerm = ref('')
const showCreatePeriodForm = ref(false)
const showEditPeriodForm = ref(false)
const editingPeriod = ref<AccountingPeriod | null>(null)
const costingMethods = [
  { label: 'Custo Médio Ponderado', value: 'average' },
  { label: 'PEPS (Primeiro a Entrar, Primeiro a Sair)', value: 'fifo' },
  { label: 'UEPS (Último a Entrar, Primeiro a Sair)', value: 'lifo' },
]

// Sharing Modal State
const showShareModal = ref(false)
const sharingPeriod = ref<AccountingPeriod | null>(null)
const userSearchQuery = ref('')
const searchResults = ref<User[]>([])
const sharingUser = ref<User | null>(null)
const sharingPermissionLevel = ref<SharedPermissionLevel>('read')
const sharedUsers = ref<SharedAccountingPeriod[]>([])

const filteredAccountingPeriods = computed(() => {
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase()
  return accountingPeriods.value.filter(
    (period) =>
      period.fiscal_year?.toString().includes(lowerCaseSearchTerm) ||
      formatDate(period.start_date).toLowerCase().includes(lowerCaseSearchTerm) ||
      formatDate(period.end_date).toLowerCase().includes(lowerCaseSearchTerm),
  )
})

onMounted(() => {
  accountingPeriodStore.fetchAccountingPeriods()
  fetchTaxRegimeHistory()
})

async function fetchTaxRegimeHistory() {
  try {
    const data = await api.get<TaxRegimeHistory[]>('/tax-regime-history')
    taxRegimeHistory.value = data
  } catch (err) {
    console.error('Erro ao buscar histórico de regime tributário:', err)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao carregar histórico de regime tributário.',
      life: 3000,
    })
  }
}

const handleCreatePeriod = async () => {
  if (
    !newPeriod.value.fiscal_year ||
    !newPeriod.value.start_date ||
    !newPeriod.value.end_date ||
    !newPeriod.value.regime ||
    !newPeriod.value.annex
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos para criar um novo ano fiscal.',
      life: 3000,
    })
    return
  }

  try {
    await accountingPeriodStore.addAccountingPeriod({
      fiscal_year: newPeriod.value.fiscal_year,
      start_date: newPeriod.value.start_date,
      end_date: newPeriod.value.end_date,
      regime: newPeriod.value.regime as TaxRegime,
      annex: newPeriod.value.annex as string,
      costing_method: newPeriod.value.costing_method,
      is_active: true,
    })
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Ano fiscal criado e ativado com sucesso!',
      life: 3000,
    })
    newPeriod.value = {
      id: '',
      organization_id: '',
      fiscal_year: new Date().getFullYear(),
      start_date: null,
      end_date: null,
      is_active: false,
      created_at: '',
      regime: null,
      annex: null,
      costing_method: 'average',
    } // Limpa o formulário
    showCreatePeriodForm.value = false // Fecha o formulário após a criação
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Falha ao criar ano fiscal.',
      life: 3000,
    })
  }
}

const startEditPeriod = (period: AccountingPeriod) => {
  editingPeriod.value = { ...period }
  if (!editingPeriod.value.costing_method) {
    editingPeriod.value.costing_method = 'average' // Garante um valor padrão
  }
  showEditPeriodForm.value = true
  showCreatePeriodForm.value = false // Esconde o formulário de criação se estiver visível
}

const handleUpdatePeriod = async () => {
  if (
    !editingPeriod.value ||
    !editingPeriod.value.fiscal_year ||
    !editingPeriod.value.start_date ||
    !editingPeriod.value.end_date ||
    !editingPeriod.value.regime ||
    !editingPeriod.value.annex
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos para atualizar o ano fiscal.',
      life: 3000,
    })
    return
  }

  try {
    await accountingPeriodStore.updateAccountingPeriod(editingPeriod.value.id, {
      fiscal_year: editingPeriod.value.fiscal_year,
      start_date: editingPeriod.value.start_date,
      end_date: editingPeriod.value.end_date,
      regime: editingPeriod.value.regime || undefined,
      annex: editingPeriod.value.annex || undefined,
      costing_method: editingPeriod.value.costing_method,
    })
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Ano fiscal atualizado com sucesso!',
      life: 3000,
    })
    showEditPeriodForm.value = false // Fecha o formulário após a atualização
    editingPeriod.value = null // Limpa o período em edição
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Falha ao atualizar ano fiscal.',
      life: 3000,
    })
  }
}

const setActive = async (id: string) => {
  try {
    await accountingPeriodStore.setActivePeriod(id)
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Período contábil definido como ativo!',
      life: 3000,
    })
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Falha ao definir período como ativo.',
      life: 3000,
    })
  }
}

const deletePeriod = async (id: string) => {
  if (confirm('Tem certeza que deseja excluir este período contábil?')) {
    try {
      await accountingPeriodStore.deleteAccountingPeriod(id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Período contábil excluído com sucesso!',
        life: 3000,
      })
    } catch (err: unknown) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err instanceof Error ? err.message : 'Falha ao excluir período contábil.',
        life: 3000,
      })
    }
  }
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('pt-BR', options)
}

const formatRegime = (regime: TaxRegime | null | undefined) => {
  if (!regime) return 'N/A'
  switch (regime) {
    case 'simples_nacional':
      return 'Simples Nacional'
    case 'lucro_presumido':
      return 'Lucro Presumido'
    case 'lucro_real':
      return 'Lucro Real'
    default:
      return regime
  }
}

const formatCostingMethod = (method: 'average' | 'fifo' | 'lifo' | undefined) => {
  if (!method) return 'N/A'
  switch (method) {
    case 'average':
      return 'Custo Médio Ponderado'
    case 'fifo':
      return 'PEPS'
    case 'lifo':
      return 'UEPS'
    default:
      return method
  }
}

// Sharing Modal Functions
async function openShareModal(period: AccountingPeriod) {
  sharingPeriod.value = period
  showShareModal.value = true
  await fetchSharedUsers(period.id)
}

function closeShareModal() {
  showShareModal.value = false
  sharingPeriod.value = null
  userSearchQuery.value = ''
  searchResults.value = []
  sharingUser.value = null
  sharingPermissionLevel.value = 'read'
  sharedUsers.value = []
}

let searchTimeout: ReturnType<typeof setTimeout>
async function searchUsers() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (userSearchQuery.value.trim().length > 2) {
      try {
        const data = await api.get<User[]>(`/users?query=${userSearchQuery.value.trim()}`)
        searchResults.value = data
      } catch (err) {
        console.error('Erro ao buscar usuários:', err)
        searchResults.value = []
      }
    } else {
      searchResults.value = []
    }
  }, 300)
}

function selectUserForSharing(user: User) {
  sharingUser.value = user
  searchResults.value = [] // Clear search results after selection
  userSearchQuery.value = user.username || user.email || '' // Display selected user
}

async function sharePeriod() {
  if (!sharingPeriod.value || !sharingUser.value || !sharingPermissionLevel.value) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Selecione um usuário e um nível de permissão.',
      life: 3000,
    })
    return
  }

  try {
    await sharingStore.shareAccountingPeriod(
      sharingPeriod.value.id,
      sharingUser.value.id,
      sharingPermissionLevel.value,
    )
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Período compartilhado com sucesso!',
      life: 3000,
    })
    await fetchSharedUsers(sharingPeriod.value.id) // Refresh shared users list
    sharingUser.value = null // Clear selected user
    userSearchQuery.value = '' // Clear search query
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Falha ao compartilhar período.',
      life: 3000,
    })
  }
}

async function unsharePeriod(sharingId: string) {
  if (confirm('Tem certeza que deseja remover este compartilhamento?')) {
    try {
      await sharingStore.unshareAccountingPeriod(sharingId)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Compartilhamento removido com sucesso!',
        life: 3000,
      })
      if (sharingPeriod.value) {
        await fetchSharedUsers(sharingPeriod.value.id) // Refresh shared users list
      }
    } catch (err: unknown) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err instanceof Error ? err.message : 'Falha ao remover compartilhamento.',
        life: 3000,
      })
    }
  }
}

async function fetchSharedUsers(periodId: string) {
  try {
    // Assuming you'll add a GET endpoint to /sharing to list shared users for a period
    // For now, this is a placeholder. You'll need to implement this backend endpoint.
    const data = await api.get<SharedAccountingPeriod[]>(
      `/sharing?accounting_period_id=${periodId}`,
    )
    sharedUsers.value = data
  } catch (err) {
    console.error('Erro ao buscar usuários compartilhados:', err)
    sharedUsers.value = []
  }
}
</script>
