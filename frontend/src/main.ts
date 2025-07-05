import './assets/main.css'

import 'primeicons/primeicons.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useAuthStore } from './stores/authStore'

import App from './App.vue'
import router from './router'

import ToastService from 'primevue/toastservice'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(ToastService)

async function initApp() {
  const authStore = useAuthStore()
    await authStore.initAuthListener()
  app.use(router)
  app.mount('#app')
}

initApp()