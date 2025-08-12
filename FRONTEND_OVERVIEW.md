# Visão Geral do Frontend (FRONTEND_OVERVIEW)

O frontend do Finvy é uma Single Page Application (SPA) moderna e reativa, construída com Vue.js 3 e TypeScript. Ele utiliza o ecossistema Vue para fornecer uma experiência de usuário rica e interativa, com gerenciamento de estado centralizado e um sistema de componentes bem definido.

## Arquitetura e Camadas Principais:

1.  **Views (`frontend/src/views/`):**
    *   Representam as páginas principais da aplicação (ex: Dashboard, Contas, Lançamentos).
    *   São responsáveis por compor o layout da página, buscar os dados iniciais necessários através dos stores e apresentar a informação ao usuário.

2.  **Components (`frontend/src/components/`):**
    *   Contém componentes Vue reutilizáveis que são usados em múltiplas views.
    *   Exemplos incluem modais de formulário (`AccountFormModal`, `JournalEntryFormModal`), componentes de UI específicos (`UserMenu`, `InfoCard`) e componentes de relatórios (`BalanceSheet`, `IncomeStatement`).

3.  **Stores (`frontend/src/stores/`):**
    *   Utiliza o **Pinia** para gerenciamento de estado global. Cada store é responsável por uma parte específica do estado da aplicação (ex: `authStore` para autenticação, `accountStore` para o plano de contas, `journalEntryStore` para lançamentos).
    *   As stores encapsulam a lógica de busca de dados (fetching), atualização e cache, agindo como a "fonte da verdade" para os componentes.

4.  **Services (`frontend/src/services/`):**
    *   Abstrai a comunicação com a API do backend.
    *   `apiClient.ts` é um wrapper configurado para o `fetch` que automaticamente injeta o token de autenticação (JWT) nos cabeçalhos e lida com respostas de erro de forma padronizada.
    *   Serviços específicos (ex: `productApiService.ts`, `chatbotApiService.ts`) exportam funções tipadas para interagir com os endpoints da API, tornando o código das stores e componentes mais limpo.

5.  **Router (`frontend/src/router/`):**
    *   Utiliza o **Vue Router** para gerenciar a navegação do lado do cliente.
    *   Define todas as rotas da aplicação e implementa um `beforeEach` guard para proteger rotas que exigem autenticação, redirecionando usuários não logados para a página de login.

6.  **Types (`frontend/src/types/`):**
    *   Define as interfaces e tipos TypeScript para todas as entidades de dados (ex: `Account`, `JournalEntry`, `Product`), garantindo a segurança de tipo e a consistência dos dados em toda a aplicação.

## Tecnologias e Bibliotecas Chave:

*   **Vue.js 3:** Framework principal, utilizando a Composition API e a sintaxe `<script setup>`.
*   **TypeScript:** Garante a tipagem estática e a robustez do código.
*   **Pinia:** Biblioteca oficial de gerenciamento de estado para Vue.js.
*   **Vue Router:** Biblioteca oficial para roteamento.
*   **PrimeVue:** Biblioteca de componentes de UI rica e personalizável.
*   **TailwindCSS:** Framework de CSS utility-first para estilização rápida e consistente.
*   **VeeValidate & Zod:** Utilizados em conjunto para validação de formulários do lado do cliente.
*   **Supabase Client:** Usado para interagir com o Supabase para autenticação.

## Fluxos de Dados e Considerações Importantes:

*   **Reatividade:** A aplicação é construída em torno do sistema de reatividade do Vue. O estado é mantido nas stores do Pinia, e os componentes reagem automaticamente a quaisquer alterações nesse estado.
*   **Autenticação:** O `authStore` gerencia o estado de autenticação do usuário. Ele escuta as mudanças de estado do Supabase, armazena o token de acesso e busca o perfil do usuário. O token é então usado pelo `apiClient` para fazer requisições autenticadas.
*   **Componentização:** A interface é dividida em componentes pequenos e reutilizáveis, promovendo a manutenibilidade e a consistência visual.
*   **Estilização:** A estilização é feita primariamente com TailwindCSS, mas personalizada e estendida através de um preset customizado do PrimeVue (`MyAuraPreset`), garantindo uma aparência única e coesa.
