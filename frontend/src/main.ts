// src/main.ts
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/authStore' // Importar o authStore

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia() // Criar a instância do Pinia

app.use(pinia) // Usar a instância do Pinia

// Inicializar o authStore antes de montar a aplicação
async function initApp() {
  const authStore = useAuthStore()
  await authStore.initAuthListener() // Aguardar a inicialização do listener de autenticação
  app.use(router) // Usar o router após a inicialização do authStore
  app.mount('#app')
}

initApp()