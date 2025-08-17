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
      <button
        @click="showYearEndClosingModal = true"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
      >
        Fechar Exercício
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
          <label for="fiscalYear" class="block text-sm font-medium text-gray-700">Ano Fiscal</label>
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
          <div
            class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 w-full"
            role="alert"
          >
            <p class="font-bold">Atenção</p>
            <p>
              Os períodos mensais serão criados automaticamente com base nas datas informadas. O
              regime tributário escolhido será aplicado a todos os cálculos de impostos do ano.
            </p>
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

    <Dialog
      v-model:visible="showYearEndClosingModal"
      modal
      header="Fechamento de Exercício"
      class="p-fluid w-full md:w-1/2 lg:w-1/3"
    >
      <form @submit.prevent="handleYearEndClosing" class="flex flex-col space-y-4">
        <p class="text-surface-700">
          O fechamento de exercício zera as contas de receita e despesa, transferindo o resultado
          para o Patrimônio Líquido. Selecione a data de fechamento. Todos os lançamentos até esta
          data serão considerados.
        </p>

        <div>
          <label for="closingDate" class="block text-sm font-medium text-gray-700"
            >Data de Fechamento</label
          >
          <input
            type="date"
            id="closingDate"
            v-model="closingDate"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            @click="showYearEndClosingModal = false"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isClosingYearEnd"
            class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50 disabled:bg-surface-300"
          >
            {{ isClosingYearEnd ? 'Processando...' : 'Realizar Fechamento' }}
          </button>
        </div>
      </form>
    </Dialog>

    <div class="space-y-6">
      <div v-if="accountingPeriodStore.loading" class="text-center text-gray-500">
        Carregando períodos...
      </div>
      <div v-else-if="accountingPeriodStore.error" class="text-center text-red-500">
        Erro ao carregar períodos: {{ accountingPeriodStore.error }}
      </div>
      <div v-else-if="groupedPeriods.length === 0" class="text-center text-gray-500">
        Nenhum período contábil encontrado. Crie um novo acima.
      </div>
      <div
        v-else
        v-for="group in groupedPeriods"
        :key="group.year"
        class="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200"
      >
        <!-- Cabeçalho do Ano Fiscal -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div class="flex items-center space-x-3">
            <span class="text-blue-500 text-2xl">
              <i class="pi pi-calendar"></i>
            </span>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Ano Fiscal {{ group.year }}</h2>
              <p class="text-sm text-gray-500">
                {{ formatDate(group.yearPeriod.start_date) }} até
                {{ formatDate(group.yearPeriod.end_date) }}
              </p>
              <p class="text-sm text-gray-500">
                {{ formatRegime(group.yearPeriod.regime) }} - {{ group.yearPeriod.annex }}
              </p>
            </div>
            <span
              v-if="group.yearPeriod.is_active"
              class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
            >
              Atual
            </span>
          </div>
          <div class="flex items-center space-x-2 mt-3 sm:mt-0">
            <button
              class="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              <i class="pi pi-lock-open mr-1"></i> Aberto
            </button>
            <button
              v-if="!group.yearPeriod.is_active"
              @click="setActive(group.yearPeriod.id)"
              class="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold hover:bg-gray-300 transition-colors"
            >
              Tornar Atual
            </button>
            <button
              class="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              <i class="pi pi-lock mr-1"></i> Fechar Ano
            </button>
            <button
              @click="startEditPeriod(group.yearPeriod)"
              class="p-2 rounded-md hover:bg-surface-100 text-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-400 focus:ring-opacity-50"
              aria-label="Editar Período"
            >
              <i class="pi pi-pen-to-square"></i>
            </button>
            <button
              @click="deletePeriod(group.yearPeriod.id)"
              class="p-2 rounded-md hover:bg-surface-100 text-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-400 focus:ring-opacity-50"
              aria-label="Excluir Período"
            >
              <i class="pi pi-trash"></i>
            </button>
            <button
              @click="openShareModal(group.yearPeriod)"
              class="p-2 rounded-md hover:bg-surface-100 text-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-400 focus:ring-opacity-50"
              aria-label="Compartilhar Período"
            >
              <i class="pi pi-share-alt"></i>
            </button>
          </div>
        </div>

        <!-- Resumo Financeiro -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-600">Períodos</p>
            <p class="text-lg font-semibold text-gray-800">
              {{ group.monthlyPeriods.length }} meses
            </p>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-600">Transações</p>
            <p class="text-lg font-semibold text-gray-800">0</p>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-600">Débitos</p>
            <p class="text-lg font-semibold text-green-600">R$ 0,00</p>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-sm text-gray-600">Créditos</p>
            <p class="text-lg font-semibold text-red-600">R$ 0,00</p>
          </div>
        </div>

        <!-- Tabela de Períodos Mensais -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Período
                </th>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Datas
                </th>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Transações
                </th>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Débitos
                </th>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Créditos
                </th>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="period in group.monthlyPeriods" :key="period.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                  {{ formatMonthYear(period.start_date) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(period.start_date) }} até {{ formatDate(period.end_date) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">0</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-green-600">R$ 0,00</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-red-600">R$ 0,00</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full"
                    >Aberto</span
                  >
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <button class="text-gray-500 hover:text-gray-700">
                    <i class="pi pi-lock"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useSharingStore } from '@/stores/sharingStore'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'

