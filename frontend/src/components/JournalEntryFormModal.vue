<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type {
  JournalEntry,
  NFeExtractedData,
  TaxSimulationResult,
} from '@/types/index'
import { useToast } from 'primevue/usetoast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

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
  unit_cost?: number // Adicionado de volta
  icms_rate?: number
  total_gross?: number
  icms_value?: number
  total_net?: number
}

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  editingEntry: JournalEntry | null
  nfeData: NFeExtractedData | null
  taxSimulationData: TaxSimulationResult | null
}>()

const emit = defineEmits(['update:visible', 'submitSuccess'])

const displayModal = ref(props.visible)
const newEntryDate = ref(new Date().toISOString().split('T')[0])
const newEntryDescription = ref('')
const newEntryLines = ref<EntryLine[]>([])

// Watch for changes in props.visible to control displayModal
watch(() => props.visible, (value) => {
  displayModal.value = value
  if (value) {
    // When modal becomes visible, initialize form based on props
    if (props.isEditing && props.editingEntry) {
      newEntryDate.value = props.editingEntry.entry_date
      newEntryDescription.value = props.editingEntry.description
      newEntryLines.value = JSON.parse(JSON.stringify(props.editingEntry.lines))
    } else if (props.nfeData) {
      handleNFeProcessed(props.nfeData)
    } else if (props.taxSimulationData) {
      handleTaxSimulationProcessed(props.taxSimulationData)
    } else {
      resetForm()
    }
  }
})

watch(displayModal, (value) => {
  emit('update:visible', value)
})

const visibleAccounts = computed(() => {
  return accountStore.accounts.filter((account) => !account.is_protected)
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
  newEntryLines.value = [
    { account_id: '', type: 'debit', amount: 0 },
    { account_id: '', type: 'credit', amount: 0 },
  ]
}

const handleNFeProcessed = (data: NFeExtractedData) => {
  newEntryDate.value = data.emission_date
  newEntryDescription.value = `Importação NF-e ${data.nfe_id} - ${data.type === 'entrada' ? 'Compra' : 'Venda'} de ${data.razao_social_emit || data.razao_social_dest}`
  newEntryLines.value = []

  // Exemplo de preenchimento de linhas com base nos dados da NF-e
  // ATENÇÃO: Substitua os IDs de conta pelos IDs reais do seu sistema!

  // Débito: Estoque / Custo de Mercadoria Vendida
  if (data.total_products > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_ESTOQUE_OU_CMV', // TODO: Substitua pelo ID da conta de estoque ou CMV real
      type: 'debit',
      amount: data.total_products,
    })
  }

  // Débito: ICMS a Recuperar (se for entrada)
  if (data.type === 'entrada' && data.total_icms > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_ICMS_A_RECUPERAR', // TODO: Substitua pelo ID da conta de ICMS a recuperar real
      type: 'debit',
      amount: data.total_icms,
    })
  }

  // Débito: IPI a Recuperar (se for entrada)
  if (data.type === 'entrada' && data.total_ipi > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_IPI_A_RECUPERAR', // TODO: Substitua pelo ID da conta de IPI a recuperar real
      type: 'debit',
      amount: data.total_ipi,
    })
  }

  // Débito: PIS a Recuperar (se for entrada)
  if (data.type === 'entrada' && data.total_pis > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_PIS_A_RECUPERAR', // TODO: Substitua pelo ID da conta de PIS a recuperar real
      type: 'debit',
      amount: data.total_pis,
    })
  }

  // Débito: COFINS a Recuperar (se for entrada)
  if (data.type === 'entrada' && data.total_cofins > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_COFINS_A_RECUPERAR', // TODO: Substitua pelo ID da conta de COFINS a recuperar real
      type: 'debit',
      amount: data.total_cofins,
    })
  }

  // Crédito: Fornecedores / Clientes
  if (data.total_nfe > 0) {
    newEntryLines.value.push({
      account_id: data.type === 'entrada' ? 'ID_CONTA_FORNECEDORES' : 'ID_CONTA_CLIENTES', // TODO: Substitua pelos IDs reais das contas de Fornecedores/Clientes
      type: 'credit',
      amount: data.total_nfe,
    })
  }

  toast.add({
    severity: 'info',
    summary: 'Dados da NF-e Carregados',
    detail: 'Formulário pré-preenchido com os dados da NF-e. Revise e finalize o lançamento.',
    life: 5000,
  })
}

