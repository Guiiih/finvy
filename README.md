# Finvy: Seu Laboratório de Contabilidade Micro SaaS

## Visão Geral

O Finvy é um Micro SaaS (Software as a Service) em desenvolvimento, concebido para ser uma ferramenta poderosa e intuitiva para a resolução de exercícios práticos de contabilidade. A sua génese reside na necessidade de transcender as limitações das folhas de cálculo, que, embora flexíveis, são propensas a erros de fórmula, carecem de integridade de dados e não são escaláveis. O objetivo do Finvy é substituir essa complexidade, oferecendo uma plataforma web onde os utilizadores podem aplicar princípios contábeis fundamentais — como o controlo de stock por custo médio, o método das partidas dobradas e a apuração de resultados — de forma automatizada, visual e segura. A visão a longo prazo é solidificar o Finvy como uma ferramenta educacional de referência e, potencialmente, um serviço comercial para pequenos negócios que necessitem de um controlo financeiro e de inventário simplificado e robusto.

## Funcionalidades Implementadas

Até o momento, o Finvy conta com as seguintes funcionalidades e melhorias, visando aprimorar a experiência do usuário e a aderência a práticas contábeis profissionais:

### 1. Gestão de Contas Contábeis
*   **Criação e Visualização:** Permite criar e visualizar contas contábeis com nome, tipo (ativo, passivo, patrimônio líquido, receita, despesa) e código.
*   **Exibição de Código da Conta:** O código da conta agora é exibido de forma proeminente na listagem de contas e nos detalhes das linhas de lançamento, facilitando a identificação e organização.
*   **Plano de Contas:** Uma nova seção dedicada à visualização do plano de contas de forma organizada, exibindo o código e o nome de cada conta por tipo.

### 2. Lançamentos Contábeis (Partidas Dobradas)
*   **Registro de Lançamentos:** Permite registrar lançamentos contábeis com data, descrição e múltiplas linhas de débito e crédito.
*   **Validação Rigorosa:** O sistema agora exige que o total de débitos seja **exatamente igual** ao total de créditos para que um lançamento possa ser submetido, garantindo a integridade do método das partidas dobradas.
*   **Imutabilidade de Lançamentos:** Para simular a prática contábil profissional e garantir a trilha de auditoria, lançamentos já registrados **não podem ser editados ou excluídos diretamente** através da interface. Futuras correções deverão ser realizadas por meio de lançamentos de estorno.
*   **Funcionalidade de Estorno:** Permite estornar um lançamento existente, criando um novo lançamento que reverte o efeito do original, mantendo a trilha de auditoria.
*   **Cálculo Automático de ICMS:** Ao selecionar um produto em uma linha de lançamento, o sistema calcula automaticamente o `valor bruto`, o `valor do ICMS` (com base na alíquota configurada para o produto) e o `valor líquido` da transação. O usuário insere o valor bruto, e o ICMS é deduzido automaticamente.

### 3. Relatórios Financeiros Essenciais
O Finvy oferece a geração de relatórios financeiros fundamentais para a análise da saúde contábil e financeira, todos com a capacidade de filtragem por período:

*   **Razão (Ledger):** Apresenta o movimento individual de cada conta contábil, mostrando débitos, créditos e o saldo final.
*   **Balancete de Verificação (Trial Balance):** Um relatório crucial que lista todas as contas do razão com seus saldos finais (débito ou crédito), permitindo verificar a igualdade entre o total de débitos e créditos.
*   **Demonstração de Resultado do Exercício (DRE):** Apresenta o desempenho financeiro da empresa em um período, detalhando receitas, custos e despesas para chegar ao lucro ou prejuízo líquido.
*   **Balanço Patrimonial:** Uma fotografia da posição financeira da empresa em uma data específica, mostrando ativos, passivos e patrimônio líquido.
*   **Demonstração do Fluxo de Caixa (DFC):** Detalha as entradas e saídas de caixa, classificadas por atividades operacionais, de investimento e de financiamento.
*   **Demonstrativo de Variações:** Apresenta as variações nas contas ao longo do tempo, útil para análise de tendências.

