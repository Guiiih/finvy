<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import type { Product as StoreProduct, StockMovement as StoreStockMovement, CostingMethod } from '@/types';

// STORES
const productStore = useProductStore();

// LOCAL STATE
const allStockMovements = ref<StoreStockMovement[]>([]);
const loadingData = ref(true);

// LIFECYCLE
onMounted(async () => {
  loadingData.value = true;
  // Fetch all products
  await productStore.fetchProducts({ itemsPerPage: 1000 }); // Assuming max 1000 products

  // Fetch movements for each product. 
  // NOTE: This is inefficient and makes N+1 requests. 
  // A better long-term solution is a dedicated backend endpoint to fetch all movements at once.
  const allMovements: StoreStockMovement[] = [];
  for (const product of productStore.products) {
    await productStore.fetchStockMovements(product.id);
    allMovements.push(...productStore.movements);
  }
  allStockMovements.value = allMovements;
  loadingData.value = false;
});

// DATA FROM STORES
const products = computed(() => productStore.products as StoreProduct[]);
const stockMovements = computed(() => allStockMovements.value);

// COMPONENT STATE
const loading = ref(false);
const searchTerm = ref('');
const selectedProduct = ref('all');
const selectedType = ref('all');
const selectedPeriod = ref('all');
const selectedMethod = ref('all');
const activeTab = ref('movements');
const showDetailModal = ref(false);
const showSummaryModal = ref(false);
const showMethodModal = ref(false);
const showAnalysisModal = ref(false);
const selectedMovement = ref<StoreStockMovement | null>(null);
const editingProductId = ref<string | null>(null);

// STATIC DATA
const costingMethods = [
  { value: 'fifo' as CostingMethod, label: 'PEPS (FIFO)', description: 'Primeiro a Entrar, Primeiro a Sair', color: 'bg-blue-100 text-blue-800' },
  { value: 'lifo' as CostingMethod, label: 'UEPS (LIFO)', description: 'Último a Entrar, Primeiro a Sair', color: 'bg-green-100 text-green-800' },
  { value: 'average' as CostingMethod, label: 'Custo Médio', description: 'Média Ponderada', color: 'bg-purple-100 text-purple-800' }
];

const movementTypes = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venda' },
  { value: 'adjustment', label: 'Ajuste' },
];

const periods = [
  { value: 'all', label: 'Todo o período' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'quarter', label: 'Este trimestre' }
];

// LOGIC
const getProductEntries = (productId: string) => {
  return stockMovements.value
    .filter((m: StoreStockMovement) => m.product_id === productId && m.movement_type === 'purchase')
    .sort((a: StoreStockMovement, b: StoreStockMovement) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime());
};

const getProductValueByMethod = (productId: string, method: CostingMethod): number => {
  const product = products.value.find(p => p.id === productId);
  if (!product || product.quantity_in_stock === 0) return 0;

  const entries = getProductEntries(productId);
  let stock = product.quantity_in_stock;
  let value = 0;

  if (method === 'average') {
    return product.quantity_in_stock * (product.avg_cost || 0);
  }

  if (method === 'fifo') {
    for (const entry of entries) {
      if (stock === 0) break;
      const qtyToTake = Math.min(stock, entry.quantity);
      value += qtyToTake * (entry.unit_cost || 0);
      stock -= qtyToTake;
    }
  }

  if (method === 'lifo') {
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (stock === 0) break;
      const qtyToTake = Math.min(stock, entry.quantity);
      value += qtyToTake * (entry.unit_cost || 0);
      stock -= qtyToTake;
    }
  }
  
  return value;
};

const getTotalInventoryValue = computed(() => {
  return products.value.reduce((total, product) => {
    return total + getProductValueByMethod(product.id, product.costing_method || 'average');
  }, 0);
});

const getInventoryValueByMethod = (method: CostingMethod) => {
  return products.value.reduce((total, product) => {
    return total + getProductValueByMethod(product.id, method);
  }, 0);
};

