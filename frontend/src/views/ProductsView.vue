<script setup lang="ts">
import { ref, onMounted, computed, watchEffect } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore'; // Importar o authStore
import type { Product } from '@/types';
import BaseTable from '@/components/BaseTable.vue';

const productStore = useProductStore();
const authStore = useAuthStore(); // Instanciar o authStore

const newProductName = ref('');
const newProductDescription = ref('');
const newProductUnitCost = ref(0);
const newProductCurrentStock = ref(0);

const isEditing = ref(false);
const editingProduct = ref<Product | null>(null);

const filteredProducts = computed(() => productStore.products);

const headers = [
  { key: 'name', label: 'Nome', align: 'left' as const },
  { key: 'description', label: 'Descrição', align: 'left' as const },
  { key: 'unit_cost', label: 'Custo Unitário', align: 'right' as const },
  { key: 'current_stock', label: 'Estoque Atual', align: 'center' as const },
  { key: 'actions', label: 'Ações', align: 'center' as const },
];

const productNameModel = computed({
  get() {
    return isEditing.value && editingProduct.value ? editingProduct.value.name : newProductName.value;
  },
  set(newValue: string) {
    if (isEditing.value && editingProduct.value) {
      editingProduct.value.name = newValue;
    } else {
      newProductName.value = newValue;
    }
  }
});

const productDescriptionModel = computed({
  get() {
    return isEditing.value && editingProduct.value ? editingProduct.value.description || '' : newProductDescription.value;
  },
  set(newValue: string) {
    if (isEditing.value && editingProduct.value) {
      editingProduct.value.description = newValue;
    } else {
      newProductDescription.value = newValue;
    }
  }
});

const productUnitCostModel = computed({
  get() {
    return isEditing.value && editingProduct.value ? editingProduct.value.unit_cost : newProductUnitCost.value;
  },
  set(newValue: number) {
    if (isEditing.value && editingProduct.value) {
      editingProduct.value.unit_cost = newValue;
    } else {
      newProductUnitCost.value = newValue;
    }
  }
});

const productCurrentStockModel = computed({
  get() {
    return isEditing.value && editingProduct.value ? editingProduct.value.current_stock : newProductCurrentStock.value;
  },
  set(newValue: number) {
    if (isEditing.value && editingProduct.value) {
      editingProduct.value.current_stock = newValue;
    } else {
      newProductCurrentStock.value = newValue;
    }
  }
});

async function loadProducts() {
  await productStore.fetchProducts();
}

async function handleAddProduct() {
  if (!newProductName.value || newProductUnitCost.value === 0) {
    alert('Por favor, preencha o nome e o custo unitário do produto.');
    return;
  }
  try {
    await productStore.addProduct({
      name: newProductName.value,
      description: newProductDescription.value,
      unit_cost: newProductUnitCost.value,
      current_stock: newProductCurrentStock.value,
    });
    newProductName.value = '';
    newProductDescription.value = '';
    newProductUnitCost.value = 0;
    newProductCurrentStock.value = 0;
  } catch (error) {
    alert(productStore.error || 'Erro ao adicionar produto.');
  }
}

function startEdit(product: Product) {
  isEditing.value = true;
  editingProduct.value = { ...product };
}

async function handleUpdateProduct() {
  if (!editingProduct.value || !editingProduct.value.id) return;

  try {
    await productStore.updateProduct(editingProduct.value.id, {
      name: editingProduct.value.name,
      description: editingProduct.value.description,
      unit_cost: editingProduct.value.unit_cost,
      current_stock: editingProduct.value.current_stock,
    });
    isEditing.value = false;
    editingProduct.value = null;
  } catch (error) {
    alert(productStore.error || 'Erro ao atualizar produto.');
  }
}

async function handleDeleteProduct(id: string) {
  if (confirm('Tem certeza de que deseja excluir este produto?')) {
    try {
      await productStore.deleteProduct(id);
    } catch (error) {
      alert(productStore.error || 'Erro ao deletar produto.');
    }
  }
}

// Usar watchEffect para carregar produtos apenas quando o authStore estiver pronto e logado
watchEffect(() => {
  if (!authStore.loading && authStore.isLoggedIn) {
    loadProducts();
  }
});

</script>

<template>
  <div class="products-container">
    <h1>Gerenciar Produtos</h1>

    <div class="form-section">
      <h2>{{ isEditing ? 'Editar Produto' : 'Adicionar Novo Produto' }}</h2>
      <form @submit.prevent="isEditing ? handleUpdateProduct() : handleAddProduct()">
        <div class="form-group">
          <label for="productName">Nome do Produto:</label>
          <input type="text" id="productName" v-model="productNameModel" required />
        </div>
        <div class="form-group">
          <label for="productDescription">Descrição:</label>
          <input type="text" id="productDescription" v-model="productDescriptionModel" />
        </div>
        <div class="form-group">
          <label for="productUnitCost">Custo Unitário:</label>
          <input type="number" id="productUnitCost" v-model.number="productUnitCostModel" required step="0.01" />
        </div>
        <div class="form-group">
          <label for="productCurrentStock">Estoque Atual:</label>
          <input type="number" id="productCurrentStock" v-model.number="productCurrentStockModel" required />
        </div>
        <button type="submit">{{ isEditing ? 'Atualizar Produto' : 'Adicionar Produto' }}</button>
        <button v-if="isEditing" type="button" @click="isEditing = false; editingProduct = null">Cancelar</button>
      </form>
    </div>

    <div class="products-list-section">
      <h2>Produtos Existentes</h2>
      <p v-if="productStore.loading">Carregando produtos...</p>
      <p v-else-if="productStore.error" class="error-message">{{ productStore.error }}</p>
      <BaseTable
        v-else
        :headers="headers"
        :items="filteredProducts"
        empty-message="Nenhum produto encontrado. Adicione um novo produto acima."
      >
        <template #cell(unit_cost)="{ value }">
          R$ {{ value.toFixed(2) }}
        </template>
        <template #cell(actions)="{ item }">
          <button @click="startEdit(item as Product)">Editar</button>
          <button @click="handleDeleteProduct(item.id!)" class="delete-button">Excluir</button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>

<style scoped>
.products-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.form-section, .products-list-section {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-right: 10px;
}

button[type="submit"] {
  background-color: #007bff;
  color: white;
}

button[type="submit"]:hover {
  background-color: #0056b3;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 10px;
}
</style>