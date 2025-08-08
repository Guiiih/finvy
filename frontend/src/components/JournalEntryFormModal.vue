<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { JournalEntry, Product, TaxData, FiscalOperationData } from '@/types/index'
import { useAuthStore } from '@/stores/authStore'
import { recordProductPurchase, calculateCogsForSale } from '@/services/productApiService'
import { api } from '@/services/api'
import { useToast } from 'primevue/usetoast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Imposto from '@/components/ImpostoComponent.vue'
import JournalEntryBasicForm from '@/components/JournalEntryBasicForm.vue'
import JournalEntryLinesForm from '@/components/JournalEntryLinesForm.vue'
import JournalEntryProductForm from '@/components/JournalEntryProductForm.vue'

const journalEntryStore = useJournalEntryStore()
const accountStore = useAccountStore()
const productStore = useProductStore()
const toast = useToast()

type EntryLine = {
  account_id: string
  type: 'debit' | 'credit'
  amount: number
  product_id?: string
  quantity?: number
  unit_cost?: number // Adicionado
  icms_rate?: number
  ipi_rate?: number // Adicionado
  pis_rate?: number
  cofins_rate?: number
  irrf_rate?: number // Adicionado
  csll_rate?: number // Adicionado
  inss_rate?: number // Adicionado
  total_gross?: number
  icms_value?: number
  ipi_value?: number // Adicionado
  pis_value?: number
  cofins_value?: number // Adicionado
  irrf_value?: number // Adicionado
  csll_value?: number // Adicionado
  inss_value?: number // Adicionado
  total_net?: number
}

interface SelectedProductData {
  product: Product;
  quantity?: number;
  unitCost?: number;
}

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  editingEntry: JournalEntry | null
}>()

const emit = defineEmits(['update:visible', 'submitSuccess'])

const displayModal = ref(props.visible)
const newEntryDate = ref(new Date().toISOString().split('T')[0])  
const newEntryDescription = ref('') 
const newEntryReferencePrefix = ref('') 
const generatedSequenceNumber = ref(0) 

const newEntryLines = ref<EntryLine[]>([])
const activeTab = ref('Básico')
const selectedProductFromForm = ref<SelectedProductData | null>(null)
const fiscalOperationData = ref<FiscalOperationData>({
  operationType: null,
  productServiceType: null,
  ufOrigin: null,
  ufDestination: null,
  cfop: null,
  totalAmount: 0,
  freight: 0,
  insurance: 0,
  discount: 0,
  icmsSt: false,
  ipiIncides: false,
  industrialOperation: false,
  taxData: {},
})
const newEntryStatus = ref('draft')

const hasStockRelatedAccount = computed(() => {
  return newEntryLines.value.some((line) => line.account_id === stockAccountId.value)
})

const stockAccountId = computed(() => {
  return accountStore.accounts.find((acc) => acc.name === 'Estoques')?.id
})

