import { defineConfig } from 'vitepress'
// import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Finvy Docs",
  description: "Documentação oficial do Finvy",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guia', link: '/guide/getting-started' },
      { text: 'API', link: '/api/introduction' },
      { text: 'Conceitos', link: '/concepts/what-is-finvy' },
      { text: 'Changelog', link: '/changelog/product-updates' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introdução',
          items: [
            { text: 'O que é o Finvy?', link: '/guide/getting-started' },
            { text: 'Primeiros Passos', link: '/guide/quickstart' },
            { text: 'Recursos de IA', link: '/guide/ai-features' },
          ]
        },
        {
          text: 'Módulos',
          items: [
            { text: 'Lançamentos Contábeis', link: '/guide/journal-entries' },
            { text: 'Contas', link: '/guide/accounts' },
            { text: 'Períodos Contábeis', link: '/guide/accounting-periods' },
            { text: 'Organizações', link: '/guide/organizations' },
            { text: 'Produtos e Estoque', link: '/guide/products-stock' },
            { text: 'Transações Financeiras', link: '/guide/financial-transactions' },
            { text: 'Relatórios', link: '/guide/reports' },
            { text: 'Importação de NF-e', link: '/guide/nfe-import' },
            { text: 'Compartilhamento e Colaboração', link: '/guide/sharing-collaboration' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'Introdução',
          items: [
            { text: 'Visão Geral da API', link: '/api/introduction' },
          ]
        },
        {
          text: 'Módulos da API',
          items: [
            { text: 'API de Administração', link: '/api/admin/introduction' },
            { text: 'API de IA', link: '/api/ai/introduction' },
            { text: 'API de Assistente', link: '/api/assistant/introduction' },
            { text: 'API de Colaboração', link: '/api/collaboration/introduction' },
            { text: 'API Core', link: '/api/core/introduction' },
            { text: 'API Financeira', link: '/api/financials/introduction' },
            { text: 'API de Gerenciamento', link: '/api/management/introduction' },
          ]
        }
      ],
      '/concepts/': [
        {
          text: 'Conceitos Fundamentais',
          items: [
            { text: 'O que é o Finvy?', link: '/concepts/what-is-finvy' },
            { text: 'Lançamentos Contábeis', link: '/concepts/journal-entries' },
            { text: 'Plano de Contas', link: '/concepts/chart-of-accounts' },
          ]
        },
        {
          text: 'Fluxos de Trabalho',
          items: [
            { text: 'Fluxos de Trabalho', link: '/concepts/flows/introduction' },
          ]
        }
      ],
      '/changelog/': [
        {
          text: 'Histórico de Alterações',
          items: [
            { text: 'Atualizações de Produto', link: '/changelog/product-updates' },
            { text: 'Atualização Principal (04/08/2025)', link: '/changelog/20250804_major_update' },
          ]
        }
      ],
      '/policies/': [
        {
          text: 'Políticas',
          items: [
            { text: 'Política de Privacidade', link: '/policies/privacy-policy' },
            { text: 'Termos de Serviço', link: '/policies/terms-of-service' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})