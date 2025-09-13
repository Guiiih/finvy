<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { Product, CostingMethod } from '@/types'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Import PrimeVue components
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import ProductAnalyticsModal from '@/components/product/ProductAnalyticsModal.vue'
import ProductImportModal from '@/components/product/ProductImportModal.vue'
import ProductExportModal from '@/components/product/ProductExportModal.vue'
import ConfirmDialog from 'primevue/confirmdialog'
import Skeleton from 'primevue/skeleton'
import Checkbox from 'primevue/checkbox'
import OverlayPanel from 'primevue/overlaypanel'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import ProductFormModal from '@/components/product/ProductFormModal.vue'

// --- SETUP ---
const productStore = useProductStore()
const toast = useToast()
const confirm = useConfirm()
const accountingPeriodStore = useAccountingPeriodStore()

// --- STATE ---
const searchTerm = ref('')
const selectedStatus = ref('all')
const selectedProducts = ref<string[]>([])

const currentPage = ref(1)
const itemsPerPage = ref(10)

// Modals visibility
const showAddEditModal = ref(false)
const showDetailModal = ref(false)
const showAnalyticsModal = ref(false)

const showImportModal = ref(false)
const showExportModal = ref(false)
const showBulkEditModal = ref(false)

const opStatus = ref<InstanceType<typeof OverlayPanel> | undefined>()

const toggleStatusFilter = (event: Event) => {
  opStatus.value?.toggle(event)
}

const applyStatusFilter = (status: string) => {
  selectedStatus.value = status
  opStatus.value?.hide()
}

// Bulk Edit Refs
const bulkEditCategory = ref(false)
const bulkEditCategoryValue = ref('')
const bulkEditStatus = ref(false)
const bulkEditStatusValue = ref(null)
const bulkEditCostingMethod = ref(false)
const bulkEditCostingMethodValue = ref(null)
const bulkEditMinStock = ref(false)
const bulkEditMinStockValue = ref(0)
const bulkEditPriceAdjust = ref(false)
const bulkEditPriceAdjustType = ref(null)
const bulkEditPriceAdjustValue = ref(0)

const isEditing = ref(false)
const selectedProduct = ref<Product | null>(null)
const productToEdit = ref<Product | null>(null)

const initialProductForm: Product = {
  id: '',
  name: '',
  sku: '',
  ncm: '',
  category: '',
  brand: '',
  description: '',
  unit_type: 'Unidade',
  unit_price: 0,
  min_stock: 10,
  max_stock: 100,
  is_active: true,
  costing_method: 'average',
  last_cost: 0,
  avg_cost: 0,
  supplier: '',
  weight: 0,
  dimensions: '',
  location: '',
  quantity_in_stock: 0,
}

// --- DATA ---
const categories = computed(() =>
  (productStore.analytics?.valueByCategory.map((c) => c.name) || []).filter(
    (name): name is string => !!name,
  ),
)
const unitTypes = computed(() =>
  [...new Set(productStore.products.map((p) => p.unit_type))].filter(
    (unit): unit is string => !!unit,
  ),
)
const costingMethods = [
  { value: 'fifo' as CostingMethod, label: 'PEPS (FIFO)' },
  { value: 'lifo' as CostingMethod, label: 'UEPS (LIFO)' },
  { value: 'average' as CostingMethod, label: 'Custo Médio' },
]
const statusOptions = [
  { label: 'Ativo', value: true },
  { label: 'Inativo', value: false },
]

const statusOptionsForFilter = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
]

// --- COMPUTED ---
const analyticsData = computed(() => productStore.analytics)

const totalProducts = computed<number>(() => productStore.totalProducts)
const activeProducts = computed<number>(
  () => productStore.products.filter((p) => p.is_active).length,
)
const lowStockProducts = computed<number>(
  () => productStore.products.filter((p) => p.quantity_in_stock <= (p.min_stock ?? 0)).length,
)
const outOfStockProducts = computed<number>(
  () => productStore.products.filter((p) => p.quantity_in_stock <= 0).length,
)
// Dummy usage to satisfy vue-tsc
console.log(outOfStockProducts.value)
const totalInventoryValue = computed<number>(() =>
  productStore.products.reduce((sum, p) => sum + p.quantity_in_stock * (p.avg_cost ?? 0), 0),
)

