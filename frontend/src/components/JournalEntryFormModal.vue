<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type {
  JournalEntry,
  Product,
} from '@/types/index'
import { useAuthStore } from '@/stores/authStore'
import { recordProductPurchase, calculateCogsForSale } from '@/services/productApiService'
import { api } from '@/services/api'
import { useToast } from 'primevue/usetoast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Imposto from '@/components/Imposto.vue'
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
  icms_rate?: number
  total_gross?: number
  icms_value?: number
  total_net?: number
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
const activeTab = ref(0)
const selectedProductFromForm = ref<Product | null>(null)

// Watch for changes in props.visible to control displayModal
      watch(() => props.visible, async (value) => {
  displayModal.value = value
  if (value) {
    // When modal becomes visible, initialize form based on props
    if (props.isEditing && props.editingEntry) {
      newEntryDate.value = props.editingEntry.entry_date
      newEntryDescription.value = props.editingEntry.description
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
        generatedSequenceNumber.value = await generateReferenceNumber(newEntryReferencePrefix.value)
      }
    }
  }
})

watch(selectedProductFromForm, (newProduct) => {
  if (newProduct) {
    // Find the currently active line or the last line to assign the product
    const lastLine = newEntryLines.value[newEntryLines.value.length - 1]
    if (lastLine) {
      lastLine.product_id = newProduct.id
      // Optionally, set quantity to 1 if it's a new product assignment
      if (!lastLine.quantity) {
        lastLine.quantity = 1
      }
    }
  }
})

watch(displayModal, (value) => {
  emit('update:visible', value)
})

onMounted(() => {
  accountStore.fetchAccounts()
  productStore.fetchProducts(1, 1000) // Fetch all products
})

const stockAccountId = computed(() => {
  return accountStore.accounts.find(acc => acc.name === 'Estoques')?.id
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

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function resetForm() {
  newEntryDate.value = new Date().toISOString().split('T')[0]
  newEntryDescription.value = ''
  newEntryReferencePrefix.value = ''
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

watch(newEntryReferencePrefix, async (newPrefix) => {
  if (newPrefix && !props.isEditing) {
    generatedSequenceNumber.value = await generateReferenceNumber(newPrefix)
  }
})

watch(() => props.visible, async (value) => {
  displayModal.value = value
  if (value) {
    // When modal becomes visible, initialize form based on props
    if (props.isEditing && props.editingEntry) {
      newEntryDate.value = props.editingEntry.entry_date
      newEntryDescription.value = props.editingEntry.description
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
        generatedSequenceNumber.value = await generateReferenceNumber(newEntryReferencePrefix.value)
      }
    }
  }
})

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
    lines: [] as typeof newEntryLines.value,
  }

  try {
    // Process stock movements first
    for (const line of newEntryLines.value) {
      if (line.account_id === stockAccountId.value && line.product_id && line.quantity) {
        if (line.type === 'debit') { // Purchase
          await recordProductPurchase(
            line.product_id,
            line.quantity,
            line.amount, // Use line.amount as unit_cost for purchase
            organizationId,
            accountingPeriodId,
          )
        } else if (line.type === 'credit') { // Sale
          const cogs = await calculateCogsForSale(
            line.product_id,
            line.quantity,
            organizationId,
            accountingPeriodId,
          )

          // Add the COGS entry (Debit to COGS account, Credit to Stock account)
          const cogsAccountId = accountStore.accounts.find(acc => acc.name === 'Custo da Mercadoria Vendida')?.id
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
      await journalEntryStore.updateEntry({ id: props.editingEntry.id!, ...entryData } as JournalEntry)
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
        <TabView v-model:activeIndex="activeTab">
        <TabPanel header="Básico" :value="0">
          <JournalEntryBasicForm
            v-model:entryDate="newEntryDate"
            v-model:entryDescription="newEntryDescription"
            v-model:referencePrefix="newEntryReferencePrefix"
          />
        </TabPanel>
        <TabPanel header="Partidas" :value="1">
          <JournalEntryLinesForm v-model:entryLines="newEntryLines" :selectedProduct="selectedProductFromForm" />
        </TabPanel>
        <TabPanel header="Produtos" :value="2">
          <JournalEntryProductForm @product-selected="selectedProductFromForm = $event" />
        </TabPanel>
        <TabPanel header="Impostos" :value="3">
          <Imposto />
        </TabPanel>
      </TabView>

      <div
        class="p-4 rounded-lg flex flex-col sm:flex-row justify-around items-center space-y-2 sm:space-y-0"
      >
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