<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type {
  Product as StoreProduct,
  StockMovement as StoreStockMovement,
  CostingMethod,
} from '@/types'

import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Skeleton from 'primevue/skeleton'

// STORES
const productStore = useProductStore()

// LOCAL STATE
const allStockMovements = ref<StoreStockMovement[]>([])
const loadingData = ref(true)

// LIFECYCLE
onMounted(async () => {
  loadingData.value = true
  // Fetch all products
  await productStore.fetchProducts({ itemsPerPage: 1000 }) // Assuming max 1000 products

  // Fetch movements for each product.
  // NOTE: This is inefficient and makes N+1 requests.
  // A better long-term solution is a dedicated backend endpoint to fetch all movements at once.
  const allMovements: StoreStockMovement[] = []
  for (const product of productStore.products) {
    await productStore.fetchStockMovements(product.id)
    allMovements.push(...productStore.movements)
  }
  allStockMovements.value = allMovements
  loadingData.value = false
})

// DATA FROM STORES
const products = computed(() => productStore.products as StoreProduct[])
const stockMovements = computed(() => allStockMovements.value)

const productOptions = computed(() => {
  const options = products.value.map((p) => ({ label: p.name, value: p.id }))
  options.unshift({ label: 'Todos os produtos', value: 'all' })
  return options
})

const methodOptions = computed(() => {
  const options: { label: string; value: CostingMethod | 'all' }[] = costingMethods.map((m) => ({
    label: m.label,
    value: m.value,
  }))
  options.unshift({ label: 'Todos os métodos', value: 'all' })
  return options
})

// COMPONENT STATE
const loading = ref(false)
const searchTerm = ref('')
const selectedProduct = ref('all')
const selectedType = ref('all')
const selectedPeriod = ref('all')
const selectedMethod = ref<'all' | CostingMethod>('all')
const activeTab = ref('movements')
const showDetailModal = ref(false)
const showSummaryModal = ref(false)
const showMethodModal = ref(false)
const showAnalysisModal = ref(false)
const selectedMovement = ref<StoreStockMovement | null>(null)
const editingProductId = ref<string | null>(null)

// STATIC DATA
const costingMethods = [
  {
    value: 'fifo' as CostingMethod,
    label: 'PEPS (FIFO)',
    description: 'Primeiro a Entrar, Primeiro a Sair',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'lifo' as CostingMethod,
    label: 'UEPS (LIFO)',
    description: 'Último a Entrar, Primeiro a Sair',
    color: 'bg-green-100 text-green-800',
  },
  {
    value: 'average' as CostingMethod,
    label: 'Custo Médio',
    description: 'Média Ponderada',
    color: 'bg-purple-100 text-purple-800',
  },
]

const movementTypes = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venda' },
  { value: 'adjustment', label: 'Ajuste' },
]

const periods = [
  { value: 'all', label: 'Todo o período' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'quarter', label: 'Este trimestre' },
]

// LOGIC
const getProductEntries = (productId: string) => {
  return stockMovements.value
    .filter((m: StoreStockMovement) => m.product_id === productId && m.movement_type === 'purchase')
    .sort(
      (a: StoreStockMovement, b: StoreStockMovement) =>
        new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime(),
    )
}

const getProductValueByMethod = (productId: string, method: CostingMethod): number => {
  const product = products.value.find((p) => p.id === productId)
  if (!product || product.quantity_in_stock === 0) return 0

  const entries = getProductEntries(productId)
  let stock = product.quantity_in_stock
  let value = 0

  if (method === 'average') {
    return product.quantity_in_stock * (product.avg_cost || 0)
  }

  if (method === 'fifo') {
    for (const entry of entries) {
      if (stock === 0) break
      const qtyToTake = Math.min(stock, entry.quantity)
      value += qtyToTake * (entry.unit_cost || 0)
      stock -= qtyToTake
    }
  }

  if (method === 'lifo') {
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]
      if (stock === 0) break
      const qtyToTake = Math.min(stock, entry.quantity)
      value += qtyToTake * (entry.unit_cost || 0)
      stock -= qtyToTake
    }
  }

  return value
}

const getTotalInventoryValue = computed(() => {
  return products.value.reduce((total, product) => {
    return total + getProductValueByMethod(product.id, product.costing_method || 'average')
  }, 0)
})

const getInventoryValueByMethod = (method: CostingMethod) => {
  return products.value.reduce((total, product) => {
    return total + getProductValueByMethod(product.id, method)
  }, 0)
}

const getCostingMethodSummary = computed(() => {
  const summary = {
    fifo: { count: 0, value: 0, products: [] as string[] },
    lifo: { count: 0, value: 0, products: [] as string[] },
    average: { count: 0, value: 0, products: [] as string[] },
  }

  products.value.forEach((p) => {
    if (p.quantity_in_stock > 0) {
      const method = p.costing_method || 'average'
      summary[method].count++
      summary[method].value += getProductValueByMethod(p.id, method)
      summary[method].products.push(p.name)
    }
  })

  return summary
})