const displayedCategoriesCount = computed(() => {
  const displayedCategories = new Set(productStore.products.map((p) => p.category))
  return displayedCategories.size
})

// --- WATCHERS ---
watch([searchTerm, selectedStatus], () => {
  productStore.fetchProducts({
    searchTerm: searchTerm.value,
    status: selectedStatus.value === 'all' ? undefined : selectedStatus.value,
  })
})

// --- METHODS ---
onMounted(async () => {
  await accountingPeriodStore.fetchAccountingPeriods()
  productStore.fetchProducts({})
  productStore.fetchAnalytics()
})

const openAddModal = () => {
  isEditing.value = false
  productToEdit.value = { ...initialProductForm }
  showAddEditModal.value = true
}

const openEditModal = (product: Product) => {
  isEditing.value = true
  productToEdit.value = { ...product }
  showAddEditModal.value = true
}

const openDetailModal = (product: Product) => {
  selectedProduct.value = product
  productStore.fetchStockMovements(product.id)
  showDetailModal.value = true
}

const handleDelete = (product: Product) => {
  confirm.require({
    message: `Tem certeza que deseja remover o produto "${product.name}"? Esta ação não pode ser desfeita.`,
    header: 'Remover Produto',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remover',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await productStore.deleteProduct(product.id)
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Produto removido com sucesso!',
          life: 3000,
        })
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível remover o produto.',
          life: 3000,
        })
      }
    },
  })
}

const handleFormSubmit = async (productData: Product) => {
  try {
    if (isEditing.value) {
      await productStore.updateProduct(productData.id, productData)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto atualizado com sucesso!',
        life: 3000,
      })
    } else {
      await productStore.addProduct(productData)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto criado com sucesso!',
        life: 3000,
      })
    }
    showAddEditModal.value = false
    productToEdit.value = null
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao salvar produto.',
      life: 3000,
    })
  }
}

const handleStartImport = () => {
  showImportModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Sucesso',
    detail: 'Importação iniciada! Você será notificado quando concluída.',
    life: 3000,
  })
}

const handleExport = (options: { format: string; scope: string }) => {
  console.log('Exporting with options:', options) // Placeholder for actual export logic
  showExportModal.value = false
  toast.add({
    severity: 'success',
    summary: 'Sucesso',
    detail: 'Exportação iniciada! Você receberá o arquivo em breve.',
    life: 3000,
  })
}

const getStockStatus = (product: Product) => {
  if (!product.quantity_in_stock || product.quantity_in_stock <= 0)
    return { label: 'Sem estoque', severity: 'danger' }
  if (product.min_stock && product.quantity_in_stock <= product.min_stock)
    return { label: 'Estoque baixo', severity: 'warning' }
  if (product.max_stock && product.quantity_in_stock >= product.max_stock)
    return { label: 'Estoque alto', severity: 'info' }
  return { label: 'Normal', severity: 'success' }
}

const getStockProgress = (product: Product) => {
  if (!product.max_stock || product.max_stock === 0) return 0
  return Math.min((product.quantity_in_stock / product.max_stock) * 100, 100)
}

const formatCurrency = (value: number | undefined) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function handleSelectAll(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedProducts.value = productStore.products.map((product) => product.id) // Select all product IDs
  } else {
    selectedProducts.value = [] // Deselect all
  }
}

function handleSelectEntry(id: string, checked: boolean) {
  if (checked) {
    selectedProducts.value.push(id) // Add product ID
  } else {
    selectedProducts.value = selectedProducts.value.filter((productId) => productId !== id) // Filter by product ID
  }
}

