<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from './supabase'

const router = useRouter()
const session = ref(null)

supabase.auth.getSession().then(({ data }) => {
  session.value = data.session
})

supabase.auth.onAuthStateChange((_, _session) => {
  session.value = _session
})

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/login')
  } catch (error: any) {
    alert(error.message)
  }
}
</script>

<template>
  <div v-if="session">
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
          <RouterLink to="/balance-sheet">Balanço Patrimonial</n          ><RouterLink to="/dfc">DFC</RouterLink>
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
