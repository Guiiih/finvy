<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useAccountStore } from '@/stores/accountStore'
import { useProductStore } from '@/stores/productStore'
import type { JournalEntry, Product, JournalEntryHistory } from '@/types/index'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
  visible: boolean
  viewingEntry: JournalEntry | null
}>()

const emit = defineEmits(['update:visible', 'edit', 'duplicate', 'delete'])

const journalEntryStore = useJournalEntryStore()
const accountStore = useAccountStore()
const productStore = useProductStore()
const toast = useToast()

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const loadingAccounts = ref(true)
const loadingProducts = ref(true)
const activeTab = ref('Partidas')

const loadingHistory = ref(false)
const historyItems = ref<JournalEntryHistory[]>([])

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      activeTab.value = 'Partidas' // Reset to the first tab
      loadingAccounts.value = true
      loadingProducts.value = true
      try {
        await accountStore.fetchAccounts()
        await productStore.fetchProducts(1, 1000)
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados para visualização.',
          life: 3000,
        })
      } finally {
        loadingAccounts.value = false
        loadingProducts.value = false
      }
    }
  },
  { immediate: true },
)

watch(
  () => activeTab.value,
  async (newTab) => {
    if (newTab === 'Histórico' && props.viewingEntry) {
      loadingHistory.value = true
      historyItems.value = await journalEntryStore.fetchJournalEntryHistory(props.viewingEntry.id)
      loadingHistory.value = false
    }
  },
)

function formatCurrency(value: number | undefined | null) {
  if (value === null || typeof value === 'undefined') return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getAccountName(accountId: string): string {
  return accountStore.getAccountById(accountId)?.name || 'N/A'
}

function getProductName(productId: string): string {
  return productStore.getProductById(productId)?.name || 'Produto não encontrado'
}

function getStatusSeverity(status: string | undefined) {
  switch (status) {
    case 'draft':
      return 'info'
    case 'posted':
    case 'Lançado': // As per image
      return 'success'
    case 'reviewed':
      return 'warning'
    default:
      return 'secondary'
  }
}

const totalValue = computed(() => {
  if (!props.viewingEntry) return 0
  // Sum of all debit lines (or credit, they should be equal)
  return props.viewingEntry.lines
    .filter((line) => line.type === 'debit')
    .reduce((sum, line) => sum + line.amount, 0)
})

const productMovements = computed(() => {
  if (!props.viewingEntry) return []
  const movements: {
    product: Product
    quantity: number
    unit_cost?: number
    unit_price?: number
  }[] = []
  props.viewingEntry.lines.forEach((line) => {
    if (line.product_id && line.quantity) {
      const product = productStore.getProductById(line.product_id)
      if (product) {
        movements.push({
          product: product,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          unit_price: line.total_gross ? line.total_gross / line.quantity : undefined,
        })
      }
    }
  })
  return movements
})

const calculatedTaxes = computed(() => {
  if (!props.viewingEntry) return []
  const taxes: { type: string; amount: number; rate?: number }[] = []
  props.viewingEntry.lines.forEach((line) => {
    if (line.icms_value && line.icms_value > 0) {
      taxes.push({ type: 'ICMS', amount: line.icms_value, rate: line.icms_rate })
    }
    if (line.pis_value && line.pis_value > 0) {
      taxes.push({ type: 'PIS', amount: line.pis_value, rate: line.pis_rate })
    }
    if (line.cofins_value && line.cofins_value > 0) {
      taxes.push({ type: 'COFINS', amount: line.cofins_value, rate: line.cofins_rate })
    }
  })
  // Remove duplicates and sum amounts if necessary (though unlikely for same entry)
  const taxMap = new Map<string, { amount: number; rate?: number }>()
  taxes.forEach((tax) => {
    if (taxMap.has(tax.type)) {
      const existing = taxMap.get(tax.type)!
      existing.amount += tax.amount
    } else {
      taxMap.set(tax.type, { amount: tax.amount, rate: tax.rate })
    }
  })
  return Array.from(taxMap.entries()).map(([type, data]) => ({ type, ...data }))
})

function handleEdit() {
  if (props.viewingEntry) {
    emit('edit', props.viewingEntry)
    localVisible.value = false
  }
}

function handleDuplicate() {
  if (props.viewingEntry) {
    emit('duplicate', props.viewingEntry)
    localVisible.value = false
  }
}

async function handleDelete() {
  if (!props.viewingEntry) return
  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
    try {
      await journalEntryStore.deleteEntry(props.viewingEntry.id)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Lançamento excluído com sucesso!',
        life: 3000,
      })
      emit('delete')
      localVisible.value = false
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao excluir lançamento.',
        life: 3000,
      })
    }
  }
}