// FILTERED DATA
const filteredMovements = computed(() => {
  if (!stockMovements.value) return []
  return stockMovements.value.filter((movement: StoreStockMovement) => {
    const product = products.value.find((p) => p.id === movement.product_id)
    const productName = product?.name || ''
    const productSku = product?.sku || ''

    const searchTermLower = searchTerm.value.toLowerCase()
    const matchesSearch =
      productName.toLowerCase().includes(searchTermLower) ||
      productSku.toLowerCase().includes(searchTermLower) ||
      (movement.reason || '').toLowerCase().includes(searchTermLower)
    const matchesProduct =
      selectedProduct.value === 'all' || movement.product_id === selectedProduct.value
    const matchesType =
      selectedType.value === 'all' || movement.movement_type === selectedType.value
    const matchesMethod =
      selectedMethod.value === 'all' || product?.costing_method === selectedMethod.value

    let matchesPeriod = true
    if (selectedPeriod.value !== 'all') {
      const movementDate = new Date(movement.movement_date)
      const now = new Date()

      switch (selectedPeriod.value) {
        case 'today':
          matchesPeriod = movementDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesPeriod = movementDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesPeriod = movementDate >= monthAgo
          break
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          matchesPeriod = movementDate >= quarterAgo
          break
      }
    }

    return matchesSearch && matchesProduct && matchesType && matchesPeriod && matchesMethod
  })
})

// STATISTICS
const totalMovements = computed(() => stockMovements.value?.length || 0)
const entryMovements = computed(
  () =>
    stockMovements.value?.filter((m: StoreStockMovement) => m.movement_type === 'purchase')
      .length || 0,
)
const exitMovements = computed(
  () =>
    stockMovements.value?.filter((m: StoreStockMovement) => m.movement_type === 'sale').length || 0,
)

const criticalProducts = computed(() => products.value.filter((p) => p.quantity_in_stock <= 0))
const lowStockProductsList = computed(() =>
  products.value.filter(
    (p) => p.quantity_in_stock > 0 && p.quantity_in_stock <= (p.min_stock || 0),
  ),
)
const mostMovedProducts = computed(() => {
  if (!stockMovements.value) return []
  const movementCounts = stockMovements.value.reduce(
    (acc: Record<string, number>, m: StoreStockMovement) => {
      acc[m.product_id] = (acc[m.product_id] || 0) + 1
      return acc
    },
    {},
  )

  return products.value
    .map((p) => ({ ...p, movementCount: movementCounts[p.id] || 0 }))
    .filter((p) => p.movementCount > 0)
    .sort((a, b) => b.movementCount - a.movementCount)
    .slice(0, 5)
})

// METHODS
const openMovementDetail = (movement: StoreStockMovement) => {
  selectedMovement.value = movement
  showDetailModal.value = true
}

const openAnalysis = () => {
  showAnalysisModal.value = true
}
const openMethodManagement = () => {
  showMethodModal.value = true
}
const openSummary = () => {
  showSummaryModal.value = true
}

const handleUpdateCostingMethod = async (productId: string, method: CostingMethod) => {
  loading.value = true
  await productStore.updateProduct(productId, { costing_method: method })
  loading.value = false
  editingProductId.value = null
  const product = products.value.find((p) => p.id === productId)
  const methodLabel = costingMethods.find((m) => m.value === method)?.label
  alert(`Método de custeio do produto "${product?.name}" alterado para ${methodLabel}`)
}

// HELPERS
const getMovementTypeColor = (type: string) => {
  switch (type) {
    case 'purchase':
      return 'bg-green-100 text-green-800'
    case 'sale':
      return 'bg-red-100 text-red-800'
    case 'adjustment':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-surface-100 text-surface-800'
  }
}