### 4. Controle de Estoque
*   **Balanço de Estoque:** Exibe o balanço atual dos produtos em estoque, incluindo quantidade, custo unitário médio e valor total.

### 5. Fechamento de Exercício
*   **Processo de Fechamento:** Permite realizar o fechamento contábil de um período, zerando as contas de receita e despesa e transferindo o resultado (lucro ou prejuízo) para uma conta de Patrimônio Líquido. Esta funcionalidade é crucial para a preparação das demonstrações financeiras anuais.

## Tecnologias Utilizadas

*   **Frontend:** Vue.js 3 (com Composition API e `<script setup>`), Pinia (gerenciamento de estado), Vue Router (roteamento), Axios (requisições HTTP).
*   **Backend (API):** Node.js com Vercel Functions (serverless), Supabase (banco de dados e autenticação), Zod (validação de esquemas).
*   **Estilização:** CSS puro (scoped).

## Como Rodar a Aplicação Localmente

### Pré-requisitos

*   Node.js e npm (ou yarn) instalados.
*   Uma conta Supabase e um projeto configurado com as tabelas `accounts`, `journal_entries`, `entry_lines`, `products`.
*   As variáveis de ambiente do Supabase configuradas (API URL e Anon Key).

### Passos

1.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd finvy
    ```

2.  **Configurar o Backend (API):**
    *   Crie um arquivo `.env.local` na raiz do projeto (`finvy/`) com suas credenciais Supabase:
        ```
        SUPABASE_URL=sua_url_supabase
        SUPABASE_ANON_KEY=sua_anon_key_supabase
        ```
    *   Instale as dependências do backend:
        ```bash
        npm install
        ```
    *   O backend é projetado para ser implantado no Vercel. Para testar localmente, o Vercel CLI pode ser usado, ou as funções serão executadas automaticamente quando o frontend as chamar se você estiver usando o `vercel dev`.

3.  **Configurar o Frontend:**
    *   Navegue até o diretório `frontend`:
        ```bash
        cd frontend
        ```
    *   Instale as dependências do frontend:
        ```bash
        npm install
        ```
    *   Crie um arquivo `.env.local` no diretório `frontend/` com suas credenciais Supabase (as mesmas do backend):
        ```
        VITE_SUPABASE_URL=sua_url_supabase
        VITE_SUPABASE_ANON_KEY=sua_anon_key_supabase
        ```

4.  **Rodar a Aplicação:**
    *   No diretório `frontend/`, inicie o servidor de desenvolvimento:
        ```bash
        npm run dev
        ```
    *   A aplicação estará disponível em `http://localhost:5173` (ou outra porta, se indicado no terminal).

## Uso

1.  **Registro/Login:** Crie uma conta ou faça login para acessar o sistema.
2.  **Contas Contábeis:** Gerencie suas contas na seção "Contas".
3.  **Lançamentos Contábeis:** Registre novas transações na seção "Lançamentos Contábeis". Lembre-se que débitos e créditos devem ser iguais.
4.  **Produtos:** Cadastre e gerencie seus produtos, incluindo custo unitário e alíquota de ICMS.
5.  **Relatórios:** Acesse a seção "Relatórios Financeiros" para gerar e visualizar o Razão, Balancete, DRE, Balanço Patrimonial, DFC e Variações. Utilize os filtros de data para analisar períodos específicos.
6.  **Fechamento de Exercício:** Utilize a nova funcionalidade de "Fechamento de Exercício" para zerar as contas de resultado ao final de um período.

## Próximos Passos e Melhorias Futuras

*   **Relatórios Mais Detalhados:** Adicionar opções de detalhamento e exportação para os relatórios.
*   **Gestão de Usuários:** Expandir a gestão de usuários para incluir diferentes níveis de permissão.
*   **Internacionalização (i18n):** Suporte a múltiplos idiomas.
*   **Testes Abrangentes:** Aumentar a cobertura de testes unitários e de integração.
*   **Otimização de Performance:** Melhorias contínuas na performance do frontend e backend.
*   **Interface do Usuário (UI/UX):** Aprimoramento da experiência do usuário com componentes mais ricos e design responsivo.