<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { Product, CostingMethod } from '@/types'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Import PrimeVue components
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Chart from 'primevue/chart'
import ConfirmDialog from 'primevue/confirmdialog'
import Skeleton from 'primevue/skeleton'
import Checkbox from 'primevue/checkbox'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'


// --- SETUP ---
const productStore = useProductStore()
const toast = useToast()
const confirm = useConfirm()
const accountingPeriodStore = useAccountingPeriodStore()

// --- STATE ---
const searchTerm = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('all')
const selectedProducts = ref<string[]>([])

const currentPage = ref(1)
const itemsPerPage = ref(10)

// Modals visibility
const showAddEditModal = ref(false)
const showDetailModal = ref(false)
const showAnalyticsModal = ref(false)
const activeAnalyticsTab = ref('visaoGeral')
const showImportModal = ref(false)
const showExportModal = ref(false)
const showBulkEditModal = ref(false)

const exportFormat = ref('excel')
const exportScope = ref('filtered')

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
const productForm = ref<Product>({ ...initialProductForm })

// --- DATA ---
const categories = [
  'Informática',
  'Impressoras',
  'Periféricos',
  'Mobiliário',
  'Serviços',
  'Materiais',
  'Equipamentos',
];
const unitTypes = ['Unidade', 'Kg', 'g', 'L', 'mL', 'm', 'cm', 'm²', 'm³', 'Pacote', 'Caixa', 'Par'];
const costingMethods = [
    { value: 'fifo' as CostingMethod, label: 'PEPS (FIFO)' },
    { value: 'lifo' as CostingMethod, label: 'UEPS (LIFO)' },
    { value: 'average' as CostingMethod, label: 'Custo Médio' }
];
const statusOptions = [
    { label: 'Ativo', value: true },
    { label: 'Inativo', value: false }
];

// --- COMPUTED ---
const profitMargin = computed(() => {
  if (productForm.value.unit_price && productForm.value.unit_price > 0) {
    const cost = productForm.value.avg_cost || 0
    return ((productForm.value.unit_price - cost) / productForm.value.unit_price) * 100
  }
  return 0
})

const analyticsData = computed(() => productStore.analytics)

const totalProducts = computed<number>(() => productStore.products.length)
const activeProducts = computed<number>(() => productStore.products.filter(p => p.is_active).length)
const lowStockProducts = computed<number>(() => productStore.products.filter(p => p.quantity_in_stock <= (p.min_stock ?? 0)).length)
const outOfStockProducts = computed<number>(() => productStore.products.filter(p => p.quantity_in_stock <= 0).length)
// Dummy usage to satisfy vue-tsc
console.log(outOfStockProducts.value)
const totalInventoryValue = computed<number>(() => productStore.products.reduce((sum, p) => sum + (p.quantity_in_stock * (p.avg_cost ?? 0)), 0))

// --- WATCHERS ---
watch([searchTerm, selectedCategory, selectedStatus], () => {
  productStore.fetchProducts({
    searchTerm: searchTerm.value,
    category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
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
  productForm.value = { ...initialProductForm }
  showAddEditModal.value = true
}

const openEditModal = (product: Product) => {
  isEditing.value = true
  productForm.value = { ...product }
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

const handleFormSubmit = async () => {
  try {
    if (isEditing.value) {
      await productStore.updateProduct(productForm.value.id, productForm.value)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto atualizado com sucesso!',
        life: 3000,
      })
    } else {
      await productStore.addProduct(productForm.value)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Produto criado com sucesso!',
        life: 3000,
      })
    }
    showAddEditModal.value = false
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao salvar produto.',
      life: 3000,
    })
  }
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
    category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
    status: selectedStatus.value === 'all' ? undefined : selectedStatus.value,
  })
}

