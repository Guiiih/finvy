<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <h1 class="title">Finvy</h1>
        <nav>
          <RouterLink to="/">Dashboard</RouterLink>
          <RouterLink to="/accounts">Plano de Contas</RouterLink> <RouterLink to="/products">Produtos</RouterLink>
          <RouterLink to="/reports">Relatórios</RouterLink>
        </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
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
</style>