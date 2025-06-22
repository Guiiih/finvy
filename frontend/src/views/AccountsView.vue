<script setup lang="ts">
import { useAccountStore } from '@/stores/accountStore';

// Acessando nosso armazém de contas
const accountStore = useAccountStore();
</script>

<template>
  <div class="accounts">
    <h2>Plano de Contas</h2>
    <p>Aqui estão as contas contábeis da sua empresa. No futuro, você poderá adicionar, editar e remover contas.</p>

    <table>
      <thead>
        <tr>
          <th>Nome da Conta</th>
          <th>Tipo</th>
          <th>Natureza</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="account in accountStore.accounts" :key="account.id">
          <td>{{ account.name }}</td>
          <td>{{ account.type }}</td>
          <td>{{ account.nature }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.accounts { padding: 1rem; }
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