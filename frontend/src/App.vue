<script setup lang="ts">
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';
import { ref, onMounted, computed, watch } from 'vue'; // Adicione watch
import { supabase } from './supabase';
import { useAuthStore } from './stores/authStore'; // Importe a authStore
import { useAccountStore } from './stores/accountStore'; // Importe accountStore
import { useProductStore } from './stores/productStore'; // Importe productStore
import { useJournalEntryStore } from './stores/journalEntryStore'; // Importe journalEntryStore

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore(); // Instancie authStore
const accountStore = useAccountStore(); // Instancie accountStore
const productStore = useProductStore(); // Instancie productStore
const journalEntryStore = useJournalEntryStore(); // Instancie journalEntryStore

// A sessão agora é gerenciada pela authStore
const session = computed(() => authStore.session);

// NOVO: Adicione um watcher para carregar dados quando o usuário logar
watch(session, async (newSession) => {
  if (newSession && newSession.user) {
    console.log('Sessão ativa detectada, carregando dados globais...');
    await accountStore.fetchAccounts();
    await productStore.fetchProducts();
    await journalEntryStore.fetchJournalEntries();
    // Você pode adicionar mais stores aqui que precisam de dados iniciais após o login
  }
}, { immediate: true }); // Executa imediatamente se a sessão já estiver ativa ao montar

// Remova handleLogout daqui, pois agora está na authStore
const handleLogout = async () => {
  await authStore.signOut(); // Usa a ação signOut da authStore
  if (!authStore.isLoggedIn) {
    router.push('/login');
  }
};

const shouldHideNavbar = computed(() => {
  return route.meta.hideNavbar || false;
});
</script>

<template>
  <div v-if="authStore.isLoggedIn && !shouldHideNavbar">
    <header>
      <div class="wrapper">
        <h1 class="title">Finvy</h1>
        <nav>
          <RouterLink to="/">Dashboard</RouterLink>
          <RouterLink to="/accounts">Plano de Contas</RouterLink>
          <RouterLink to="/journal-entries">Lançamentos Contábeis</RouterLink>
          <RouterLink to="/products">Produtos</RouterLink>
          <RouterLink to="/stock-control">Controle de Estoque</RouterLink>
          <RouterLink to="/ledger">Razão</RouterLink>
          <RouterLink to="/dre">DRE</RouterLink>
          <RouterLink to="/balance-sheet">Balanço Patrimonial</RouterLink>
          <RouterLink to="/dfc">DFC</RouterLink>
          <RouterLink to="/variations">Variações</RouterLink>
          <RouterLink to="/reports">Relatórios</RouterLink>
          <button @click="handleLogout" class="logout-button">Sair</button>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
  <div v-else>
    <RouterView />
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

nav {
  width: 100%;
  font-size: 1rem;
  text-align: center;
  margin-top: 1rem;
}

nav a.router-link-exact-active {
  color: hsla(160, 100%, 37%, 1);
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;
}

.logout-button:hover {
  background-color: #c82333;
}
</style>