<template>
  <div>
    <div class="max-w-7xl mx-auto">
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
        :style="{ width: '450px' }"
        class="p-fluid"
        :draggable="false"
      >
        <template #header>
          <div class="flex flex-col gap-1">
            <h3 class="text-xl font-bold text-gray-900">Criar Novo Ano Fiscal</h3>
            <p class="text-sm text-gray-500">
              Configure um novo ano fiscal com seus períodos contábeis.
            </p>
          </div>
        </template>

        <form @submit.prevent="handleCreatePeriod" class="flex flex-col gap-6 pt-4">
          <div class="flex flex-col gap-2">
            <label for="fiscalYear" class="text-sm font-medium text-gray-800">Ano Fiscal</label>
            <InputNumber
              id="fiscalYear"
              v-model="newPeriod.fiscal_year"
              mode="decimal"
              :useGrouping="false"
              required
              size="small"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="regime" class="text-sm font-medium text-gray-800">Regime Tributário</label>
            <Dropdown
              id="regime"
              v-model="newPeriod.regime"
              :options="regimeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um regime"
              required
              size="small"
            />
          </div>

          <div v-if="newPeriod.regime === 'simples_nacional'" class="flex flex-col gap-2">
            <label for="annex" class="text-sm font-medium text-gray-800"
              >Anexo do Simples Nacional</label
            >
            <Dropdown
              id="annex"
              v-model="newPeriod.annex"
              :options="annexOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um anexo"
              required
              size="small"
            />
          </div>

          <div class="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 text-sm" role="alert">
            <div class="flex items-center">
              <i class="pi pi-info-circle mr-2"></i>
              <p>
                Os períodos mensais serão criados automaticamente. O regime tributário escolhido
                será aplicado a todos os cálculos de impostos do ano.
              </p>
            </div>
          </div>

          <div class="flex justify-end space-x-2">
            <Button
              label="Cancelar"
              text
              @click="showCreatePeriodForm = false"
              class="text-gray-800"
              size="small"
            />
            <Button
              :loading="accountingPeriodStore.loading"
              type="submit"
              :label="accountingPeriodStore.loading ? 'Criando...' : 'Criar Ano Fiscal'"
              class="!bg-gray-900 !text-white"
              size="small"
            />
          </div>
        </form>
        <p v-if="accountingPeriodStore.error" class="text-red-500 text-sm mt-2">
          {{ accountingPeriodStore.error }}
        </p>
      </Dialog>

      <Dialog
        v-model:visible="showEditPeriodForm"
        modal
        :style="{ width: '450px' }"
        class="p-fluid"
        :draggable="false"
      >
        <template #header>
          <div class="flex flex-col gap-1">
            <h3 class="text-xl font-bold text-gray-900">
              Editar Ano Fiscal: {{ editingPeriod?.fiscal_year }}
            </h3>
            <p class="text-sm text-gray-500">Ajuste as configurações do seu ano fiscal.</p>
          </div>
        </template>

        <form
          v-if="editingPeriod"
          @submit.prevent="handleUpdatePeriod"
          class="flex flex-col gap-6 pt-4"
        >
          <div class="flex flex-col gap-2">
            <label for="editFiscalYear" class="text-sm font-medium text-gray-800">Ano Fiscal</label>
            <InputNumber
              id="editFiscalYear"
              v-model="editingPeriod.fiscal_year"
              mode="decimal"
              :useGrouping="false"
              required
              size="small"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="editRegime" class="text-sm font-medium text-gray-800"
              >Regime Tributário</label
            >
            <Dropdown
              id="editRegime"
              v-model="editingPeriod.regime"
              :options="regimeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um regime"
              required
              size="small"
            />
          </div>

          <div v-if="editingPeriod.regime === 'simples_nacional'" class="flex flex-col gap-2">
            <label for="editAnnex" class="text-sm font-medium text-gray-800"
              >Anexo do Simples Nacional</label
            >
            <Dropdown
              id="editAnnex"
              v-model="editingPeriod.annex"
              :options="annexOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um anexo"
              required
              size="small"
            />
          </div>

          <div class="flex justify-end space-x-2">
            <Button
              label="Cancelar"
              text
              @click="showEditPeriodForm = false"
              class="text-gray-800"
              size="small"
            />
            <Button
              :loading="accountingPeriodStore.loading"
              type="submit"
              :label="accountingPeriodStore.loading ? 'Atualizando...' : 'Atualizar Período'"
              class="!bg-gray-900 !text-white"
              size="small"
            />
          </div>
        </form>
        <p v-if="accountingPeriodStore.error" class="text-red-500 text-sm mt-2">
          {{ accountingPeriodStore.error }}
        </p>
      </Dialog>

      <Dialog
        v-model:visible="showClosePeriodModal"
        modal
        header="Fechar Período"
        class="p-fluid w-full md:w-1/2 lg:w-1/3"
      >
        <p v-if="periodToClose">
          Deseja fechar o período de {{ formatMonthYear(periodToClose.start_date) }}? Esta ação não
          poderá ser desfeita.
        </p>
        <div class="flex justify-end space-x-2 pt-4">
          <button
            @click="showClosePeriodModal = false"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            @click="handleClosePeriod"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Fechar Período
          </button>
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showCloseYearModal"
        modal
        :header="`Fechar Ano Fiscal ${yearToClose?.year}`"
        class="p-fluid w-full md:w-1/2 lg:w-1/3"
      >
        <p v-if="yearToClose">
          Esta ação irá fechar todos os períodos abertos do ano {{ yearToClose.year }} e não poderá
          ser desfeita. Certifique-se de que todos os lançamentos estão corretos.
        </p>
        <div class="flex justify-end space-x-2 pt-4">
          <button
            @click="showCloseYearModal = false"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
          <Button
            @click="handleCloseYear"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Fechar Ano
          </Button>
        </div>
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
          :key="`${group.year}-${rerenderKey}`"
          class="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200"
        >
          <!-- Cabeçalho do Ano Fiscal -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <div>
                <h2 class="text-sm flex items-center gap-2 text-gray-800">
                  <div
                    v-if="group.yearPeriod.is_active"
                    class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  ></div>
                  Ano Fiscal {{ group.year }}
                </h2>
                <p class="text-sm text-gray-500">
                  {{ formatDateWithYear(group.yearPeriod.start_date) }} até
                  {{ formatDateWithYear(group.yearPeriod.end_date) }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatRegime(group.yearPeriod.regime) }} - {{ group.yearPeriod.annex }}
                </p>
              </div>
              <span
                v-if="group.yearPeriod.is_active"
                class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1 text-xs"
              >
                <i class="pi pi-check-circle text-blue-800"></i>
                <span>Atual</span>
              </span>
            </div>
            <div class="flex flex-col items-end space-y-2 mt-3 sm:mt-0">
              <div class="flex items-center space-x-2">
                <Button
                  @click="startEditPeriod(group.yearPeriod)"
                  icon="pi pi-pen-to-square"
                  text
                  rounded
                ></Button>
                <Button
                  @click="deletePeriod(group.yearPeriod.id)"
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                ></Button>
                <Button
                  @click="openShareModal(group.yearPeriod)"
                  icon="pi pi-share-alt"
                  text
                  rounded
                ></Button>
              </div>
              <div class="flex items-center space-x-2">
                <span
                  v-if="!group.yearPeriod.is_locked"
                  class="bg-emerald-100 text-emerald-700 px-4 py-0.5 rounded-full flex items-center gap-0 text-xs"
                >
                  <i class="pi pi-unlock text-emerald-700"></i>
                  <span>Aberto</span>
                </span>
                <span v-else class="bg-red-500 text-white px-3 py-1 rounded-full"> Fechado </span>
                <Button
                  v-if="!group.yearPeriod.is_active"
                  @click="setActive(group.yearPeriod.id)"
                  label="Tornar Atual"
                  severity="secondary"
                  text
                ></Button>
                <Button
                  @click="openCloseYearModal(group)"
                  icon="pi pi-lock"
                  label="Fechar Ano"
                  severity="danger"
                  variant="outlined"
                  size="small"
                ></Button>
              </div>
            </div>
          </div>

          <!-- Resumo Financeiro -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-gray-600">Períodos</p>
              <p class="text-lg text-gray-800">{{ group.monthlyPeriods.length }} meses</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Transações</p>
              <p class="text-lg text-gray-800">0</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Débitos</p>
              <p class="text-lg text-green-600">R$ 0,00</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Créditos</p>
              <p class="text-lg text-red-600">R$ 0,00</p>
            </div>
          </div>

          <!-- Tabela de Períodos Mensais -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Período
                  </th>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Datas
                  </th>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Transações
                  </th>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Débitos
                  </th>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Créditos
                  </th>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="period in group.monthlyPeriods"
                  :key="period.id"
                  class="hover:bg-gray-50"
                >
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs font-medium text-gray-800">
                    {{ formatMonthYear(period.start_date) }}
                  </td>
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs text-gray-600">
                    {{ formatDate(period.start_date) }} até {{ formatDate(period.end_date) }}
                  </td>
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs text-gray-600">0</td>
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs text-green-600">
                    <i class="material-icons text-green-600">trending_up</i> R$ 0,00
                  </td>
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs text-red-600">
                    <i class="material-icons text-red-600">trending_down</i> R$ 0,00
                  </td>
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs">
                    <span
                      v-if="!period.is_locked"
                      class="bg-emerald-100 text-emerald-700 px-4 py-0.5 rounded-full flex items-center gap-0 text-xs"
                    >
                      <i class="pi pi-unlock text-emerald-700"></i>
                      <span>Aberto</span>
                    </span>
                    <span
                      v-else
                      class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1 text-xs"
                    >
                      <i class="pi pi-lock text-red-700"></i>
                      <span>Fechado</span>
                    </span>
                  </td>
                  <td class="px-2 py-1.5 whitespace-nowrap text-xs">
                    <Button
                      v-if="!period.is_locked"
                      @click="openClosePeriodModal(period)"
                      icon="pi pi-lock"
                      text
                      rounded
                    ></Button>
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
        header="Compartilhar Período Fiscal"
        :style="{ width: '600px' }"
        :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
        @hide="closeShareModal"
      >
        <div class="space-y-6">
          <!-- Seção de Convite -->
          <div>
            <p class="text-sm text-gray-600 mb-2">
              Convide pessoas por e-mail para colaborar neste período fiscal.
            </p>
            <div class="flex flex-col sm:flex-row items-stretch gap-2">
              <Chips
                v-model="emailsToInvite"
                separator=","
                placeholder="Um ou mais emails"
                class="flex-grow"
              />
              <div class="flex items-stretch gap-2">
                <Select
                  v-model="sharingPermissionLevel"
                  :options="permissionLevels"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full sm:w-36"
                />
                <Button
                  @click="sendInvites"
                  icon="pi pi-send"
                  label="Convidar"
                  class="bg-blue-600 text-white"
                />
              </div>
            </div>
          </div>

          <!-- Divisor -->
          <div class="border-t border-gray-200"></div>

          <!-- Lista de Membros -->
          <div>
            <h3 class="text-lg font-medium text-gray-900">Pessoas com Acesso</h3>
            <div v-if="sharedUsers.length > 0" class="mt-4 space-y-3 max-h-60 overflow-y-auto">
              <div
                v-for="shared in sharedUsers"
                :key="shared.id"
                class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <div class="flex items-center gap-3 mb-2 sm:mb-0">
                  <img
                    :src="`https://ui-avatars.com/api/?name=${shared.profiles?.username || shared.profiles?.email}&background=random&color=fff`"
                    alt="avatar"
                    class="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p class="font-semibold text-gray-900">{{ shared.profiles?.username }}</p>
                    <p class="text-sm text-gray-500">{{ shared.profiles?.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center">
                  <Select
                    v-model="shared.permission_level"
                    :options="permissionLevels"
                    optionLabel="label"
                    optionValue="value"
                    @change="updatePermission(shared)"
                    class="w-32"
                  />
                  <Button
                    @click="unsharePeriod(shared.id)"
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    aria-label="Remover Acesso"
                  />
                </div>
              </div>
            </div>
            <div v-else class="mt-4 text-center text-gray-500 py-4">
              <p>Ninguém foi convidado para este período ainda.</p>
            </div>
          </div>

          <!-- Divisor -->
          <div class="border-t border-gray-200"></div>

          <!-- Compartilhamento de Link -->
          <div>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">Compartilhamento por Link</h3>
              <!-- Opcional: Adicionar um toggle para ativar/desativar o link público -->
              <!-- <InputSwitch v-model="publicLinkEnabled" /> -->
            </div>
            <p class="text-sm text-gray-600 mt-1">
              Qualquer pessoa com o link poderá visualizar (somente leitura).
            </p>
            <div class="mt-3 flex items-stretch">
              <input
                type="text"
                :value="shareableLink"
                readonly
                class="flex-grow p-2 border border-gray-300 rounded-l-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                @click="copyToClipboard(shareableLink)"
                icon="pi pi-copy"
                label="Copiar"
                severity="secondary"
                class="rounded-l-none"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useSharingStore } from '@/stores/sharingStore'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Chips from 'primevue/chips'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

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

const regimeOptions = ref([
  { label: 'Simples Nacional', value: 'simples_nacional' },
  { label: 'Lucro Presumido', value: 'lucro_presumido' },
  { label: 'Lucro Real', value: 'lucro_real' },
])

const annexOptions = ref([
  { label: 'Anexo I - Comércio', value: 'annex_i' },
  { label: 'Anexo II - Indústria', value: 'annex_ii' },
  { label: 'Anexo III - Serviços', value: 'annex_iii' },
  { label: 'Anexo IV - Serviços', value: 'annex_iv' },
  { label: 'Anexo V - Serviços', value: 'annex_v' },
])

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

watch(
  () => newPeriod.value.regime,
  (newRegime) => {
    if (newRegime !== 'simples_nacional') {
      newPeriod.value.annex = null
    }
  },
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

watch(
  () => editingPeriod.value?.regime,
  (newRegime) => {
    if (editingPeriod.value && newRegime !== 'simples_nacional') {
      editingPeriod.value.annex = null
    }
  },
)

// Sharing Modal State
const showShareModal = ref(false)
const sharingPeriod = ref<AccountingPeriod | null>(null)
const userSearchQuery = ref('')
const searchResults = ref<User[]>([])
const sharingUser = ref<User | null>(null)
const sharingPermissionLevel = ref<SharedPermissionLevel>('read')
const sharedUsers = ref<SharedAccountingPeriod[]>([])
const emailsToInvite = ref<string[]>([])

const permissionLevels = ref([
  { label: 'Viewer', value: 'read' },
  { label: 'Editor', value: 'write' },
  { label: 'Admin', value: 'admin' },
])

const shareableLink = computed(() => {
  if (sharingPeriod.value) {
    return `https://app.finvy.com/shared/periods/${sharingPeriod.value.id}`
  }
  return ''
})

const copyToClipboard = (text: string) => {
  if (!navigator.clipboard) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      toast.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Link copiado para a área de transferência.',
        life: 3000,
      })
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar o link.',
        life: 3000,
      })
    }
    document.body.removeChild(textArea)
    return
  }
  navigator.clipboard.writeText(text).then(
    () => {
      toast.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Link copiado para a área de transferência.',
        life: 3000,
      })
    },
    () => {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar o link.',
        life: 3000,
      })
    },
  )
}

