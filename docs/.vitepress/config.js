export default {
  base: '/docs/',
  title: 'Finvy',
  description: 'Documentação do Finvy',
  appearance: 'dark',
  themeConfig: {
    nav: [
      { text: 'Início', link: '/' },
      { text: 'Guia', link: '/guide/introduction' },
      { text: 'API', link: '/api/introduction' },
      { text: 'Changelog', link: '/changelog/product-updates' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guia do Usuário',
          items: [
            { text: 'Introdução', link: '/guide/introduction' },
            { text: 'Início Rápido', link: '/guide/quickstart' },
          ]
        }
      ],

      '/api/': [
        {
          text: 'Introdução',
          items: [
            { text: 'Visão Geral', link: '/api/introduction' },
          ]
        },
        {
          text: 'Contabilidade (Core)',
          items: [
            { text: 'Contas (Plano de Contas)', link: '/api/core/accounts' },
            { text: 'Lançamentos Contábeis', link: '/api/core/journal-entries' },
            { text: 'Linhas de Lançamento', link: '/api/core/entry-lines' },
            { text: 'Produtos e Estoque', link: '/api/core/products' },
            { text: 'Encerramento do Exercício', link: '/api/core/year-end-closing' },
          ]
        },
        {
          text: 'Gestão',
          items: [
            { text: 'Organizações', link: '/api/management/organizations' },
            { text: 'Períodos Contábeis', link: '/api/management/accounting-periods' },
            { text: 'Membros e Papéis', link: '/api/management/user-organization-roles' },
            { text: 'Perfil do Usuário', link: '/api/management/profile' },
            { text: 'Regimes Tributários', link: '/api/management/tax-regime-history' },
          ]
        },
        {
          text: 'Operações Financeiras',
          items: [
            { text: 'Importação de NF-e', link: '/api/financials/nfe-import' },
            { text: 'Contas a Pagar/Receber', link: '/api/financials/financial-transactions' },
            { text: 'Relatórios', link: '/api/financials/reports' },
          ]
        },
        {
          text: 'Recursos de IA e Automação',
          items: [
            { text: 'Chatbot Contábil', link: '/api/ai/chatbot' },
            { text: 'Processador de Documentos', link: '/api/ai/document-processor' },
            { text: 'Resolvedor de Exercícios', link: '/api/ai/exercise-solver' },
            { text: 'Validador de Lançamentos', link: '/api/ai/journal-entry-validator' },
          ]
        },
        {
          text: 'Colaboração e Utilidades',
          items: [
            { text: 'Compartilhamento', link: '/api/collaboration/sharing' },
            { text: 'Notificações', link: '/api/collaboration/notifications' },
            { text: 'Presença de Usuário', link: '/api/collaboration/user-presence' },
            { text: 'Busca de Usuários', link: '/api/collaboration/users' },
          ]
        }
      ],

      '/changelog/': [
        {
          text: 'Changelog',
          items: [
            { text: 'Atualizações do Produto', link: '/changelog/product-updates' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/finvy' }
    ]
  }
}
