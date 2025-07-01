# Finvy

## Visão Geral

O Finvy é um Micro SaaS em desenvolvimento, concebido para ser uma ferramenta poderosa e intuitiva para a resolução de exercícios práticos de contabilidade. A sua génese reside na necessidade de transcender as limitações das folhas de cálculo, que, embora flexíveis, são propensas a erros de fórmula, carecem de integridade de dados e não são escaláveis.

O objetivo do Finvy é substituir essa complexidade, oferecendo uma plataforma web onde os utilizadores podem aplicar princípios contábeis fundamentais — como o controlo de stock por custo médio, o método das partidas dobradas e a apuração de resultados — de forma automatizada, visual e segura. A visão a longo prazo é solidificar o Finvy como uma ferramenta educacional de referência e, potencialmente, um serviço comercial para pequenos negócios que necessitem de um controlo financeiro e de inventário simplificado e robusto.

## Funcionalidades Implementadas

Até o momento, o Finvy conta com as seguintes funcionalidades, visando aprimorar a experiência do usuário e a aderência a práticas contábeis profissionais:

### 1. Gestão de Contas Contábeis
* **Criação e Visualização:** Permite criar e visualizar contas contábeis com nome, tipo (ativo, passivo, patrimônio líquido, receita, despesa) e código.
* **Exibição de Código da Conta:** O código da conta agora é exibido de forma proeminente na listagem de contas e nos detalhes das linhas de lançamento, facilitando a identificação e organização.
* **Plano de Contas:** Uma nova seção dedicada à visualização do plano de contas de forma organizada, exibindo o código e o nome de cada conta por tipo.

### 2. Lançamentos Contábeis (Partidas Dobradas)
* **Registro de Lançamentos:** Permite registrar lançamentos contábeis com data, descrição e múltiplas linhas de débito e crédito.
* **Validação Rigorosa:** O sistema exige que o total de débitos seja **exatamente igual** ao total de créditos para que um lançamento possa ser submetido, garantindo a integridade do método das partidas dobradas.
* **Imutabilidade e Estorno:** Para simular a prática contábil profissional, lançamentos registrados não podem ser editados ou excluídos diretamente. Em vez disso, a funcionalidade de **estorno** cria um novo lançamento que reverte o original, mantendo uma trilha de auditoria íntegra.
* **Cálculo Automático de ICMS:** Ao selecionar um produto em uma linha de lançamento, o sistema calcula automaticamente o valor bruto, o valor do ICMS (com base na alíquota configurada para o produto) e o valor líquido da transação.

### 3. Relatórios Financeiros Essenciais
O Finvy oferece a geração de relatórios financeiros fundamentais, todos com a capacidade de filtragem por período:

* **Razão (Ledger):** Apresenta o movimento individual de cada conta contábil, mostrando débitos, créditos e o saldo final.
* **Balancete de Verificação (Trial Balance):** Lista todas as contas do razão com seus saldos finais, permitindo verificar a igualdade entre o total de débitos e créditos.
* **Demonstração de Resultado do Exercício (DRE):** Detalha receitas, custos e despesas para apurar o lucro ou prejuízo líquido do período.
* **Balanço Patrimonial:** Uma fotografia da posição financeira da empresa, mostrando ativos, passivos e patrimônio líquido.
* **Demonstração do Fluxo de Caixa (DFC):** Detalha as entradas e saídas de caixa, classificadas por atividades operacionais, de investimento e de financiamento.
* **Demonstrativo de Variações:** Apresenta as variações nas contas ao longo do tempo.

### 4. Gestão de Produtos e Estoque
* **Cadastro de Produtos:** Gerencie seus produtos, incluindo custo unitário e alíquota de ICMS.
* **Balanço de Estoque:** Exibe o balanço atual dos produtos, incluindo quantidade, custo unitário médio e valor total.

### 5. Fechamento de Exercício
* **Processo Automatizado:** Permite realizar o fechamento contábil de um período, zerando as contas de receita e despesa e transferindo o resultado (lucro ou prejuízo) para o Patrimônio Líquido.

### 6. Contas a Pagar e a Receber
* **Registro e Acompanhamento:** Registre e acompanhe contas a pagar e a receber, com integração automática aos lançamentos contábeis quando uma conta é criada ou liquidada.

## Tecnologias Utilizadas

* **Frontend:** Vue.js 3 (Composition API), Pinia, Vue Router, Axios, TypeScript.
* **Backend (API):** Node.js com Vercel Functions (Serverless), Supabase (Banco de Dados PostgreSQL e Autenticação), Zod (Validação de esquemas).
* **Estilização:** CSS puro (scoped).

## Estrutura do Projeto
```
finvy/
├── api/                  # Funções Serverless da Vercel (Backend API)
│   ├── accounts.ts
│   ├── entry-lines.ts
│   ├── financial-transactions.ts
│   ├── journal-entries.ts
│   ├── products.ts
│   ├── reports/
│   │   └── generate.ts
│   └── year-end-closing.ts
├── frontend/             # Aplicação Frontend em Vue.js
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── router/       # Configuração de rotas
│   │   ├── services/     # Configuração do cliente API
│   │   ├── stores/       # Stores do Pinia para gestão de estado
│   │   ├── types/        # Definições de tipos TypeScript
│   │   └── views/        # Componentes de página
│   └── ...
└── ...
```