const sendInvites = () => {
  if (!emailsToInvite.value || emailsToInvite.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Insira um ou mais emails para convidar.',
      life: 3000,
    })
    return
  }
  // TODO: A implementação do backend para enviar convites é necessária.
  toast.add({
    severity: 'info',
    summary: 'Não implementado',
    detail: 'O envio de convites ainda não foi implementado.',
    life: 3000,
  })
  console.log(
    'Convidando emails:',
    emailsToInvite.value,
    'com permissão:',
    sharingPermissionLevel.value,
  )
}

const updatePermission = (shared: SharedAccountingPeriod) => {
  // TODO: A implementação do backend para atualizar as permissões é necessária.
  toast.add({
    severity: 'info',
    summary: 'Não implementado',
    detail: 'A atualização de permissões ainda não foi implementada.',
    life: 3000,
  })
  console.log('Atualizando permissão para:', shared.id, 'para:', shared.permission_level)
}

// State for closing modals
const showClosePeriodModal = ref(false)
const showCloseYearModal = ref(false)
const periodToClose = ref<AccountingPeriod | null>(null)
const yearToClose = ref<{ year: number } | null>(null)
const rerenderKey = ref(0)

const groupedPeriods = computed(() => {
  const groups: {
    year: number
    yearPeriod: AccountingPeriod
    monthlyPeriods: AccountingPeriod[]
  }[] = []

  const yearlyPeriods = accountingPeriods.value.filter((p) => p.period_type === 'yearly')
  const monthlyPeriods = accountingPeriods.value.filter((p) => p.period_type === 'monthly')

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
    const newAccountingPeriod = await accountingPeriodStore.addAccountingPeriod({
      fiscal_year: newPeriod.value.fiscal_year,
      start_date: newPeriod.value.start_date,
      end_date: newPeriod.value.end_date,
      regime: newPeriod.value.regime as TaxRegime,
      annex: newPeriod.value.annex as string,

      is_active: true,
    })

    if (newAccountingPeriod) {
      await accountingPeriodStore.setActivePeriod(newAccountingPeriod.id)
    }

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
  const options: Intl.DateTimeFormatOptions = { month: '2-digit', day: '2-digit' }
  return new Date(dateString).toLocaleDateString('pt-BR', options)
}

const formatDateWithYear = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const options: Intl.DateTimeFormatOptions = { year: '2-digit', month: '2-digit', day: '2-digit' }
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

function openClosePeriodModal(period: AccountingPeriod) {
  periodToClose.value = period
  showClosePeriodModal.value = true
}

function openCloseYearModal(group: { year: number }) {
  yearToClose.value = group
  showCloseYearModal.value = true
}

async function handleClosePeriod() {
  if (!periodToClose.value) return
  // Lógica para fechar o período aqui
  console.log('Fechando período:', periodToClose.value)
  showClosePeriodModal.value = false
  periodToClose.value = null
}

async function handleCloseYear() {
  if (!yearToClose.value) return
  // Lógica para fechar o ano aqui
  console.log('Fechando ano:', yearToClose.value.year)
  showCloseYearModal.value = false
  yearToClose.value = null
}
</script>
