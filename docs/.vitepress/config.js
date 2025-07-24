export default {
  base: '/docs/',
  title: 'Finvy',
  description: 'Documentação do Finvy',
  appearance: 'dark',
  themeConfig: {
    nav: [
      { text: 'Documentação', link: '/guide/introduction' },
      { text: 'API', link: '/api/introduction' },
      { text: 'Changelog', link: '/changelog/product-updates' },
      { text: 'Políticas', link: '/policies/terms-of-service' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guia do Usuário',
          items: [
            { text: 'Introdução', link: '/guide/introduction' },
            { text: 'Início Rápido', link: '/guide/quickstart' },
            { text: 'Gestão de Organizações', link: '/guide/organizations' },
            { text: 'Gestão de Períodos Contábeis', link: '/guide/accounting-periods' },
            { text: 'Plano de Contas', link: '/guide/accounts' },
            { text: 'Lançamentos Contábeis', link: '/guide/journal-entries' },
            { text: 'Controle de Estoque e Produtos', link: '/guide/products-stock' },
            { text: 'Importação de NF-e', link: '/guide/nfe-import' },
            { text: 'Contas a Pagar e Receber', link: '/guide/financial-transactions' },
            { text: 'Geração de Relatórios', link: '/guide/reports' },
            { text: 'Recursos de IA', link: '/guide/ai-features' },
            { text: 'Compartilhamento e Colaboração', link: '/guide/sharing-collaboration' },
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
      ],

      '/policies/': [
        {
          text: 'Políticas',
          items: [
            { text: 'Termos de Serviço', link: '/policies/terms-of-service' },
            { text: 'Política de Privacidade', link: '/policies/privacy-policy' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/finvy' }
    ]
  }
}
