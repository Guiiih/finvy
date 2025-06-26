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
import DFCView from '../views/DFCView.vue'
import ReportsView from '../views/ReportsView.vue'
import VariationView from '../views/VariationView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import UpdatePasswordView from '../views/UpdatePasswordView.vue'
import { supabase } from '../supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/journal-entries',
      name: 'journal-entries',
      component: JournalEntryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/stock-control',
      name: 'stock-control',
      component: StockControlView,
      meta: { requiresAuth: true }
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: LedgerView,
      meta: { requiresAuth: true }
    },
    {
      path: '/dre',
      name: 'dre',
      component: DREView,
      meta: { requiresAuth: true }
    },
    {
      path: '/balance-sheet',
      name: 'balance-sheet',
      component: BalanceSheetView,
      meta: { requiresAuth: true }
    },
    {
      path: '/dfc',
      name: 'dfc',
      component: DFCView,
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/variations',
      name: 'variations',
      component: VariationView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: UpdatePasswordView
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !session) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register' || to.path === '/forgot-password') && session) {
    next('/');
  } else {
    next();
  }
});

export default router