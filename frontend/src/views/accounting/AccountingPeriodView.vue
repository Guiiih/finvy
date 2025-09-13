<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import AccountingPeriodFormModal from '@/components/accounting-period/AccountingPeriodFormModal.vue'
import CloseConfirmationModal from '@/components/accounting-period/CloseConfirmationModal.vue'
import ShareAccountingPeriodModal from '@/components/accounting-period/ShareAccountingPeriodModal.vue'
import DeleteConfirmationModal from '@/components/accounting-period/DeleteConfirmationModal.vue'

import type { AccountingPeriod, TaxRegime } from '@/types'

const accountingPeriodStore = useAccountingPeriodStore()
const { accountingPeriods } = storeToRefs(accountingPeriodStore)
const toast = useToast()

const searchTerm = ref('')
const showCreatePeriodForm = ref(false)
const showEditPeriodForm = ref(false)
const editingPeriod = ref<AccountingPeriod | null>(null)

// Sharing Modal State
const showShareModal = ref(false)
const sharingPeriod = ref<AccountingPeriod | null>(null)

// State for closing modals
const showClosePeriodModal = ref(false)
const showCloseYearModal = ref(false)
const periodToClose = ref<AccountingPeriod | null>(null)
const yearToClose = ref<{ year: number } | null>(null)

// State for delete modal
const showDeletePeriodModal = ref(false)
const periodToDelete = ref<AccountingPeriod | null>(null)

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

onMounted(() => {
  accountingPeriodStore.fetchAccountingPeriods()
})

const handleFormSubmitSuccess = () => {
  showCreatePeriodForm.value = false
  showEditPeriodForm.value = false
  editingPeriod.value = null
}

const startEditPeriod = (period: AccountingPeriod) => {
  editingPeriod.value = { ...period }
  showEditPeriodForm.value = true
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

const deletePeriod = (period: AccountingPeriod) => {
  periodToDelete.value = period
  showDeletePeriodModal.value = true
}

const confirmDeletePeriod = async (id: string) => {
  try {
    await accountingPeriodStore.deleteAccountingPeriod(id)
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Período contábil excluído com sucesso!',
      life: 3000,
    })
    rerenderKey.value++ // Force re-render
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Falha ao excluir período contábil.',
      life: 3000,
    })
  } finally {
    periodToDelete.value = null
  }
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