const totalDebits = computed(() =>
  newEntryLines.value.reduce(
    (sum: number, line: EntryLine) => (line.type === 'debit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)

const totalCredits = computed(() =>
  newEntryLines.value.reduce(
    (sum: number, line: EntryLine) => (line.type === 'credit' ? sum + (line.amount || 0) : sum),
    0,
  ),
)

watch(
  () => props.visible,
  async (value) => {
    displayModal.value = value
    if (value) {
      // When modal becomes visible, initialize form based on props
      if (props.isEditing && props.editingEntry) {
        newEntryDate.value = props.editingEntry.entry_date
        newEntryDescription.value = props.editingEntry.description
        newEntryStatus.value = props.editingEntry.status || 'draft'
        // Parse existing reference into prefix and number
        const match = props.editingEntry.reference.match(/^([A-Za-z]+)(\d+)$/)
        if (match) {
          newEntryReferencePrefix.value = match[1]
          generatedSequenceNumber.value = parseInt(match[2], 10)
        } else {
          newEntryReferencePrefix.value = ''
          generatedSequenceNumber.value = 0
        }
        newEntryLines.value = JSON.parse(JSON.stringify(props.editingEntry.lines))
      } else {
        resetForm()
        // Generate initial reference number if prefix is already set
        if (newEntryReferencePrefix.value) {
          generatedSequenceNumber.value = await generateReferenceNumber(
            newEntryReferencePrefix.value,
          )
        }
      }
    }
  },
)

watch(selectedProductFromForm, (newProductData) => {
  if (newProductData && newProductData.product) {
    const product = newProductData.product;
    const quantity = newProductData.quantity;
    const unitCost = newProductData.unitCost;

    // Find the currently active line or the last line to assign the product
    const lastLine = newEntryLines.value[newEntryLines.value.length - 1]
    if (lastLine) {
      lastLine.product_id = product.id
      lastLine.quantity = quantity
      lastLine.unit_cost = unitCost
    }
  }
})

watch(totalDebits, (newTotalDebits) => {
  fiscalOperationData.value.totalAmount = newTotalDebits;
});

watch(displayModal, (value) => {
  emit('update:visible', value)
})

onMounted(() => {
  accountStore.fetchAccounts()
  productStore.fetchProducts(1, 1000) // Fetch all products
})

watch(newEntryReferencePrefix, async (newPrefix) => {
  if (newPrefix && !props.isEditing) {
    generatedSequenceNumber.value = await generateReferenceNumber(newPrefix)
  }
})

function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0]
  newEntryDescription.value = ''
  newEntryReferencePrefix.value = ''
  newEntryStatus.value = 'draft'
  newEntryLines.value = [
    { account_id: '', type: 'debit', amount: 0 },
    { account_id: '', type: 'credit', amount: 0 },
  ]
}

async function generateReferenceNumber(prefix: string) {
  const authStore = useAuthStore()
  const organizationId = authStore.userOrganizationId
  const accountingPeriodId = authStore.userActiveAccountingPeriodId

  if (!organizationId || !accountingPeriodId) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Dados da organização ou período contábil ausentes para gerar referência.',
      life: 3000,
    })
    return 0
  }

  try {
    const response = await api.get<{ nextNumber: number }>('/generate-reference', {
      params: {
        prefix,
        organization_id: organizationId,
        accounting_period_id: accountingPeriodId,
      },
    })
    return response.nextNumber
  } catch (error) {
    console.error('Erro ao buscar o próximo número de referência:', error)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao gerar número de referência.',
      life: 3000,
    })
    return 0
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

  const authStore = useAuthStore()
  const organizationId = authStore.userOrganizationId
  const accountingPeriodId = authStore.userActiveAccountingPeriodId
  const token = authStore.token

  if (!organizationId || !accountingPeriodId || !token) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Dados da organização ou período contábil ausentes.',
      life: 3000,
    })
    return
  }

  const entryData = {
    entry_date: newEntryDate.value,
    description: newEntryDescription.value,
    reference: `${newEntryReferencePrefix.value}${generatedSequenceNumber.value}`,
    status: newEntryStatus.value,
    lines: [] as typeof newEntryLines.value,
  }

  try {
    // Process stock movements first
    for (const line of newEntryLines.value) {
      // Adicionar dados de impostos da taxData para cada linha
      type TaxKeyMap = {
        [K in keyof TaxData]: {
          rateKey: keyof EntryLine;
          valueKey: keyof EntryLine;
        };
      };

      const taxKeyMap: TaxKeyMap = {
        icms: { rateKey: 'icms_rate', valueKey: 'icms_value' },
        ipi: { rateKey: 'ipi_rate', valueKey: 'ipi_value' },
        pis: { rateKey: 'pis_rate', valueKey: 'pis_value' },
        cofins: { rateKey: 'cofins_rate', valueKey: 'cofins_value' },
        irrf: { rateKey: 'irrf_rate', valueKey: 'irrf_value' },
        csll: { rateKey: 'csll_rate', valueKey: 'csll_value' },
        inss: { rateKey: 'inss_rate', valueKey: 'inss_value' },
      };

      const taxKeys: (keyof TaxData)[] = ['icms', 'ipi', 'pis', 'cofins', 'irrf', 'csll', 'inss'];
      taxKeys.forEach(taxKey => {
        if (fiscalOperationData.value.taxData && fiscalOperationData.value.taxData[taxKey]) {
          const mapping = taxKeyMap[taxKey];
          if (mapping) {
            (line[mapping.rateKey] as number | undefined) = fiscalOperationData.value.taxData[taxKey]?.rate;
            (line[mapping.valueKey] as number | undefined) = fiscalOperationData.value.taxData[taxKey]?.amount;
          }
        }
      });

      if (line.account_id === stockAccountId.value && line.product_id && line.quantity) {
        if (line.type === 'debit') {
          // Purchase
          await recordProductPurchase(
            line.product_id,
            line.quantity,
            line.amount, // Use line.amount as unit_cost for purchase
            organizationId,
            accountingPeriodId,
          )
        } else if (line.type === 'credit') {
          // Sale
          const cogs = await calculateCogsForSale(
            line.product_id,
            line.quantity,
            organizationId,
            accountingPeriodId,
          )

          // Add the COGS entry (Debit to COGS account, Credit to Stock account)
          const cogsAccountId = accountStore.accounts.find(
            (acc) => acc.name === 'Custo da Mercadoria Vendida',
          )?.id
          if (!cogsAccountId) {
            toast.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Conta de Custo da Mercadoria Vendida não encontrada.',
              life: 3000,
            })
            return
          }

          entryData.lines.push({
            account_id: cogsAccountId,
            type: 'debit',
            amount: cogs,
          })
          entryData.lines.push({
            account_id: stockAccountId.value,
            type: 'credit',
            amount: cogs,
          })
        }
      }
      entryData.lines.push(line)
    }

    if (props.isEditing && props.editingEntry) {
      await journalEntryStore.updateEntry({
        id: props.editingEntry.id!,
        ...entryData,
      } as JournalEntry)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento atualizado com sucesso!',
        life: 3000,
      })
    } else {
      await journalEntryStore.addJournalEntry(entryData as Omit<JournalEntry, 'id'>)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento adicionado com sucesso!',
        life: 3000,
      })
    }
    resetForm()
    emit('submitSuccess')
    displayModal.value = false // Close modal on success
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 })
  }
}
</script>

