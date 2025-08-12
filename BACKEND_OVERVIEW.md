# Visão Geral do Backend (BACKEND_OVERVIEW)

O backend do Finvy é uma aplicação Node.js/TypeScript construída para ser executada em um ambiente serverless (Vercel). Ele interage com um banco de dados PostgreSQL gerenciado pelo Supabase, que também é utilizado para autenticação e políticas de Row Level Security (RLS).

## Arquitetura e Camadas Principais:

1.  **Handlers (`backend/handlers/`):**
    *   São os pontos de entrada da API, responsáveis por receber as requisições HTTP, validar os dados de entrada e delegar a lógica de negócio para os serviços apropriados.
    *   Utilizam o middleware `withAuth` para autenticação e extração do contexto do usuário (ID, organização, período contábil ativo).
    *   Lidam com a formatação das respostas HTTP e tratamento de erros.

2.  **Serviços (`backend/services/`):**
    *   Contêm a lógica de negócio principal da aplicação.
    *   São responsáveis por orquestrar operações complexas, interagir com o banco de dados (via Supabase Client) e se comunicar com APIs externas (como a API Gemini para funcionalidades de IA).
    *   Exemplos incluem `AccountService`, `JournalEntryService`, `TaxService`, `ChatbotService`, etc.

3.  **Tipos (`backend/types/`):**
    *   Define as interfaces e tipos TypeScript para as entidades de dados e estruturas de requisição/resposta, garantindo a segurança de tipo em toda a aplicação.

4.  **Utilitários (`backend/utils/`):**
    *   Contém funções auxiliares e módulos reutilizáveis, como logger, manipuladores de erro, clientes Supabase e schemas de validação (Zod).

## Tecnologias Chave:

*   **Node.js/TypeScript:** Linguagem e ambiente de desenvolvimento.
*   **Vercel:** Plataforma serverless para deploy da API.
*   **Supabase:** Backend-as-a-Service (BaaS) que fornece:
    *   **PostgreSQL:** Banco de dados relacional para armazenamento de dados.
    *   **Supabase Auth:** Gerenciamento de usuários e autenticação (JWT).
    *   **Row Level Security (RLS):** Políticas de segurança no banco de dados para garantir que os usuários só possam acessar seus próprios dados ou dados compartilhados.
    *   **RPC (Remote Procedure Calls):** Funções de banco de dados para encapsular lógica complexa e garantir atomicidade (ex: `create_organization_and_assign_owner`, `record_purchase`).
*   **Zod:** Biblioteca para validação de schemas de dados, garantindo a integridade das entradas da API.
*   **Gemini API:** Utilizada para funcionalidades de Inteligência Artificial, como resolução de exercícios contábeis e validação de lançamentos.
*   **ExcelJS, PDFKit, xml2js:** Bibliotecas para manipulação e exportação de dados em diferentes formatos (Excel, PDF, parsing de XML de NF-e).

## Fluxos de Dados e Considerações Importantes:

*   **Autenticação:** Todas as rotas protegidas utilizam um middleware `withAuth` que valida o JWT do Supabase e injeta o `user_id`, `organization_id` e `active_accounting_period_id` na requisição, garantindo que todas as operações sejam realizadas no contexto correto do usuário e da organização.
*   **Escopo de Dados:** Os dados são consistentemente escopados por `organization_id` e `active_accounting_period_id`, que são obtidos no início de cada handler. Isso, combinado com as políticas de RLS do Supabase, garante que os usuários só possam acessar e modificar os dados aos quais têm permissão.
*   **Operações Críticas:** Operações que exigem acesso elevado (como exclusão de usuário ou gerenciamento de papéis de organização) utilizam o cliente `getSupabaseAdmin()`, que ignora as políticas de RLS. O acesso a esses endpoints é rigorosamente controlado por verificações de papel (`owner`, `admin`).
*   **Integração com IA:** A API Gemini é utilizada para funcionalidades inteligentes, como a resolução de exercícios contábeis e a validação de lançamentos, transformando texto não estruturado em dados contábeis estruturados.
*   **Integridade de Dados:** Operações complexas de banco de dados (como exclusão de lançamentos com suas linhas ou registro de compras/vendas de produtos) são delegadas a funções RPC no Supabase para garantir atomicidade e integridade transacional.
