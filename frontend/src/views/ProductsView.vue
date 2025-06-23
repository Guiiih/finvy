<script setup lang="ts">
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();
</script>

<template>
  <div class="products">
    <h2>Gerenciamento de Produtos</h2>
    <p>Aqui você pode visualizar e gerenciar seus produtos.</p>

    <table>
      <thead>
        <tr>
          <th>Nome do Produto</th>
          <th>Quantidade</th>
          <th>Preço Unitário</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in productStore.products" :key="product.id">
          <td>{{ product.name }}</td>
          <td>{{ product.quantity }}</td>
          <td>R$ {{ product.unitPrice.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.products { padding: 1rem; }
table {
  width: 100%;
  margin-top: 1.5rem;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #e0e0e0;
  padding: 0.75rem;
  text-align: left;
}
th {
  background-color: #f8f8f8;
  font-weight: 600;
}
</style>