// Chart Data and Options
const pieChartData = computed(() => ({
  labels: analyticsData.value?.valueByCategory.map((c) => c.name) || [],
  datasets: [
    {
      data: analyticsData.value?.valueByCategory.map((c) => c.value) || [],
      backgroundColor: [
        '#42A5F5',
        '#66BB6A',
        '#FFA726',
        '#26C6DA',
        '#7E57C2',
        '#EC407A',
        '#FF7043',
      ],
    },
  ],
}))

const chartOptions = { responsive: true, maintainAspectRatio: false }
</script>

<template>
  <main class="max-w-7xl mx-auto">


    <!-- Bulk Actions Bar -->
    <div v-if="selectedProducts.length > 0" class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-blue-900">
          {{ selectedProducts.length }} produto(s) selecionado(s)
        </span>
      </div>
      <div class="flex gap-2">
        <Button label="Edição em Lote" icon="pi pi-pencil" severity="secondary" outlined @click="showBulkEditModal = true" />
        <Button label="Limpar Seleção" severity="secondary" text @click="selectedProducts = []" />
      </div>
    </div>

    

    <!-- Filters and Actions -->
    <div class="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <div class="relative flex-grow">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400"
          ></i>
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Buscar produto por nome, SKU ou marca..."
            class="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
        <Select
          v-model="selectedCategory"
          :options="categories"
          placeholder="Categoria"
          class="w-full sm:w-48"
        />
        <Select
          v-model="selectedStatus"
          :options="[
            { label: 'Todos', value: 'all' },
            { label: 'Ativo', value: 'active' },
            { label: 'Inativo', value: 'inactive' },
          ]"
          optionLabel="label"
          optionValue="value"
          placeholder="Status"
          class="w-full sm:w-32"
        />
        <Button
          label="Importar"
          icon="pi pi-upload"
          @click="showImportModal = true"
          severity="secondary"
          outlined
        />
        <Button
          label="Exportar"
          icon="pi pi-download"
          @click="showExportModal = true"
          severity="secondary"
          outlined
        />
        <Button
          label="Análise"
          icon="pi pi-chart-bar"
          @click="showAnalyticsModal = true"
          severity="secondary"
          outlined
        />
        <button
          @click="openAddModal"
          class="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
        >
          Novo Produto
        </button>
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
      <p v-else-if="productStore.error" class="text-red-400 text-center p-8">
        {{ productStore.error }}
      </p>
      <p
        v-else-if="productStore.products.length === 0"
        class="text-surface-400 text-center p-8"
      >
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
            <div class="col-span-2 flex items-center">
              <Checkbox
                :binary="true"
                :modelValue="selectedProducts.includes(product.id)"
                @update:modelValue="(checked) => handleSelectEntry(product.id, checked)"
                @click.stop
              />
              <span class="ml-3 font-medium">{{ product.name }}</span>
            </div>
            <div class="col-span-2">
              <Tag :value="product.category"></Tag>
            </div>
            <div class="col-span-2">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ product.quantity_in_stock }} {{ product.unit_type }}</span>
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
            <div class="col-span-2">
              <div class="space-y-1">
                <div class="text-sm">Custo: {{ formatCurrency(product.avg_cost) }}</div>
                <div class="text-sm">Venda: {{ formatCurrency(product.unit_price) }}</div>
              </div>
            </div>
            <div class="col-span-1">
              <span
                v-if="product.unit_price && product.avg_cost"
                :class="product.unit_price - product.avg_cost > 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ (((product.unit_price - product.avg_cost) / product.unit_price) * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="col-span-1 text-center">
              <Tag
                :value="product.is_active ? 'Ativo' : 'Inativo'"
                :severity="product.is_active ? 'success' : 'secondary'"
              ></Tag>
            </div>
            <div class="col-span-2 flex justify-center items-center">
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
    </div> <!-- Added closing div for overflow-hidden -->
    <!-- Paginator can be added here if totalRecords is provided by the store -->

        
      </div> <!-- End of products-table-container -->

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
    <Dialog
      v-model:visible="showAddEditModal"
      :modal="true"
      class="w-full max-w-3xl"
    >
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-bold">{{ isEditing ? 'Editar Produto' : 'Novo Produto' }}</h2>
          <p v-if="!isEditing" class="text-sm text-surface-500">Cadastre um novo produto com todas as informações básicas.</p>
          <p v-else class="text-sm text-surface-500">Modifique as informações do produto.</p>
        </div>
      </template>
      <div class="space-y-6">
        <div class="space-y-4">
          <h4 class="font-medium">Informações Básicas</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm">Nome do Produto *</label>
              <InputText v-model="productForm.name" placeholder="Ex: Notebook Dell Inspiron 15" size="small" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm">SKU (opcional)</label>
              <InputText
                v-model="productForm.sku"
                placeholder="Será gerado automaticamente se vazio"
                size="small"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm">Categoria *</label>
              <Select
                size="small"
                v-model="productForm.category"
                :options="categories"
                placeholder="Selecione uma categoria"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm">Marca *</label>
              <InputText v-model="productForm.brand" placeholder="Ex: Dell, HP, Logitech" size="small" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm">Unidade</label>
              <Select v-model="productForm.unit_type" :options="unitTypes" placeholder="Unidade" size="small" />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Descrição</label>
            <Textarea
              v-model="productForm.description"
              rows="3"
              placeholder="Descrição detalhada..."
              class="resize-none"
              size="small"
            />
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="font-medium">Preços e Custos</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm">Custo Unitário</label>
              <InputNumber v-model="productForm.avg_cost" inputId="avg_cost" mode="currency" currency="BRL" locale="pt-BR"  size="small"/>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm">Preço de Venda</label>
              <InputNumber v-model="productForm.unit_price" inputId="unit_price" mode="currency" currency="BRL" locale="pt-BR" size="small" />
            </div>
          </div>
          <div v-if="productForm.unit_price && productForm.unit_price > 0" class="p-3 bg-surface-50 rounded-lg">
            <span class="font-medium">Margem de Lucro: </span>
            <span :class="profitMargin > 0 ? 'text-green-600' : 'text-red-600'"
              >{{ profitMargin.toFixed(2) }}%</span
            >
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="font-medium">Controle de Estoque</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm">Estoque Mínimo</label>
              <InputNumber v-model="productForm.min_stock" inputId="min_stock" size="small"/>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm">Estoque Máximo</label>
              <InputNumber v-model="productForm.max_stock" inputId="max_stock" size="small"/>
            </div>
            <div class="flex flex-col gap-2">
                <label class="text-sm">Método de Custeio</label>
                <Select v-model="productForm.costing_method" :options="costingMethods" optionLabel="label" optionValue="value" placeholder="Selecione" size="small" />
            </div>
          </div>
        </div>

        <div class="space-y-4">
            <h4 class="font-medium">Informações Adicionais</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-sm">Fornecedor</label>
                    <InputText v-model="productForm.supplier" placeholder="Nome do fornecedor principal" size="small" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm">Peso (kg)</label>
                    <InputNumber v-model="productForm.weight" inputId="weight" size="small" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm">Dimensões</label>
                    <InputText v-model="productForm.dimensions" placeholder="Ex: 30x20x15 cm" size="small" />
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-sm">Localização no Estoque</label>
                    <InputText v-model="productForm.location" placeholder="Ex: A1-B2-C3" size="small" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm">NCM</label>
                    <InputText v-model="productForm.ncm" placeholder="Ex: 8471.30.19" size="small" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm">Status</label>
                    <Select v-model="productForm.is_active" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Ativo" size="small" />
                </div>
            </div>
        </div>

      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showAddEditModal = false" />
        <Button
          :label="isEditing ? 'Salvar Alterações' : 'Criar Produto'"
          @click="handleFormSubmit"
          :loading="productStore.loading"
        />
      </template>
    </Dialog>

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
          <div class="text-center p-4 border rounded-lg"> <!-- Replaced Card with div -->
            <i class="pi pi-box text-2xl text-blue-500"></i>
            <div class="text-2xl font-bold">{{ selectedProduct.quantity_in_stock }}</div>
            <div class="text-sm text-surface-500">Estoque Atual</div>
          </div>
          <div class="text-center p-4 border rounded-lg"> <!-- Replaced Card with div -->
            <i class="pi pi-exclamation-triangle text-2xl text-yellow-500"></i>
            <div class="text-2xl font-bold">{{ selectedProduct.min_stock }}</div>
            <div class="text-sm text-surface-500">Estoque Mínimo</div>
          </div>
          <div class="text-center p-4 border rounded-lg"> <!-- Replaced Card with div -->
            <i class="pi pi-bullseye text-2xl text-green-500"></i>
            <div class="text-2xl font-bold">{{ selectedProduct.max_stock }}</div>
            <div class="text-sm text-surface-500">Estoque Máximo</div>
          </div>
          <div class="text-center p-4 border rounded-lg"> <!-- Replaced Card with div -->
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
        <div class="overflow-x-auto"> <!-- Added for scrollable table -->
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unit.</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="productStore.loading">
                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center">Carregando...</td>
              </tr>
              <tr v-else-if="productStore.movements.length === 0">
                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center">Nenhuma movimentação encontrada.</td>
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

    <!-- Analytics Modal -->
    <Dialog
      v-model:visible="showAnalyticsModal"
      :modal="true"
      class="w-full max-w-6xl"
    >
      <template #header>
        <div class="flex flex-col">
            <div class="flex items-center gap-3">
                <i class="pi pi-chart-bar text-xl"></i>
                <span class="text-xl font-bold">Análise de Produtos</span>
            </div>
            <span class="text-sm text-surface-500 mt-1">Visualizações e métricas detalhadas do catálogo de produtos</span>
        </div>
      </template>

      <div class="p-4">
        <div class="bg-surface-100 rounded-lg p-1 flex gap-1">
            <Button
                label="Visão Geral"
                @click="activeAnalyticsTab = 'visaoGeral'"
                :class="[
                    'w-full !text-sm !py-2',
                    activeAnalyticsTab === 'visaoGeral'
                        ? '!bg-white !text-surface-900 shadow-sm'
                        : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50'
                ]"
                link
            />
            <Button
                label="Categorias"
                @click="activeAnalyticsTab = 'categorias'"
                :class="[
                    'w-full !text-sm !py-2',
                    activeAnalyticsTab === 'categorias'
                        ? '!bg-white !text-surface-900 shadow-sm'
                        : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50'
                ]"
                link
            />
            <Button
                label="Estoque"
                @click="activeAnalyticsTab = 'estoque'"
                :class="[
                    'w-full !text-sm !py-2',
                    activeAnalyticsTab === 'estoque'
                        ? '!bg-white !text-surface-900 shadow-sm'
                        : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50'
                ]"
                link
            />
            <Button
                label="Performance"
                @click="activeAnalyticsTab = 'performance'"
                :class="[
                    'w-full !text-sm !py-2',
                    activeAnalyticsTab === 'performance'
                        ? '!bg-white !text-surface-900 shadow-sm'
                        : 'bg-transparent !text-surface-600 hover:!bg-surface-200/50'
                ]"
                link
            />
        </div>

        <div class="mt-6">
            <div v-if="activeAnalyticsTab === 'visaoGeral'">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="p-4 border rounded-lg flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-surface-500">
                            <i class="pi pi-box"></i>
                            <span>Total de Produtos</span>
                        </div>
                        <div class="text-2xl font-bold">{{ totalProducts }}</div>
                    </div>
                    <div class="p-4 border rounded-lg flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-surface-500">
                            <i class="pi pi-dollar"></i>
                            <span>Valor Total</span>
                        </div>
                        <div class="text-2xl font-bold">{{ formatCurrency(totalInventoryValue) }}</div>
                    </div>
                    <div class="p-4 border rounded-lg flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-red-500">
                            <i class="pi pi-exclamation-triangle"></i>
                            <span>Alertas</span>
                        </div>
                        <div class="text-2xl font-bold text-red-500">{{ lowStockProducts }}</div>
                    </div>
                    <div class="p-4 border rounded-lg flex flex-col gap-2">
                        <div class="flex items-center gap-2 text-surface-500">
                            <i class="pi pi-arrow-up-right"></i>
                            <span>Receita</span>
                        </div>
                        <div class="text-2xl font-bold">R$ 0,00</div> <!-- Placeholder -->
                    </div>
                </div>
                <div class="mt-8">
                    <h3 class="font-medium mb-4">Distribuição de Valor por Categoria</h3>
                    <Chart
                        type="pie"
                        :data="pieChartData"
                        :options="chartOptions"
                        class="w-full md:w-1/2 mx-auto"
                    ></Chart>
                </div>
            </div>
            <div v-if="activeAnalyticsTab === 'categorias'">
                <h3 class="font-medium mb-4">Análise por Categorias</h3>
                <Chart
                    type="bar"
                    :data="pieChartData" 
                    :options="chartOptions"
                    class="h-96"
                ></Chart>
            </div>
            <div v-if="activeAnalyticsTab === 'estoque'">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 border rounded-lg bg-red-50 text-red-700 flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-times-circle"></i>
                            <span>Sem Estoque</span>
                        </div>
                        <div class="text-2xl font-bold">{{ outOfStockProducts }}</div>
                    </div>
                    <div class="p-4 border rounded-lg bg-yellow-50 text-yellow-700 flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-clock"></i>
                            <span>Estoque Baixo</span>
                        </div>
                        <div class="text-2xl font-bold">{{ lowStockProducts }}</div>
                    </div>
                    <div class="p-4 border rounded-lg bg-green-50 text-green-700 flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-check-circle"></i>
                            <span>Estoque Normal</span>
                        </div>
                        <div class="text-2xl font-bold">{{ totalProducts - lowStockProducts - outOfStockProducts }}</div>
                    </div>
                </div>
                <div class="mt-8">
                    <h3 class="font-medium mb-4">Produtos Críticos</h3>
                    <div class="p-4 border rounded-lg text-center text-surface-500">
                        Tabela de produtos críticos aqui.
                    </div>
                </div>
            </div>
            <div v-if="activeAnalyticsTab === 'performance'">
                <h3 class="font-medium mb-4">Top 10 Produtos por Receita</h3>
                <div class="p-4 border rounded-lg text-center text-surface-500 h-96 flex items-center justify-center">
                    Gráfico de Top 10 aqui.
                </div>
            </div>
        </div>
      </div>

      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="showAnalyticsModal = false" />
        <Button label="Exportar Relatório" icon="pi pi-download" />
      </template>
    </Dialog>

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
              <Select v-model="bulkEditCategoryValue" :options="categories" placeholder="Selecionar categoria" :disabled="!bulkEditCategory" />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkStatus" v-model="bulkEditStatus" :binary="true" />
                <label for="bulkStatus">Status</label>
              </div>
              <Select v-model="bulkEditStatusValue" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Selecionar status" :disabled="!bulkEditStatus" />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkCostingMethod" v-model="bulkEditCostingMethod" :binary="true" />
                <label for="bulkCostingMethod">Método de Custeio</label>
              </div>
              <Select v-model="bulkEditCostingMethodValue" :options="costingMethods" optionLabel="label" optionValue="value" placeholder="Selecionar método" :disabled="!bulkEditCostingMethod" />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center space-x-2">
                <Checkbox inputId="bulkMinStock" v-model="bulkEditMinStock" :binary="true" />
                <label for="bulkMinStock">Estoque Mínimo</label>
              </div>
              <InputNumber v-model="bulkEditMinStockValue" inputId="bulkMinStockValue" placeholder="0" :disabled="!bulkEditMinStock" />
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
              <Select v-model="bulkEditPriceAdjustType" :options="[{label: 'Percentual', value: 'percentage'}, {label: 'Valor fixo', value: 'fixed'}, {label: 'Por margem', value: 'margin'}]" optionLabel="label" optionValue="value" placeholder="Tipo de ajuste" :disabled="!bulkEditPriceAdjust" />
            </div>

            <div class="flex flex-col gap-2">
              <label>Valor do Ajuste</label>
              <InputNumber v-model="bulkEditPriceAdjustValue" inputId="bulkPriceAdjustValue" placeholder="0" :disabled="!bulkEditPriceAdjust" />
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-exclamation-triangle text-yellow-600"></i>
            <span class="font-medium text-yellow-900">Atenção</span>
          </div>
          <p class="text-sm text-yellow-800">
            As alterações serão aplicadas a todos os {{ selectedProducts.length }} produtos selecionados.
            Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showBulkEditModal = false" />
        <Button label="Aplicar Alterações" @click="() => { showBulkEditModal = false; selectedProducts = []; toast.add({ severity: 'success', summary: 'Sucesso', detail: `${selectedProducts.length} produtos foram atualizados em lote!`, life: 3000 }); }" />
      </template>
    </Dialog>

    <!-- Import Modal -->
    <Dialog
      v-model:visible="showImportModal"
      header="Importar Produtos"
      :modal="true"
      class="w-full max-w-2xl"
    >
      <div class="space-y-6 p-4">
        <div class="space-y-4">
          <div class="border-2 border-dashed border-surface-300 rounded-lg p-8 text-center">
            <i class="pi pi-upload text-surface-400 text-5xl mx-auto mb-4"></i>
            <div class="space-y-2">
              <p class="font-medium">Arraste e solte seu arquivo aqui</p>
              <p class="text-sm text-surface-500">ou clique para selecionar</p>
              <Button label="Escolher Arquivo" severity="secondary" outlined class="mt-2" />
            </div>
          </div>

          <div class="text-sm text-surface-500">
            <p class="mb-2">Formatos aceitos: .xlsx, .xls, .csv</p>
            <p>Tamanho máximo: 10MB</p>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="font-medium">Configurações de Importação</h4>
          
          <div class="space-y-3">
            <div class="flex items-center space-x-2">
              <Checkbox inputId="updateExisting" :binary="true" :modelValue="true" />
              <label for="updateExisting">Atualizar produtos existentes (baseado no SKU)</label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox inputId="skipErrors" :binary="true" :modelValue="true" />
              <label for="skipErrors">Pular linhas com erro e continuar importação</label>
            </div>
            <div class="flex items-center space-x-2">
              <Checkbox inputId="validateStock" :binary="true" :modelValue="false" />
              <label for="validateStock">Validar níveis de estoque mínimo/máximo</label>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-file text-blue-600"></i>
            <span class="font-medium text-blue-900">Modelo de Planilha</span>
          </div>
          <p class="text-sm text-blue-800 mb-3">
            Baixe o modelo oficial para garantir que sua importação seja processada corretamente.
          </p>
          <Button label="Baixar Modelo" severity="secondary" outlined>
            <i class="pi pi-download mr-2"></i>
            Baixar Modelo
          </Button>
        </div>

        <div class="space-y-2">
          <label>Mapeamento de Colunas</label>
          <p class="text-sm text-surface-500">
            As seguintes colunas são obrigatórias: Nome, Categoria, Marca, Custo Unitário, Preço de Venda
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="showImportModal = false" />
        <Button label="Iniciar Importação" @click="() => { showImportModal = false; toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Importação iniciada! Você será notificado quando concluída.', life: 3000 }); }">
          <i class="pi pi-upload mr-2"></i>
          Iniciar Importação
        </Button>
      </template>
    </Dialog>

    <!-- Export Modal -->
    <Dialog
      v-model:visible="showExportModal"
      :modal="true"
      class="w-full max-w-lg"
    >
      <template #header>
        <div class="flex flex-col">
            <div class="flex items-center gap-3">
                <i class="pi pi-download text-xl"></i>
                <span class="text-xl font-bold">Exportar Produtos</span>
            </div>
            <span class="text-sm text-surface-500 mt-1">Configure as opções de exportação do catálogo</span>
        </div>
      </template>
      <div class="space-y-6 p-4">
        <div class="space-y-2">
            <label class="block text-sm font-medium text-surface-700 mb-1">Formato de Exportação</label>
            <Select :options="[{label: 'Excel (.xlsx)', value: 'excel'}, {label: 'CSV', value: 'csv'}, {label: 'PDF (Relatório)', value: 'pdf'}]" optionLabel="label" optionValue="value" v-model="exportFormat" placeholder="Selecione" class="w-full" />
        </div>

        <div class="space-y-2">
            <label class="block text-sm font-medium text-surface-700 mb-1">Produtos a Exportar</label>
            <Select :options="[
            {label: `Produtos selecionados (${selectedProducts.length})`, value: 'selected', disabled: selectedProducts.length === 0},
            {label: `Produtos filtrados (${productStore.products.length})`, value: 'filtered'},
            {label: `Todos os produtos (${totalProducts})`, value: 'all'},
            {label: `Apenas produtos ativos (${activeProducts})`, value: 'active'},
            {label: `Produtos com estoque baixo (${lowStockProducts})`, value: 'lowstock'}
            ]" optionLabel="label" optionValue="value" v-model="exportScope" placeholder="Selecione" class="w-full" />
        </div>

        <div class="space-y-2">
            <label class="block text-sm font-medium text-surface-700 mb-2">Incluir nas Colunas</label>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex items-center space-x-2">
                    <Checkbox inputId="includeBasicInfo" :binary="true" :modelValue="true" />
                    <label for="includeBasicInfo" class="text-sm">Informações básicas</label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox inputId="includePricing" :binary="true" :modelValue="true" />
                    <label for="includePricing" class="text-sm">Preços e custos</label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox inputId="includeStock" :binary="true" :modelValue="true" />
                    <label for="includeStock" class="text-sm">Dados de estoque</label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox inputId="includeSales" :binary="true" :modelValue="true" />
                    <label for="includeSales" class="text-sm">Histórico de vendas</label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox inputId="includeMovements" :binary="true" :modelValue="false" />
                    <label for="includeMovements" class="text-sm">Movimentações</label>
                </div>
                <div class="flex items-center space-x-2">
                    <Checkbox inputId="includeMetrics" :binary="true" :modelValue="false" />
                    <label for="includeMetrics" class="text-sm">Métricas calculadas</label>
                </div>
            </div>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-chart-line text-green-600"></i>
                <span class="font-medium text-green-900">Resumo da Exportação</span>
            </div>
            <div class="text-sm text-green-800 space-y-1">
                <p>• {{ productStore.products.length }} produtos serão exportados</p>
                <p>• Valor total do estoque: {{ formatCurrency(totalInventoryValue) }}</p>
                <p>• {{ activeProducts }} produtos ativos</p>
                <p>• {{ categories.filter(cat => productStore.products.some(p => p.category === cat)).length }} categorias diferentes</p>
            </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showExportModal = false" />
        <Button label="Exportar" icon="pi pi-download" @click="() => { showExportModal = false; toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Exportação iniciada! Você receberá o arquivo em breve.', life: 3000 }); }" />
      </template>
    </Dialog>
  </main>
</template>
