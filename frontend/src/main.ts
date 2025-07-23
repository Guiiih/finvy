import './assets/main.css'

import 'primeicons/primeicons.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useAuthStore } from './stores/authStore'

import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import { Cropper } from 'vue-advanced-cropper'

import Tooltip from 'primevue/tooltip'
import MyAuraPreset from '@/themes/MyAuraPreset'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(PrimeVue, {
  theme: {
    preset: MyAuraPreset,
    options: {
      darkModeSelector: '.dark',
    },
  },
})
app.use(ToastService)
app.directive('tooltip', Tooltip)
app.component('InputText', InputText)
app.component('PPassword', Password)
app.component('PButton', Button)
app.component('PDialog', Dialog)
app.component('FileUpload', FileUpload)
app.component('SelectButton', SelectButton)
app.component('PDropdown', Dropdown)
app.component('AppCropper', Cropper)

async function initApp() {
  const authStore = useAuthStore()
  await authStore.initAuthListener()
  app.use(router)
  app.mount('#app')
}

initApp()