<template>
  <Dialog
    v-model:visible="displayModal"
    modal
    :header="props.isEditing ? 'Editar Lançamento' : 'Adicionar Lançamento'"
    :style="{ width: '75vw' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <form @submit.prevent="submitEntry" class="space-y-4">
      <!-- Custom Tabs -->
      <div class="mb-6">
        <div class="flex space-x-2 p-1 bg-surface-100 rounded-lg">
          <button
            type="button"
            @click="activeTab = 'Básico'"
            :class="[
              'flex-1 py-2 px-4 text-center rounded-md transition-colors duration-200',
              activeTab === 'Básico'
                ? 'bg-white text-primary shadow'
                : 'bg-transparent text-surface-600 hover:bg-surface-200',
            ]"
          >
            Básico
          </button>
          <button
            type="button"
            @click="activeTab = 'Partidas'"
            :class="[
              'flex-1 py-2 px-4 text-center rounded-md transition-colors duration-200',
              activeTab === 'Partidas'
                ? 'bg-white text-primary shadow'
                : 'bg-transparent text-surface-600 hover:bg-surface-200',
            ]"
          >
            Partidas
          </button>
          <button
            type="button"
            @click="activeTab = 'Produtos'"
            :class="[
              'flex-1 py-2 px-4 text-center rounded-md transition-colors duration-200',
              activeTab === 'Produtos'
                ? 'bg-white text-primary shadow'
                : 'bg-transparent text-surface-600 hover:bg-surface-200',
            ]"
          >
            Produtos
          </button>
          <button
            type="button"
            @click="activeTab = 'Impostos'"
            :class="[
              'flex-1 py-2 px-4 text-center rounded-md transition-colors duration-200',
              activeTab === 'Impostos'
                ? 'bg-white text-primary shadow'
                : 'bg-transparent text-surface-600 hover:bg-surface-200',
            ]"
          >
            Impostos
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="p-4 border border-surface-200 rounded-lg min-h-[250px]">
        <div v-if="activeTab === 'Básico'">
          <JournalEntryBasicForm
            v-model:entryDate="newEntryDate"
            v-model:entryDescription="newEntryDescription"
            v-model:referencePrefix="newEntryReferencePrefix"
            v-model:status="newEntryStatus"
            :hasStockRelatedAccount="hasStockRelatedAccount"
          />
        </div>
        <div v-if="activeTab === 'Partidas'">
          <JournalEntryLinesForm
            v-model:entryLines="newEntryLines"
            :selectedProduct="selectedProductFromForm"
          />
        </div>
        <div v-if="activeTab === 'Produtos'">
          <JournalEntryProductForm @product-selected="selectedProductFromForm = $event" />
        </div>
        <div v-if="activeTab === 'Impostos'">
          <Imposto v-model:fiscalOperationData="fiscalOperationData" />
        </div>
      </div>

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="journalEntryStore.loading || totalDebits !== totalCredits"
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
        >
          <span class="flex items-center justify-center">
            <ProgressSpinner
              v-if="journalEntryStore.loading"
              class="w-5 h-5 mr-2"
              strokeWidth="8"
              fill="var(--surface-ground)"
              animationDuration=".5s"
              aria-label="Custom ProgressSpinner"
            />
            {{ props.isEditing ? 'Atualizar Lançamento' : 'Adicionar Lançamento' }}
          </span>
        </button>
      </div>
    </form>
  </Dialog>
</template>