const getCostingMethodSummary = computed(() => {
  const summary = {
    fifo: { count: 0, value: 0, products: [] as string[] },
    lifo: { count: 0, value: 0, products: [] as string[] },
    average: { count: 0, value: 0, products: [] as string[] }
  };

  products.value.forEach(p => {
    if (p.quantity_in_stock > 0) {
      const method = p.costing_method || 'average';
      summary[method].count++;
      summary[method].value += getProductValueByMethod(p.id, method);
      summary[method].products.push(p.name);
    }
  });

  return summary;
});

// FILTERED DATA
const filteredMovements = computed(() => {
  if (!stockMovements.value) return [];
  return stockMovements.value.filter((movement: StoreStockMovement) => {
    const product = products.value.find(p => p.id === movement.product_id);
    const productName = product?.name || '';
    const productSku = product?.sku || '';

    const searchTermLower = searchTerm.value.toLowerCase();
    const matchesSearch = productName.toLowerCase().includes(searchTermLower) ||
                         productSku.toLowerCase().includes(searchTermLower) ||
                         (movement.reason || '').toLowerCase().includes(searchTermLower);
    const matchesProduct = selectedProduct.value === 'all' || movement.product_id === selectedProduct.value;
    const matchesType = selectedType.value === 'all' || movement.movement_type === selectedType.value;
    const matchesMethod = selectedMethod.value === 'all' || product?.costing_method === selectedMethod.value;
    
    let matchesPeriod = true;
    if (selectedPeriod.value !== 'all') {
      const movementDate = new Date(movement.movement_date);
      const now = new Date();
      
      switch (selectedPeriod.value) {
        case 'today':
          matchesPeriod = movementDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesPeriod = movementDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesPeriod = movementDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesPeriod = movementDate >= quarterAgo;
          break;
      }
    }
    
    return matchesSearch && matchesProduct && matchesType && matchesPeriod && matchesMethod;
  });
});

// STATISTICS
const totalMovements = computed(() => stockMovements.value?.length || 0);
const entryMovements = computed(() => stockMovements.value?.filter((m: StoreStockMovement) => m.movement_type === 'purchase').length || 0);
const exitMovements = computed(() => stockMovements.value?.filter((m: StoreStockMovement) => m.movement_type === 'sale').length || 0);
const lowStockProducts = computed(() => products.value.filter(p => p.quantity_in_stock > 0 && p.quantity_in_stock <= (p.min_stock || 0)).length);
const criticalProducts = computed(() => products.value.filter(p => p.quantity_in_stock <= 0));
const lowStockProductsList = computed(() => products.value.filter(p => p.quantity_in_stock > 0 && p.quantity_in_stock <= (p.min_stock || 0)));
const mostMovedProducts = computed(() => {
  if (!stockMovements.value) return [];
  const movementCounts = stockMovements.value.reduce((acc: Record<string, number>, m: StoreStockMovement) => {
    acc[m.product_id] = (acc[m.product_id] || 0) + 1;
    return acc;
  }, {});

  return products.value
    .map(p => ({ ...p, movementCount: movementCounts[p.id] || 0 }))
    .filter(p => p.movementCount > 0)
    .sort((a, b) => b.movementCount - a.movementCount)
    .slice(0, 5);
});


// METHODS
const openMovementDetail = (movement: StoreStockMovement) => {
  selectedMovement.value = movement;
  showDetailModal.value = true;
};

const openAnalysis = () => {
  showAnalysisModal.value = true;
};
const openMethodManagement = () => {
  showMethodModal.value = true;
};
const openSummary = () => {
  showSummaryModal.value = true;
};

const handleUpdateCostingMethod = async (productId: string, event: Event) => {
  const method = (event.target as HTMLSelectElement).value as CostingMethod;
  loading.value = true;
  await productStore.updateProduct(productId, { costing_method: method });
  loading.value = false;
  editingProductId.value = null;
  const product = products.value.find(p => p.id === productId);
  const methodLabel = costingMethods.find(m => m.value === method)?.label;
  alert(`Método de custeio do produto "${product?.name}" alterado para ${methodLabel}`);
};

