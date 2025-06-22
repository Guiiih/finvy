import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import AccountsView from '../views/AccountsView.vue' // IMPORTAR A NOVA VIEW

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/accounts', // ROTA NOVA
      name: 'accounts',
      component: AccountsView
    }
  ]
})

export default router