const getCostingMethodInfo = (method?: CostingMethod) => {
  if (!method) return costingMethods.find((m) => m.value === 'average')
  return costingMethods.find((m) => m.value === method)
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const getProductName = (productId: string) =>
  products.value.find((p) => p.id === productId)?.name || 'N/A'
const getProductSku = (productId: string) =>
  products.value.find((p) => p.id === productId)?.sku || 'N/A'
</script>

<template>
  <main class="max-w-7xl mx-auto">
    <div v-if="loadingData">
      <!-- SKELETON LOADER -->
      <div class="space-y-8 p-4">
        <!-- Costing Methods Skeleton -->
        <div class="border border-surface-200 rounded-lg bg-primary-0">
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <Skeleton width="20rem" height="1.5rem" class="mb-2"></Skeleton>
                <Skeleton width="15rem" height="1rem"></Skeleton>
              </div>
              <div class="flex gap-2">
                <Skeleton shape="circle" size="2.5rem"></Skeleton>
                <Skeleton shape="circle" size="2.5rem"></Skeleton>
              </div>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="i in 3" :key="i" class="border border-surface-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <Skeleton width="8rem" height="1.5rem"></Skeleton>
                  <Skeleton width="6rem" height="1.5rem" borderRadius="16px"></Skeleton>
                </div>
                <Skeleton width="10rem" height="2rem" class="mb-2"></Skeleton>
                <Skeleton width="12rem" height="1rem" class="mb-4"></Skeleton>
                <div class="border-t border-surface-100 pt-2">
                  <Skeleton width="100%" height="3rem"></Skeleton>
                </div>
              </div>
            </div>
            <div class="mt-4 p-4 bg-surface-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <Skeleton width="12rem" height="1.25rem" class="mb-1"></Skeleton>
                  <Skeleton width="18rem" height="1rem"></Skeleton>
                </div>
                <Skeleton width="8rem" height="1.5rem"></Skeleton>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Skeleton -->
        <div class="space-y-6">
          <Skeleton width="100%" height="3rem" borderRadius="9999px"></Skeleton>

          <!-- Movements Tab Skeleton -->
          <div class="space-y-6">
            <!-- Filters Skeleton -->
            <div class="flex flex-col sm:flex-row gap-4">
              <Skeleton width="100%" height="2.5rem" borderRadius="6px"></Skeleton>
              <Skeleton width="12rem" height="2.5rem" borderRadius="6px"></Skeleton>
              <Skeleton width="12rem" height="2.5rem" borderRadius="6px"></Skeleton>
              <Skeleton width="12rem" height="2.5rem" borderRadius="6px"></Skeleton>
              <Skeleton width="12rem" height="2.5rem" borderRadius="6px"></Skeleton>
              <Skeleton shape="circle" size="2.5rem"></Skeleton>
            </div>

            <!-- Table Skeleton -->
            <div class="border border-surface-200 rounded-lg bg-primary-0">
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead class="bg-surface-50">
                    <tr>
                      <th v-for="i in 9" :key="i" class="px-6 py-3">
                        <Skeleton width="6rem" height="1rem"></Skeleton>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="i in 10" :key="i" class="hover:bg-surface-50">
                      <td class="px-6 py-4"><Skeleton width="100%" height="1.5rem"></Skeleton></td>
                      <td class="px-6 py-4"><Skeleton width="100%" height="1.5rem"></Skeleton></td>
                      <td class="px-6 py-4"><Skeleton shape="circle" size="2rem"></Skeleton></td>
                      <td class="px-6 py-4">
                        <Skeleton width="6rem" height="1.5rem" borderRadius="16px"></Skeleton>
                      </td>
                      <td class="px-6 py-4"><Skeleton width="100%" height="1.5rem"></Skeleton></td>
                      <td class="px-6 py-4"><Skeleton width="100%" height="1.5rem"></Skeleton></td>
                      <td class="px-6 py-4"><Skeleton width="100%" height="1.5rem"></Skeleton></td>
                      <td class="px-6 py-4"><Skeleton width="100%" height="1.5rem"></Skeleton></td>
                      <td class="px-6 py-4"><Skeleton shape="circle" size="2rem"></Skeleton></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <!-- Costing Methods Overview -->
      <div class="mb-8 border border-surface-200 rounded-lg bg-primary-0">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold flex items-center gap-2">
                Métodos de Custeio por Produto
              </h2>
              <p class="text-sm text-surface-500">
                Cada produto pode usar um método de custeio específico
              </p>
            </div>
            <div class="flex gap-2">
              <Button
                @click="openSummary"
                icon="pi pi-chart-bar"
                class="px-4 py-2 text-sm font-medium border border-surface-200 rounded-md flex items-center gap-2 hover:bg-surface-50"
                size="small"
              />
              <Button
                @click="openMethodManagement"
                icon="pi pi-cog"
                class="px-4 py-2 text-sm font-medium border border-surface-200 rounded-md flex items-center gap-2 hover:bg-surface-50"
                size="small"
              />
            </div>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="method in costingMethods"
              :key="method.value"
              class="border border-surface-200 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold">{{ method.label }}</h3>
                </div>
                <span :class="[method.color, 'px-2 py-0.5 text-sm font-medium rounded-full']">
                  {{ getCostingMethodSummary[method.value].count }} produtos
                </span>
              </div>
              <div class="mt-4">
                <div class="text-sm font-bold">
                  {{ formatCurrency(getCostingMethodSummary[method.value].value) }}
                </div>
                <div class="text-sm text-surface-500">
                  {{ method.description }}
                </div>
                <div class="flex gap-4 mt-2 pt-2 border-t border-surface-100">
                  <!-- New section for Produtos Ativos -->
                  <div class="w-1/2">
                    <div class="text-xs tsext-surface-500">
                      Produtos Ativos: {{ products.length }}
                    </div>
                    <div class="text-xs text-surface-500">
                      {{ products.filter((p) => p.is_active).length }} ativos
                    </div>
                  </div>
                  <!-- New section for Total de Movimentações -->
                  <div class="w-1/2">
                    <div class="text-xs text-surface-500">
                      Total de Movimentações: {{ totalMovements }}
                    </div>
                    <div class="text-xs text-surface-500">
                      {{ entryMovements }} entradas, {{ exitMovements }} saídas
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-surface-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Valor Total do Inventário</div>
                <div class="text-sm text-surface-500">
                  Calculado usando método específico de cada produto
                </div>
              </div>
              <div class="text-sm font-bold">
                {{ formatCurrency(getTotalInventoryValue) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->

      <!-- Tabs -->
      <div class="space-y-6">
        <div class="bg-surface-200 rounded-full p-1 flex">
          <button
            @click="activeTab = 'movements'"
            :class="[
              'flex-1 text-center py-2 px-4 rounded-full text-sm font-medium',
              activeTab === 'movements'
                ? 'bg-surface-950'
                : 'text-surface-500 hover:text-surface-700',
            ]"
          >
            Movimentações
          </button>
          <button
            @click="activeTab = 'products'"
            :class="[
              'flex-1 text-center py-2 px-4 rounded-full text-sm font-medium',
              activeTab === 'products'
                ? 'bg-surface-950'
                : 'text-surface-500 hover:text-surface-700',
            ]"
          >
            Produtos e Métodos
          </button>
          <button
            @click="activeTab = 'alerts'"
            :class="[
              'flex-1 text-center py-2 px-4 rounded-full text-sm font-medium',
              activeTab === 'alerts' ? 'bg-surface-950' : 'text-surface-500 hover:text-surface-700',
            ]"
          >
            Alertas
          </button>
        </div>

        <!-- Movements Tab -->
        <div v-if="activeTab === 'movements'" class="space-y-6">
          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
              <i
                class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400"
              ></i>
              <input
                v-model="searchTerm"
                placeholder="Buscar por produto, SKU ou descrição..."
                class="w-full pl-10 pr-4 py-1 border border-surface-200 rounded-md"
              />
            </div>

            <Select
              v-model="selectedProduct"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              size="small"
            />

            <Select
              v-model="selectedType"
              :options="movementTypes"
              optionLabel="label"
              optionValue="value"
              size="small"
            />

            <Select
              v-model="selectedMethod"
              :options="methodOptions"
              optionLabel="label"
              optionValue="value"
              size="small"
            />

            <Select
              v-model="selectedPeriod"
              :options="periods"
              optionLabel="label"
              optionValue="value"
              size="small"
            />

            <Button
              @click="openAnalysis"
              icon="pi pi-chart-bar"
              class="px-4 py-2 text-sm font-medium border border-surface-200 rounded-md flex items-center gap-2 hover:bg-surface-50"
              size="small"
            />
          </div>

          <!-- Movements Table -->
          <div class="border border-surface-200 rounded-lg bg-primary-0">
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-surface-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Data
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Produto
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Método
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Tipo
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Quantidade
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Custo Unit.
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Custo Total
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Usuário
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-primary-0">
                  <tr
                    v-for="movement in filteredMovements.sort(
                      (a, b) =>
                        new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime(),
                    )"
                    :key="movement.id"
                    class="hover:bg-surface-50"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-xs">
                        {{ new Date(movement.movement_date).toLocaleDateString('pt-BR') }}
                      </div>
                      <div class="text-xs text-surface-500">{{ movement.reference_id }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-xs">
                        {{ getProductName(movement.product_id) }}
                      </div>
                      <div class="text-xs text-surface-500 font-mono">
                        {{ getProductSku(movement.product_id) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          getCostingMethodInfo(
                            products.find((p) => p.id === movement.product_id)?.costing_method,
                          )?.color,
                          'px-2 inline-flex text-sm leading-5 font-semibold rounded-full',
                        ]"
                      >
                        {{
                          getCostingMethodInfo(
                            products.find((p) => p.id === movement.product_id)?.costing_method,
                          )?.label.split(' ')[0]
                        }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          getMovementTypeColor(movement.movement_type),
                          'px-2 inline-flex text-sm leading-5 font-semibold rounded-full items-center gap-1',
                        ]"
                      >
                        {{
                          movement.movement_type.charAt(0).toUpperCase() +
                          movement.movement_type.slice(1)
                        }}
                      </span>
                    </td>
                    <td
                      class="px-6 py-4 whitespace-nowrap text-xs"
                      :class="
                        movement.movement_type === 'purchase' ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ movement.movement_type === 'purchase' ? '+' : '-' }}{{ movement.quantity }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      {{ formatCurrency(movement.unit_cost) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      {{ formatCurrency((movement.unit_cost || 0) * movement.quantity) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-xs text-surface-500">
                      {{ movement.created_by }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button
                        @click="openMovementDetail(movement)"
                        class="p-1 text-surface-500 hover:text-surface-800"
                      >
                        <i class="pi pi-eye"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Products Tab -->
        <div v-if="activeTab === 'products'" class="space-y-6">
          <div class="border border-surface-200 rounded-lg bg-primary-0">
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-surface-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Produto
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Categoria
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Estoque
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Método Atual
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Valor PEPS
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Valor UEPS
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Valor Médio
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Valor Atual
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-primary-0">
                  <tr
                    v-for="product in products.filter((p) => p.quantity_in_stock > 0)"
                    :key="product.id"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-xs">{{ product.name }}</div>
                      <div class="text-sm text-surface-500">{{ product.sku }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-surface-100 text-surface-800"
                        >{{ product.category }}</span
                      >
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {{ product.quantity_in_stock }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          getCostingMethodInfo(product.costing_method)?.color,
                          'px-2 inline-flex text-sm leading-5 font-semibold rounded-full',
                        ]"
                      >
                        {{ getCostingMethodInfo(product.costing_method)?.label }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {{ formatCurrency(getProductValueByMethod(product.id, 'fifo')) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {{ formatCurrency(getProductValueByMethod(product.id, 'lifo')) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {{ formatCurrency(getProductValueByMethod(product.id, 'average')) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">
                      {{
                        formatCurrency(
                          getProductValueByMethod(product.id, product.costing_method || 'average'),
                        )
                      }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button
                        v-if="editingProductId !== product.id"
                        @click="editingProductId = product.id"
                        :disabled="loading"
                        class="p-1 text-surface-500 hover:text-surface-800 disabled:opacity-50"
                      >
                        <i class="pi pi-pencil"></i>
                      </button>
                      <Select
                        v-else
                        v-model="product.costing_method"
                        :options="costingMethods"
                        optionLabel="label"
                        optionValue="value"
                        @update:modelValue="handleUpdateCostingMethod(product.id, $event)"
                        :disabled="loading"
                        size="small"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div v-if="activeTab === 'alerts'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="border border-surface-200 rounded-lg bg-primary-0">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-red-600">Produtos Sem Estoque</h3>
                <p class="text-sm text-surface-500">Produtos que precisam de reposição urgente</p>
              </div>
              <div class="p-6">
                <div v-if="criticalProducts.length === 0" class="text-center py-6 text-surface-500">
                  <i class="pi pi-check-circle text-5xl mx-auto mb-2 text-green-500"></i>
                  <p>Nenhum produto sem estoque</p>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="product in criticalProducts"
                    :key="product.id"
                    class="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                  >
                    <div>
                      <div class="font-medium text-red-800">{{ product.name }}</div>
                      <div class="text-sm text-red-600 flex items-center gap-2">
                        <span>{{ product.sku }}</span>
                      </div>
                    </div>
                    <span
                      class="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800"
                      >Estoque: {{ product.quantity_in_stock }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="border border-surface-200 rounded-lg bg-primary-0">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-yellow-600">Estoque Baixo</h3>
                <p class="text-sm text-surface-500">Produtos próximos ao estoque mínimo</p>
              </div>
              <div class="p-6">
                <div
                  v-if="lowStockProductsList.length === 0"
                  class="text-center py-6 text-surface-500"
                >
                  <i class="pi pi-check-circle text-5xl mx-auto mb-2 text-green-500"></i>
                  <p>Todos os produtos com estoque adequado</p>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="product in lowStockProductsList"
                    :key="product.id"
                    class="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50"
                  >
                    <div>
                      <div class="font-medium text-yellow-800">{{ product.name }}</div>
                      <div class="text-sm text-yellow-600">
                        <span>{{ product.sku }} • Mín: {{ product.min_stock }}</span>
                      </div>
                    </div>
                    <span
                      class="px-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800"
                      >Estoque: {{ product.quantity_in_stock }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border border-surface-200 rounded-lg bg-primary-0">
            <div class="p-6">
              <h3 class="text-lg font-semibold">Recomendações de Compra</h3>
              <p class="text-sm text-surface-500">
                Sugestões baseadas no método de custeio específico de cada produto
              </p>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div
                  v-for="product in [...criticalProducts, ...lowStockProductsList].slice(0, 5)"
                  :key="product.id"
                  class="flex items-center justify-between p-4 border border-surface-200 rounded-lg"
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="w-3 h-3 rounded-full"
                      :class="product.quantity_in_stock <= 0 ? 'bg-red-500' : 'bg-yellow-500'"
                    ></div>
                    <div>
                      <div class="font-medium flex items-center gap-2">{{ product.name }}</div>
                      <div class="text-sm text-surface-500">
                        Estoque atual: {{ product.quantity_in_stock }} • Mínimo:
                        {{ product.min_stock }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium">
                      Comprar:
                      {{
                        Math.max(
                          (product.max_stock || 0) - product.quantity_in_stock,
                          (product.min_stock || 0) * 2,
                        )
                      }}
                      unidades
                    </div>
                    <div class="text-sm text-surface-500">
                      Custo estimado:
                      {{
                        formatCurrency(
                          Math.max(
                            (product.max_stock || 0) - product.quantity_in_stock,
                            (product.min_stock || 0) * 2,
                          ) * (product.avg_cost || 0),
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <Dialog
        v-model:visible="showSummaryModal"
        modal
        header="Resumo dos Métodos de Custeio"
        :style="{ width: '50vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      >
        <template #header>
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-surface-900">Resumo dos Métodos de Custeio</h3>
            <p class="text-sm text-surface-500">
              Análise consolidada dos métodos utilizados por produto
            </p>
          </div>
        </template>
        <div class="p-6 space-y-6 flex-grow bg-surface-50">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="method in costingMethods"
              :key="method.value"
              class="bg-primary-0 border border-surface-200 rounded-lg p-4 space-y-3"
            >
              <div class="flex items-center gap-2">
                <i
                  v-if="method.value === 'fifo'"
                  class="pi pi-sort-amount-down-alt text-surface-600"
                ></i>
                <i
                  v-if="method.value === 'lifo'"
                  class="pi pi-sort-amount-up-alt text-surface-600"
                ></i>
                <i v-if="method.value === 'average'" class="pi pi-calculator text-surface-600"></i>
                <h4 class="font-semibold text-surface-800">{{ method.label }}</h4>
              </div>
              <p class="text-sm text-surface-500">{{ method.description }}</p>
              <div class="text-2xl font-bold text-surface-900">
                {{ formatCurrency(getCostingMethodSummary[method.value].value) }}
              </div>
              <div class="text-sm text-surface-500">
                {{
                  getTotalInventoryValue > 0
                    ? (
                        (getCostingMethodSummary[method.value].value / getTotalInventoryValue) *
                        100
                      ).toFixed(1)
                    : '0.0'
                }}% do inventário total
              </div>
              <div>
                <div class="w-full bg-surface-200 rounded-full h-1.5">
                  <div
                    class="bg-surface-400 h-1.5 rounded-full"
                    :style="{
                      width:
                        products.length > 0
                          ? (getCostingMethodSummary[method.value].count / products.length) * 100 +
                            '%'
                          : '0%',
                    }"
                  ></div>
                </div>
                <div class="flex justify-between text-sm mt-1">
                  <span class="text-surface-600">Produtos usando este método</span>
                  <span class="font-medium text-surface-800">{{
                    getCostingMethodSummary[method.value].count
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Comparison Impact -->
          <div class="bg-primary-0 border border-surface-200 rounded-lg">
            <div class="p-4">
              <h4 class="font-semibold text-surface-800">Impacto da Individualização</h4>
            </div>
            <div class="p-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 class="text-sm text-surface-600">Se todos usassem PEPS:</h5>
                <div class="text-sm font-bold text-blue-600">
                  {{ formatCurrency(getInventoryValueByMethod('fifo')) }}
                </div>
                <div class="text-sm text-surface-500">
                  Diferença:
                  {{ formatCurrency(getInventoryValueByMethod('fifo') - getTotalInventoryValue) }}
                </div>
              </div>
              <div>
                <h5 class="text-sm text-surface-600">Se todos usassem UEPS:</h5>
                <div class="text-sm font-bold text-green-600">
                  {{ formatCurrency(getInventoryValueByMethod('lifo')) }}
                </div>
                <div class="text-sm text-surface-500">
                  Diferença:
                  {{ formatCurrency(getInventoryValueByMethod('lifo') - getTotalInventoryValue) }}
                </div>
              </div>
              <div>
                <h5 class="text-sm text-surface-600">Se todos usassem Médio:</h5>
                <div class="text-sm font-bold text-purple-600">
                  {{ formatCurrency(getInventoryValueByMethod('average')) }}
                </div>
                <div class="text-sm text-surface-500">
                  Diferença:
                  {{
                    formatCurrency(getInventoryValueByMethod('average') - getTotalInventoryValue)
                  }}
                </div>
              </div>
            </div>
          </div>
          <!-- Recommendations -->
          <div class="bg-primary-0 border border-surface-200 rounded-lg">
            <div class="p-4">
              <h4 class="font-semibold text-surface-800">Recomendações por Categoria</h4>
            </div>
            <div class="p-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-sort-alt text-blue-600"></i>
                  <span class="font-semibold text-blue-900">PEPS (FIFO)</span>
                </div>
                <div class="text-sm text-blue-800 space-y-1">
                  <div class="font-bold">Recomendado para:</div>
                  <ul class="list-disc list-inside">
                    <li>Produtos tecnológicos</li>
                    <li>Itens com obsolescência</li>
                    <li>Produtos perecíveis</li>
                  </ul>
                </div>
              </div>
              <div class="p-4 rounded-lg bg-green-50 border border-green-200">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-sort-alt-slash text-green-600"></i>
                  <span class="font-semibold text-green-900">UEPS (LIFO)</span>
                </div>
                <div class="text-sm text-green-800 space-y-1">
                  <div class="font-bold">Recomendado para:</div>
                  <ul class="list-disc list-inside">
                    <li>Commodities</li>
                    <li>Produtos não perecíveis</li>
                    <li>Mercado em deflação</li>
                  </ul>
                </div>
              </div>
              <div class="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-calculator text-purple-600"></i>
                  <span class="font-semibold text-purple-900">Custo Médio</span>
                </div>
                <div class="text-sm text-purple-800 space-y-1">
                  <div class="font-bold">Recomendado para:</div>
                  <ul class="list-disc list-inside">
                    <li>Produtos similares</li>
                    <li>Materiais fungíveis</li>
                    <li>Simplicidade operacional</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <Button
            @click="showSummaryModal = false"
            label="Fechar"
            class="px-4 py-2 text-sm font-medium border rounded-md bg-surface-800 text-white hover:bg-surface-700"
            size="small"
          />
        </template>
      </Dialog>

      <!-- Movement Detail Modal -->
      <Dialog
        v-model:visible="showDetailModal"
        modal
        header="Detalhes da Movimentação"
        :style="{ width: '50vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      >
        <template #header>
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-surface-900">Detalhes da Movimentação</h3>
            <p class="text-sm text-surface-500">Informações completas sobre a movimentação</p>
          </div>
        </template>
        <div v-if="selectedMovement" class="p-6 space-y-4 flex-grow">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Data</label>
              <p class="text-sm mt-1">
                {{ new Date(selectedMovement?.movement_date).toLocaleDateString('pt-BR') }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium">Referência</label>
              <p class="text-sm mt-1 font-mono">{{ selectedMovement?.reference_id }}</p>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Produto</label>
            <div class="mt-1">
              <p class="text-sm font-medium">{{ getProductName(selectedMovement?.product_id) }}</p>
              <p class="text-sm text-surface-500">
                {{ getProductSku(selectedMovement?.product_id) }}
              </p>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Método de Custeio Usado</label>
            <div class="mt-1">
              <span
                :class="[
                  getCostingMethodInfo(
                    products.find((p) => p.id === selectedMovement?.product_id)?.costing_method,
                  )?.color,
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                ]"
              >
                {{
                  getCostingMethodInfo(
                    products.find((p) => p.id === selectedMovement?.product_id)?.costing_method,
                  )?.label
                }}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Quantidade</label>
              <p
                class="text-sm mt-1 font-medium"
                :class="
                  selectedMovement?.movement_type === 'purchase' ? 'text-green-600' : 'text-red-600'
                "
              >
                {{ selectedMovement?.movement_type === 'purchase' ? '+' : '-'
                }}{{ selectedMovement?.quantity }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium">Custo Unitário</label>
              <p class="text-sm mt-1 font-mono">
                {{ formatCurrency(selectedMovement?.unit_cost) }}
              </p>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium">Motivo</label>
            <p class="text-sm mt-1">{{ selectedMovement?.reason }}</p>
          </div>
          <div>
            <label class="text-sm font-medium">Usuário</label>
            <p class="text-sm mt-1">{{ selectedMovement?.created_by }}</p>
          </div>
        </div>
        <template #footer>
          <button
            @click="showDetailModal = false"
            class="px-4 py-2 text-sm font-medium border rounded-md bg-surface-800 text-white hover:bg-surface-700"
          >
            Fechar
          </button>
        </template>
      </Dialog>

      <!-- Method Management Modal -->
      <Dialog
        v-model:visible="showMethodModal"
        modal
        header="Gerenciar Métodos de Custeio"
        :style="{ width: '50vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      >
        <template #header>
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-surface-900">Gerenciar Métodos de Custeio</h3>
            <p class="text-sm text-surface-500">
              Configure o método de custeio para cada produto individualmente
            </p>
          </div>
        </template>
        <div class="p-6 flex-grow">
          <div class="border border-surface-200 rounded-lg overflow-hidden">
            <table class="min-w-full">
              <thead class="bg-surface-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Produto
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Categoria
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Método Atual
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody class="bg-primary-0">
                <tr v-for="product in products" :key="product.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-sm">{{ product.name }}</div>
                    <div class="text-sm text-surface-500">{{ product.sku }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-surface-100 text-surface-800"
                      >{{ product.category }}</span
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        getCostingMethodInfo(product.costing_method)?.color,
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      ]"
                    >
                      {{ getCostingMethodInfo(product.costing_method)?.label }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <Select
                      v-model="product.costing_method"
                      :options="costingMethods"
                      optionLabel="label"
                      optionValue="value"
                      @update:modelValue="handleUpdateCostingMethod(product.id, $event)"
                      :disabled="loading"
                      size="small"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <template #footer>
          <button
            @click="showMethodModal = false"
            class="px-4 py-2 text-sm font-medium border rounded-md bg-surface-800 text-white hover:bg-surface-700"
          >
            Fechar
          </button>
        </template>
      </Dialog>

      <!-- Analysis Modal -->
      <Dialog
        v-model:visible="showAnalysisModal"
        modal
        header="Análise de Movimentações por Método"
        :style="{ width: '50vw' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      >
        <template #header>
          <div class="flex flex-col">
            <h3 class="text-sm font-bold text-surface-900">Análise de Movimentações por Método</h3>
            <p class="text-sm text-surface-500">
              Estatísticas considerando métodos individualizados por produto
            </p>
          </div>
        </template>
        <div class="p-6 space-y-6 flex-grow bg-surface-50">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-primary-0 p-4 rounded-lg border border-surface-200">
              <h4 class="text-sm text-surface-500">Total de Entradas</h4>
              <p class="text-sm font-bold text-green-600">{{ entryMovements }}</p>
              <p class="text-sm text-surface-500">
                {{
                  stockMovements
                    .filter((m: StoreStockMovement) => m.movement_type === 'purchase')
                    .reduce((sum: number, m: StoreStockMovement) => sum + m.quantity, 0)
                }}
                unidades
              </p>
            </div>
            <div class="bg-primary-0 p-4 rounded-lg border border-surface-200">
              <h4 class="text-sm text-surface-500">Total de Saídas</h4>
              <p class="text-sm font-bold text-red-600">{{ exitMovements }}</p>
              <p class="text-sm text-surface-500">
                {{
                  stockMovements
                    .filter((m: StoreStockMovement) => m.movement_type === 'sale')
                    .reduce((sum: number, m: StoreStockMovement) => sum + m.quantity, 0)
                }}
                unidades
              </p>
            </div>
            <div class="bg-primary-0 p-4 rounded-lg border border-surface-200">
              <h4 class="text-sm text-surface-500">Métodos Utilizados</h4>
              <p class="text-sm font-bold">{{ costingMethods.length }}</p>
              <p class="text-sm text-surface-500">Diferentes métodos</p>
            </div>
            <div class="bg-primary-0 p-4 rounded-lg border border-surface-200">
              <h4 class="text-sm text-surface-500">Valor Total</h4>
              <p class="text-sm font-bold">{{ formatCurrency(getTotalInventoryValue) }}</p>
              <p class="text-sm text-surface-500">Métodos individuais</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-primary-0 p-6 rounded-lg border">
              <h4 class="text-sm font-semibold mb-4">Distribuição por Método</h4>
              <div class="space-y-4">
                <div v-for="method in costingMethods" :key="method.value">
                  <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">{{ method.label }}</span>
                    </div>
                    <span class="text-sm text-surface-600"
                      >{{ getCostingMethodSummary[method.value].count }} produtos</span
                    >
                  </div>
                  <div class="w-full bg-surface-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="
                        method.value === 'fifo'
                          ? 'bg-blue-500'
                          : method.value === 'lifo'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                      "
                      :style="{
                        width:
                          products.length > 0
                            ? (getCostingMethodSummary[method.value].count / products.length) *
                                100 +
                              '%'
                            : '0%',
                      }"
                    ></div>
                  </div>
                  <div class="text-sm text-surface-500 text-right mt-1">
                    {{ formatCurrency(getCostingMethodSummary[method.value].value) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-primary-0 p-6 rounded-lg border">
              <h4 class="text-sm font-semibold mb-4">Produtos Mais Movimentados</h4>
              <div class="space-y-4">
                <div
                  v-for="(product, index) in mostMovedProducts"
                  :key="product.id"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex items-center justify-center w-6 h-6 rounded-full bg-surface-200 text-surface-700 text-xs font-bold"
                    >
                      {{ index + 1 }}
                    </div>
                    <div>
                      <div class="text-sm font-medium">{{ product.name }}</div>
                      <div class="text-sm text-surface-500">{{ product.sku }}</div>
                    </div>
                  </div>
                  <div class="text-sm font-bold">{{ product.movementCount }} mov.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <button
            @click="showAnalysisModal = false"
            class="px-4 py-2 text-sm font-medium border rounded-md bg-surface-800 text-white hover:bg-surface-700"
          >
            Fechar
          </button>
        </template>
      </Dialog>
    </div>
  </main>
</template>
