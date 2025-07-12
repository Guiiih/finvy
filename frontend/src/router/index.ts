
import { createRouter, createWebHistory } from 'vue-router'

import { supabase } from '../supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Inital',
      component: () => import('../views/InitialView.vue'),
      meta: { requiresAuth: true, title: 'Visão Geral' },
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('../views/AccountsView.vue'),
      meta: { requiresAuth: true, title: 'Contas Contábeis' },
    },
    {
      path: '/journal-entries',
      name: 'journal-entries',
      component: () => import('../views/JournalEntryView.vue'),
      meta: { requiresAuth: true, title: 'Lançamentos Contábeis' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true, title: 'Produtos' },
    },
    {
      path: '/stock-control',
      name: 'stock-control',
      component: () => import('../views/StockControlView.vue'),
      meta: { requiresAuth: true, title: 'Controle de Estoque' },
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: () => import('../views/LedgerView.vue'),
      meta: { requiresAuth: true, title: 'Razão' },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true, title: 'Relatórios' },
      children: [
        {
          path: 'dre',
          name: 'dre-report',
          component: () => import('../views/DREView.vue'),
          meta: { requiresAuth: true, title: 'DRE' },
        },
        {
          path: 'balance-sheet',
          name: 'balance-sheet-report',
          component: () => import('../views/BalanceSheetView.vue'),
          meta: { requiresAuth: true, title: 'Balanço Patrimonial' },
        },
        {
          path: 'dfc',
          name: 'dfc-report',
          component: () => import('../views/DFCView.vue'),
          meta: { requiresAuth: true, title: 'DFC' },
        },
      ],
    },
    {
      path: '/variations',
      name: 'variations',
      component: () => import('../views/VariationView.vue'),
      meta: { requiresAuth: true, title: 'Variações' },
    },
    {
      path: '/trial-balance',
      name: 'trial-balance',
      component: () => import('../views/TrialBalanceView.vue'),
      meta: { requiresAuth: true, title: 'Balancete de Verificação' },
    },
    {
      path: '/chart-of-accounts',
      name: 'chart-of-accounts',
      component: () => import('../views/ChartOfAccountsView.vue'),
      meta: { requiresAuth: true, title: 'Plano de Contas' },
    },
    {
      path: '/year-end-closing',
      name: 'year-end-closing',
      component: () => import('../views/YearEndClosingView.vue'),
      meta: { requiresAuth: true, title: 'Fechamento de Exercício' },
    },
    {
      path: '/accounts-payable',
      name: 'accounts-payable',
      component: () => import('../views/AccountsPayableView.vue'),
      meta: { requiresAuth: true, title: 'Contas a Pagar' },
    },
    {
      path: '/accounts-receivable',
      name: 'accounts-receivable',
      component: () => import('../views/AccountsReceivableView.vue'),
      meta: { requiresAuth: true, title: 'Contas a Receber' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Login' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { title: 'Cadastro' },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      meta: { title: 'Esqueci a Senha' },
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('../views/UpdatePasswordView.vue'),
      meta: { title: 'Atualizar Senha' },
    },
    {
      path: '/registration-success',
      name: 'registration-success',
      component: () => import('../views/RegistrationSuccessView.vue'),
      meta: { hideNavbar: true, title: 'Cadastro Concluído' },
    },
    {
      path: '/password-reset-success',
      name: 'password-reset-success',
      component: () => import('../views/PasswordResetSuccessView.vue'),
      meta: { hideNavbar: true, title: 'Redefinição de Senha' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Configurações' },
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/HelpView.vue'),
      meta: { requiresAuth: true, title: 'Ajuda' },
    },
    {
      path: '/accounting-periods',
      name: 'accounting-periods',
      component: () => import('../views/AccountingPeriodView.vue'),
      meta: { requiresAuth: true, title: 'Gestão de Períodos Contábeis' },
    },
    {
      path: '/docs/project',
      name: 'project-docs',
      component: () => import('../views/ProjectDocsView.vue'),
      meta: { requiresAuth: true, title: 'Documentação do Projeto' },

    },
    {
      path: '/docs/api',
      name: 'api-docs',
      component: () => import('../views/ApiDocsView.vue'),
      meta: { requiresAuth: true, title: 'Documentação da API' },
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('../views/FaqView.vue'),
      meta: { requiresAuth: true, title: 'FAQ' },
    },

    {
      path: '/support',
      name: 'support',
      component: () => import('../views/SupportView.vue'),
      meta: { requiresAuth: true, title: 'Suporte' },
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

router.afterEach((to) => {
  const appName = 'Finvy';
  let viewName = '';

  if (to.meta.title) {
    viewName = to.meta.title as string;
  } else if (to.name) {
    viewName = String(to.name)
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  document.title = viewName ? `${appName} | ${viewName}` : appName;
});

export default router