function getHistoryIcon(action: string): string {
  switch (action) {
    case 'CREATED':
      return 'pi pi-check-circle text-green-500'
    case 'STATUS_UPDATED':
      return 'pi pi-file text-blue-500'
    case 'EDITED':
      return 'pi pi-pencil text-yellow-500'
    default:
      return 'pi pi-info-circle'
  }
}

interface HistoryDetails {
  old_status?: string;
  new_status?: string;
}

function formatHistoryTitle(action: string, details: HistoryDetails): string {
  switch (action) {
    case 'CREATED':
      return 'Lançamento criado'
    case 'STATUS_UPDATED':
      return `Status alterado de "${details.old_status}" para "${details.new_status}"`
    case 'EDITED':
      return 'Lançamento editado'
    default:
      return action
  }
}
</script>

<template>
  <Dialog
    :visible="localVisible"
    @update:visible="localVisible = $event"
    modal
    :header="undefined"
    :style="{ width: '60vw' }"
    :breakpoints="{ '1200px': '70vw', '992px': '80vw', '768px': '90vw', '576px': '95vw' }"
    class="p-fluid"
  >
    <template #header>
      <div class="flex items-center">
        <i class="pi pi-file-text text-2xl mr-3 text-primary"></i>
        <div>
          <h2 class="text-xl font-bold text-surface-800">Visualizar Lançamento Contábil</h2>
          <p class="text-sm text-surface-500">Detalhes completos do lançamento selecionado</p>
        </div>
      </div>
    </template>

    <div v-if="viewingEntry" class="p-4 bg-white rounded-lg">
      <!-- Header Info -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 mb-8">
        <div>
          <label class="block text-sm font-medium text-surface-500 mb-1">Data</label>
          <p class="text-base text-surface-800">
            {{ new Date(viewingEntry.entry_date).toLocaleDateString('pt-BR') }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-500 mb-1">Referência</label>
          <p class="text-base text-surface-800 font-mono">{{ viewingEntry.reference }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-500 mb-1">Status</label>
          <Tag
            :severity="getStatusSeverity(viewingEntry.status ?? undefined)"
            :value="viewingEntry.status ? viewingEntry.status : ''"
            class="capitalize"
          ></Tag>
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-500 mb-1">Valor Total</label>
          <p class="text-base font-bold text-surface-800">{{ formatCurrency(totalValue) }}</p>
        </div>
      </div>
      <div class="mb-8">
        <label class="block text-sm font-medium text-surface-500 mb-1">Descrição</label>
        <div class="p-3 bg-surface-50 rounded-md min-h-[4rem]">
          <p class="text-base text-surface-800">{{ viewingEntry.description }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6">
        <div class="flex space-x-2 p-1 bg-surface-100 rounded-lg">
          <button
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
            @click="activeTab = 'Produto'"
            :class="[
              'flex-1 py-2 px-4 text-center rounded-md transition-colors duration-200',
              activeTab === 'Produto'
                ? 'bg-white text-primary shadow'
                : 'bg-transparent text-surface-600 hover:bg-surface-200',
            ]"
          >
            Produto
          </button>
          <button
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
          <button
            @click="activeTab = 'Histórico'"
            :class="[
              'flex-1 py-2 px-4 text-center rounded-md transition-colors duration-200',
              activeTab === 'Histórico'
                ? 'bg-white text-primary shadow'
                : 'bg-transparent text-surface-600 hover:bg-surface-200',
            ]"
          >
            Histórico
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="p-4 border border-surface-200 rounded-lg min-h-[250px]">
        <!-- Partidas Contábeis -->
        <div v-if="activeTab === 'Partidas'">
          <h3 class="text-lg font-semibold mb-4 text-surface-800">
            <i class="pi pi-list mr-2"></i>Partidas Contábeis
          </h3>
          <div v-if="loadingAccounts">
            <Skeleton height="5rem" class="mb-2"></Skeleton>
            <Skeleton height="3rem"></Skeleton>
          </div>
          <table v-else class="w-full text-sm text-left text-surface-500">
            <thead class="text-xs text-surface-700 uppercase bg-surface-50">
              <tr>
                <th scope="col" class="px-6 py-3">Conta</th>
                <th scope="col" class="px-6 py-3 text-right">Débito</th>
                <th scope="col" class="px-6 py-3 text-right">Crédito</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="line in viewingEntry.lines"
                :key="line.id"
                class="bg-white border-b last:border-b-0"
              >
                <td class="px-6 py-4">
                  <div class="font-medium text-surface-800">{{ line.account_id }}</div>
                  <div class="text-surface-500">{{ getAccountName(line.account_id) }}</div>
                </td>
                <td class="px-6 py-4 text-right font-mono text-green-600">
                  {{ line.type === 'debit' ? formatCurrency(line.amount) : '—' }}
                </td>
                <td class="px-6 py-4 text-right font-mono text-red-600">
                  {{ line.type === 'credit' ? formatCurrency(line.amount) : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Movimentação de Produto -->
        <div v-if="activeTab === 'Produto'">
          <h3 class="text-lg font-semibold mb-4 text-surface-800">
            <i class="pi pi-box mr-2"></i>Movimentação de Produto
          </h3>
          <div v-if="loadingProducts">
            <Skeleton height="5rem" class="mb-2"></Skeleton>
          </div>
          <div v-else-if="productMovements.length > 0">
            <div
              v-for="movement in productMovements"
              :key="movement.product.id"
              class="p-4 border rounded-lg"
            >
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="text-sm text-surface-500">Produto</label>
                  <p class="font-medium">{{ getProductName(movement.product.id) }}</p>
                </div>
                <div>
                  <label class="text-sm text-surface-500">Quantidade</label>
                  <p class="font-medium">{{ movement.quantity }}</p>
                </div>
                <div>
                  <label class="text-sm text-surface-500">Custo Unitário</label>
                  <p class="font-medium">{{ formatCurrency(movement.unit_cost) }}</p>
                </div>
                <div>
                  <label class="text-sm text-surface-500">Preço Unitário</label>
                  <p class="font-medium">{{ formatCurrency(movement.unit_price) }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center p-8 text-center text-surface-500">
            <i class="pi pi-box text-4xl mb-3 text-surface-400"></i>
            <p>Nenhuma movimentação de produto</p>
          </div>
        </div>

        <!-- Impostos Calculados -->
        <div v-if="activeTab === 'Impostos'">
          <h3 class="text-lg font-semibold mb-4 text-surface-800">
            <i class="pi pi-receipt mr-2"></i>Impostos Calculados
          </h3>
          <div v-if="calculatedTaxes.length > 0" class="space-y-3">
            <div
              v-for="tax in calculatedTaxes"
              :key="tax.type"
              class="flex justify-between items-center p-4 border border-surface-200 rounded-lg"
            >
              <div>
                <p class="font-semibold text-surface-800">{{ tax.type }}</p>
                <p v-if="tax.rate" class="text-sm text-surface-500">Alíquota: {{ tax.rate }}%</p>
              </div>
              <p class="font-mono text-lg text-surface-800">{{ formatCurrency(tax.amount) }}</p>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center p-8 text-center text-surface-500">
            <i class="pi pi-receipt text-4xl mb-3 text-surface-400"></i>
            <p>Nenhum imposto calculado</p>
          </div>
        </div>

        <!-- Histórico -->
        <div v-if="activeTab === 'Histórico'">
          <h3 class="text-lg font-semibold mb-4 text-surface-800">
            <i class="pi pi-history mr-2"></i>Histórico de Alterações
          </h3>
          <div v-if="loadingHistory" class="space-y-4">
            <Skeleton height="4rem" class="mb-2"></Skeleton>
            <Skeleton height="4rem"></Skeleton>
          </div>
          <div v-else-if="historyItems.length > 0" class="space-y-4">
            <div
              v-for="item in historyItems"
              :key="item.id"
              class="flex items-center p-4 rounded-lg bg-surface-50"
            >
              <i :class="['text-xl mr-4', getHistoryIcon(item.action_type)]"></i>
              <div>
                <p class="font-semibold">{{ formatHistoryTitle(item.action_type, item.details) }}</p>
                <p class="text-sm text-surface-500">
                  {{ new Date(item.changed_at).toLocaleString('pt-BR') }} - {{ item.changed_by_name || 'Sistema' }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center p-8 text-center text-surface-500">
            <i class="pi pi-history text-4xl mb-3 text-surface-400"></i>
            <p>Nenhum histórico de alterações encontrado.</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2 pt-4">
        <Button
          label="Fechar"
          icon="pi pi-times"
          @click="localVisible = false"
          class="p-button-text"
        />
        <Button
          label="Duplicar"
          icon="pi pi-copy"
          @click="handleDuplicate"
          class="p-button-outlined p-button-secondary"
        />
        <Button
          label="Excluir"
          icon="pi pi-trash"
          @click="handleDelete"
          class="p-button-danger"
        />
        <Button label="Editar" icon="pi pi-pencil" @click="handleEdit" />
      </div>
    </template>
  </Dialog>
</template>