// HELPERS
const getMovementTypeColor = (type: string) => {
  switch (type) {
    case 'purchase': return 'bg-green-100 text-green-800';
    case 'sale': return 'bg-red-100 text-red-800';
    case 'adjustment': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCostingMethodInfo = (method?: CostingMethod) => {
  if (!method) return costingMethods.find(m => m.value === 'average');
  return costingMethods.find(m => m.value === method);
};

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getProductName = (productId: string) => products.value.find(p => p.id === productId)?.name || 'N/A';
const getProductSku = (productId: string) => products.value.find(p => p.id === productId)?.sku || 'N/A';

</script>

<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-800">
    <div v-if="loadingData" class="text-center">
      <p>Carregando dados de estoque...</p>
    </div>
    <div v-else>
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Controle de Estoque</h1>
        <p class="text-gray-500">
          Monitore movimentações de estoque com métodos de custeio individuais por produto.
        </p>
      </div>

      <!-- Costing Methods Overview -->
      <div class="mb-8 border rounded-lg bg-white shadow">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15c0-2.5-1.8-4-4-4s-4 1.5-4 4s1.8 4 4 4s4-1.5 4-4Z"/><path d="M6 9V6c0-1.7 1.3-3 3-3h1.5"/><path d="M18 9h1.5c1.7 0 3 1.3 3 3v0"/><path d="m6 21-3-3 3-3"/><path d="m3 18h12"/></svg>
                Métodos de Custeio por Produto
              </h2>
              <p class="text-sm text-gray-500">
                Cada produto pode usar um método de custeio específico
              </p>
            </div>
            <div class="flex gap-2">
              <button @click="openSummary" class="px-4 py-2 text-sm font-medium border rounded-md flex items-center gap-2 hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                Resumo
              </button>
              <button @click="openMethodManagement" class="px-4 py-2 text-sm font-medium border rounded-md flex items-center gap-2 hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Gerenciar Métodos
              </button>
            </div>
          </div>
        </div>
        <div class="p-6 border-t">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="method in costingMethods" :key="method.value" class="border rounded-lg p-4">
              <div class="flex items-center justify-between pb-3">
                <div class="flex items-center gap-2">
                  <svg v-if="method.value === 'fifo'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                  <svg v-if="method.value === 'lifo'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h5v5"/><path d="M21 4 2 22"/><path d="M8 20H3v-5"/><path d="M3 20l12-12"/></svg>
                  <h3 class="text-sm font-semibold">{{ method.label }}</h3>
                </div>
                <span :class="[method.color, 'px-2 py-0.5 text-xs font-medium rounded-full']">
                  {{ getCostingMethodSummary[method.value].count }} produtos
                </span>
              </div>
              <div>
                <div class="space-y-2">
                  <div class="text-lg font-bold">
                    {{ formatCurrency(getCostingMethodSummary[method.value].value) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ method.description }}
                  </div>
                  <div v-if="getCostingMethodSummary[method.value].count > 0 && getTotalInventoryValue > 0" class="text-xs text-gray-500">
                    {{ ((getCostingMethodSummary[method.value].value / getTotalInventoryValue) * 100).toFixed(1) }}% do total
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Valor Total do Inventário</div>
                <div class="text-sm text-gray-500">
                  Calculado usando método específico de cada produto
                </div>
              </div>
              <div class="text-2xl font-bold">
                {{ formatCurrency(getTotalInventoryValue) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Card 1 -->
        <div class="border rounded-lg bg-white p-6 shadow">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Total de Movimentações</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ totalMovements }}</div>
            <p class="text-xs text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1 text-green-500"><path d="M18 6 6 18"/><path d="M12 6h6v6"/></svg>
              {{ entryMovements }} entradas, {{ exitMovements }} saídas
            </p>
          </div>
        </div>
        <!-- Card 2 -->
        <div class="border rounded-lg bg-white p-6 shadow">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Valor do Estoque</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ formatCurrency(getTotalInventoryValue) }}</div>
            <p class="text-xs text-gray-500">Métodos individualizados</p>
          </div>
        </div>
        <!-- Card 3 -->
        <div class="border rounded-lg bg-white p-6 shadow">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Produtos Ativos</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="M21 14v2a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16v-2"/><path d="M3 10v4"/><path d="M21 10v4"/><path d="m7.5 15.5 9-5.5"/><path d="m7.5 9.5 9 5.5"/></svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ products.length }}</div>
            <p class="text-xs text-gray-500">{{ products.filter(p => p.is_active).length }} ativos</p>
          </div>
        </div>
        <!-- Card 4 -->
        <div class="border rounded-lg bg-white p-6 shadow">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="text-sm font-medium">Alertas de Estoque</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-600">{{ lowStockProducts }}</div>
            <p class="text-xs text-gray-500">{{ criticalProducts.length }} sem estoque</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="space-y-6">
        <div class="border-b">
          <nav class="flex -mb-px space-x-6" aria-label="Tabs">
            <button @click="activeTab = 'movements'" :class="['py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'movements' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">Movimentações</button>
            <button @click="activeTab = 'products'" :class="['py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'products' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">Produtos e Métodos</button>
            <button @click="activeTab = 'alerts'" :class="['py-4 px-1 border-b-2 font-medium text-sm', activeTab === 'alerts' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">Alertas</button>
          </nav>
        </div>

        <!-- Movements Tab -->
        <div v-if="activeTab === 'movements'" class="space-y-6">
          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input v-model="searchTerm" placeholder="Buscar por produto, SKU ou descrição..." class="w-full pl-10 pr-4 py-2 border rounded-md" />
            </div>
            
            <select v-model="selectedProduct" class="w-48 border rounded-md px-2 py-2 bg-white">
              <option value="all">Todos os produtos</option>
              <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
            </select>
            
            <select v-model="selectedType" class="w-40 border rounded-md px-2 py-2 bg-white">
              <option v-for="type in movementTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>

            <select v-model="selectedMethod" class="w-40 border rounded-md px-2 py-2 bg-white">
              <option value="all">Todos os métodos</option>
              <option v-for="method in costingMethods" :key="method.value" :value="method.value">{{ method.label }}</option>
            </select>
            
            <select v-model="selectedPeriod" class="w-40 border rounded-md px-2 py-2 bg-white">
              <option v-for="period in periods" :key="period.value" :value="period.value">{{ period.label }}</option>
            </select>
            
            <button @click="openAnalysis" class="px-4 py-2 text-sm font-medium border rounded-md flex items-center gap-2 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Análise
            </button>
          </div>

          <!-- Movements Table -->
          <div class="border rounded-lg bg-white shadow">
            <div class="p-6">
              <h3 class="text-lg font-semibold">Histórico de Movimentações</h3>
              <p class="text-sm text-gray-500">Registro automático das movimentações usando método específico de cada produto</p>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unit.</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Total</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="movement in filteredMovements.sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime())" :key="movement.id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-sm">{{ new Date(movement.movement_date).toLocaleDateString('pt-BR') }}</div>
                      <div class="text-sm text-gray-500">{{ movement.reference_id }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-sm">{{ getProductName(movement.product_id) }}</div>
                      <div class="text-sm text-gray-500 font-mono">{{ getProductSku(movement.product_id) }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="[getCostingMethodInfo(products.find(p=>p.id === movement.product_id)?.costing_method)?.color, 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full']">
                        {{ getCostingMethodInfo(products.find(p=>p.id === movement.product_id)?.costing_method)?.label.split(' ')[0] }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="[getMovementTypeColor(movement.movement_type), 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1']">
                        {{ movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm" :class="movement.movement_type === 'purchase' ? 'text-green-600' : 'text-red-600'">
                      {{ movement.movement_type === 'purchase' ? '+' : '-' }}{{ movement.quantity }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ formatCurrency(movement.unit_cost) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ formatCurrency((movement.unit_cost || 0) * movement.quantity) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ movement.created_by }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button @click="openMovementDetail(movement)" class="p-1 text-gray-500 hover:text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
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
          <div class="border rounded-lg bg-white shadow">
            <div class="p-6">
              <h3 class="text-lg font-semibold">Gerenciamento de Métodos por Produto</h3>
              <p class="text-sm text-gray-500">Configure o método de custeio específico para cada produto</p>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método Atual</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor PEPS</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor UEPS</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Médio</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Atual</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="product in products.filter(p => p.quantity_in_stock > 0)" :key="product.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-sm">{{ product.name }}</div>
                      <div class="text-sm text-gray-500">{{ product.sku }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{{ product.category }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ product.quantity_in_stock }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                       <span :class="[getCostingMethodInfo(product.costing_method)?.color, 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full']">
                        {{ getCostingMethodInfo(product.costing_method)?.label }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ formatCurrency(getProductValueByMethod(product.id, 'fifo')) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ formatCurrency(getProductValueByMethod(product.id, 'lifo')) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ formatCurrency(getProductValueByMethod(product.id, 'average')) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">{{ formatCurrency(getProductValueByMethod(product.id, product.costing_method || 'average')) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button v-if="editingProductId !== product.id" @click="editingProductId = product.id" :disabled="loading" class="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <select v-else :value="product.costing_method" @change="handleUpdateCostingMethod(product.id, $event)" :disabled="loading" class="w-32 border rounded-md px-2 py-1 bg-white text-sm">
                        <option v-for="method in costingMethods" :key="method.value" :value="method.value">{{ method.label.split(' ')[0] }}</option>
                      </select>
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
            <div class="border rounded-lg bg-white shadow">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-red-600">Produtos Sem Estoque</h3>
                <p class="text-sm text-gray-500">Produtos que precisam de reposição urgente</p>
              </div>
              <div class="p-6">
                <div v-if="criticalProducts.length === 0" class="text-center py-6 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  <p>Nenhum produto sem estoque</p>
                </div>
                <div v-else class="space-y-3">
                  <div v-for="product in criticalProducts" :key="product.id" class="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <div class="font-medium text-red-800">{{ product.name }}</div>
                      <div class="text-sm text-red-600 flex items-center gap-2">
                        <span>{{ product.sku }}</span>
                      </div>
                    </div>
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Estoque: {{ product.quantity_in_stock }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="border rounded-lg bg-white shadow">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-yellow-600">Estoque Baixo</h3>
                <p class="text-sm text-gray-500">Produtos próximos ao estoque mínimo</p>
              </div>
              <div class="p-6">
                <div v-if="lowStockProductsList.length === 0" class="text-center py-6 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-green-500"><path d="M18 6 6 18"/><path d="M12 6h6v6"/></svg>
                  <p>Todos os produtos com estoque adequado</p>
                </div>
                <div v-else class="space-y-3">
                  <div v-for="product in lowStockProductsList" :key="product.id" class="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div>
                      <div class="font-medium text-yellow-800">{{ product.name }}</div>
                      <div class="text-sm text-yellow-600">
                        <span>{{ product.sku }} • Mín: {{ product.min_stock }}</span>
                      </div>
                    </div>
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Estoque: {{ product.quantity_in_stock }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border rounded-lg bg-white shadow">
            <div class="p-6">
              <h3 class="text-lg font-semibold">Recomendações de Compra</h3>
              <p class="text-sm text-gray-500">Sugestões baseadas no método de custeio específico de cada produto</p>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div v-for="product in [...criticalProducts, ...lowStockProductsList].slice(0, 5)" :key="product.id" class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center gap-4">
                    <div class="w-3 h-3 rounded-full" :class="product.quantity_in_stock <= 0 ? 'bg-red-500' : 'bg-yellow-500'"></div>
                    <div>
                      <div class="font-medium flex items-center gap-2">{{ product.name }}</div>
                      <div class="text-sm text-gray-500">Estoque atual: {{ product.quantity_in_stock }} • Mínimo: {{ product.min_stock }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium">Comprar: {{ Math.max((product.max_stock || 0) - product.quantity_in_stock, (product.min_stock || 0) * 2) }} unidades</div>
                    <div class="text-sm text-gray-500">Custo estimado: {{ formatCurrency(Math.max((product.max_stock || 0) - product.quantity_in_stock, (product.min_stock || 0) * 2) * (product.avg_cost || 0)) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <div v-if="showSummaryModal" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" @click.self="showSummaryModal = false">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
          <div class="p-6 border-b flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Resumo dos Métodos de Custeio</h3>
              <p class="text-sm text-gray-500">Análise consolidada dos métodos utilizados por produto</p>
            </div>
            <button @click="showSummaryModal = false" class="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="p-6 space-y-6 flex-grow bg-gray-50">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div v-for="method in costingMethods" :key="method.value" class="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div class="flex items-center gap-2">
                  <svg v-if="method.value === 'fifo'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                  <svg v-if="method.value === 'lifo'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2l4.3 8.2c.7 1.3 2.1 2.2 3.6 2.2H22"/><path d="m18 22 4-4-4-4"/></svg>
                  <svg v-if="method.value === 'average'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><line x1="16" x2="12" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="8" x2="8" y1="10" y2="18"/></svg>
                  <h4 class="font-semibold text-gray-800">{{ method.label }}</h4>
                </div>
                <p class="text-sm text-gray-500">{{ method.description }}</p>
                <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(getCostingMethodSummary[method.value].value) }}</div>
                <div class="text-sm text-gray-500">{{ getTotalInventoryValue > 0 ? ((getCostingMethodSummary[method.value].value / getTotalInventoryValue) * 100).toFixed(1) : '0.0' }}% do inventário total</div>
                <div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div class="bg-gray-400 h-1.5 rounded-full" :style="{ width: products.length > 0 ? (getCostingMethodSummary[method.value].count / products.length) * 100 + '%' : '0%' }"></div>
                  </div>
                  <div class="flex justify-between text-sm mt-1">
                    <span class="text-gray-600">Produtos usando este método</span>
                    <span class="font-medium text-gray-800">{{ getCostingMethodSummary[method.value].count }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Comparison Impact -->
            <div class="bg-white border border-gray-200 rounded-lg">
              <div class="p-4"><h4 class="font-semibold text-gray-800">Impacto da Individualização</h4></div>
              <div class="p-4 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h5 class="text-sm text-gray-600">Se todos usassem PEPS:</h5>
                  <div class="text-lg font-bold text-blue-600">{{ formatCurrency(getInventoryValueByMethod('fifo')) }}</div>
                  <div class="text-sm text-gray-500">Diferença: {{ formatCurrency(getInventoryValueByMethod('fifo') - getTotalInventoryValue) }}</div>
                </div>
                <div>
                  <h5 class="text-sm text-gray-600">Se todos usassem UEPS:</h5>
                  <div class="text-lg font-bold text-green-600">{{ formatCurrency(getInventoryValueByMethod('lifo')) }}</div>
                  <div class="text-sm text-gray-500">Diferença: {{ formatCurrency(getInventoryValueByMethod('lifo') - getTotalInventoryValue) }}</div>
                </div>
                <div>
                  <h5 class="text-sm text-gray-600">Se todos usassem Médio:</h5>
                  <div class="text-lg font-bold text-purple-600">{{ formatCurrency(getInventoryValueByMethod('average')) }}</div>
                  <div class="text-sm text-gray-500">Diferença: {{ formatCurrency(getInventoryValueByMethod('average') - getTotalInventoryValue) }}</div>
                </div>
              </div>
            </div>
            <!-- Recommendations -->
            <div class="bg-white border border-gray-200 rounded-lg">
              <div class="p-4"><h4 class="font-semibold text-gray-800">Recomendações por Categoria</h4></div>
              <div class="p-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2l4.3 8.2c.7 1.3 2.1 2.2 3.6 2.2H22"/><path d="m18 22 4-4-4-4"/></svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><line x1="16" x2="12" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="8" x2="8" y1="10" y2="18"/></svg>
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
          <div class="p-4 bg-white border-t flex justify-end">
            <button @click="showSummaryModal = false" class="px-4 py-2 text-sm font-medium border rounded-md bg-gray-800 text-white hover:bg-gray-700">Fechar</button>
          </div>
        </div>
      </div>

      <!-- Movement Detail Modal -->
      <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 z-40" @click="showDetailModal = false"></div>
      <div v-if="showDetailModal && selectedMovement" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
          <div class="p-6 border-b flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Detalhes da Movimentação</h3>
              <p class="text-sm text-gray-500">Informações completas sobre a movimentação</p>
            </div>
             <button @click="showDetailModal = false" class="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div v-if="selectedMovement" class="p-6 space-y-4 flex-grow">
            <div class="grid grid-cols-2 gap-4">
              <div><label class="text-sm font-medium">Data</label><p class="text-sm mt-1">{{ new Date(selectedMovement?.movement_date).toLocaleDateString('pt-BR') }}</p></div>
              <div><label class="text-sm font-medium">Referência</label><p class="text-sm mt-1 font-mono">{{ selectedMovement?.reference_id }}</p></div>
            </div>
            <div><label class="text-sm font-medium">Produto</label><div class="mt-1"><p class="text-sm font-medium">{{ getProductName(selectedMovement?.product_id) }}</p><p class="text-sm text-gray-500">{{ getProductSku(selectedMovement?.product_id) }}</p></div></div>
            <div>
              <label class="text-sm font-medium">Método de Custeio Usado</label>
              <div class="mt-1">
                <span :class="[getCostingMethodInfo(products.find(p=>p.id === selectedMovement?.product_id)?.costing_method)?.color, 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full']">
                  {{ getCostingMethodInfo(products.find(p=>p.id === selectedMovement?.product_id)?.costing_method)?.label }}
                </span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium">Quantidade</label>
                <p class="text-sm mt-1 font-medium" :class="selectedMovement?.movement_type === 'purchase' ? 'text-green-600' : 'text-red-600'">
                  {{ selectedMovement?.movement_type === 'purchase' ? '+' : '-' }}{{ selectedMovement?.quantity }}
                </p>
              </div>
              <div><label class="text-sm font-medium">Custo Unitário</label><p class="text-sm mt-1 font-mono">{{ formatCurrency(selectedMovement?.unit_cost) }}</p></div>
            </div>
            <div><label class="text-sm font-medium">Motivo</label><p class="text-sm mt-1">{{ selectedMovement?.reason }}</p></div>
            <div><label class="text-sm font-medium">Usuário</label><p class="text-sm mt-1">{{ selectedMovement?.created_by }}</p></div>
          </div>
          <div class="p-4 bg-gray-50 border-t flex justify-end">
            <button @click="showDetailModal = false" class="px-4 py-2 text-sm font-medium border rounded-md bg-gray-800 text-white hover:bg-gray-700">Fechar</button>
          </div>
        </div>
      </div>

      <!-- Method Management Modal -->
      <div v-if="showMethodModal" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" @click.self="showMethodModal = false">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
          <div class="p-6 border-b flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Gerenciar Métodos de Custeio</h3>
              <p class="text-sm text-gray-500">Configure o método de custeio para cada produto individualmente</p>
            </div>
            <button @click="showMethodModal = false" class="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="p-6 flex-grow">
            <div class="border rounded-lg overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método Atual</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="product in products" :key="product.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-sm">{{ product.name }}</div>
                      <div class="text-sm text-gray-500">{{ product.sku }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{{ product.category }}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span :class="[getCostingMethodInfo(product.costing_method)?.color, 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full']">
                        {{ getCostingMethodInfo(product.costing_method)?.label }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <select :value="product.costing_method" @change="handleUpdateCostingMethod(product.id, $event)" :disabled="loading" class="w-48 border rounded-md px-2 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                        <option v-for="method in costingMethods" :key="method.value" :value="method.value">{{ method.label }}</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="p-4 bg-gray-50 border-t flex justify-end">
            <button @click="showMethodModal = false" class="px-4 py-2 text-sm font-medium border rounded-md bg-gray-800 text-white hover:bg-gray-700">Fechar</button>
          </div>
        </div>
      </div>

      <!-- Analysis Modal -->
      <div v-if="showAnalysisModal" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" @click.self="showAnalysisModal = false">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
          <div class="p-6 border-b flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Análise de Movimentações por Método</h3>
              <p class="text-sm text-gray-500">Estatísticas considerando métodos individualizados por produto</p>
            </div>
            <button @click="showAnalysisModal = false" class="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="p-6 space-y-6 flex-grow bg-gray-50">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="bg-white p-4 rounded-lg border">
                <h4 class="text-sm text-gray-500">Total de Entradas</h4>
                <p class="text-2xl font-bold text-green-600">{{ entryMovements }}</p>
                <p class="text-xs text-gray-500">{{ stockMovements.filter((m: StoreStockMovement) => m.movement_type === 'purchase').reduce((sum: number, m: StoreStockMovement) => sum + m.quantity, 0) }} unidades</p>
              </div>
              <div class="bg-white p-4 rounded-lg border">
                <h4 class="text-sm text-gray-500">Total de Saídas</h4>
                <p class="text-2xl font-bold text-red-600">{{ exitMovements }}</p>
                <p class="text-xs text-gray-500">{{ stockMovements.filter((m: StoreStockMovement) => m.movement_type === 'sale').reduce((sum: number, m: StoreStockMovement) => sum + m.quantity, 0) }} unidades</p>
              </div>
              <div class="bg-white p-4 rounded-lg border">
                <h4 class="text-sm text-gray-500">Métodos Utilizados</h4>
                <p class="text-2xl font-bold">{{ costingMethods.length }}</p>
                <p class="text-xs text-gray-500">Diferentes métodos</p>
              </div>
              <div class="bg-white p-4 rounded-lg border">
                <h4 class="text-sm text-gray-500">Valor Total</h4>
                <p class="text-lg font-bold">{{ formatCurrency(getTotalInventoryValue) }}</p>
                <p class="text-xs text-gray-500">Métodos individuais</p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white p-6 rounded-lg border">
                <h4 class="text-base font-semibold mb-4">Distribuição por Método</h4>
                <div class="space-y-4">
                  <div v-for="method in costingMethods" :key="method.value">
                    <div class="flex justify-between items-center mb-1">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">{{ method.label }}</span>
                      </div>
                      <span class="text-sm text-gray-600">{{ getCostingMethodSummary[method.value].count }} produtos</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="h-2 rounded-full" :class="method.value === 'fifo' ? 'bg-blue-500' : method.value === 'lifo' ? 'bg-green-500' : 'bg-purple-500'" :style="{ width: products.length > 0 ? (getCostingMethodSummary[method.value].count / products.length) * 100 + '%' : '0%' }"></div>
                    </div>
                    <div class="text-xs text-gray-500 text-right mt-1">{{ formatCurrency(getCostingMethodSummary[method.value].value) }}</div>
                  </div>
                </div>
              </div>

              <div class="bg-white p-6 rounded-lg border">
                <h4 class="text-base font-semibold mb-4">Produtos Mais Movimentados</h4>
                <div class="space-y-4">
                  <div v-for="(product, index) in mostMovedProducts" :key="product.id" class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold">{{ index + 1 }}</div>
                      <div>
                        <div class="text-sm font-medium">{{ product.name }}</div>
                        <div class="text-xs text-gray-500">{{ product.sku }}</div>
                      </div>
                    </div>
                    <div class="text-sm font-bold">{{ product.movementCount }} mov.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4 bg-gray-50 border-t flex justify-end">
            <button @click="showAnalysisModal = false" class="px-4 py-2 text-sm font-medium border rounded-md bg-gray-800 text-white hover:bg-gray-700">Fechar</button>
          </div>
        </div>
      </div>
    </div>

  </main>
</template>