<script setup lang="ts">
import { ref, onMounted, computed, watchEffect } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useAuthStore } from '@/stores/authStore'; // Importar o authStore
import type { Product } from '@/types';
import BaseTable from '@/components/BaseTable.vue';

const productStore = useProductStore();
const authStore = useAuthStore(); // Instanciar o authStore

const filteredProducts = computed(() => {
  return productStore.products.map(product => {
    const total_gross_stock = product.unit_cost * product.current_stock;
    const icms_rate = product.icms_rate || 0;
    const icms_value_stock = total_gross_stock * (icms_rate / 100);
    const total_net_stock = total_gross_stock - icms_value_stock;
    return {
      ...product,
      total_gross_stock,
      icms_value_stock,
      total_net_stock,
    };
  });
});

const headers = [
  { key: 'name', label: 'Nome', align: 'left' as const },
  { key: 'description', label: 'Descrição', align: 'left' as const },
  { key: 'unit_cost', label: 'Custo Unitário', align: 'right' as const },
  { key: 'icms_rate', label: 'Alíquota ICMS (%)', align: 'center' as const },
  { key: 'current_stock', label: 'Estoque Atual', align: 'center' as const },
  { key: 'total_gross_stock', label: 'Valor Bruto Total (Estoque)', align: 'right' as const },
  { key: 'icms_value_stock', label: 'ICMS Total (Estoque)', align: 'right' as const },
  { key: 'total_net_stock', label: 'Valor Líquido Total (Estoque)', align: 'right' as const },
  { key: 'actions', label: 'Ações', align: 'center' as const },
];

async function loadProducts() {
  await productStore.fetchProducts();
}

async function handleDeleteProduct(id: string) {
  if (confirm('Tem certeza de que deseja excluir este produto?')) {
    try {
      await productStore.deleteProduct(id);
    } catch (err: unknown) { 
      console.error("Erro ao deletar produto:", err);
      if (err instanceof Error) {
        alert(err.message || 'Erro ao deletar produto.');
      } else {
        alert('Erro ao deletar produto.');
      }
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
        <template #cell(icms_rate)="{ value }">
          {{ value.toFixed(2) }}%
        </template>
        <template #cell(total_gross_stock)="{ value }">
          R$ {{ value.toFixed(2) }}
        </template>
        <template #cell(icms_value_stock)="{ value }">
          R$ {{ value.toFixed(2) }}
        </template>
        <template #cell(total_net_stock)="{ value }">
          R$ {{ value.toFixed(2) }}
        </template>
        <template #cell(actions)="{ item }">
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