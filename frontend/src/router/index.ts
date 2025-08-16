import { createRouter, createWebHistory } from 'vue-router'

import { supabase } from '@/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: () => import('../views/LandingPage.vue'),
    },
    {
      path: '/dashboard',
      name: 'Initial',
      component: () => import('../views/dashboard/InitialView.vue'),
      meta: { requiresAuth: true, title: 'Visão Geral' },
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('../views/accounting/AccountsView.vue'),
      meta: { requiresAuth: true, title: 'Contas Contábeis' },
    },
    {
      path: '/journal-entries',
      name: 'journal-entries',
      component: () => import('../views/accounting/JournalEntryView.vue'),
      meta: { requiresAuth: true, title: 'Lançamentos Contábeis' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/inventory/ProductsView.vue'),
      meta: { requiresAuth: true, title: 'Produtos' },
    },
    {
      path: '/stock-control',
      name: 'stock-control',
      component: () => import('../views/inventory/StockControlView.vue'),
      meta: { requiresAuth: true, title: 'Controle de Estoque' },
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: () => import('../views/accounting/LedgerView.vue'),
      meta: { requiresAuth: true, title: 'Razão' },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/reports/ReportsView.vue'),
      meta: { requiresAuth: true, title: 'Relatórios' },
    },

    {
      path: '/accounting-periods',
      name: 'accounting-periods',
      component: () => import('../views/accounting/AccountingPeriodView.vue'),
      meta: { requiresAuth: true, title: 'Gestão de Períodos Contábeis' },
    },
    
    {
      path: '/accounts-payable',
      name: 'accounts-payable',
      component: () => import('../views/financials/AccountsPayableView.vue'),
      meta: { requiresAuth: true, title: 'Contas a Pagar' },
    },
    {
      path: '/accounts-receivable',
      name: 'accounts-receivable',
      component: () => import('../views/financials/AccountsReceivableView.vue'),
      meta: { requiresAuth: true, title: 'Contas a Receber' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { title: 'Login' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { title: 'Cadastro' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordView.vue'),
      meta: { title: 'Esqueci a Senha' },
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('../views/auth/UpdatePasswordView.vue'),
      meta: { title: 'Atualizar Senha' },
    },
    {
      path: '/registration-success',
      name: 'registration-success',
      component: () => import('../views/auth/RegistrationSuccessView.vue'),
      meta: { hideNavbar: true, title: 'Cadastro Concluído' },
    },
    {
      path: '/password-reset-success',
      name: 'password-reset-success',
      component: () => import('../views/auth/PasswordResetSuccessView.vue'),
      meta: { hideNavbar: true, title: 'Redefinição de Senha' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/settings/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Configurações' },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next('/login')
  } else if (
    (to.path === '/login' ||
      to.path === '/register' ||
      to.path === '/forgot-password' ||
      to.path === '/' ||
      to.path === '/registration-success') &&
    session
  ) {
    next('/dashboard')
  } else {
    next()
  }
})

router.afterEach((to) => {
  const appName = 'Finvy'
  let viewName = ''

  if (to.meta.title) {
    viewName = to.meta.title as string
  } else if (to.name) {
    viewName = String(to.name)
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  document.title = viewName ? `${appName} | ${viewName}` : appName
})

export default router