const handleTaxSimulationProcessed = (result: TaxSimulationResult) => {
  newEntryDate.value = new Date().toISOString().split('T')[0] // Data atual para simulação
  newEntryDescription.value = 'Lançamento gerado por simulação de impostos'
  newEntryLines.value = []

  // Exemplo de preenchimento de linhas com base nos dados da simulação
  // ATENÇÃO: Substitua os IDs de conta pelos IDs reais do seu sistema!

  // Débito: ICMS a Recuperar / ICMS sobre Vendas
  if (result.valorICMS > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_ICMS_A_RECUPERAR_OU_SOBRE_VENDAS', // TODO: Substitua pelo ID da conta de ICMS a recuperar ou sobre vendas real
      type: 'debit',
      amount: result.valorICMS,
    })
  }

  // Débito: ICMS-ST a Recuperar / ICMS-ST sobre Vendas
  if (result.valorICMSST && result.valorICMSST > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_ICMS_ST_A_RECUPERAR_OU_SOBRE_VENDAS', // TODO: Substitua pelo ID da conta de ICMS-ST a recuperar ou sobre vendas real
      type: 'debit',
      amount: result.valorICMSST,
    })
  }

  // Débito: PIS a Recuperar / PIS sobre Vendas
  if (result.valorPIS > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_PIS_A_RECUPERAR_OU_SOBRE_VENDAS', // TODO: Substitua pelo ID da conta de PIS a recuperar ou sobre vendas real
      type: 'debit',
      amount: result.valorPIS,
    })
  }

  // Débito: COFINS a Recuperar / COFINS sobre Vendas
  if (result.valorCOFINS > 0) {
    newEntryLines.value.push({
      account_id: 'ID_CONTA_COFINS_A_RECUPERAR_OU_SOBRE_VENDAS', // TODO: Substitua pelo ID da conta de COFINS a recuperar ou sobre vendas real
      type: 'debit',
      amount: result.valorCOFINS,
    })
  }

  // Crédito: Receita de Vendas / Custo de Aquisição
  // Este é um exemplo simplificado. A lógica real dependerá do tipo de operação (compra/venda)
  // e de como você quer que o valor total da operação seja refletido.
  newEntryLines.value.push({
    account_id: 'ID_CONTA_RECEITA_OU_CUSTO', // TODO: Substitua pelo ID da conta de Receita de Vendas ou Custo de Aquisição real
    type: 'credit',
    amount: result.baseCalculoICMS, // Ou outro valor relevante da simulação
  })

  toast.add({
    severity: 'info',
    summary: 'Dados da Simulação Carregados',
    detail: 'Formulário pré-preenchido com os dados da simulação. Revise e finalize o lançamento.',
    life: 5000,
  })
}

function addLine() {
  newEntryLines.value.push({ account_id: '', type: 'debit', amount: 0 })
}

function removeLine(index: number) {
  newEntryLines.value.splice(index, 1)
}

import { recordProductPurchase, calculateCogsForSale } from '@/services/productApiService'
import { useAuthStore } from '@/stores/authStore'

// ... (rest of the script)

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
    lines: [] as typeof newEntryLines.value,
  }

  try {
    // Process stock movements first
    for (const line of newEntryLines.value) {
      if (line.account_id === stockAccountId.value && line.product_id && line.quantity) {
        if (line.type === 'debit') { // Purchase
          if (!line.unit_cost) {
            toast.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Custo unitário é obrigatório para compras de estoque.',
              life: 3000,
            })
            return
          }
          await recordProductPurchase(
            line.product_id,
            line.quantity,
            line.unit_cost,
            organizationId,
            accountingPeriodId,
          )
          // Add the original line to the entry data
          entryData.lines.push(line)
        } else if (line.type === 'credit') { // Sale
          const cogs = await calculateCogsForSale(
            line.product_id,
            line.quantity,
            organizationId,
            accountingPeriodId,
          )

          // Add the original sale line (e.g., Credit to Stock, Debit to Accounts Receivable)
          entryData.lines.push(line)

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
      } else {
        // For non-stock related lines, just add them to the entry data
        entryData.lines.push(line)
      }
    }

    if (props.isEditing && props.editingEntry) {
      await journalEntryStore.updateEntry({ id: props.editingEntry.id!, ...entryData })
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
    <div class="p-6 rounded-lg shadow-inner mb-6">
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
              :class="line.account_id === stockAccountId ? 'md:col-span-4' : 'md:col-span-5'" 
              class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="" disabled>Selecione a Conta</option>
              <optgroup v-for="type in accountStore.accountTypes" :label="type" :key="type">
                <option
                  v-for="account in visibleAccounts.filter((acc) => acc.type === type)"
                  :value="account.id"
                  :key="account.id"
                >
                  {{ account.name }}
                </option>
              </optgroup>
            </select>
              <template v-if="line.account_id === stockAccountId">
                <select
                  v-model="line.product_id"
                  class="md:col-span-3 p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" 
                >
                  <option value="" disabled>Selecione o Produto</option>
                  <option v-for="product in productStore.products" :value="product.id" :key="product.id">
                    {{ product.name }}
                  </option>
                </select>
                <input
                  type="number"
                  v-model.number="line.quantity"
                  placeholder="Quantidade"
                  min="0"
                  class="md:col-span-2 p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  v-if="line.type === 'debit'"
                  type="number"
                  v-model.number="line.unit_cost"
                  placeholder="Custo Unit."
                  step="0.01"
                  min="0"
                  class="md:col-span-2 p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </template>
                <select
                  v-model="line.type"
                  required
                  :class="line.account_id === stockAccountId ? 'md:col-span-2' : 'md:col-span-2'"
                  class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" 
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
                  :class="line.account_id === stockAccountId ? 'md:col-span-2' : 'md:col-span-4'"
                  class="p-3 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400" 
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
    </div>
  </Dialog>
</template>
