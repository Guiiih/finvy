
import { createRouter, createWebHistory } from 'vue-router'

import { supabase } from '../supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Inital',
      component: () => import('../views/InitialView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('../views/AccountsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/journal-entries',
      name: 'journal-entries',
      component: () => import('../views/JournalEntryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/stock-control',
      name: 'stock-control',
      component: () => import('../views/StockControlView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: () => import('../views/LedgerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dre',
          name: 'dre-report',
          component: () => import('../views/DREView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'balance-sheet',
          name: 'balance-sheet-report',
          component: () => import('../views/BalanceSheetView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'dfc',
          name: 'dfc-report',
          component: () => import('../views/DFCView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/variations',
      name: 'variations',
      component: () => import('../views/VariationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/trial-balance',
      name: 'trial-balance',
      component: () => import('../views/TrialBalanceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chart-of-accounts',
      name: 'chart-of-accounts',
      component: () => import('../views/ChartOfAccountsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/year-end-closing',
      name: 'year-end-closing',
      component: () => import('../views/YearEndClosingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/accounts-payable',
      name: 'accounts-payable',
      component: () => import('../views/AccountsPayableView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/accounts-receivable',
      name: 'accounts-receivable',
      component: () => import('../views/AccountsReceivableView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('../views/UpdatePasswordView.vue'),
    },
    {
      path: '/registration-success',
      name: 'registration-success',
      component: () => import('../views/RegistrationSuccessView.vue'),
      meta: { hideNavbar: true },
    },
    {
      path: '/password-reset-success',
      name: 'password-reset-success',
      component: () => import('../views/PasswordResetSuccessView.vue'),
      meta: { hideNavbar: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/HelpView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next('/login')
  } else if (
    (to.path === '/login' || to.path === '/register' || to.path === '/forgot-password') &&
    session
  ) {
    next('/')
  } else {
    next()
  }
})

export default router