function openShareModal(period: AccountingPeriod) {
  sharingPeriod.value = period
  showShareModal.value = true
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

const formatMonthYear = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()
}
</script>
<template>
  <div>
    <div class="max-w-7xl mx-auto">
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <div class="relative flex-1">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Busque um período contábil..."
            class="w-full rounded-lg border border-surface-300 py-1 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-zinc-950 placeholder:text-sm"
          />
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 transform text-surface-400"
            style="font-size: 15px"
          ></i>
        </div>
        <div class="md:hidden">
          <Button
            icon="pi pi-plus"
            @click="showCreatePeriodForm = true"
            size="small"
            title="Novo Período"
          />
        </div>
        <div class="hidden md:inline-block">
          <Button @click="showCreatePeriodForm = true" label="Novo Período" size="small" />
        </div>
      </div>

      <AccountingPeriodFormModal
        v-model:visible="showCreatePeriodForm"
        @submit-success="handleFormSubmitSuccess"
      />

      <AccountingPeriodFormModal
        v-model:visible="showEditPeriodForm"
        :initial-period="editingPeriod"
        @submit-success="handleFormSubmitSuccess"
      />

      <CloseConfirmationModal
        v-model:visible="showClosePeriodModal"
        type="period"
        :period-to-close="periodToClose"
        @confirm-close="handleClosePeriod"
      />

      <CloseConfirmationModal
        v-model:visible="showCloseYearModal"
        type="year"
        :year-to-close="yearToClose"
        @confirm-close="handleCloseYear"
      />

      <div class="space-y-6">
        <div v-if="accountingPeriodStore.loading" class="text-center text-surface-500">
          Carregando períodos...
        </div>
        <div v-else-if="accountingPeriodStore.error" class="text-center text-red-500">
          Erro ao carregar períodos: {{ accountingPeriodStore.error }}
        </div>
        <div v-else-if="groupedPeriods.length === 0" class="text-center text-surface-500">
          Nenhum período contábil encontrado. Crie um novo acima.
        </div>
        <div
          v-else
          v-for="group in groupedPeriods"
          :key="`${group.year}-${rerenderKey}`"
          class="bg-surface-950 p-4 sm:p-6 rounded-lg shadow-md border border-surface-200"
        >
          <!-- Cabeçalho do Ano Fiscal -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <div>
                <h2 class="text-sm flex items-center gap-2 text-surface-800">
                  <div
                    v-if="group.yearPeriod.is_active"
                    class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  ></div>
                  Ano Fiscal {{ group.year }}
                </h2>
                
                <p class="text-xs text-surface-500">
                  {{ formatRegime(group.yearPeriod.regime) }}
                  <span v-if="group.yearPeriod.annex"> - {{ group.yearPeriod.annex }}</span>
                </p>
              </div>
              
            </div>
            <div class="flex flex-col items-end space-y-2 mt-3 sm:mt-0">
              <div class="flex items-center gap-2">
                <Button
                  @click="startEditPeriod(group.yearPeriod)"
                  icon="pi pi-pen-to-square"
                  text
                  rounded
                ></Button>
                <Button
                  @click="deletePeriod(group.yearPeriod)"
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  size="small"
                ></Button>
                <Button
                  @click="openShareModal(group.yearPeriod)"
                  icon="pi pi-share-alt"
                  text
                  rounded
                  size="small"
                ></Button>
              </div>
              <div class="flex items-center space-x-2">
                <span 
                  v-if="!group.yearPeriod.is_locked"
                  class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 inset-ring inset-ring-green-500/20"
                >
                  <i class="pi pi-unlock mr-1"></i>
                  Aberto
                </span>
                <span 
                  v-else 
                  class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 inset-ring inset-ring-green-500/20"
                >
                  <i class="pi pi-lock mr-1"></i>
                  Fechado
                </span>
                <Button
                  v-if="!group.yearPeriod.is_active"
                  @click="setActive(group.yearPeriod.id)"
                  label="Tornar Atual"
                  severity="secondary"
                  variant="outlined"
                  size="small"
                ></Button>
                <Button
                  @click="openCloseYearModal(group)"
                  icon="pi pi-lock"
                  label="Fechar Ano"
                  variant="outlined"
                  severity="danger"
                  size="small"
                ></Button>
              </div>
            </div>
          </div>

          <!-- Resumo Financeiro -->
          <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-surface-50 rounded-lg">
            <div class="text-center">
              <p class="text-sm text-surface-600">Débitos</p>
              <p class="text-lg text-green-600">R$ 0,00</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-surface-600">Créditos</p>
              <p class="text-lg text-red-600">R$ 0,00</p>
            </div>
          </div>

          <!-- Tabela de Períodos Mensais -->
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="hidden md:table-header-group bg-surface-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Período
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Débitos
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Créditos
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody class="bg-primary-0">
                <template v-for="period in group.monthlyPeriods" :key="period.id">
                  <!-- Desktop View (md and larger) -->
                  <tr class="hover:bg-surface-50 hidden md:table-row">
                    <td class="px-6 py-2 whitespace-nowrap">
                      <div class="font-medium text-xs">
                        {{ formatMonthYear(period.start_date) }}
                      </div>
                    </td>
                    <td class="px-6 py-2 whitespace-nowrap text-xs text-green-600">
                      R$ 0,00
                    </td>
                    <td class="px-6 py-2 whitespace-nowrap text-xs text-red-600">
                      R$ 0,00
                    </td>
                    <td class="px-6 py-2 whitespace-nowrap text-xs">
                      <span
                        v-if="!period.is_locked"
                        class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 inset-ring inset-ring-green-500/20"
                      >
                        <i class="pi pi-unlock mr-1"></i>
                        Aberto
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 inset-ring inset-ring-green-500/20"
                      >
                        <i class="pi pi-lock mr-1"></i>
                        Fechado
                      </span>
                    </td>
                    <td class="px-6 py-2 whitespace-nowrap text-xs">
                      <Button
                        v-if="!period.is_locked"
                        @click="openClosePeriodModal(period)"
                        icon="pi pi-lock"
                        size="small"
                        severity="secondary"
                        rounded
                      ></Button>
                    </td>
                  </tr>

                  <!-- Mobile View (below md) -->
                  <div class="block md:hidden border-b border-surface-200 p-4">
                    <div class="flex justify-between items-center mb-2">
                      <div class="font-medium text-sm">{{ formatMonthYear(period.start_date) }}</div>
                      <div class="flex items-center gap-2"> <!-- New div to group badge and button -->
                        <span
                          v-if="!period.is_locked"
                          class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 inset-ring inset-ring-green-500/20"
                        >
                          <i class="pi pi-unlock mr-1"></i>
                          Aberto
                        </span>
                        <span
                          v-else
                          class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-600 inset-ring inset-ring-green-500/20"
                        >
                          <i class="pi pi-lock mr-1"></i>
                          Fechado
                        </span>
                        <Button
                          v-if="!period.is_locked"
                          @click="openClosePeriodModal(period)"
                          icon="pi pi-lock"
                          size="small"
                          severity="secondary"
                          rounded
                        ></Button>
                      </div>
                    </div>
                    <div class="flex justify-between items-center mb-2">
                      <div class="text-xs text-green-600">Débitos: R$ 0,00</div>
                      <div class="text-xs text-red-600">Créditos: R$ 0,00</div>
                    </div>
                    <!-- Removed the old div for the button -->
                  </div>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ShareAccountingPeriodModal
        v-model:visible="showShareModal"
        :sharing-period="sharingPeriod"
      />
      <DeleteConfirmationModal
        v-model:visible="showDeletePeriodModal"
        :period-to-delete="periodToDelete"
        @confirm-delete="confirmDeletePeriod"
      />
    </div>
  </div>
</template>
