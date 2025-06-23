// frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import AccountsView from '../views/AccountsView.vue'
import JournalEntryView from '../views/JournalEntryView.vue'
import ProductsView from '../views/ProductsView.vue'
import StockControlView from '../views/StockControlView.vue'
import LedgerView from '../views/LedgerView.vue'
import DREView from '../views/DREView.vue'
import BalanceSheetView from '../views/BalanceSheetView.vue'
import DFCView from '../views/DFCView.vue' // IMPORTAR A NOVA VIEW DO DFC
import ReportsView from '../views/ReportsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsView
    },
    {
      path: '/journal-entries',
      name: 'journal-entries',
      component: JournalEntryView
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView
    },
    {
      path: '/stock-control',
      name: 'stock-control',
      component: StockControlView
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: LedgerView
    },
    {
      path: '/dre',
      name: 'dre',
      component: DREView
    },
    {
      path: '/balance-sheet',
      name: 'balance-sheet',
      component: BalanceSheetView
    },
    {
      path: '/dfc', // NOVA ROTA PARA O DFC
      name: 'dfc',
      component: DFCView
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView
    }
  ]
})

export default router