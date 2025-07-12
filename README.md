# **Finvy**

[![Status do Projeto](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)](https://github.com/guilhermecardoso94/finvy)

[**Experimente o Finvy Online!**](https://finvy.vercel.app/) (Link para a demonstração ao vivo)

## **Visão Geral**

O Finvy é um Micro SaaS em desenvolvimento, concebido para ser uma ferramenta poderosa e intuitiva para a resolução de exercícios práticos de contabilidade. A sua génese reside na necessidade de transcender as limitações das folhas de cálculo, que, embora flexíveis, são propensas a erros de fórmula, carecem de integridade de dados e não são escaláveis.

O objetivo do Finvy é substituir essa complexidade, oferecendo uma plataforma web onde os utilizadores podem aplicar princípios contábeis fundamentais — como o controlo de stock por custo médio, o método das partidas dobradas e a apuração de resultados — de forma automatizada, visual e segura. A visão a longo prazo é solidificar o Finvy como uma ferramenta educacional de referência e, potencialmente, um serviço comercial para pequenos negócios que necessitem de um controlo financeiro e de inventário simplificado e robusto.

## **Funcionalidades Implementadas**

Até o momento, o Finvy conta com as seguintes funcionalidades, visando aprimorar a experiência do usuário e a aderência a práticas contábeis profissionais:

### **1. Gestão de Contas Contábeis**
* **Criação e Visualização:** Permite criar e visualizar contas contábeis com nome, tipo (ativo, passivo, patrimônio líquido, receita, despesa) e código.
* **Exibição de Código da Conta:** O código da conta agora é exibido de forma proeminente na listagem de contas e nos detalhes das linhas de lançamento, facilitando a identificação e organização.
* **Plano de Contas:** Uma nova seção dedicada à visualização do plano de contas de forma organizada, exibindo o código e o nome de cada conta por tipo.

### **2. Lançamentos Contábeis (Partidas Dobradas)**
* **Registro de Lançamentos:** Permite registrar lançamentos contábeis com data, descrição e múltiplas linhas de débito e crédito.
* **Validação Rigorosa:** O sistema exige que o total de débitos seja **exatamente igual** ao total de créditos para que um lançamento possa ser submetido, garantindo a integridade do método das partidas dobradas.
* **Imutabilidade e Estorno:** Para simular a prática contábil profissional, lançamentos registrados não podem ser editados ou excluídos diretamente. Em vez disso, a funcionalidade de **estorno** cria um novo lançamento que reverte o original, mantendo uma trilha de auditoria íntegra.
* **Cálculo Automático de ICMS:** Ao selecionar um produto em uma linha de lançamento, o sistema calcula automaticamente o valor bruto, o valor do ICMS (com base na alíquota configurada para o produto) e o valor líquido da transação.

### **3. Relatórios Financeiros Essenciais**
O Finvy oferece a geração de relatórios financeiros fundamentais, todos com a capacidade de filtragem por período:

* **Razão (Ledger):** Apresenta o movimento individual de cada conta contábil, mostrando débitos, créditos e o saldo final.
* **Balancete de Verificação (Trial Balance):** Lista todas as contas do razão com seus saldos finais, permitindo verificar a igualdade entre o total de débitos e créditos.
* **Demonstração de Resultado do Exercício (DRE):** Detalha receitas, custos e despesas para apurar o lucro ou prejuízo líquido do período.
* **Balanço Patrimonial:** Uma fotografia da posição financeira da empresa, mostrando ativos, passivos e patrimônio líquido.
* **Demonstração do Fluxo de Caixa (DFC):** Detalha as entradas e saídas de caixa, classificadas por atividades operacionais, de investimento e de financiamento.
* **Demonstrativo de Variações:** Apresenta as variações nas contas ao longo do tempo.

### **4. Gestão de Produtos e Estoque**
* **Cadastro de Produtos:** Gerencie seus produtos, incluindo custo unitário e alíquota de ICMS.
* **Balanço de Estoque:** Exibe o balanço atual dos produtos, incluindo quantidade, custo unitário médio e valor total.

### **5. Fechamento de Exercício**
* **Processo Automatizado:** Permite realizar o fechamento contábil de um período, zerando as contas de receita e despesa e transferindo o resultado (lucro ou prejuízo) para o Patrimônio Líquido.

### **6. Contas a Pagar e a Receber**
* **Registro e Acompanhamento:** Registre e acompanhe contas a pagar e a receber, com integração automática aos lançamentos contábeis quando uma conta é criada ou liquidada.

## **Tecnologias Utilizadas**

* **Frontend:** Vue.js 3 (Composition API), Pinia, Vue Router, Axios, TypeScript.
* **Backend (API):** Node.js com Vercel Functions (Serverless), Supabase (Banco de Dados PostgreSQL e Autenticação), Zod (Validação de esquemas).
* **Estilização:** CSS puro (scoped).

## **Estrutura do Projeto**
O projeto Finvy é organizado como um monorepo, contendo o frontend, o backend e as configurações de banco de dados.

```
finvy/
├──  api/                  # Funções Serverless para a API (Vercel Functions)
│   └── index.ts             # Ponto de entrada da API
├──  backend/              # Lógica de negócio do backend
│   ├──  handlers/         # Manipuladores de requisições da API
│   ├──  services/         # Serviços de negócio
│   └──  utils/            # Utilitários e configurações do backend
├──  frontend/             # Aplicação web frontend
│   ├──  public/           # Ativos estáticos
│   └──  src/              # Código fonte do frontend
│       ├──  assets/       # Imagens, ícones, CSS global
│       ├──  components/   # Componentes Vue reutilizáveis
│       ├──  router/       # Configuração de rotas do Vue Router
│       ├──  services/     # Serviços de comunicação com a API
│       ├──  stores/       # Gerenciamento de estado (Pinia)
│       ├──  types/        # Definições de tipos TypeScript
│       └──  views/        # Páginas/visualizações da aplicação
├──  supabase/             # Configurações e migrações do Supabase
│   ├──  migrations/       # Arquivos de migração do banco de dados
│   ├── config.toml          # Configuração do projeto Supabase
│   └── .gitignore           # Ignorar arquivos gerados pelo Supabase
├── .gitignore               # Arquivos e diretórios ignorados pelo Git
├── package.json             # Dependências e scripts do monorepo
├── README.md                # Este arquivo
└── vercel.json              # Configurações de deploy do Vercel
```

## **Configuração do Ambiente de Desenvolvimento**

Para configurar e executar o Finvy localmente, siga os passos abaixo:

### **Pré-requisitos**
*   Node.js e npm (ou yarn) instalados.
*   Uma conta gratuita no [Supabase](https://supabase.com).
*   **Docker Desktop** instalado e em execução.

### **Passos para Configuração**

1.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd finvy
    ```

2.  **Instale as Dependências (Raiz e Frontend):**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente Local da Supabase:**
    *   Este projeto usa a **Supabase CLI** para gerir o banco de dados localmente. Se não a tiver instalada, instale-a como uma dependência de desenvolvimento:
        ```bash
        npm install supabase --save-dev
        ```
    *   Faça o login na sua conta Supabase através da CLI:
        ```bash
        npx supabase login
        ```
    *   Vincule o seu projeto local ao seu projeto remoto na Supabase:
        ```bash
        # Substitua <project-id> pelo ID do seu projeto no Supabase
        npx supabase link --project-ref <project-id>
        ```
    *   Inicie os serviços locais da Supabase (requer Docker):
        ```bash
        npx supabase start
        ```
    *   Aplique as migrações para criar a estrutura do banco de dados no seu ambiente local:
        ```bash
        # Este comando irá apagar e recriar a base de dados local, aplicando todas as migrações
        npx supabase db reset
        ```
    *Isto irá configurar a sua base de dados local com o esquema mais recente do projeto.*

4.  **Configure as Variáveis de Ambiente:**
    *   **Frontend:** No diretório `frontend/`, crie um ficheiro chamado `.env` e adicione as credenciais locais da Supabase (fornecidas no terminal após o `npx supabase start`):
        ```
        VITE_SUPABASE_URL="A_SUA_URL_LOCAL_API"
        VITE_SUPABASE_ANON_KEY="A_SUA_CHAVE_ANON_LOCAL"
        ```
    *   **Backend (Vercel Functions):** Para o backend, as variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) devem ser configuradas diretamente no painel da Vercel do seu projeto.

5.  **Rode a Aplicação:**
    *   **Para o Frontend:** No diretório `frontend/`, inicie o servidor de desenvolvimento:
        ```bash
        npm run dev
        ```
    *   **Para o Backend (local):** Na raiz do projeto (`finvy/`), use a Vercel CLI:
        ```bash
        vercel dev
        ```
    *   A aplicação estará disponível em `http://localhost:5173` (ou outra porta indicada).

## **Executando Testes**

Para executar os testes do projeto, utilize os seguintes comandos:

*   **Testes do Backend:**
    ```bash
    npm test
    ```
*   **Testes do Frontend:**
    ```bash
    cd frontend
    npm test
    ```

## **Fluxo de Trabalho de Migrações**

Para fazer alterações no banco de dados, siga este fluxo de trabalho:

1.  **Faça as alterações localmente** (por exemplo, através do Supabase Studio local em `http://127.0.0.1:54323`).
2.  **Gere um ficheiro de migração** com as diferenças:
    ```bash
    npx supabase db diff -f "nome_descritivo_da_alteracao"
    ```
3.  **Aplique as alterações localmente** para testar:
    ```bash
    npx supabase db reset
    ```
4.  **Envie as migrações para produção** quando estiverem prontas:
    ```bash
    npx supabase db push
    ```

## **Endpoints da API**

* `GET /api/accounts`: Retorna todas as contas do usuário.
* `POST /api/accounts`: Cria uma nova conta.
* `GET /api/products`: Retorna todos os produtos do usuário.
* `POST /api/products`: Cria um novo produto.
* `GET /api/journal-entries`: Retorna todos os lançamentos contábeis.
* `POST /api/journal-entries`: Cria um novo cabeçalho de lançamento.
* `POST /api/entry-lines`: Cria uma nova linha para um lançamento.
* `GET /api/reports/generate`: Gera um conjunto completo de relatórios financeiros.
* `POST /api/year-end-closing`: Executa o processo de fechamento de exercício.

## **Próximos Passos e Melhorias Futuras**

* **Gestão de Usuários:** Expandir a gestão de usuários com diferentes níveis de permissão.
* **Internacionalização (i18n):** Suporte a múltiplos idiomas.
* **Testes Abrangentes:** Aumentar a cobertura de testes unitários e de integração.
* **Otimização de Performance:** Melhorias contínuas na performance do frontend e backend.
* **Interface do Usuário (UI/UX):** Aprimoramento da experiência do usuário com componentes mais ricos e design responsivo.

## **Contribuir**

Contribuições são bem-vindas! Por favor, siga o fluxo padrão do GitHub (Fork, Branch, Commit, Pull Request).

## **Licença**

Este projeto está licenciado sob a Licença MIT.

## **Contato e Suporte**

Para dúvidas, sugestões ou suporte, por favor, abra uma [Issue no GitHub](https://github.com/guilhermecardoso94/finvy/issues) ou entre em contato através do email: [seu.email@example.com](mailto:seu.email@example.com).
