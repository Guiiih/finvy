import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate' // 1. Importe o plugin
import { useAuthStore } from './stores/authStore'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate) // 2. Diga ao Pinia para usar o plugin

app.use(pinia)

async function initApp() {
  const authStore = useAuthStore()
  await authStore.initAuthListener()
  app.use(router)
  app.mount('#app')
}

initApp()