function onPageChange(event: { page: number; first: number; rows: number; pageCount?: number }) {
  currentPage.value = event.page + 1
  itemsPerPage.value = event.rows
  productStore.fetchProducts({
    page: currentPage.value,
    itemsPerPage: itemsPerPage.value,
    searchTerm: searchTerm.value,
    status: selectedStatus.value === 'all' ? undefined : selectedStatus.value,
  })
}
</script>

<template>
  <main class="max-w-7xl mx-auto">
    <!-- Bulk Actions Bar -->
    <div
      v-if="selectedProducts.length > 0"
      class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6"
    >
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-blue-900">
          {{ selectedProducts.length }} produto(s) selecionado(s)
        </span>
      </div>
      <div class="flex gap-2">
        <Button
          label="Edição em Lote"
          icon="pi pi-pencil"
          severity="secondary"
          @click="showBulkEditModal = true"
        />
        <Button label="Limpar Seleção" severity="secondary" text @click="selectedProducts = []" />
      </div>
    </div>

    <!-- Filters and Actions -->
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <div class="relative flex-1">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Busque um produto"
          class="w-full rounded-lg border border-surface-300 py-1 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-zinc-950 placeholder:text-sm"
        />
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 transform text-surface-400"
          style="font-size: 15px"
        ></i>
      </div>
      <Button
        icon="pi pi-filter"
        @click="toggleStatusFilter"
        severity="secondary"
        aria-haspopup="true"
        aria-controls="overlay_panel_status"
        size="small"
      />
      <OverlayPanel ref="opStatus" id="overlay_panel_status" style="min-width: 250px">
        <div class="flex flex-col space-y-2 p-4">
          <div
            v-for="status in statusOptionsForFilter"
            :key="status.value"
            class="flex cursor-pointer items-center justify-between p-2 hover:bg-surface-100"
            @click="applyStatusFilter(status.value)"
          >
            <span>{{ status.label }}</span>
            <i v-if="selectedStatus === status.value" class="pi pi-check text-surface-500"></i>
          </div>
        </div>
      </OverlayPanel>

      <Button
        icon="pi pi-info-circle"
        @click="showAnalyticsModal = true"
        severity="secondary"
        size="small"
      />
      <div class="md:hidden">
        <Button icon="pi pi-plus" @click="openAddModal" size="small" title="Novo Produto" />
      </div>
      <div class="hidden md:inline-block">
        <Button label="Novo Produto" @click="openAddModal" size="small" />
      </div>
    </div>

    <!-- Products Table -->
    <div class="products-table-container">
      <div class="overflow-hidden">
        <!-- Custom Header -->

        <div
          class="hidden md:grid grid-cols-12 gap-4 p-4 font-bold text-surface-400 border border-surface-200 uppercase text-sm"
        >
          <div class="col-span-2 flex items-center">
            <Checkbox
              :binary="true"
              :modelValue="
                selectedProducts.length === productStore.products.length &&
                productStore.products.length > 0
              "
              @change="handleSelectAll"
            />
            <span class="ml-3">Produto</span>
          </div>
          <div class="col-span-2">Categoria</div>
          <div class="col-span-2">Estoque</div>
          <div class="col-span-2">Preços</div>
          <div class="col-span-1">Margem</div>
          <div class="col-span-1 text-center">Status</div>
          <div class="col-span-2 text-center">Ações</div>
        </div>

        <!-- Loading Skeleton / No products found / Error -->
        <div v-if="productStore.loading" class="p-4 space-y-4">
          <!-- Skeletons for loading state -->
          <div
            v-for="i in 10"
            :key="i"
            class="grid grid-cols-1 md:grid-cols-12 gap-4 p-2 items-center"
          >
            <div class="md:col-span-2 flex items-center">
              <Skeleton shape="square" size="1.25rem" class="mr-3" />
              <Skeleton height="0.75rem" width="70%" />
            </div>
            <div class="md:col-span-2"><Skeleton height="0.75rem" width="90%" /></div>
            <div class="md:col-span-2"><Skeleton height="0.75rem" width="95%" /></div>
            <div class="md:col-span-2"><Skeleton height="0.75rem" width="60%" /></div>
            <div class="md:col-span-1 flex justify-center items-center">
              <Skeleton shape="circle" size="1rem" />
            </div>
            <div class="md:col-span-1 flex justify-center items-center">
              <Skeleton shape="circle" size="1rem" />
            </div>
            <div class="md:col-span-2 flex justify-center items-center">
              <Skeleton shape="circle" size="1rem" />
            </div>
          </div>
        </div>
        <p v-else-if="productStore.products.length === 0" class="text-surface-400 text-center p-8">
          Nenhum produto encontrado.
        </p>

        <!-- Product Rows -->
        <div v-else>
          <div
            v-for="product in productStore.products"
            :key="product.id"
            class="border-b border-surface-200 last:border-b-0"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-surface-50 transition cursor-pointer"
              @click="openDetailModal(product)"
            >
              <div class="col-span-full md:col-span-2 flex items-center">
                <Checkbox
                  :binary="true"
                  :modelValue="selectedProducts.includes(product.id)"
                  @update:modelValue="(checked) => handleSelectEntry(product.id, checked)"
                  @click.stop
                />
                <span class="ml-3 font-medium text-lg md:text-base">{{ product.name }}</span>
              </div>

              <div class="col-span-full md:col-span-2 flex justify-between items-center text-sm">
                <span class="font-bold text-surface-500 md:hidden">Categoria</span>
                <Tag :value="product.category"></Tag>
              </div>

              <div class="col-span-full md:col-span-2">
                <div class="flex justify-between items-center md:block">
                  <span class="font-bold text-surface-500 md:hidden">Estoque</span>
                  <div class="space-y-1 text-right md:text-left">
                    <div class="flex items-center gap-2 justify-end md:justify-start">
                      <span class="font-medium"
                        >{{ product.quantity_in_stock }} {{ product.unit_type }}</span
                      >
                      <Tag
                        :value="getStockStatus(product).label"
                        :severity="getStockStatus(product).severity"
                      ></Tag>
                    </div>
                    <ProgressBar
                      :value="getStockProgress(product)"
                      :showValue="false"
                      style="height: 6px"
                    ></ProgressBar>
                    <div class="text-xs text-surface-500">
                      Min: {{ product.min_stock }} | Max: {{ product.max_stock }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-span-full md:col-span-2 flex justify-between items-center text-sm">
                <span class="font-bold text-surface-500 md:hidden">Preços</span>
                <div class="space-y-1 text-right">
                  <div>Custo: {{ formatCurrency(product.avg_cost) }}</div>
                  <div>Venda: {{ formatCurrency(product.unit_price) }}</div>
                </div>
              </div>

              <div class="col-span-full md:col-span-1 flex justify-between items-center text-sm">
                <span class="font-bold text-surface-500 md:hidden">Margem</span>
                <span
                  v-if="product.unit_price && product.avg_cost"
                  :class="
                    product.unit_price - product.avg_cost > 0 ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{
                    (((product.unit_price - product.avg_cost) / product.unit_price) * 100).toFixed(
                      1,
                    )
                  }}%
                </span>
              </div>

              <div class="col-span-full md:col-span-1 flex justify-between items-center text-sm">
                <span class="font-bold text-surface-500 md:hidden">Status</span>
                <Tag
                  :value="product.is_active ? 'Ativo' : 'Inativo'"
                  :severity="product.is_active ? 'success' : 'secondary'"
                ></Tag>
              </div>

              <div
                class="col-span-full md:col-span-2 flex justify-center items-center pt-4 md:pt-0 border-t md:border-none border-surface-200"
              >
                <Button icon="pi pi-eye" text rounded @click.stop="openDetailModal(product)" />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="warning"
                  @click.stop="openEditModal(product)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  @click.stop="handleDelete(product)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Added closing div for overflow-hidden -->
      <!-- Paginator can be added here if totalRecords is provided by the store -->
    </div>
    <!-- End of products-table-container -->

    <Paginator
      v-if="productStore.totalProducts > itemsPerPage"
      :rows="itemsPerPage"
      :totalRecords="productStore.totalProducts"
      :rowsPerPageOptions="[10, 20, 50]"
      @page="onPageChange"
      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      class="mt-6"
    ></Paginator>

    <!-- Add/Edit Product Modal -->
    <ProductFormModal
      v-model:visible="showAddEditModal"
      :is-editing="isEditing"
      :initial-data="productToEdit"
      :loading="productStore.loading"
      :categories="categories"
      :unit-types="unitTypes"
      :costing-methods="costingMethods"
      :status-options="statusOptions"
      @submit="handleFormSubmit"
      @click:import="showImportModal = true"
    />

    <!-- Product Detail Modal -->
    <Dialog
      v-model:visible="showDetailModal"
      header="Detalhes do Produto"
      :modal="true"
      class="w-full max-w-4xl"
    >
      <div v-if="selectedProduct" class="p-4">
        <h4 class="text-lg font-bold mb-4">Visão Geral</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div>
            <label class="font-bold">Nome</label>
            <p>{{ selectedProduct.name }}</p>
          </div>
          <div>
            <label class="font-bold">SKU</label>
            <p>{{ selectedProduct.sku }}</p>
          </div>
          <div>
            <label class="font-bold">Categoria</label>
            <p><Tag :value="selectedProduct.category"></Tag></p>
          </div>
          <div>
            <label class="font-bold">Marca</label>
            <p>{{ selectedProduct.brand }}</p>
          </div>
        </div>
        <div class="py-4">
          <label class="font-bold">Descrição</label>
          <p class="p-3 bg-surface-50 rounded mt-2">
            {{ selectedProduct.description || 'Sem descrição' }}
          </p>
        </div>

        <h4 class="text-lg font-bold mb-4 mt-8">Estoque</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div class="text-center p-4 border rounded-lg">
            <!-- Replaced Card with div -->
            <i class="pi pi-box text-2xl text-blue-500"></i>
            <div class="text-2xl font-bold">{{ selectedProduct.quantity_in_stock }}</div>
            <div class="text-sm text-surface-500">Estoque Atual</div>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <!-- Replaced Card with div -->
            <i class="pi pi-exclamation-triangle text-2xl text-yellow-500"></i>
            <div class="text-2xl font-bold">{{ selectedProduct.min_stock }}</div>
            <div class="text-sm text-surface-500">Estoque Mínimo</div>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <!-- Replaced Card with div -->
            <i class="pi pi-bullseye text-2xl text-green-500"></i>
            <div class="text-2xl font-bold">{{ selectedProduct.max_stock }}</div>
            <div class="text-sm text-surface-500">Estoque Máximo</div>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <!-- Replaced Card with div -->
            <i class="pi pi-inbox text-2xl text-purple-500"></i>
            <div class="text-2xl font-bold">
              <span v-if="selectedProduct.avg_cost">{{
                formatCurrency(selectedProduct.quantity_in_stock * selectedProduct.avg_cost)
              }}</span>
            </div>
            <div class="text-sm text-surface-500">Valor em Estoque</div>
          </div>
        </div>

        <h4 class="text-lg font-bold mb-4 mt-8">Histórico</h4>
        <div class="overflow-x-auto">
          <!-- Added for scrollable table -->
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tipo
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quantidade
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Custo Unit.
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="productStore.loading">
                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center">Carregando...</td>
              </tr>
              <tr v-else-if="productStore.movements.length === 0">
                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center">
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
              <tr v-else v-for="data in productStore.movements" :key="data.id">
                <td class="px-6 py-4 whitespace-nowrap">{{ data.movement_date }}</td>
                <td class="px-6 py-4 whitespace-nowrap"><Tag :value="data.movement_type"></Tag></td>
                <td class="px-6 py-4 whitespace-nowrap">{{ data.quantity }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ formatCurrency(data.unit_cost) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ data.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Dialog>

    <ProductAnalyticsModal
      v-model:visible="showAnalyticsModal"
      :analytics-data="analyticsData"
      :total-products="totalProducts"
      :total-inventory-value="totalInventoryValue"
      :low-stock-products="lowStockProducts"
      :out-of-stock-products="outOfStockProducts"
      :format-currency="formatCurrency"
      @export="showExportModal = true"
    />

    <ConfirmDialog></ConfirmDialog>

    <!-- Bulk Edit Modal -->
    <Dialog
      v-model:visible="showBulkEditModal"
      header="Edição em Lote"
      :modal="true"
      class="w-full max-w-2xl"
    >
      <div class="space-y-6 p-4">
        <div class="space-y-4">
          <h4 class="font-medium">Campos a Alterar</h4>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkCategory" v-model="bulkEditCategory" :binary="true" />
                <label for="bulkCategory">Categoria</label>
              </div>
              <Select
                v-model="bulkEditCategoryValue"
                :options="categories"
                placeholder="Selecionar categoria"
                :disabled="!bulkEditCategory"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkStatus" v-model="bulkEditStatus" :binary="true" />
                <label for="bulkStatus">Status</label>
              </div>
              <Select
                v-model="bulkEditStatusValue"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecionar status"
                :disabled="!bulkEditStatus"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox
                  inputId="bulkCostingMethod"
                  v-model="bulkEditCostingMethod"
                  :binary="true"
                />
                <label for="bulkCostingMethod">Método de Custeio</label>
              </div>
              <Select
                v-model="bulkEditCostingMethodValue"
                :options="costingMethods"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecionar método"
                :disabled="!bulkEditCostingMethod"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkMinStock" v-model="bulkEditMinStock" :binary="true" />
                <label for="bulkMinStock">Estoque Mínimo</label>
              </div>
              <InputNumber
                v-model="bulkEditMinStockValue"
                inputId="bulkMinStockValue"
                placeholder="0"
                :disabled="!bulkEditMinStock"
              />
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="font-medium">Ajuste de Preços</h4>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkPriceAdjust" v-model="bulkEditPriceAdjust" :binary="true" />
                <label for="bulkPriceAdjust">Ajustar Preços</label>
              </div>
              <Select
                v-model="bulkEditPriceAdjustType"
                :options="[
                  { label: 'Percentual', value: 'percentage' },
                  { label: 'Valor fixo', value: 'fixed' },
                  { label: 'Por margem', value: 'margin' },
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="Tipo de ajuste"
                :disabled="!bulkEditPriceAdjust"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label>Valor do Ajuste</label>
              <InputNumber
                v-model="bulkEditPriceAdjustValue"
                inputId="bulkPriceAdjustValue"
                placeholder="0"
                :disabled="!bulkEditPriceAdjust"
              />
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-exclamation-triangle text-yellow-600"></i>
            <span class="font-medium text-yellow-900">Atenção</span>
          </div>
          <p class="text-sm text-yellow-800">
            As alterações serão aplicadas a todos os {{ selectedProducts.length }} produtos
            selecionados. Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showBulkEditModal = false" />
        <Button
          label="Aplicar Alterações"
          @click="
            () => {
              showBulkEditModal = false
              selectedProducts = []
              toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: `${selectedProducts.length} produtos foram atualizados em lote!`,
                life: 3000,
              })
            }
          "
        />
      </template>
    </Dialog>

    <ProductImportModal v-model:visible="showImportModal" @start-import="handleStartImport" />

    <ProductExportModal
      v-model:visible="showExportModal"
      :selected-products-count="selectedProducts.length"
      :filtered-products-count="productStore.products.length"
      :total-products="totalProducts"
      :active-products="activeProducts"
      :low-stock-products="lowStockProducts"
      :total-inventory-value="totalInventoryValue"
      :format-currency="formatCurrency"
      :categories-count="displayedCategoriesCount"
      @export="handleExport"
    />
  </main>
</template>