## Como Começar

Siga os passos abaixo para configurar e executar o Finvy localmente.

### Pré-requisitos
* Node.js e npm (ou yarn) instalados.
* Uma conta gratuita no Supabase.

### Passos para Configuração

1.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd finvy
    ```
2.  **Instale as Dependências (Raiz e Frontend):**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados no Supabase:**
    * Crie um novo projeto na sua conta Supabase.
    * Na secção **SQL Editor** do seu projeto, clique em **"New query"** e cole o conteúdo do script abaixo para criar todas as tabelas necessárias. Clique em **"Run"**.
        ```sql
        -- Tabela de Contas
        CREATE TABLE accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            user_id UUID REFERENCES auth.users(id),
            code SERIAL
        );

        -- Tabela de Produtos
        CREATE TABLE products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            unit_cost NUMERIC(10, 2) NOT NULL,
            current_stock INTEGER NOT NULL,
            icms_rate NUMERIC(5, 2) DEFAULT 0,
            user_id UUID REFERENCES auth.users(id)
        );

        -- Tabela de Lançamentos Contábeis
        CREATE TABLE journal_entries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            entry_date DATE NOT NULL,
            description TEXT,
            user_id UUID REFERENCES auth.users(id)
        );

        -- Tabela de Linhas dos Lançamentos
        CREATE TABLE entry_lines (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
            account_id UUID REFERENCES accounts(id),
            debit NUMERIC(10, 2) DEFAULT 0,
            credit NUMERIC(10, 2) DEFAULT 0,
            product_id UUID REFERENCES products(id),
            quantity INTEGER,
            unit_cost NUMERIC(10, 2)
        );
        ```
    * Vá para **Project Settings > API**. Copie a **Project URL** e a chave **`anon` `public`**.

4.  **Configure as Variáveis de Ambiente:**
    * No diretório `frontend/`, crie um ficheiro chamado `.env`.
    * Adicione as suas credenciais do Supabase:
        ```
        VITE_SUPABASE_URL="A_SUA_URL_SUPABASE"
        VITE_SUPABASE_ANON_KEY="A_SUA_CHAVE_ANON_SUPABASE"
        ```

5.  **Rode a Aplicação:**
    * **Para o Frontend:** No diretório `frontend/`, inicie o servidor de desenvolvimento:
        ```bash
        npm run dev
        ```
    * **Para o Backend (local):** Na raiz do projeto (`finvy/`), use a Vercel CLI:
        ```bash
        vercel dev
        ```
    * A aplicação estará disponível em `http://localhost:5173` (ou outra porta indicada).

## Uso

1.  **Registro/Login:** Crie uma conta ou faça login para acessar o sistema.
2.  **Contas Contábeis:** Gerencie suas contas na seção "Plano de Contas".
3.  **Produtos:** Cadastre e gerencie seus produtos.
4.  **Lançamentos Contábeis:** Registre novas transações. Lembre-se que débitos e créditos devem ser iguais.
5.  **Relatórios:** Acesse a seção "Relatórios" para gerar e visualizar as demonstrações financeiras.
6.  **Fechamento de Exercício:** Utilize a funcionalidade para zerar as contas de resultado ao final de um período.
7.  **Contas a Pagar/Receber:** Gerencie suas obrigações e direitos financeiros.

## Endpoints da API

* `GET /api/accounts`: Retorna todas as contas do usuário.
* `POST /api/accounts`: Cria uma nova conta.
* `GET /api/products`: Retorna todos os produtos do usuário.
* `POST /api/products`: Cria um novo produto.
* `GET /api/journal-entries`: Retorna todos os lançamentos contábeis.
* `POST /api/journal-entries`: Cria um novo cabeçalho de lançamento.
* `POST /api/entry-lines`: Cria uma nova linha para um lançamento.
* `GET /api/reports/generate`: Gera um conjunto completo de relatórios financeiros.
* `POST /api/year-end-closing`: Executa o processo de fechamento de exercício.

## Próximos Passos e Melhorias Futuras

* **Relatórios Mais Detalhados:** Adicionar opções de detalhamento e exportação.
* **Gestão de Usuários:** Expandir a gestão de usuários com diferentes níveis de permissão.
* **Internacionalização (i18n):** Suporte a múltiplos idiomas.
* **Testes Abrangentes:** Aumentar a cobertura de testes unitários e de integração.
* **Otimização de Performance:** Melhorias contínuas na performance do frontend e backend.
* **Interface do Usuário (UI/UX):** Aprimoramento da experiência do usuário com componentes mais ricos e design responsivo.

## Contribuir

Contribuições são bem-vindas! Por favor, siga o fluxo padrão do GitHub (Fork, Branch, Commit, Pull Request).

## Licença

Este projeto está licenciado sob a Licença MIT.