import { api } from '@/services/api'
import type {
  AccountingPeriod,
  User,
  SharedPermissionLevel,
  SharedAccountingPeriod,
  TaxRegime,
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
})

watch(
  () => newPeriod.value.fiscal_year,
  (newYear) => {
    if (newYear) {
      newPeriod.value.start_date = `${newYear}-01-01`
      newPeriod.value.end_date = `${newYear}-12-31`
    } else {
      newPeriod.value.start_date = null
      newPeriod.value.end_date = null
    }
  },
  { immediate: true },
)

const searchTerm = ref('')
const showCreatePeriodForm = ref(false)
const showEditPeriodForm = ref(false)
const editingPeriod = ref<AccountingPeriod | null>(null)

watch(
  () => editingPeriod.value?.fiscal_year,
  (newYear) => {
    if (editingPeriod.value && newYear) {
      editingPeriod.value.start_date = `${newYear}-01-01`
      editingPeriod.value.end_date = `${newYear}-12-31`
    } else if (editingPeriod.value) {
      editingPeriod.value.start_date = null
      editingPeriod.value.end_date = null
    }
  },
  { immediate: true },
)

// Sharing Modal State
const showShareModal = ref(false)
const sharingPeriod = ref<AccountingPeriod | null>(null)
const userSearchQuery = ref('')
const searchResults = ref<User[]>([])
const sharingUser = ref<User | null>(null)
const sharingPermissionLevel = ref<SharedPermissionLevel>('read')
const sharedUsers = ref<SharedAccountingPeriod[]>([])

// Year End Closing State
const showYearEndClosingModal = ref(false)
const closingDate = ref('')
const isClosingYearEnd = ref(false)

const groupedPeriods = computed(() => {
  const groups: {
    year: number
    yearPeriod: AccountingPeriod
    monthlyPeriods: AccountingPeriod[]
  }[] = []

  const yearlyPeriods = accountingPeriods.value.filter((p) => p.is_active)
  const monthlyPeriods = accountingPeriods.value.filter((p) => !p.is_active)

  for (const yearPeriod of yearlyPeriods) {
    const year = yearPeriod.fiscal_year
    if (year) {
      const correspondingMonthly = monthlyPeriods
        .filter((p) => p.fiscal_year === year)
        .sort((a, b) => {
          if (a.start_date && b.start_date) {
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          }
          return 0
        })

      groups.push({
        year,
        yearPeriod,
        monthlyPeriods: correspondingMonthly,
      })
    }
  }

  return groups.sort((a, b) => b.year - a.year)
})

const formatMonthYear = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

onMounted(() => {
  accountingPeriodStore.fetchAccountingPeriods()
})

const handleCreatePeriod = async () => {
  if (!newPeriod.value.fiscal_year || !newPeriod.value.regime || !newPeriod.value.annex) {
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

  showEditPeriodForm.value = true
  showCreatePeriodForm.value = false // Esconde o formulário de criação se estiver visível
}

const handleUpdatePeriod = async () => {
  if (
    !editingPeriod.value ||
    !editingPeriod.value.fiscal_year ||
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

async function handleYearEndClosing() {
  if (!closingDate.value) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Por favor, selecione uma data de fechamento.',
      life: 3000,
    })
    return
  }

  isClosingYearEnd.value = true
  try {
    const response = await api.post<{ message?: string }, { closingDate: string }>(
      '/year-end-closing',
      {
        closingDate: closingDate.value,
      },
    )
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: response.message || 'Fechamento de exercício realizado com sucesso!',
      life: 3000,
    })
    showYearEndClosingModal.value = false
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Erro ao realizar fechamento de exercício.',
      life: 3000,
    })
  } finally {
    isClosingYearEnd.value = false
  }
}
</script>
