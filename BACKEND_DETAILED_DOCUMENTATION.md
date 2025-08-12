# Documentação Detalhada do Backend

Este documento fornece uma análise completa e detalhada de cada arquivo na estrutura do backend do Finvy.

---

## Diretório: `utils`

O diretório `utils` contém módulos de suporte e ferramentas reutilizáveis que são fundamentais para o funcionamento da aplicação.

### Arquivo: `utils/logger.ts`

**Propósito:**

Este arquivo é responsável por criar e configurar uma instância de logger padronizada para toda a aplicação, utilizando a biblioteca `pino`.

**Lógica Principal:**

- **Logger Condicional:** A configuração do logger é sensível ao ambiente (`NODE_ENV`).
  - **Desenvolvimento (`NODE_ENV !== 'production'`):** Utiliza o transport `pino-pretty`. Isso formata os logs de uma maneira legível e colorida, otimizada para a visualização humana durante o desenvolvimento.
  - **Produção (`NODE_ENV === 'production'`):** Utiliza a configuração padrão do `pino`, que gera logs em formato JSON estruturado. Este formato é ideal para ser consumido por serviços de agregação e monitoramento de logs (como Datadog, LogDNA, etc.), permitindo buscas e análises eficientes.

**Exportação:**

- **`logger`**: Exporta uma única instância do logger configurado. Qualquer parte da aplicação que precisar registrar uma informação (seja um erro, um aviso ou um evento) deve importar e usar esta instância, garantindo que todos os logs sigam o mesmo padrão.

### Arquivo: `utils/corsHandler.ts`

**Propósito:**

Gerencia as políticas de Cross-Origin Resource Sharing (CORS) para a API. O CORS é um mecanismo de segurança do navegador que restringe como recursos (por exemplo, APIs) em um domínio podem ser solicitados por um frontend de outro domínio.

**Lógica Principal:**

- **`handleCors(req, res)`**: Esta função é chamada no início de cada requisição para configurar os cabeçalhos de resposta CORS.
  - **`Access-Control-Allow-Origin`**: Define quais origens (domínios de frontend) têm permissão para acessar a API. O valor é obtido da variável de ambiente `CORS_ORIGIN`, tornando a configuração flexível para diferentes ambientes (desenvolvimento, produção).
  - **`Access-Control-Allow-Methods`**: Especifica os métodos HTTP permitidos (GET, POST, PUT, DELETE, OPTIONS).
  - **`Access-Control-Allow-Headers`**: Autoriza o envio de cabeçalhos essenciais como `Content-Type` (para especificar o formato do corpo da requisição, como JSON) e `Authorization` (para enviar o token de autenticação).
  - **Tratamento de Requisições `OPTIONS` (Preflight):** Antes de uma requisição complexa (como um `POST` com `Content-Type: application/json`), os navegadores enviam uma requisição "preflight" usando o método `OPTIONS` para verificar se a chamada é permitida. Esta função detecta essa requisição, responde com `status 200 OK` e encerra a resposta, sinalizando ao navegador que a requisição real pode ser enviada. 

**Retorno:**

- Retorna `true` se a requisição era do tipo `OPTIONS` (a resposta já foi enviada). 
- Retorna `false` para todos os outros métodos, permitindo que a requisição continue seu fluxo para os próximos middlewares e handlers.

### Arquivo: `utils/errorUtils.ts`

**Propósito:**

Centraliza e padroniza o tratamento de erros, especialmente os erros provenientes do banco de dados Supabase (PostgreSQL). O objetivo é traduzir mensagens de erro técnicas e crípticas em explicações claras e úteis, tanto para o desenvolvedor (nos logs) quanto para o cliente da API.

**Lógica Principal:**

- **`formatSupabaseError(error)`**: Esta função recebe um erro de tipo `unknown` e o inspeciona para fornecer a melhor formatação possível.
  - **Detecção de Erro Supabase:** Verifica se o erro é uma instância de `PostgrestError` (o tipo de erro do Supabase) procurando por propriedades como `code` e `message`.
  - **Tratamento de Códigos Específicos:** Utiliza um `switch` para tratar os códigos de erro mais comuns do PostgreSQL, fornecendo mensagens contextualizadas:
    - `23505 (unique_violation)`: Traduzido para "Erro de duplicidade", informando ao usuário que o item já existe (ex: tentar criar um usuário com um e-mail já cadastrado).
    - `23503 (foreign_key_violation)`: Traduzido para "Erro de referência", indicando que um ID fornecido não corresponde a um registro existente em outra tabela (ex: tentar criar um lançamento para uma `account_id` que não existe).
    - `22P02 (invalid_text_representation)`: Traduzido para "Erro de formato de dados", útil para quando um valor não corresponde ao tipo esperado pela coluna (ex: um UUID malformado).
  - **Tratamento Genérico:** Se o código de erro não for um dos casos específicos, ele ainda formata a mensagem de forma padronizada, incluindo o código do erro para facilitar a depuração.
  - **Fallback:** Se o erro não for um `PostgrestError` ou nem mesmo uma instância de `Error`, retorna uma mensagem genérica de "Erro interno do servidor".

**Utilização:**

- É tipicamente usada nos blocos `catch` dos handlers da API. Em vez de retornar o erro bruto do banco de dados, o handler chama `formatSupabaseError` para gerar uma mensagem limpa e a envia na resposta HTTP com um status de erro apropriado.

### Arquivo: `utils/supabaseClient.ts`

**Propósito:**

Este arquivo é o ponto central para a comunicação com o backend do Supabase. Ele inicializa e exporta diferentes tipos de clientes Supabase e funções auxiliares para interagir com o banco de dados e a autenticação, garantindo que a configuração seja consistente e segura.

**Lógica Principal e Funções Exportadas:**

- **Inicialização e Validação:** Lê as variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) e lança um erro fatal se alguma estiver faltando, impedindo a execução da aplicação com configuração incorreta.

- **`anonSupabase`**: Um cliente Supabase inicializado com a chave anônima (`anon key`). Este cliente é de baixo privilégio e é usado principalmente pelo middleware de autenticação (`withAuth`) para verificar a validade de um token de usuário (`anonSupabase.auth.getUser(token)`). Ele só pode acessar dados permitidos pelas políticas de RLS (Row Level Security) para usuários não autenticados.

- **`getSupabaseClient(token)`**: Esta é a principal função para interagir com o banco de dados **no contexto de um usuário autenticado**. Ela cria uma nova instância do cliente Supabase para cada requisição, injetando o token JWT do usuário nos cabeçalhos. Isso garante que todas as operações de banco de dados (SELECT, INSERT, UPDATE, DELETE) executadas com este cliente respeitem as políticas de RLS definidas para aquele usuário específico.

- **`getSupabaseAdmin()`**: Retorna um cliente Supabase inicializado com a chave de serviço (`service_role key`). Este cliente tem privilégios de administrador e **ignora todas as políticas de RLS**. Seu uso é restrito a operações que necessitam de acesso total, como deletar um usuário do sistema (`auth.admin.deleteUser`), uma ação que o próprio usuário não poderia realizar.

- **`handleErrorResponse(res, statusCode, message)`**: Uma função utilitária simples para padronizar o envio de respostas de erro em formato JSON a partir dos handlers.

- **`getUserOrganizationAndPeriod(user_id, token)`**: Uma função auxiliar crucial, usada em quase todos os handlers. Ela recebe o ID e o token de um usuário e busca, na tabela `profiles`, a organização e o período contábil que estão atualmente ativos para ele. Isso evita a repetição de código e garante que as operações sejam sempre executadas no contexto correto (a empresa/período que o usuário selecionou no frontend).

- **`getUserProfileInfo(user_id, token)`**: Semelhante à anterior, but busca informações mais gerais do perfil do usuário, como `username`, `email` e `handle`. É usada para enriquecer registros, como adicionar o nome de quem criou um lançamento contábil.

### Arquivo: `utils/schemas.ts`

**Propósito:**

Este arquivo atua como a "fonte da verdade" para a validação de dados em toda a API. Utilizando a biblioteca `zod`, ele define esquemas rigorosos para os dados que entram na aplicação (via corpo de requisição ou parâmetros de URL), garantindo a integridade e o formato correto dos dados antes que eles atinjam a lógica de negócio.

**Lógica e Estrutura:**

- **Centralização:** Consolida todas as regras de validação em um único local, facilitando a manutenção e garantindo consistência.
- **Composição de Esquemas:** Constrói esquemas complexos a partir de primitivos. Por exemplo, o `uuidSchema` é definido uma vez e reutilizado em múltiplos outros esquemas (`createAccountSchema`, `createJournalEntrySchema`, etc.).
- **Esquemas de Criação vs. Atualização:**
  - **Criação (ex: `createAccountSchema`):** Define todos os campos que são obrigatórios ao criar um novo objeto, com suas respectivas regras (tipo, tamanho mínimo/máximo, formato, etc.).
  - **Atualização (ex: `updateAccountSchema`):** Geralmente deriva do esquema de criação, but com o método `.partial()` do Zod. Isso torna todos os campos opcionais, o que é ideal para requisições `PUT` ou `PATCH`, onde o cliente pode enviar apenas os campos que deseja modificar.
- **Validação Detalhada:** Utiliza uma ampla gama de validadores do Zod:
  - `.string()`, `.number()`, `.boolean()`: Para tipos primitivos.
  - `.uuid()`: Para garantir que os IDs estejam no formato UUID.
  - `.min()`, `.max()`, `.length()`: Para restringir o tamanho de strings.
  - `.regex()`: Para validar formatos específicos, como datas (`YYYY-MM-DD`).
  - `.enum()`: Para garantir que um campo corresponda a uma lista de valores permitidos (ex: `['asset', 'liability', ...]`).
  - `.optional()`, `.nullable()`: Para definir campos que não são obrigatórios.

**Utilização:**

- Os esquemas são importados pelos `handlers`. No início de um handler, o método `.safeParse(req.body)` é chamado. 
- Se a validação falhar (`!parsedBody.success`), o handler interrompe a execução e retorna imediatamente uma resposta `400 Bad Request`, incluindo as mensagens de erro detalhadas fornecidas pelo Zod. Isso cria uma barreira de proteção, impedindo que dados malformados ou inválidos cheguem às camadas de serviço e ao banco de dados.

### Arquivo: `utils/middleware.ts`

**Propósito:**

Este arquivo implementa o middleware de autenticação `withAuth`, que atua como um portão de segurança para as rotas da API. Sua principal responsabilidade é garantir que apenas usuários autenticados e com um token válido possam acessar os endpoints protegidos.

**Lógica Principal (padrão Higher-Order Function):**

- **`withAuth(handler)`**: É uma função de ordem superior que "envolve" um handler de API. Ao fazer isso, ela injeta a lógica de autenticação antes que o handler original seja executado.

- **Fluxo de Execução:**
  1.  **CORS Preflight:** Primeiro, chama `handleCors` para lidar com requisições `OPTIONS`.
  2.  **Parse do Corpo:** Garante que o corpo da requisição (`req.body`) seja sempre um objeto JSON, tratando casos em que ele chega como string ou buffer.
  3.  **Extração do Token:** Procura pelo cabeçalho `Authorization` e extrai o token JWT (o que vem depois de "Bearer "). Se não houver token, retorna um erro `401 Unauthorized`.
  4.  **Verificação do Token:** Usa `anonSupabase.auth.getUser(token)` para que o Supabase valide a assinatura e a data de expiração do token. Se o token for inválido, retorna um erro `401 Unauthorized`.
  5.  **Busca de Perfil e Papel (Role):** Se o token for válido, o middleware usa o ID do usuário retornado para buscar seu perfil na tabela `profiles`, obtendo seu `role` (papel/função, ex: 'admin', 'member').
  6.  **Injeção de Dados e Execução do Handler:** Se tudo for bem-sucedido, o middleware finalmente chama o handler original, but agora passando argumentos adicionais e validados: `user_id`, `token` e `user_role`. Isso enriquece o contexto da requisição para o handler.
  7.  **Tratamento de Erros:** Todo o processo é envolto em um bloco `try...catch` para capturar falhas inesperadas durante a autenticação e retornar um erro `500 Internal Server Error`.

**Utilização:**

- No arquivo principal da API (`api/index.ts`), as rotas que precisam de proteção são envolvidas por esta função. Exemplo: `app.post('/api/accounts', withAuth(accountsHandler));`. Isso torna a aplicação da segurança declarativa e centralizada.

### Arquivo: `utils/vercel-adapters.ts`

**Propósito:**

Este arquivo serve como uma camada de compatibilidade (adapter) entre o framework Express.js e os tipos de requisição e resposta esperados pelo ambiente serverless da Vercel. Embora os objetos sejam estruturalmente semelhantes, suas definições de tipo podem ser diferentes, e este adaptador resolve essas discrepâncias.

**Lógica Principal:**

- **`toVercelRequest(req)`**: Uma função simples que apenas faz uma coerção de tipo. Ela informa ao TypeScript para tratar um objeto `Request` do Express como um `VercelRequest`. Isso é principalmente para satisfazer o sistema de tipos, já que as propriedades usadas na aplicação são compatíveis.

- **`toVercelResponse(res)`**: Uma função mais elaborada que envolve um objeto `Response` do Express para que ele se comporte como um `VercelResponse`. Ela cria um novo objeto que delega as chamadas para os métodos originais do Express (`send`, `json`, `status`, etc.), but garante que o **retorno** de cada método seja a própria instância da resposta. Isso é importante para permitir o encadeamento de métodos (`res.status(200).json(...)`), um padrão comum tanto no Express quanto nas funções da Vercel, que as definições de tipo do Express puro nem sempre suportam.

**Utilização:**

- É usado no ponto de entrada da API (`api/index.ts`), onde a aplicação Express é exportada como um handler serverless. Ele garante que os objetos `req` e `res` passados para os handlers estejam em conformidade com os tipos esperados pelo TypeScript em todo o projeto, evitando erros de compilação e melhorando a previsibilidade do código.

---

## Diretório: `types`

Este diretório define as "plantas" dos dados para a aplicação, garantindo consistência e segurança de tipos em todo o código através de interfaces e tipos do TypeScript.

### Arquivo: `types/index.ts`

**Propósito:**

Este é o arquivo principal para as definições de tipo do domínio da aplicação. Ele consolida as interfaces e tipos mais comuns que representam as entidades de negócio do sistema, como Contas, Lançamentos, Organizações, etc. Funciona como um ponto central de importação para a maioria das necessidades de tipagem.

**Estruturas Definidas:**

- **`AccountType`**: Um tipo literal de string que restringe o tipo de uma conta a `'asset'`, `'liability'`, `'equity'`, `'revenue'`, ou `'expense'`. Usar um tipo em vez de uma string genérica previne erros de digitação.

- **`Account`**: Interface que define a estrutura de uma conta no plano de contas, incluindo campos como `id`, `name`, `type`, `code` e `parent_account_id` para hierarquia.

- **`EntryType`**: Tipo literal para as linhas de um lançamento: `'debit'` ou `'credit'`.

- **`EntryLine`**: Interface para uma linha de débito ou crédito dentro de um lançamento. Contém `account_id`, `type`, `amount` e campos opcionais para transações de produtos e impostos.

- **`JournalEntry`**: Interface para um lançamento contábil completo. Agrupa um `id`, `entry_date`, `description` e um array opcional de `EntryLine`.

- **`LedgerAccount`**: Uma interface específica para a geração de relatórios, representando a totalização de uma conta (débitos, créditos e saldo final).

- **`Organization`**: Define a estrutura de uma organização/empresa no sistema.

- **`FinancialTransaction`**: Interface para contas a pagar ou a receber.

- **`TaxRule`**, **`TaxSetting`**, **`TaxRegime`**, **`TaxRegimeHistory`**: Conjunto de tipos e interfaces para modelar as complexas regras, configurações e históricos fiscais.

- **`AuthenticatedRequest`**: Estende a interface `VercelRequest` padrão, adicionando campos como `userId`, `organizationId`, etc. Este tipo é usado nos handlers após o middleware `withAuth` ter validado o usuário e injetado essas informações na requisição.

- **`UserPresence`**, **`UserProfile`**, **`OnlineUser`**: Tipos relacionados ao recurso de presença de usuário em tempo real.

**Utilização:**

- Essas interfaces e tipos são importados em toda a base de código (handlers, services) para tipar variáveis, parâmetros de função e retornos. Isso permite que o TypeScript verifique a correção do código em tempo de compilação, o que reduz drasticamente a ocorrência de bugs em tempo de execução e melhora a clareza e a manutenibilidade do código.

### Arquivo: `types/chatbot.ts`

**Propósito:**

Define as interfaces TypeScript específicas para a funcionalidade do chatbot. Este arquivo estrutura os dados trocados entre o cliente, o backend e a API de IA (Gemini), garantindo que a comunicação seja previsível e segura em termos de tipos.

**Estruturas Definidas:**

- **`ChatbotMessage`**: Modela uma única mensagem dentro de uma conversa. A propriedade `role` é fundamental, pois diferencia entre o que o `'user'` disse e o que o `'model'` (a IA) respondeu, um formato exigido pela API do Gemini para manter o contexto do diálogo.

- **`ChatbotRequest`**: Tipifica a requisição inicial que o cliente envia para o backend, contendo apenas a `message` do usuário.

- **`ProposedEntry`**: Uma interface crucial que estrutura a solução de um exercício contábil fornecida pela IA. Ela define um formato JSON claro para um lançamento contábil, com data, descrição, e arrays de débitos e créditos. Essa estrutura permite que o backend processe a sugestão da IA e a transforme em um lançamento real no banco de dados.

- **`ChatbotResponse`**: Modela o objeto de resposta que o backend envia de volta para o cliente. É uma interface rica que permite uma interação dinâmica no frontend:
  - `reply`: A resposta textual a ser exibida.
  - `intent`: Um campo chave que informa ao frontend qual era a "intenção" do usuário segundo a IA (ex: `'resolve_exercise_request'`, `'awaiting_clarification'`). O frontend pode usar essa informação para renderizar diferentes componentes (um formulário, uma lista de perguntas, etc.).
  - `clarifyingQuestions`: Um array opcional de perguntas, usado quando a IA precisa de mais informações para proceder.
  - `proposedEntries`: Um array opcional de `ProposedEntry`, enviado quando a IA resolveu com sucesso um exercício.

**Utilização:**

- Usado intensivamente pelo `chatbotService` e pelo `chatbot` handler para garantir que os dados de entrada e saída estejam corretamente formatados. Para o frontend, a interface `ChatbotResponse` é particularmente importante, pois permite construir uma UI reativa que se adapta aos diferentes estados da conversa com a IA.

### Arquivo: `types/tax.ts`

**Propósito:**

Isola as definições de tipo relacionadas especificamente a operações fiscais e cálculos de impostos, mantendo o arquivo `types/index.ts` focado nas entidades de negócio mais genéricas.

**Estruturas Definidas:**

- **`TaxData`**: Define a estrutura do **resultado** de um cálculo de impostos. Contém um campo para cada imposto calculado (`calculated_icms_value`, `calculated_ipi_value`, etc.) e o valor líquido final. Garante que a saída do `taxService` seja sempre consistente.

- **`FiscalOperationData`**: Modela os **dados de entrada** necessários para realizar um cálculo de impostos. Agrega todos os parâmetros que influenciam o cálculo, como tipo de operação (Compra/Venda), tipo de item (Produto/Serviço), UFs de origem e destino, CFOP, valores e flags para regras específicas (ex: `icmsSt`).

**Utilização:**

- A interface `FiscalOperationData` é usada pelo handler `tax-calculation` para validar e estruturar os dados recebidos do cliente.
- A interface `TaxData` é usada como o tipo de retorno da função `calculateTaxes` no `taxService`.
- Ambos os tipos são re-exportados por `types/index.ts` para facilitar o acesso em outras partes da aplicação.

---

## Diretório: `services`

Este diretório contém a lógica de negócio principal da aplicação. Os serviços são responsáveis por orquestrar as operações, interagir com o banco de dados e se comunicar com APIs externas.

### Arquivo: `services/accountService.ts`

**Propósito:**

Encapsula toda a lógica de negócio relacionada ao Plano de Contas. Este serviço vai além de um simples CRUD, implementando funcionalidades inteligentes para a criação e manutenção das contas contábeis.

**Funções Principais e Lógica:**

- **`getAccounts(..)` e `getAccountsByType(..)`**: Funções padrão para buscar contas de forma paginada ou filtrada por tipo, sempre no escopo da organização e do período contábil ativos do usuário.

- **`createAccount(..)`**: Esta função contém uma lógica sofisticada para a criação de contas:
  1.  **Determinação de Tipo:** Primeiramente, define o tipo da conta (`asset`, `liability`, etc.). Se um tipo for fornecido, ele é usado. Caso contrário, o serviço busca a conta pai (`parent_account_id`) e herda o tipo dela. Se não houver pai, um tipo padrão é aplicado.
  2.  **Geração de Código Hierárquico:** O serviço gera automaticamente um código contábil estruturado. Se a conta tem um pai (ex: `1.1 Caixa e Equivalentes`), ele busca a última conta filha existente (ex: `1.1.1 Caixa`) e cria a nova com o próximo número sequencial (`1.1.2 Bancos`). Se for uma conta de nível superior, ele segue a sequência principal (ex: `1 Ativo`, `2 Passivo`, `3 Patrimônio Líquido`).
  3.  **Inserção:** Após determinar o tipo e o código, a função insere a nova conta no banco de dados.

- **`deleteAccount(..)`**: Antes de deletar, verifica se a conta possui a flag `is_protected`. Contas essenciais para o sistema (como "Lucros Acumulados") são protegidas para evitar exclusões acidentais que poderiam corromper a lógica contábil.

- **`getOrCreateAccount(..)`**: Uma das funções mais avançadas, combinando busca, criação e IA.
  1.  **Busca:** Tenta encontrar uma conta pelo nome exato.
  2.  **IA para Classificação:** Se a conta não existe, a função constrói um prompt para a API Gemini, enviando o nome da conta e o contexto do lançamento contábil. Ela solicita à IA que sugira o `type` (tipo) e o `parentAccountName` (nome da conta pai) em formato JSON.
  3.  **Criação Recursiva e Segura:** Se a IA sugere uma conta pai, a função chama a si mesma (`getOrCreateAccount`) para garantir que a hierarquia completa exista, criando a conta pai (e potencialmente a avó, etc.) primeiro. Para evitar loops infinitos (ex: A é pai de B, e B é pai de A), a função mantém um registro das contas que estão sendo processadas e interrompe a execução se um ciclo for detectado.
  4.  **Criação Final:** Com a hierarquia garantida e o tipo de conta sugerido pela IA, ela finalmente chama `createAccount` para criar a conta desejada.

### Arquivo: `services/chatbotService.ts`

**Propósito:**

Atua como o cérebro e orquestrador da funcionalidade de chatbot. Ele interpreta a linguagem natural do usuário para determinar sua intenção e, em seguida, coordena outros serviços para formular uma resposta inteligente e contextual.

**Funções Principais e Lógica:**

- **`sendMessageToChatbot(..)`**: Esta é a função central do serviço.
  1.  **Detecção de Intenção com IA:** A primeira e mais crucial etapa é enviar a mensagem do usuário e o histórico da conversa para a API Gemini. É usado um prompt que instrui a IA a analisar a conversa e retornar um JSON estruturado contendo a `intent` (intenção) do usuário. As intenções possíveis são pré-definidas (ex: `resolve_exercise_request`, `validate_journal_entry_request`, `general_question`), transformando texto não estruturado em um comando acionável.
  2.  **Delegação Baseada na Intenção:** Após receber a intenção, o serviço atua como um roteador:
      - Se a intenção é `exercise_text_received`, ele delega a tarefa para o `exerciseSolverService`.
      - Se a intenção é `journal_entry_text_received`, ele chama o `journalEntryValidatorService`.
      - Se a intenção é `awaiting_existing_journal_entry_description`, ele usa o `journalEntrySearchService` para buscar lançamentos no banco de dados com base na descrição fornecida pelo usuário.
      - Se a intenção é mais simples, como `validate_existing_journal_entry_request`, o próprio serviço pode formular a resposta (ex: "Ok, qual a descrição do lançamento que você quer validar?"), guiando o usuário para o próximo passo.
  3.  **Gerenciamento de Conversa:** O serviço mantém o estado da conversa, adicionando a nova mensagem do usuário e a resposta final da IA ao histórico. Este histórico é reenviado à API a cada nova mensagem, fornecendo o contexto necessário para respostas coerentes.
  4.  **Resposta Estruturada:** Em vez de retornar apenas texto, o serviço envia um objeto `ChatbotResponse` completo para o frontend. Este objeto contém a resposta textual, o histórico atualizado, a intenção final e, opcionalmente, dados estruturados como `proposedEntries` (a solução de um exercício) ou `clarifyingQuestions` (perguntas da IA). Isso permite que a interface do usuário seja altamente dinâmica e reativa.

### Arquivo: `services/confirmJournalEntryService.ts`

**Propósito:**

Serve como a ponte entre uma sugestão de lançamento gerada pela IA (via `exerciseSolverService`) e sua persistência no banco de dados. Ele transforma os dados brutos da proposta em registros contábeis concretos e interligados.

**Funções Principais e Lógica:**

- **`confirmProposedJournalEntries(..)`**: Esta é a única função exportada e orquestra todo o processo.
  1.  **Iteração:** A função percorre cada `ProposedEntry` (lançamento proposto) recebido.
  2.  **Criação do Cabeçalho:** Para cada proposta, ela primeiro chama `createJournalEntry` para criar o registro principal na tabela `journal_entries`, que contém a data e a descrição do lançamento.
  3.  **Resolução de Contas (A Mágica Acontece Aqui):** Em seguida, itera sobre todas as linhas de débito e crédito da proposta. Para cada nome de conta (ex: "Caixa", "Receita de Vendas"), ela chama a função `getOrCreateAccount` do `accountService`.
      - Se a conta "Receita de Vendas" não existir no plano de contas do usuário, o `getOrCreateAccount` será acionado, usará a IA para classificá-la como `revenue` e a criará no banco de dados antes de prosseguir. Isso torna o sistema extremamente flexível, pois o usuário não precisa pré-cadastrar todas as contas.
  4.  **Criação das Linhas:** Com os IDs de todas as contas em mãos (sejam as que já existiam ou as que acabaram de ser criadas), a função chama `createSimpleEntryLines` para inserir em lote todas as linhas de débito e crédito na tabela `entry_lines`, associando-as ao cabeçalho criado no passo 2.
  5.  **Retorno:** Ao final, retorna uma lista dos lançamentos completos que foram efetivamente criados no banco de dados.

### Arquivo: `services/documentProcessorService.ts`

**Propósito:**

Fornece uma funcionalidade centralizada para extrair texto de diferentes tipos de arquivos, como PDFs e imagens. Este serviço abstrai a complexidade das diferentes bibliotecas de extração de texto.

**Funções Principais e Lógica:**

- **`processDocument(fileBuffer, mimetype)`**: A função principal que recebe o conteúdo do arquivo (`Buffer`) e seu tipo MIME.
  - **Roteamento por Tipo:** A lógica principal é um `if/else if` que direciona o arquivo para o motor de processamento correto com base no `mimetype`.
  - **Extração de PDF:** Se o tipo for `application/pdf`, ele utiliza a biblioteca `pdf-parse` para extrair o conteúdo textual. Este método é eficaz para PDFs que contêm texto embutido.
  - **Extração de Imagem (OCR):** Se o tipo for de imagem (ex: `image/png`, `image/jpeg`), ele utiliza a biblioteca `tesseract.js` para realizar o Reconhecimento Óptico de Caracteres (OCR).
    - **Gerenciamento de Worker:** O Tesseract.js opera com "workers" que são processos computacionalmente intensivos. O código cria um worker, o inicializa para o idioma português (`por`) para melhorar a precisão, e executa o reconhecimento.
    - **Liberação de Recursos:** É crucial que o bloco `finally` chame `worker.terminate()`. Isso garante que os recursos do worker sejam liberados após o uso, evitando vazamentos de memória no servidor.
  - **Tratamento de Erro:** Se o tipo de arquivo não for suportado, a função lança um erro, que é então capturado pelo handler para notificar o cliente.

**Utilização:**

- É chamado pelo `documentProcessor` handler, que lida com o upload de arquivos. O texto extraído por este serviço pode ser usado para preencher campos de formulário, ser analisado pela IA, ou para outras finalidades de automação.

### Arquivo: `services/entryLineService.ts`

**Propósito:**

Este é um serviço auxiliar focado em uma única responsabilidade: criar as linhas de débito e crédito (entry_lines) para um lançamento contábil de forma eficiente.

**Funções Principais e Lógica:**

- **`createSimpleEntryLines(..)`**: A única função do serviço.
  1.  **Mapeamento de Dados:** Recebe um array de objetos de linha simplificados. A função enriquece cada objeto, adicionando os IDs necessários para o escopo dos dados: `journal_entry_id`, `organization_id` e `accounting_period_id`.
  2.  **Inserção em Lote (Bulk Insert):** Em vez de inserir cada linha individualmente (o que geraria múltiplas idas e vindas ao banco de dados), a função passa o array completo de linhas para o método `.insert()` do Supabase. O banco de dados então processa a inserção de todos os registros em uma única transação, o que é significativamente mais performático.
  3.  **Retorno:** Retorna o array de linhas que foram efetivamente criadas no banco de dados, agora com seus IDs e outros campos preenchidos pelo banco.

**Utilização:**

- Atua como um componente de baixo nível, chamado por serviços mais complexos. É usado pelo `confirmJournalEntryService` como a etapa final para persistir as linhas de um lançamento proposto pela IA. Também é utilizado pelo handler `entry-lines` para criar os múltiplos lançamentos detalhados de uma transação de compra ou venda.

### Arquivo: `services/exerciseSolverService.ts`

**Propósito:**

Este serviço é dedicado a resolver exercícios contábeis descritos em linguagem natural. Ele utiliza a API Gemini para transformar o texto não estruturado do usuário em uma proposta de lançamento contábil estruturada e validada.

**Funções Principais e Lógica:**

- **`getJsonFromGemini(..)`**: Função interna que interage com a API Gemini.
  - **Engenharia de Prompt:** O núcleo da sua inteligência está no prompt enviado à IA. O prompt instrui o Gemini a atuar como um assistente contábil brasileiro e a analisar o texto do exercício. Crucialmente, ele exige que a IA tome uma decisão: se o texto tiver todas as informações necessárias (data, descrição, contas, valores balanceados), ela deve retornar um JSON com a chave `"entries"`; se faltar alguma informação, ela deve retornar um JSON com a chave `"clarifyingQuestions"`.
  - **Resposta JSON Forçada:** A chamada à API é configurada com `responseMimeType: 'application/json'` e um `responseSchema`. Isso força a IA a responder estritamente no formato JSON esperado, eliminando a necessidade de analisar texto livre e tornando a integração muito mais robusta e confiável.

- **`solveExercise(..)`**: A função pública que orquestra o processo.
  1.  **Chama a IA:** Invoca `getJsonFromGemini` para obter a resposta estruturada.
  2.  **Análise da Resposta:** Verifica qual chave (`entries` ou `clarifyingQuestions`) foi retornada pela IA.
  3.  **Cenário 1: Perguntas de Esclarecimento:** Se a IA retornar `clarifyingQuestions`, o serviço entende que o exercício está incompleto e retorna um objeto `ClarificationResponse`. Isso sinaliza para o `chatbotService` que ele deve apresentar essas perguntas ao usuário.
  4.  **Cenário 2: Proposta de Lançamento:** Se a IA retornar `entries`, o serviço realiza uma **validação de sanidade**: ele calcula a soma de todos os débitos e créditos da proposta. Se não baterem, lança um erro, pois a IA cometeu um engano. Se estiverem balanceados, ele retorna um objeto `SuccessResponse` com os lançamentos propostos, pronto para ser usado pelo `confirmJournalEntryService`.

**Retorno:**

- O serviço retorna uma união discriminada (`SuccessResponse | ClarificationResponse`), permitindo que o código que o chamou (o `chatbotService`) use um simples `if` para saber se obteve uma solução ou se precisa pedir mais informações ao usuário.

### Arquivo: `services/financialTransactionService.ts`

**Propósito:**

Gerencia a lógica de negócio para operações financeiras simples, como Contas a Pagar e Contas a Receber. Este serviço também demonstra a comunicação entre serviços ao interagir com o `NotificationService`.

**Funções Principais e Lógica:**

- **`getFinancialTransactions(..)`**:
  - **Seleção Dinâmica de Tabela:** Determina se deve consultar a tabela `accounts_payable` ou `accounts_receivable` com base no parâmetro `type` recebido.
  - **Busca com Escopo:** Realiza uma consulta `select` na tabela apropriada, sempre filtrando por `organization_id` e `active_accounting_period_id` para garantir que apenas os dados pertencentes ao contexto do usuário sejam retornados.

- **`createFinancialTransaction(..)`**:
  - **Seleção de Tabela:** Assim como na busca, escolhe a tabela correta (`accounts_payable` ou `accounts_receivable`).
  - **Enriquecimento de Dados:** Pega o objeto da transação vindo do handler e adiciona os campos de escopo (`user_id`, `organization_id`, `accounting_period_id`) antes de enviá-lo ao banco de dados.
  - **Criação de Notificação (Side-effect):** Após a inserção bem- sucedida da transação, o serviço executa um efeito colateral: ele instancia o `NotificationService` e chama o método `createNotification`. Ele constrói uma mensagem amigável (ex: "Nova conta a pagar criada: ...") e cria um registro de notificação para o usuário, informando-o sobre a nova pendência financeira.

**Utilização:**

- O serviço é instanciado e utilizado por outros serviços que precisam gerar alertas para o usuário. Por exemplo, o `financialTransactionService` o utiliza para notificar o usuário sempre que uma nova conta a pagar ou a receber é criada em seu nome, mantendo-o informado sobre atividades importantes em sua conta.

### Arquivo: `services/journalEntrySearchService.ts`

**Propósito:**

Fornece uma função de busca altamente especializada para encontrar lançamentos contábeis com base em uma descrição textual. É um componente chave para a funcionalidade do chatbot, permitindo que ele encontre registros existentes mencionados pelo usuário.

**Funções Principais e Lógica:**

- **`searchJournalEntriesByDescription(..)`**:
  - **Cliente Supabase com Chave de Serviço:** Este serviço inicializa seu próprio cliente Supabase usando a `SUPABASE_SERVICE_ROLE_KEY`. Esta é uma decisão de design deliberada. A chave de serviço ignora todas as políticas de RLS (Row Level Security). Isso é feito para garantir que a busca possa varrer todos os lançamentos da organização, sem o risco de uma política de RLS específica do usuário ocultar um resultado relevante. A segurança é mantida ao filtrar a busca explicitamente por `organization_id` e `active_accounting_period_id`.
  - **Busca com `ilike`:** A consulta ao banco de dados utiliza o operador `ilike` do PostgreSQL. Isso permite uma busca textual que é:
    - **Case-insensitive:** Não diferencia maiúsculas de minúsculas (ex: "venda" encontra "Venda").
    - **Parcial:** O uso dos wildcards `%` (ex: `%termo%`) permite encontrar a descrição em qualquer parte do texto, não apenas no início ou no fim.
  - **Normalização:** O termo de busca é normalizado com `.trim()` para remover espaços em branco antes de ser usado na consulta, melhorando a correspondência.

**Utilização:**

- É chamado pelo `chatbotService` quando a intenção do usuário é `awaiting_existing_journal_entry_description`. O serviço de chatbot pega a resposta do usuário (a descrição que ele digitou) e a passa para esta função para encontrar os lançamentos correspondentes no banco de dados.

### Arquivo: `services/journalEntryService.ts`

**Propósito:**

Este é o serviço central para todas as operações de CRUD (Criar, Ler, Atualizar, Deletar) relacionadas aos cabeçalhos dos lançamentos contábeis (`journal_entries`). Ele também lida com operações em massa para eficiência.

**Funções Principais e Lógica:**

- **`getJournalEntries(..)`**: Uma função de busca robusta e flexível.
  - **Paginação e Filtros Simples:** Suporta paginação (`page`, `limit`) e filtros diretos na tabela, como por `status`.
  - **Filtros Avançados com Subqueries:** Para filtrar por dados que estão na tabela relacionada `entry_lines` (como `hasProduct`, `hasTaxes` ou por contas específicas), o serviço adota uma estratégia de subquery. Primeiro, ele faz uma consulta na tabela `entry_lines` para obter os `journal_entry_id`s que satisfazem a condição. Em seguida, usa esses IDs em uma cláusula `in('id', ids)` na consulta principal à tabela `journal_entries`. Esta abordagem é uma forma eficaz de realizar o que seria um `JOIN` complexo em SQL, but usando o construtor de queries do Supabase.

- **`createJournalEntry(..)` e `updateJournalEntry(..)`**: Funções padrão de inserção e atualização, que garantem que os dados sejam sempre associados à `organization_id` e `accounting_period_id` correctos.

- **`deleteJournalEntry(..)`**: Para garantir a integridade dos dados, esta função não executa um simples `DELETE`. Em vez disso, ela chama uma **Função de Banco de Dados (RPC)** chamada `delete_journal_entry_and_lines`. Delegar esta operação ao banco de dados garante que o lançamento principal e *todas* as suas linhas de débito/crédito associadas sejam excluídas em uma única transação atômica, prevenindo "linhas órfãs".

- **`checkDoubleEntryBalance(..)`**: Uma função de utilidade para verificar a integridade de um lançamento. Ela soma todos os débitos e créditos de um `journal_entry_id` para garantir que o total seja zero, o princípio fundamental das partidas dobradas.

- **`bulkDeleteJournalEntries(..)`**: Semelhante à exclusão única, utiliza uma RPC (`delete_multiple_journal_entries_and_lines`) para deletar múltiplos lançamentos e todas as suas linhas de forma atômica e eficiente.

- **`bulkUpdateJournalEntryStatus(..)`**: Atualiza o status de múltiplos lançamentos de uma só vez usando a cláusula `in('id', ids)`, o que é muito mais performático do que fazer um `update` para cada ID individualmente.

### Arquivo: `services/journalEntryValidatorService.ts`

**Propósito:**

Este serviço tem uma única e focada função: usar a IA para atuar como um especialista contábil, fornecendo feedback detalhado sobre um lançamento descrito pelo usuário.

**Funções Principais e Lógica:**

- **`validateJournalEntry(..)`**:
  - **Engenharia de Prompt:** O coração do serviço é o prompt cuidadosamente elaborado. Ele define a persona da IA como um "professor de contabilidade experiente" e estabelece um formato de resposta claro e estruturado. A IA é instruída a classificar o lançamento (CORRETO, INCOMPLETO, INCORRETO), explicar o porquê, e sugerir a forma correta se necessário, usando Markdown para clareza.
  - **Chamada à IA:** Envia o prompt e a descrição do usuário para a API Gemini. É importante notar que ele solicita um `maxOutputTokens` maior, permitindo que a IA gere uma resposta mais longa e educativa, sem ser cortada no meio.
  - **Retorno Direto:** Diferente de outros serviços que retornam JSON, este retorna diretamente o texto formatado pela IA. O objetivo não é o processamento por máquina, but a exibição direta para o usuário final no chatbot.

**Utilização:**

- É chamado pelo `chatbotService` quando a intenção do usuário é validar um lançamento que ele mesmo elaborou. Permite que a aplicação ofereça uma ferramenta de aprendizado interativo, onde os usuários podem testar seus conhecimentos e receber correções instantâneas e didáticas.

### Arquivo: `services/notificationService.ts`

**Propósito:**

Implementa um sistema de notificações para o usuário, utilizando uma abordagem de classe para organizar a lógica. Centraliza a criação, busca e atualização de notificações.

**Classe e Métodos:**

- **`NotificationService`**: Uma classe que encapsula os métodos de notificação.
  - **`createNotification(..)`**: Realiza uma inserção simples na tabela `notifications`, gravando para quem é a notificação (`userId`), o contexto (`organizationId`), um `type` para categorização (ex: `'new_transaction'`) e a mensagem de texto.
  - **`getNotificationsByUserId(..)`**: Busca todas as notificações de um usuário específico, ordenando-as da mais recente para a mais antiga para exibição no frontend.
  - **`markAsRead(..)`**: Atualiza uma notificação específica para marcá-la como lida. Inclui uma cláusula `eq('user_id', userId)` na query de atualização como uma **camada de segurança crucial**, garantindo que um usuário só possa marcar as *suas próprias* notificações como lidas, prevenindo que ele modifique notificações de outros usuários.

**Utilização:**

- O serviço é instanciado e utilizado por outros serviços que precisam gerar alertas para o usuário. Por exemplo, o `financialTransactionService` o utiliza para notificar o usuário sempre que uma nova conta a pagar ou a receber é criada em seu nome, mantendo-o informado sobre atividades importantes em sua conta.

### Arquivo: `services/productService.ts`

**Propósito:**

Lida com a lógica de negócio relacionada a produtos e ao controle de estoque, focando especificamente no registro de compras e no cálculo do Custo da Mercadoria Vendida (CMV).

**Funções Principais e Lógica:**

- **Delegação ao Banco de Dados (RPC):** A principal característica deste serviço é que ele delega a lógica de negócio complexa para funções (RPCs - Remote Procedure Calls) dentro do próprio banco de dados PostgreSQL.
  - **`recordProductPurchase(..)`**: Não executa um `INSERT` ou `UPDATE` diretamente. Em vez disso, chama a função de banco de dados `record_purchase`. Essa função interna do banco de dados é responsável por toda a lógica de uma compra: atualizar os níveis de estoque, possivelmente recalcular o custo médio ponderado do produto e criar registros históricos, tudo de forma atômica e segura.
  - **`calculateCogsForSale(..)`**: Da mesma forma, chama a função de banco de dados `calculate_cogs_for_sale`. Esta RPC é responsável por implementar o método de custeio de estoque (ex: Custo Médio Ponderado, PEPS), calcular o CMV para a quantidade de itens vendidos e, provavelmente, dar baixa na quantidade correspondente do estoque, tudo em uma única transação.

**Vantagens da Abordagem RPC:**

- **Performance:** Executar lógicas complexas que envolvem múltiplas tabelas e cálculos diretamente no banco de dados é geralmente mais rápido do que buscar os dados para a aplicação, processá-los e depois enviar os resultados de volta.
- **Atomicidade e Integridade:** Garante que operações complexas (como uma venda, que envolve calcular o CMV e atualizar o estoque) sejam atômicas. Ou tudo é executado com sucesso, ou nada é, prevenindo inconsistências nos dados.

**Utilização:**

- Este serviço é chamado por outros handlers ou serviços que lidam com transações que envolvem produtos, como o handler `entry-lines` ao processar uma nota fiscal de venda ou compra.

### Arquivo: `services/referenceService.ts`

**Propósito:**

Fornece um mecanismo para gerar números de referência sequenciais e únicos para documentos, como `JE-2023-001`, `JE-2023-002`, etc. Ele garante que cada tipo de documento, dentro de cada organização e período contábil, tenha sua própria sequência numérica.

**Funções Principais e Lógica:**

- **`getNextReferenceNumber(..)`**:
  1.  **Busca da Sequência:** A função primeiro tenta encontrar um registro na tabela `reference_sequences` que corresponda à combinação exata de `prefix`, `organizationId` e `accountingPeriodId`. Isso isola as sequências, impedindo que o contador de uma empresa afete o de outra.
  2.  **Cenário 1: Nova Sequência:** Se nenhum registro for encontrado (um erro `PGRST116` do Supabase), o serviço entende que esta é a primeira vez que a referência está sendo gerada para este contexto. Ele inicia o `nextNumber` como `1` e insere um novo registro na tabela `reference_sequences` para "reservar" o prefixo e iniciar a contagem.
  3.  **Cenário 2: Sequência Existente:** Se um registro for encontrado, o serviço pega o `last_number` armazenado, o incrementa em 1 para obter o `nextNumber`, e imediatamente atualiza o registro no banco de dados com o novo `last_number`. Este passo de atualização é crucial para evitar que o mesmo número seja gerado duas vezes se a função for chamada rapidamente em sucessão.

**Utilização:**

- É chamado por serviços ou handlers que precisam criar um novo documento com um identificador legível e sequencial, como o `journalEntryService` antes de criar um novo lançamento contábil.

### Arquivo: `services/reportService.ts`

**Propósito:**

Este serviço é o coração da geração de relatórios financeiros. Sua responsabilidade é buscar todos os dados brutos necessários (contas, lançamentos, produtos) para um determinado período e, em seguida, realizar os cálculos e as transformações em memória para produzir os dados estruturados para os principais relatórios contábeis.

**Funções Principais e Lógica:**

- **`generateReports(..)`**: A função orquestradora principal.
  1.  **Busca de Dados em Paralelo:** Utiliza `Promise.all` para buscar de forma concorrente todas as contas, lançamentos do período e produtos. Isso é muito mais eficiente do que buscar cada conjunto de dados sequencialmente.
  2.  **Cálculo em Cadeia:** Após ter os dados brutos, ela invoca as várias funções de cálculo (`calculateTrialBalance`, `calculateDreData`, etc.) para processar esses dados.
  3.  **Agregação:** Retorna um único objeto grande contendo tanto os dados brutos quanto os resultados de todos os relatórios calculados.

- **`calculateTrialBalance(..)` (Balancete de Verificação)**:
  - A base para todos os outros relatórios. Ele cria um `Map` para manter o estado de cada conta. Itera sobre cada linha de cada lançamento e acumula os totais de débito e crédito para cada conta. No final, calcula o saldo final de cada conta, respeitando sua natureza (contas de ativo e despesa têm saldo devedor; as demais, credor).

- **`calculateDreData(..)` (Demonstração do Resultado do Exercício)**:
  - Reutiliza o resultado do `calculateTrialBalance`. Filtra apenas as contas de `revenue` (receita) e `expense` (despesa), soma seus saldos e calcula o `netIncome` (lucro/prejuízo líquido).

- **`calculateBalanceSheetData(..)` (Balanço Patrimonial)**:
  - Também reutiliza o `calculateTrialBalance`. Soma os saldos das contas de `asset`, `liability` e `equity`.
  - **Ponto Crítico da Integração Contábil:** Ele pega o `netIncome` calculado pela DRE e o **adiciona** ao `totalEquity`. Este passo é fundamental e demonstra a ligação intrínseca entre a DRE e o Balanço Patrimonial.
  - Realiza a verificação final da equação contábil: `Ativo = Passivo + Patrimônio Líquido`.

- **Outros Relatórios:** Inclui também funções para gerar um Razão detalhado (`calculateLedgerDetails`), uma Demonstração do Fluxo de Caixa (`calculateDfcData`) e um balanço de estoque (`calculateStockFromJournalEntries`).

**Utilização:**

- É a principal fonte de dados para os handlers de relatórios (`reports/generate.ts` e `reports/export.ts`), fornecendo todos os dados necessários para a visualização na interface do usuário ou para a exportação em arquivos.

### Arquivo: `services/taxRuleService.ts`

**Propósito:**

Fornece as operações básicas de CRUD (Criar, Ler, Atualizar, Deletar) para gerenciar regras de impostos personalizadas. Essas regras permitem que os usuários definam uma lógica fiscal mais granular que pode substituir as configurações padrão (por exemplo, definir uma alíquota de ICMS específica para transações entre SP e RJ).

**Funções Principais e Lógica:**

- **`getTaxRules(..)`**: Busca e retorna todas as regras fiscais para uma determinada organização.
- **`createTaxRule(..)`**: Cria uma nova regra fiscal, garantindo que ela seja associada à `organization_id` correta.
- **`updateTaxRule(..)`**: Atualiza uma regra existente. A consulta inclui uma cláusula `eq('organization_id', ...)` para garantir que um usuário só possa modificar regras de sua própria organização.
- **`deleteTaxRule(..)`**: Deleta uma regra existente, também com a verificação de segurança do `organization_id`.

**Utilização:**

- Este serviço é a camada de lógica de negócio para o handler `tax-rules`. Ele permite que a aplicação ofereça personalização fiscal. O `taxService` provavelmente consulta essas regras durante o cálculo de impostos para verificar se uma alíquota personalizada deve ser aplicada em vez da alíquota padrão.

### Arquivo: `services/taxService.ts`

**Propósito:**

Este é o motor central de cálculo de impostos da aplicação. Ele é projetado para lidar com a complexidade da legislação tributária brasileira, aplicando diferentes alíquotas e regras com base em múltiplos fatores, como regime tributário, tipo de operação e localização.

**Funções Principais e Lógica:**

- **`calculateTaxes(..)`**: A única e principal função do serviço.
  1.  **Coleta de Parâmetros:** Recebe um objeto grande com todos os dados relevantes para a transação (`total_gross`, alíquotas, `tax_regime`, NCM, UFs, etc.).
  2.  **Aplicação de Regras de Precedência:** A lógica segue uma hierarquia para determinar as alíquotas corretas:
      - **Regras Específicas:** Primeiro, verifica se existem regras customizadas na tabela `tax_rules` (ex: uma alíquota de ICMS específica para a rota SP -> RJ) ou regras baseadas no NCM do produto. Se existirem, essas regras têm prioridade e sobrescrevem as alíquotas padrão.
      - **Regime Tributário:** Em seguida, ajusta as alíquotas com base no `tax_regime` da organização. Para o `Simples Nacional`, por exemplo, muitas alíquotas são zeradas, pois o imposto é recolhido de forma unificada.
      - **Padrão:** Se nenhuma das condições acima for atendida, utiliza as alíquotas padrão passadas nos parâmetros.
  3.  **Ordem de Cálculo (Importante):** A ordem dos cálculos segue a legislação fiscal:
      - O IPI é calculado primeiro e seu valor é somado à base de cálculo do ICMS.
      - O ICMS é calculado sobre essa base maior (valor dos produtos + IPI).
      - PIS e COFINS são calculados sobre o valor bruto original.
      - O ICMS-ST é calculado por último, pois depende do valor do ICMS próprio.
  4.  **Cálculo do Valor Líquido:** Para vendas, o valor líquido final é o valor bruto mais os impostos que são repassados ao cliente (IPI e ICMS-ST). Para compras, assume-se que o valor líquido já é o total da nota, e os impostos são calculados apenas para fins de crédito.
  5.  **Trilha de Auditoria:** Durante todo o processo, a função popula um array `details`, que registra cada etapa do cálculo, a regra aplicada, a base de cálculo e o valor resultante. Isso é extremamente valioso para a depuração e para fornecer transparência ao usuário sobre como os valores foram obtidos.

**Utilização:**

- É chamado principalmente pelo handler `entry-lines` quando uma transação de compra ou venda com produtos e impostos é criada, garantindo que todos os valores fiscais sejam calculados e registrados corretamente.

### Arquivo: `services/taxSettingService.ts`

**Propósito:**

Este serviço atua como um provedor de configuração para o `taxService`. Sua função é buscar as alíquotas de impostos e o regime tributário corretos que devem ser aplicados a uma transação, com base em sua data.

**Funções Principais e Lógica:**

- **`getTaxSettings(..)`**:
  - **Consulta Histórica:** A lógica chave desta função é a consulta sensível ao tempo. Ela busca na tabela `tax_settings` não apenas pela `organization_id`, but também por registros onde a `effective_date` (data de vigência) é menor ou igual à data da transação.
  - **Seleção da Alíquota Correta:** Ao ordenar os resultados pela `effective_date` em ordem decrescente e pegar apenas o primeiro (`limit(1)`), a função garante que está retornando o conjunto de alíquotas que estava em vigor no exato momento da transação, permitindo cálculos históricos precisos mesmo que as alíquotas mudem.

- **`getTaxRegimeHistory(..)`**:
  - **Busca do Regime Atual:** De forma semelhante, busca na tabela `tax_regime_history` o regime tributário mais recente da organização, ordenando pela data de início e pegando o primeiro resultado.

**Utilização:**

- É uma dependência direta do `taxService`. Antes de qualquer cálculo, o `taxService` chama as funções deste serviço para obter o contexto fiscal correto (alíquotas e regime) para a transação em questão, garantindo a aplicação das regras fiscais apropriadas.

### Arquivo: `services/userPresenceService.ts`

**Propósito:**

Gerencia a funcionalidade de presença de usuário em tempo real (ou quase real), permitindo que a aplicação saiba quais usuários estão ativos em um determinado contexto (organização e período contábil).

**Classe e Métodos:**

- **`UserPresenceService`**: Uma classe que encapsula a lógica de presença.
  - **`updateUserPresence(..)`**:
    - **Operação `upsert`:** Utiliza o comando `upsert` do Supabase, que é uma combinação eficiente de `UPDATE` ou `INSERT`. Se um registro para o `userId` já existe, ele atualiza o campo `last_seen` com o timestamp atual. Se não existe, ele cria um novo registro.
    - **Timestamping:** O campo `last_seen` é o coração da funcionalidade, registrando a última vez que o usuário esteve ativo.
  - **`getOnlineUsersInPeriod(..)`**:
    - **Definição de "Online":** A lógica considera um usuário "online" se sua última atividade (`last_seen`) ocorreu nos últimos 5 minutos. Isso é feito calculando um timestamp de 5 minutos atrás.
    - **Query com Filtro de Tempo:** A consulta ao banco de dados na tabela `user_presence` filtra os registros com base no `organizationId`, `activeAccountingPeriodId` e, crucialmente, no `last_seen` ser maior ou igual ao timestamp de 5 minutos atrás.
    - **Enriquecimento de Dados:** A consulta faz um `join` com a tabela `profiles` para incluir o nome de usuário e o avatar nos resultados, permitindo que o frontend exiba uma lista de usuários online de forma amigável.

**Utilização:**

- O método `updateUserPresence` é projetado para ser chamado periodicamente pelo cliente (frontend) enquanto o usuário está ativo na página.
- O método `getOnlineUsersInPeriod` é chamado pelo cliente sempre que ele precisar exibir a lista de outros colaboradores que estão trabalhando no mesmo contexto, habilitando recursos de colaboração.

### Arquivo: `services/journalEntryHistoryService.ts`

**Propósito:**

Encapsula a lógica de negócio para buscar o histórico de alterações de lançamentos contábeis.

**Classe e Métodos:**

- **`JournalEntryHistoryService`**: Uma classe que encapsula os métodos para interagir com o histórico de lançamentos.
  - **`getJournalEntryHistory(journalEntryId, token)`**: Busca o histórico de alterações para um `journalEntryId` específico na tabela `journal_entry_history`. Os resultados são ordenados pela data de alteração (`changed_at`) em ordem decrescente (mais recentes primeiro).

**Utilização:**

- Este serviço é utilizado pelo handler `journal-entry-history.ts` para fornecer a funcionalidade de visualização do histórico de lançamentos, promovendo a separação de responsabilidades e a reutilização de código.

---

## Diretório: `handlers`

Este diretório é a camada de entrada da API, responsável por receber as requisições HTTP, validar os dados, chamar os serviços apropriados e retornar uma resposta ao cliente. Cada arquivo corresponde a um recurso específico da API.

### Arquivo: `handlers/accounting-periods.ts`

**Propósito:**

Gerencia todas as operações CRUD (Criar, Ler, Atualizar, Deletar) para os Períodos Contábeis e seus históricos de regimes fiscais associados.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** A rota é protegida pelo middleware `withAuth`. A primeira ação do handler é chamar `getUserOrganizationAndPeriod` para garantir que todas as operações subsequentes sejam corretamente limitadas à organização do usuário.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (GET, POST, PUT, DELETE).
3.  **`POST` (Criação):**
    - Valida o corpo da requisição com o `createAccountingPeriodSchema`.
    - **Validação de Sobreposição:** Antes de inserir, realiza uma verificação de integridade crucial: busca todos os `tax_regime_history` existentes para a organização e garante que as novas datas não se sobreponham a nenhum período já registrado. Isso previne a criação de dados inconsistentes.
    - **Transação Lógica:** Executa duas inserções no banco de dados: uma na tabela `accounting_periods` e outra na `tax_regime_history`, vinculando o período ao seu regime fiscal.
4.  **`GET` (Leitura):** Busca e retorna uma lista de todos os períodos contábeis da organização, ordenados do mais recente para o mais antigo.
5.  **`PUT` (Atualização):**
    - Valida o corpo da requisição com o `updateAccountingPeriodSchema`.
    - Também executa a validação de sobreposição de datas para garantir que a alteração não crie conflitos.
    - Atualiza os registros nas tabelas `accounting_periods` e `tax_regime_history`.
6.  **`DELETE` (Exclusão):**
    - Garante a integridade referencial ao deletar primeiro o registro dependente na tabela `tax_regime_history` antes de deletar o registro principal em `accounting_periods`.
7.  **Tratamento de Erros:** Todas as operações são envoltas em um bloco `try...catch` que utiliza o `formatSupabaseError` para retornar mensagens de erro claras e padronizadas.

### Arquivo: `handlers/accounts.ts`

**Propósito:**

Atua como o endpoint da API para todas as operações relacionadas ao Plano de Contas (`/api/accounts`). A principal responsabilidade deste handler é validar as requisições HTTP e delegar a lógica de negócio para o `accountService`.

**Lógica e Fluxo:**

1.  **Autenticação e Escopo:** Como outros handlers, obtém o contexto do usuário (`organization_id`, `active_accounting_period_id`) através do `getUserOrganizationAndPeriod` logo no início. Isso garante que todas as operações sejam seguras e restritas ao ambiente de trabalho correto do usuário.
2.  **Roteamento por Método:** Separa a lógica para `GET`, `POST`, `PUT`, e `DELETE`.
3.  **`GET` (Leitura):**
    - **Busca por Tipo:** Possui uma rota especializada. Se a URL contém `/by-type`, ele chama a função `getAccountsByType` do serviço para retornar contas de um tipo específico (ex: apenas 'Ativos').
    - **Busca Padrão:** Caso contrário, chama `getAccounts` para uma busca paginada padrão, passando os parâmetros `page` e `limit` da query string.
4.  **`POST` (Criação):**
    - Valida o corpo da requisição com o `createAccountSchema`.
    - Delega a criação para o `accountService.createAccount`. O handler não precisa saber dos detalhes complexos de geração de código ou inferência de tipo; ele apenas confia no serviço para fazer o trabalho pesado.
5.  **`PUT` (Atualização):**
    - Valida o corpo com `updateAccountSchema`.
    - Faz uma verificação para garantir que o corpo da requisição não esteja vazio, evitando uma chamada desnecessária ao banco de dados.
    - Chama `accountService.updateAccount` e lida com a resposta, retornando `404 Not Found` se o serviço indicar que a conta não foi encontrada.
6.  **`DELETE` (Exclusão):**
    - Valida o ID do produto na URL para garantir que é um UUID válido.
    - Chama `accountService.deleteAccount` e retorna `204 No Content` em caso de sucesso.
7.  **Tratamento de Erros:** Um bloco `try...catch` global captura quaisquer erros lançados pela camada de serviço (como a tentativa de deletar uma conta protegida), os formata e retorna um erro `500` padronizado.

### Arquivo: `handlers/chatbot.ts`

**Propósito:**

É o ponto de entrada da API para a funcionalidade de chatbot. Sua responsabilidade é simples: receber a mensagem do usuário, validá-la e passá-la para o `chatbotService`, que contém toda a lógica complexa de conversação e IA.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** Obtém o `organization_id` e `active_accounting_period_id` do usuário. Isso é crucial para que o `chatbotService` possa, se necessário, buscar informações específicas da empresa do usuário (como lançamentos contábeis existentes).
2.  **Validação:** Usa o `chatbotRequestSchema` para garantir que a requisição contenha um campo `message` e que o `conversationHistory` (se enviado) esteja no formato correto.
3.  **Delegação Total:** O trabalho principal é chamar a função `sendMessageToChatbot` do serviço, passando todos os dados relevantes. O handler não se envolve na lógica de IA, apenas orquestra a chamada.
4.  **Resposta:** Retorna o objeto de resposta estruturado (`ChatbotResponse`) fornecido pelo serviço diretamente para o cliente.

### Arquivo: `handlers/confirmJournalEntryHandler.ts`

**Propósito:**

Este handler fornece o endpoint da API (`/api/confirm-journal-entry`) para a ação de alta importância de transformar um conjunto de lançamentos contábeis propostos (geralmente pela IA) em registros oficiais e permanentes no banco de dados.

**Lógica e Fluxo:**

1.  **Autenticação e Escopo:** Protegido pelo `withAuth`, o handler obtém o `organization_id` e `active_accounting_period_id` para garantir que os novos lançamentos sejam criados no contexto correto.
2.  **Validação Rigorosa:** Utiliza o `confirmEntriesRequestSchema` para fazer uma validação profunda da estrutura dos dados recebidos. Ele verifica se o payload é um array de `proposedEntries` e se cada objeto dentro do array tem a estrutura esperada (`date`, `description`, `debits`, `credits`). Esta é uma etapa de segurança vital para garantir que os dados (potencialmente vindos de uma IA) estejam bem formados antes de serem processados.
3.  **Delegação ao Serviço:** O handler delega completamente a lógica de negócio para a função `confirmProposedJournalEntries` no `confirmJournalEntryService`. Ele não tem conhecimento sobre como as contas são criadas ou como as linhas são inseridas; sua única função é orquestrar a chamada para o serviço que sabe como fazer isso.
4.  **Resposta de Sucesso:** Em caso de sucesso, retorna um status `200 OK` com uma mensagem de confirmação e os dados dos lançamentos que acabaram de ser criados, fornecendo um feedback claro ao cliente.

### Arquivo: `handlers/documentProcessor.ts`

**Propósito:**

Este handler é o endpoint da API (`/api/document-processor`) para upload de arquivos (PDFs, imagens) com o objetivo de extrair seu conteúdo textual.

**Lógica e Fluxo:**

1.  **Configuração do Parser de Corpo:** O handler exporta uma configuração `api: { bodyParser: false }`. Esta é uma instrução específica para o ambiente da Vercel, desabilitando o parser de corpo padrão que não consegue lidar com o formato `multipart/form-data`, usado para upload de arquivos.
2.  **Uso do `formidable`:** A biblioteca `formidable` é usada para processar a requisição de upload. Ela lida com o streaming do arquivo, salvando-o em um local temporário no servidor e disponibilizando seus metadados.
3.  **Leitura do Arquivo Temporário:** Após o `formidable` salvar o arquivo, o handler usa a função `readFile` do Node.js para carregar o conteúdo do arquivo temporário em um `Buffer`.
4.  **Delegação ao Serviço:** O `Buffer` do arquivo e seu `mimetype` (tipo do arquivo) são passados para a função `processDocument` no `documentProcessorService`, que contém a lógica real de extração de texto (seja por OCR para imagens ou parse para PDFs).
5.  **Resposta:** Retorna um JSON contendo o `extractedText` que foi retornado pelo serviço.

### Arquivo: `handlers/entry-lines.ts`

**Propósito:**

Este é um dos handlers mais complexos, responsável por gerenciar as linhas de um lançamento contábil (`/api/entry-lines`). Ele não apenas cria linhas simples, but também orquestra a criação de lançamentos contábeis completos e detalhados para transações de compra e venda, incluindo todos os impostos e movimentações de estoque.

**Lógica e Fluxo:**

1.  **Roteamento de Métodos:** Lida com `GET` para buscar linhas de um lançamento e `DELETE` para apagar todas as linhas de um lançamento.
2.  **`POST` (Criação de Lançamentos Complexos):** O coração do handler.
    - **Validação:** Valida a requisição com o `createEntryLineSchema`, que pode incluir tipo de transação, dados de produtos e alíquotas de impostos.
    - **Busca de Contexto Fiscal:** Chama o `taxSettingService` para obter as alíquotas e o regime fiscal corretos para a data da transação.
    - **Cálculo de Impostos:** Delega o cálculo de todos os impostos (ICMS, IPI, PIS, COFINS, etc.) para o `taxService`, que retorna os valores calculados.
    - **Mapeamento de Contas:** Executa uma consulta para buscar os IDs de todas as contas contábeis que serão necessárias para a transação (ex: "Receita de Vendas", "IPI a Recolher", "Estoque", "CMV", "ICMS a Recuperar", etc.). Se alguma conta essencial não for encontrada, retorna um erro, instruindo o usuário a configurar seu plano de contas.
    - **Construção do Lançamento:** Com todos os dados em mãos (valores de impostos, IDs das contas), o handler constrói programaticamente um array com **todas as linhas de débito e crédito** necessárias para registrar a operação de forma completa e balanceada, seguindo os princípios contábeis.
    - **Inserção em Lote:** Envia o array completo de linhas para ser inserido no banco de dados de uma só vez, de forma eficiente.

**Importância:**

- Este handler demonstra uma orquestração significativa, agindo como um "maestro" que chama múltiplos serviços (`taxService`, `taxSettingService`, `supabaseClient`) para reunir todas as informações necessárias antes de construir e persistir um lançamento contábil complexo e preciso.

### Arquivo: `handlers/exerciseSolver.ts`

**Propósito:**

Fornece o endpoint da API (`/api/exercise-solver`) para a funcionalidade de resolução de exercícios com IA. Atua como uma camada fina, validando a entrada e passando a lógica principal para o `exerciseSolverService`.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** A rota é protegida por `withAuth` e obtém o contexto do usuário. Embora o serviço de resolução em si seja genérico, manter o contexto do usuário é uma boa prática para futuras melhorias (ex: adaptar a solução ao plano de contas específico da organização).
2.  **Validação:** Utiliza o `exerciseSolverRequestSchema` para garantir que um texto de exercício (`exercise`) não vazio foi enviado no corpo da requisição.
3.  **Delegação ao Serviço:** A principal responsabilidade do handler é chamar a função `solveExercise` do `exerciseSolverService`, passando o texto do exercício. Toda a complexidade da interação com a IA, interpretação do texto e estruturação da resposta é abstraída pelo serviço.
4.  **Resposta:** O handler recebe a resposta estruturada do serviço (que pode ser uma solução com `proposedEntries` ou um pedido de esclarecimento com `clarifyingQuestions`) e a envia de volta ao cliente com um status `200 OK`.

### Arquivo: `handlers/financial-transactions.ts`

**Propósito:**

Gerencia as operações de CRUD para transações financeiras simples, como Contas a Pagar e Contas a Receber (`/api/financial-transactions`).

**Lógica e Fluxo:**

1.  **Autenticação e Escopo:** Obtém o contexto do usuário (`organization_id`, `active_accounting_period_id`) para garantir que todas as operações sejam restritas ao ambiente de trabalho correto.
2.  **Roteamento por Método (`GET`, `POST`):**
    - **`GET`:**
        - Recebe um parâmetro de query `type` (`payable` ou `receivable`) para determinar qual tipo de transação buscar.
        - Delega a busca para a função `getFinancialTransactions` do `financialTransactionService`.
    - **`POST`:**
        - Também usa o parâmetro `type` para determinar onde criar a transação.
        - Valida o corpo da requisição com o `createFinancialTransactionSchema`.
        - Delega a criação para a função `createFinancialTransaction` do serviço. O serviço, por sua vez, também é responsável por criar uma notificação para o usuário sobre a nova pendência financeira.
3.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro, como `404 Not Found` se nenhuma transação for encontrada ou `400 Bad Request` se a validação do corpo da requisição falhar.

### Arquivo: `handlers/journal-entries.ts`

**Propósito:**

Gerencia todas as operações de CRUD (Criar, Ler, Atualizar, Deletar) para os lançamentos contábeis (`/api/journal-entries`), incluindo operações em massa.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** A rota é protegida por `withAuth`. O handler obtém o `organization_id` e `active_accounting_period_id` do usuário para garantir que todas as operações sejam restritas ao contexto correto.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (GET, POST, PUT, DELETE).
3.  **`GET` (Leitura):**
    - Suporta paginação através dos parâmetros de query `page` e `limit`.
    - Delega a busca para a função `getJournalEntries` do `journalEntryService`.
4.  **`POST` (Criação e Operações em Massa):**
    - **`POST /journal-entries/bulk-delete`:**
        - Lida com a exclusão em massa de lançamentos.
        - Espera um array de `ids` no corpo da requisição.
        - Chama `bulkDeleteJournalEntries` do `journalEntryService`.
    - **`POST /journal-entries/bulk-update-status`:**
        - Lida com a atualização em massa do status de lançamentos.
        - Espera um array de `ids` e um `status` no corpo da requisição.
        - Chama `bulkUpdateJournalEntryStatus` do `journalEntryService`.
    - **`POST /journal-entries` (Criação de Lançamento Único):**
        - Valida o corpo da requisição com o `createJournalEntrySchema`.
        - Obtém informações do perfil do usuário (`username`, `email`, `handle`) para registrar quem criou o lançamento.
        - Chama `createJournalEntry` do `journalEntryService`.
5.  **`PUT /journal-entries/{id}` (Atualização):**
    - Atualiza um lançamento contábil específico pelo seu `id`.
    - Valida o corpo da requisição com o `updateJournalEntrySchema`.
    - Verifica se há dados para atualizar antes de chamar o serviço.
    - Chama `updateJournalEntry` do `journalEntryService`.
6.  **`DELETE /journal-entries/{id}` (Exclusão):**
    - Deleta um lançamento contábil específico pelo seu `id`.
    - Chama `deleteJournalEntry` do `journalEntryService`. Este serviço é responsável por garantir a exclusão atômica do lançamento e suas linhas associadas no banco de dados.
7.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro e `formatSupabaseError` para formatar erros do Supabase, garantindo mensagens claras ao cliente.

### Arquivo: `handlers/journal-entry-history.ts`

**Propósito:**

Fornece o endpoint da API para recuperar o histórico de alterações de um lançamento contábil específico (`/api/journal-entries/{id}/history`).

**Lógica e Fluxo:**

1.  **Parâmetro de Rota:** Recebe o `id` do lançamento contábil como um parâmetro na URL.
2.  **Instância do Serviço:** Cria uma instância de `JournalEntryHistoryService` para interagir com a lógica de negócio de histórico de lançamentos.
3.  **Busca de Histórico:** Chama `journalEntryHistoryService.getJournalEntryHistory` para buscar o histórico de alterações para o `journalEntryId` fornecido.
4.  **Resposta:** Retorna o histórico de alterações em formato JSON com um status `200 OK`.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar e logar erros, utilizando `handleErrorResponse` para enviar respostas de erro padronizadas com status `500 Internal Server Error`.

**Observação:** Este handler foi refatorado para utilizar uma camada de serviço dedicada (`JournalEntryHistoryService`), promovendo a separação de responsabilidades e a manutenibilidade do código.

### Arquivo: `handlers/journalEntryValidator.ts`

**Propósito:**

Fornece um endpoint da API (`/api/journal-entry-validator`) para validar descrições de lançamentos contábeis usando inteligência artificial.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `POST`.
2.  **Validação de Entrada:** O corpo da requisição é validado usando o `journalEntryValidationRequestSchema` (definido com Zod), garantindo que a `journalEntryDescription` seja uma string não vazia.
3.  **Delegação ao Serviço:** A lógica principal de validação é delegada ao `journalEntryValidatorService.validateJournalEntry`, que interage com a IA para analisar a descrição.
4.  **Resposta:** O resultado da validação retornado pelo serviço é enviado de volta ao cliente com um status `200 OK`.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros inesperados durante o processo e retorna respostas de erro padronizadas usando `handleErrorResponse`.

### Arquivo: `handlers/nfe-import.ts`

**Propósito:**

Fornece um endpoint da API (`/api/nfe-import`) para importar dados de arquivos XML de Nota Fiscal Eletrônica (NF-e) brasileira. Ele extrai informações cruciais do XML e tenta determinar o regime tributário da organização na data de emissão da NF-e.

**Lógica e Fluxo:**

1.  **Método Permitido:** Aceita apenas requisições `POST`.
2.  **Autenticação e Contexto:** Obtém o `organization_id` e `active_accounting_period_id` do usuário para garantir o contexto correto.
3.  **Validação de Entrada:** Verifica se o corpo da requisição é uma string (o conteúdo XML) e se não está vazio.
4.  **Parsing do XML:** Utiliza a biblioteca `xml2js` para analisar o conteúdo XML e convertê-lo em um objeto JavaScript.
5.  **Extração de Dados:** Extrai informações detalhadas da NF-e, como:
    - Dados de identificação (ID, data de emissão, tipo - entrada/saída).
    - Dados do emitente e destinatário (CNPJ/CPF, razão social, UF, município).
    - Totais de impostos (ICMS, IPI, PIS, COFINS).
    - Detalhes dos produtos/serviços (descrição, NCM, quantidade, valores, impostos por item).
6.  **Determinação do Regime Tributário:** Se a data de emissão estiver disponível, consulta a tabela `tax_regime_history` para encontrar o regime tributário da organização que estava ativo naquela data. Isso é fundamental para cálculos fiscais precisos.
7.  **Resposta:** Retorna os dados extraídos e o regime tributário determinado em formato JSON.
8.  **Tratamento de Erros:** Lida com erros de parsing do XML, dados ausentes no XML e erros gerais do servidor, retornando respostas de erro padronizadas.

### Arquivo: `handlers/notifications.ts`

**Propósito:**

Fornece endpoints da API para gerenciar notificações de usuário, permitindo a recuperação e marcação de notificações como lidas.

**Lógica e Fluxo:**

1.  **Instância do Serviço:** Cria uma instância de `NotificationService` para interagir com a lógica de negócio de notificações.
2.  **`getNotifications(req, res, userId)`:**
    - **Propósito:** Recupera todas as notificações para um `userId` específico.
    - **Fluxo:** Chama `notificationService.getNotificationsByUserId` e retorna as notificações com status `200 OK`.
3.  **`markNotificationAsRead(req, res, userId, notificationId)`:**
    - **Propósito:** Marca uma notificação específica como lida para um `userId` e `notificationId` dados.
    - **Fluxo:** Chama `notificationService.markAsRead` e retorna um status `204 No Content` (indicando sucesso sem conteúdo de resposta).
4.  **Tratamento de Erros:** Ambos os métodos incluem blocos `try...catch` para capturar e logar erros. Utilizam `handleErrorResponse` para enviar respostas de erro padronizadas com status `500 Internal Server Error`.

**Observação:** Este arquivo exporta funções diretamente, o que significa que ele é importado e utilizado por um roteador ou outro handler que define as rotas da API, em vez de ser um handler padrão que lida com todos os métodos HTTP para um único endpoint. Isso promove a modularidade e a reutilização de código.

### Arquivo: `handlers/organizations.ts`

**Propósito:**

Gerencia as operações de CRUD (Criar, Ler, Atualizar, Deletar) para organizações (`/api/organizations`), incluindo a criação de novas organizações, listagem de organizações acessíveis ao usuário, e atualização/exclusão de organizações existentes com controle de acesso baseado em função.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** A rota é protegida por `withAuth`. O handler obtém o `user_id` e `token` para interagir com o Supabase no contexto do usuário.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (POST, GET, PUT, DELETE).
3.  **`POST` (Criação):**
    - Valida o corpo da requisição com o `createOrganizationSchema`.
    - Chama a função RPC do Supabase `create_organization_and_assign_owner` para criar a organização e automaticamente atribuir o usuário criador como proprietário, além de configurar um período contábil padrão.
    - Retorna os detalhes da nova organização e do período contábil padrão.
4.  **`GET` (Leitura):**
    - Busca todas as organizações às quais o usuário tem acesso, utilizando a função RPC do Supabase `get_user_accessible_organizations`.
    - Retorna uma lista de objetos `AccessibleOrganization`.
5.  **`DELETE /organizations/{id}` (Exclusão):**
    - Recebe o `id` da organização a ser deletada.
    - **Verificações de Segurança:**
        - Impede a exclusão de organizações marcadas como `is_personal`.
        - Verifica se o usuário solicitante possui a função de `owner` ou `admin` na organização através de `getUserRoleInOrganization`.
    - Executa a exclusão da organização no Supabase.
    - Retorna um status `204 No Content` em caso de sucesso.
6.  **`PUT /organizations/{id}` (Atualização):**
    - Recebe o `id` da organização a ser atualizada.
    - Valida o corpo da requisição com o `updateOrganizationSchema`.
    - **Verificações de Segurança:**
        - Verifica se o usuário solicitante possui a função de `owner` ou `admin` na organização através de `getUserRoleInOrganization`.
    - Executa a atualização da organização no Supabase.
    - Retorna os dados da organização atualizada.
7.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro e `formatSupabaseError` para formatar erros do Supabase, garantindo mensagens claras ao cliente. Lida com erros de validação, organizações não encontradas e permissões insuficientes.

### Arquivo: `handlers/products.ts`

**Propósito:**

Gerencia as operações de CRUD (Criar, Ler, Atualizar, Deletar) para produtos (`/api/products`), incluindo listagem, criação, atualização e exclusão. Além disso, oferece endpoints específicos para registrar compras de produtos e calcular o Custo da Mercadoria Vendida (CMV) utilizando funções RPC do Supabase.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** O handler obtém o `organization_id` e `active_accounting_period_id` do usuário para garantir que todas as operações sejam restritas ao contexto correto.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (GET, POST, PUT, DELETE).
3.  **`GET` (Leitura):**
    - Suporta paginação através dos parâmetros de query `page` e `limit`.
    - Busca produtos na tabela `products`, filtrando pela organização e período contábil ativos, e ordenando por nome.
4.  **`POST` (Criação e Operações Específicas):**
    - **`POST /products` (Criação de Produto Único):**
        - Valida o corpo da requisição com o `createProductSchema`.
        - Insere o novo produto na tabela `products`.
        - Retorna o produto criado.
    - **`POST /products/purchase` (Registro de Compra):**
        - Espera `product_id`, `quantity` e `unit_cost` no corpo da requisição.
        - Chama a função RPC do Supabase `record_purchase` para processar a compra, que atualiza o estoque e recalcula custos no banco de dados.
    - **`POST /products/calculate-cogs` (Cálculo de CMV):**
        - Espera `product_id` e `quantity_sold` no corpo da requisição.
        - Chama a função RPC do Supabase `calculate_cogs_for_sale` para calcular o CMV.
5.  **`PUT /products/{id}` (Atualização):**
    - Atualiza um produto específico pelo seu `id`.
    - Valida o corpo da requisição com o `updateProductSchema`.
    - Verifica se há dados para atualizar antes de chamar o Supabase.
    - Atualiza o produto na tabela `products`, garantindo o escopo pela organização e período contábil.
    - Retorna o produto atualizado.
6.  **`DELETE /products/{id}` (Exclusão):**
    - Deleta um produto específico pelo seu `id`.
    - Deleta o produto da tabela `products`, garantindo o escopo pela organização e período contábil.
    - Retorna um status `204 No Content` em caso de sucesso.
7.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro e `formatSupabaseError` para formatar erros do Supabase, garantindo mensagens claras ao cliente. Lida com erros de validação, produtos não encontrados e erros durante as chamadas RPC.

### Arquivo: `handlers/profile.ts`

**Propósito:**

Gerencia as operações de perfil do usuário (`/api/profile`), permitindo a recuperação, atualização e exclusão do perfil do usuário autenticado.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** O handler recebe o `user_id` e `token` do usuário autenticado, que são usados para interagir com o Supabase no contexto do usuário.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (GET, DELETE, PUT).
3.  **`GET` (Leitura):**
    - Busca as informações do perfil do usuário na tabela `profiles` com base no `user_id`.
    - Retorna campos como `username`, `role`, `avatar_url`, `organization_id`, `active_accounting_period_id` e `handle`.
4.  **`DELETE` (Exclusão):**
    - **Atenção:** Esta operação utiliza um cliente Supabase com privilégios de administrador (`getSupabaseAdmin()`) para chamar `supabaseAdmin.auth.admin.deleteUser(user_id)`. Isso garante a exclusão completa do usuário do sistema de autenticação do Supabase e de todos os dados associados ao seu perfil, ignorando as políticas de RLS.
    - Retorna um status `200 OK` com uma mensagem de sucesso.
5.  **`PUT` (Atualização):**
    - Valida o corpo da requisição com o `updateProfileSchema`.
    - Verifica se há campos para atualizar no corpo da requisição.
    - Atualiza o perfil do usuário na tabela `profiles` com base no `user_id`.
    - Retorna os dados do perfil atualizado.
6.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro. Lida com perfis não encontrados (404), erros de validação (400) e erros inesperados do servidor (500).

**Considerações de Segurança:**

- A operação `DELETE` é crítica, pois remove permanentemente o usuário. O uso do cliente `supabaseAdmin` é necessário para essa funcionalidade, mas exige que as credenciais de administrador sejam gerenciadas com extrema segurança.
- Todas as operações são inerentemente restritas ao perfil do usuário autenticado, garantindo que um usuário só possa gerenciar seus próprios dados de perfil.

### Arquivo: `handlers/referenceGenerator.ts`

**Propósito:**

Fornece um endpoint da API (`/api/reference-generator`) para gerar o próximo número de referência sequencial para documentos, como lançamentos contábeis, dentro de um contexto específico de organização e período contábil.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `GET`.
2.  **Validação de Parâmetros:** Espera e valida os parâmetros de query `prefix`, `organization_id` e `accounting_period_id`. Todos são obrigatórios e devem ser strings.
3.  **Delegação ao Serviço:** A lógica de geração do número de referência é delegada ao `referenceService.getNextReferenceNumber`.
4.  **Resposta:** Retorna o número de referência gerado (`nextNumber`) em formato JSON com um status `200 OK`.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros durante a geração da referência (por exemplo, falha na comunicação com o banco de dados) e retorna uma resposta de erro padronizada com status `500 Internal Server Error`.

### Arquivo: `handlers/reports/consolidated-reports.ts`

**Propósito:**

Este handler é responsável por gerar relatórios consolidados (atualmente baseados em lançamentos contábeis) e exportá-los em vários formatos (Excel, CSV, PDF). Ele agrega os dados dos lançamentos por mês e inclui os nomes das contas para maior clareza.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** Garante que o usuário esteja autenticado e obtém seu `organization_id` e `active_accounting_period_id` para restringir as operações ao contexto correto.
2.  **Método Permitido:** Aceita apenas requisições `GET`.
3.  **Validação de Parâmetros:** Valida os parâmetros de query `reportType`, `startDate`, `endDate` e `format` (que pode ser `xlsx`, `csv` ou `pdf`) usando o `exportReportSchema`.
4.  **Recuperação de Dados:**
    - Busca os `journal_entries` e suas `entry_lines` associadas (incluindo `account_id`, `debit`, `credit`) dentro do intervalo de datas especificado e filtrados pela organização e período contábil.
    - Busca as `accounts` (ID e nome) para mapear os IDs das contas para nomes legíveis.
5.  **Agregação de Dados:** Organiza os lançamentos contábeis em `monthlyData`, agrupando-os por mês (`YYYY-MM`).
6.  **Lógica de Exportação (baseada no `format`):**
    - **`xlsx` (Excel):** Utiliza `ExcelJS` para criar um workbook com uma planilha para cada mês, contendo colunas para Data, Descrição, Conta, Débito e Crédito. Define os cabeçalhos de resposta apropriados para download de arquivo Excel.
    - **`csv` (CSV):** Gera o conteúdo CSV, incluindo cabeçalhos mensais e formatando os dados das linhas de lançamento. Define os cabeçalhos de resposta apropriados para download de arquivo CSV.
    - **`pdf` (PDF):** Utiliza `pdfkit` para criar um documento PDF com um título principal e seções mensais. Formata os dados das linhas de lançamento em texto dentro do PDF. Define os cabeçalhos de resposta apropriados para download de arquivo PDF.
    - **Formato Não Suportado:** Retorna um status `400 Bad Request` se o formato solicitado não for suportado.
7.  **Tratamento de Erros:** Inclui blocos `try...catch` para capturar e logar erros de banco de dados e erros inesperados, utilizando `formatSupabaseError` para mensagens claras.

### Arquivo: `handlers/reports/export.ts`

**Propósito:**

Este handler é responsável por gerar e exportar diversos relatórios financeiros (Balancete de Verificação, DRE, Balanço Patrimonial, Razão Detalhado) em diferentes formatos (CSV, XLSX, PDF). Ele atua como um orquestrador, chamando os serviços de geração de relatórios e, em seguida, lidando com a conversão do arquivo e a resposta HTTP.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `POST`.
2.  **Validação de Parâmetros:** Valida o corpo da requisição usando o `exportReportSchema`, que espera `reportType`, `startDate`, `endDate` e `format`.
3.  **Geração de Relatórios:**
    - Chama `generateReports` (do `reportService`) para buscar os dados brutos necessários (contas e lançamentos contábeis) dentro do período especificado.
    - Com base no `reportType` recebido, invoca a função de cálculo apropriada do `reportService` (`calculateTrialBalance`, `calculateDreData`, `calculateBalanceSheetData`, `calculateLedgerDetails`) para processar os dados brutos e obter o relatório estruturado.
4.  **Exportação de Arquivos:**
    - Utiliza funções auxiliares (`convertToCsv`, `convertToXlsx`, `convertToPdf`) para formatar os dados do relatório no formato de arquivo desejado.
    - Define os cabeçalhos `Content-Type` e `Content-Disposition` apropriados para o download do arquivo.
    - Para XLSX e PDF, os dados são transmitidos diretamente para a resposta (`res.pipe()`). Para CSV, o conteúdo é gerado como uma string e enviado.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros durante a geração ou exportação do relatório, logando-os e retornando uma resposta de erro `500 Internal Server Error`.

**Funções Auxiliares de Conversão:**

- **`convertToCsv(data, reportType)`:** Converte os dados do relatório em uma string CSV, com cabeçalhos e linhas formatadas de acordo com o tipo de relatório.
- **`convertToXlsx(data, reportType, res)`:** Cria um workbook Excel usando `ExcelJS`, adiciona os dados do relatório e transmite o arquivo para a resposta HTTP.
- **`convertToPdf(data, reportType, res)`:** Cria um documento PDF usando `pdfkit`, adiciona o título e os dados do relatório, e transmite o arquivo para a resposta HTTP.

**Considerações:**

- O handler é projetado para ser eficiente, mas para exports de relatórios muito grandes, é sugerido que a geração seja feita em segundo plano para evitar timeouts em ambientes serverless.

### Arquivo: `handlers/reports/generate.ts`

**Propósito:**

Este handler fornece um endpoint da API (`/api/reports/generate`) para gerar diversos relatórios financeiros. Ele atua como uma camada fina, validando os parâmetros da requisição e delegando a lógica complexa de geração de relatórios para o `reportService`.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `GET`.
2.  **Validação de Parâmetros:** Valida os parâmetros de query `startDate` e `endDate` usando o `reportQuerySchema`.
3.  **Delegação ao Serviço:** Chama a função `generateReports` do `reportService`, passando o `user_id`, `token`, `startDate` e `endDate`. O `reportService` é responsável por buscar os dados brutos e realizar todos os cálculos necessários para os diferentes tipos de relatórios.
4.  **Resposta:** Retorna os relatórios gerados em formato JSON com um status `200 OK`.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros durante a geração dos relatórios, logando-os e retornando uma resposta de erro `500 Internal Server Error`.

**Considerações:**

- O design deste handler foca na separação de responsabilidades: o handler lida com a interface HTTP e validação básica, enquanto o serviço (`reportService`) contém a lógica de negócio complexa.
- Os comentários no código sugerem futuras otimizações para lidar com grandes volumes de dados, como a implementação de streaming ou o uso de filas de tarefas em segundo plano para evitar problemas de performance e timeouts em ambientes serverless.

### Arquivo: `handlers/sharing.ts`

**Propósito:**

Gerencia o compartilhamento de períodos contábeis (e, implicitamente, as organizações às quais pertencem) com outros usuários (`/api/sharing`). Permite que um usuário conceda permissões de leitura ou escrita a outro usuário para um período contábil específico.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** O handler obtém o `user_id` e `token` do usuário autenticado para interagir com o Supabase no contexto do usuário.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (POST, GET, DELETE).
3.  **`POST` (Compartilhamento):**
    - Valida o corpo da requisição usando o `sharePeriodSchema`.
    - **Resolução de Usuário:** Se um `shared_with_identifier` (e-mail ou nome de usuário) for fornecido em vez de um `shared_with_user_id`, o handler utiliza uma função RPC do Supabase (`get_user_id_by_handle_or_email`) para resolver o ID do usuário alvo.
    - **Verificação de Permissão:** Antes de permitir o compartilhamento, verifica se o usuário solicitante tem a função de `owner` ou `admin` na organização à qual o período contábil pertence, utilizando a função auxiliar `getUserRoleInOrganization`.
    - Insere um novo registro na tabela `shared_accounting_periods` com os detalhes do compartilhamento.
    - Retorna o registro de compartilhamento criado.
4.  **`GET` (Listagem de Compartilhamentos):**
    - Espera o `accounting_period_id` como parâmetro de query.
    - Busca todos os registros de compartilhamento para o período contábil especificado na tabela `shared_accounting_periods`, incluindo o nome de usuário do destinatário através de um `join` com a tabela `profiles`.
    - Retorna a lista de compartilhamentos.
5.  **`DELETE` (Remoção de Compartilhamento):**
    - Espera o `id` do registro de compartilhamento (`shared_accounting_periods.id`) como parâmetro de query.
    - **Verificação de Permissão:** Similar ao `POST`, verifica se o usuário solicitante tem a função de `owner` ou `admin` na organização do período contábil associado ao compartilhamento.
    - Deleta o registro da tabela `shared_accounting_periods`.
    - Retorna um status `204 No Content` em caso de sucesso.
6.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro. Lida com erros de validação, usuários/registros não encontrados e permissões insuficientes. Captura e formata erros RPC do Supabase e erros inesperados.

**Considerações de Segurança:**

- A validação de permissão baseada em função (`owner`/`admin`) é crucial para garantir que apenas usuários autorizados possam gerenciar o compartilhamento de dados sensíveis da organização.
- A resolução de usuários por identificador (e-mail/username) adiciona flexibilidade, mas a segurança é mantida pela validação subsequente do ID do usuário resolvido.

### Arquivo: `handlers/swagger-docs.ts`

**Propósito:**

Este handler serve a documentação gerada do Swagger/OpenAPI para a API de backend. Ele lê um arquivo JSON pré-gerado e o envia como resposta HTTP.

**Lógica e Fluxo:**

1.  **Leitura do Arquivo:** O handler lê o arquivo `swagger-output.json` (que é gerado por uma ferramenta de documentação como `swagger-autogen` durante o processo de build) do sistema de arquivos.
2.  **Configuração da Resposta:** Define o cabeçalho `Content-Type` da resposta como `application/json`.
3.  **Envio da Documentação:** Envia o conteúdo do arquivo JSON lido como o corpo da resposta HTTP com um status `200 OK`.
4.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar quaisquer erros que possam ocorrer durante a leitura do arquivo (por exemplo, arquivo não encontrado ou erro de permissão) e retorna uma resposta de erro `500 Internal Server Error` com uma mensagem genérica.

**Observação:** Este handler é simples e direto, pois sua principal função é expor uma documentação estática. A complexidade da geração da documentação em si reside nas ferramentas de build que criam o `swagger-output.json`.

### Arquivo: `handlers/tax-calculation.ts`

**Propósito:**

Este handler fornece um endpoint da API para calcular impostos fiscais com base em dados de operação fornecidos. Ele integra-se com serviços relacionados a impostos para buscar configurações e realizar os cálculos, além de registrar o histórico dessas operações.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `POST`.
2.  **Validação de Entrada:** O corpo da requisição é validado usando o `fiscalOperationSchema` (definido com Zod), que garante a estrutura e o tipo corretos dos dados fiscais da operação (tipo de operação, valores, datas, etc.).
3.  **Autenticação e Contexto:** Assume que o `organizationId` e o `token` do usuário são fornecidos pelo middleware de autenticação, garantindo que os cálculos sejam feitos no contexto da organização correta.
4.  **Recuperação de Configurações Fiscais:** Chama `getTaxSettings` e `getTaxRegimeHistory` (do `taxSettingService`) para obter as alíquotas de impostos e o regime tributário aplicáveis à organização na data da transação.
5.  **Cálculo de Impostos:** Delega o cálculo principal dos impostos para a função `calculateTaxes` (do `taxService`), passando os dados da operação e as configurações fiscais recuperadas.
6.  **Registro do Histórico:** Após o cálculo, insere os dados da operação fiscal, o resultado do cálculo e os detalhes do cálculo na tabela `tax_calculation_history` do Supabase. Erros durante este registro são logados, mas não impedem que o resultado do cálculo seja retornado ao usuário.
7.  **Resposta:** Retorna os impostos calculados em formato JSON com um status `200 OK`.
8.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros de validação, dados de autenticação incompletos, configurações de impostos não encontradas e erros inesperados do servidor, retornando respostas de erro padronizadas.

### Arquivo: `handlers/tax-regime-history.ts`

**Propósito:**

Este handler gerencia o histórico de regimes tributários de uma organização (`/api/tax-regime-history`). Ele permite criar, listar, atualizar e excluir entradas de histórico de regime tributário, com validação rigorosa para evitar sobreposição de períodos.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** O handler obtém o `user_id` e `token` do usuário autenticado, bem como o `organization_id` do contexto do usuário, para garantir que todas as operações sejam restritas à organização correta.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (POST, GET, PUT, DELETE).
3.  **`POST` (Criação):**
    - Valida o corpo da requisição com o `createTaxRegimeHistorySchema`.
    - **Validação de Sobreposição de Datas:** Antes de inserir, o handler verifica se o novo período (`start_date` e `end_date`) se sobrepõe a qualquer regime tributário existente para a mesma organização. Também garante que `start_date` não seja posterior a `end_date`. Se houver sobreposição ou datas inválidas, retorna um erro `400 Bad Request`.
    - Insere o novo registro na tabela `tax_regime_history`.
    - Retorna o registro criado.
4.  **`GET` (Leitura):**
    - Busca todos os registros de histórico de regime tributário para a organização do usuário.
    - Ordena os resultados pela `start_date` em ordem decrescente.
    - Retorna a lista de registros.
5.  **`PUT` (Atualização):**
    - Recebe o `id` do registro a ser atualizado.
    - Valida o corpo da requisição com o `updateTaxRegimeHistorySchema`.
    - **Validação de Sobreposição de Datas (para atualização):** Se as datas forem alteradas, realiza uma verificação de sobreposição semelhante à do `POST`, mas exclui o próprio registro que está sendo atualizado da verificação.
    - Atualiza o registro na tabela `tax_regime_history`, garantindo o escopo pela organização.
    - Retorna o registro atualizado.
6.  **`DELETE` (Exclusão):**
    - Recebe o `id` do registro a ser deletado.
    - Deleta o registro da tabela `tax_regime_history`, garantindo o escopo pela organização.
    - Retorna um status `204 No Content` em caso de sucesso.
7.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro e `formatSupabaseError` para formatar erros do Supabase. Lida com erros de validação (incluindo sobreposição de datas), registros não encontrados e erros inesperados do servidor.

### Arquivo: `handlers/tax-rules.ts`

**Propósito:**

Este handler gerencia as operações CRUD (Criar, Ler, Atualizar, Deletar) para regras fiscais personalizadas (`/api/tax-rules`). Essas regras permitem que as organizações definam comportamentos fiscais específicos que podem substituir os cálculos padrão.

**Lógica e Fluxo:**

1.  **Autenticação e Contexto:** O handler obtém o `user_id` e `token` do usuário autenticado, bem como o `organization_id` do contexto do usuário, para garantir que todas as operações sejam restritas à organização correta.
2.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (GET, POST, PUT, DELETE).
3.  **`GET` (Leitura):**
    - Busca todas as regras fiscais personalizadas para a organização do usuário, chamando o `taxRuleService.getTaxRules`.
    - Retorna a lista de regras fiscais.
4.  **`POST` (Criação):**
    - Valida o corpo da requisição com o `createTaxRuleSchema`.
    - Chama o `taxRuleService.createTaxRule` para inserir a nova regra, associando-a à `organization_id`.
    - Retorna a regra fiscal criada.
5.  **`PUT` (Atualização):**
    - Recebe o `id` da regra fiscal a ser atualizada.
    - Valida o corpo da requisição com o `updateTaxRuleSchema`.
    - Chama o `taxRuleService.updateTaxRule` para atualizar a regra, garantindo que a operação seja restrita à `organization_id`.
    - Retorna a regra fiscal atualizada.
6.  **`DELETE` (Exclusão):**
    - Recebe o `id` da regra fiscal a ser deletada.
    - Deleta o registro da tabela `tax_rules`, garantindo o escopo pela `organization_id`.
    - Retorna um status `204 No Content` em caso de sucesso.
7.  **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro. Lida com erros de validação, regras não encontradas e erros inesperados do servidor.

### Arquivo: `handlers/user-organization-roles.ts`

**Propósito:**

Este handler gerencia os papéis dos usuários dentro das organizações (`/api/user-organization-roles`), permitindo listar, adicionar, atualizar e remover membros e seus respectivos papéis. Ele implementa um controle de acesso robusto para garantir que apenas usuários autorizados possam realizar essas ações e previne cenários críticos, como um proprietário/administrador se remover se for o último.

**Lógica e Fluxo:**

1.  **Função Auxiliar `getUserRoleInOrganization`:**
    - Exportada para ser utilizada por outros handlers (como `organizations.ts`).
    - Busca o papel (`role`) de um `user_id` específico em uma `organization_id` na tabela `user_organization_roles`.
    - É fundamental para a implementação do controle de acesso baseado em função (RBAC).
2.  **Autenticação e Contexto:** O handler obtém o `user_id` e `token` do usuário autenticado. Ele também espera o `organization_id` como parâmetro de query para todas as operações.
3.  **Verificação de Organização Pessoal:** Impede modificações (POST, PUT, DELETE) em organizações marcadas como `is_personal`, pois estas são gerenciadas automaticamente pelo sistema.
4.  **Roteamento por Método:** Utiliza um bloco `if/else if` para separar a lógica de cada método HTTP (GET, POST, PUT, DELETE).
5.  **`GET` (Listagem de Membros):**
    - Qualquer membro da organização pode listar os outros membros.
    - Utiliza o cliente `getSupabaseAdmin()` para buscar os dados da tabela `user_organization_roles` e `profiles` (para obter detalhes do usuário), garantindo que todas as informações sejam acessíveis, mas filtradas pela `organization_id`.
    - Retorna uma lista de membros com seus IDs, papéis e informações de perfil.
6.  **Verificação de Permissão para Modificações:** Para `POST`, `PUT` e `DELETE`, o handler verifica se o usuário solicitante tem o papel de `owner` ou `admin` na organização. Se não tiver, retorna um erro `403 Forbidden`.
7.  **`POST` (Adicionar Membro):**
    - Valida o corpo da requisição com o `addMemberSchema`.
    - **Controle de Hierarquia de Papéis:** Impede que um `admin` atribua o papel de `owner` a um novo membro.
    - Chama a função RPC do Supabase `create_user_organization_role` para adicionar o novo membro.
    - Retorna uma mensagem de sucesso.
8.  **`PUT` (Atualizar Papel de Membro):**
    - Recebe o `member_id` (ID do registro na tabela `user_organization_roles`) e o novo papel no corpo da requisição.
    - Valida o corpo da requisição com o `updateMemberRoleSchema`.
    - **Controle de Hierarquia de Papéis:** Impede que um `admin` altere o papel de um `owner` existente ou atribua a si mesmo o papel de `owner`.
    - Atualiza o papel do membro na tabela `user_organization_roles`.
    - Retorna o registro do membro atualizado.
9.  **`DELETE` (Remover Membro):**
    - Recebe o `member_id` do registro a ser deletado.
    - **Prevenção de Auto-remoção Crítica:** Antes de deletar, verifica se o usuário que está solicitando a remoção é o último `owner` ou `admin` da organização. Se for, impede a remoção para evitar que a organização fique sem administradores.
    - Deleta o registro da tabela `user_organization_roles`.
    - Retorna um status `204 No Content` em caso de sucesso.
10. **Tratamento de Erros:** Utiliza `handleErrorResponse` para padronizar as respostas de erro. Lida com IDs ausentes/inválidos, organizações/membros não encontrados, permissões insuficientes e erros inesperados do servidor.

**Considerações de Segurança:**

- Este handler é um exemplo complexo de implementação de RBAC, com múltiplas camadas de validação e verificação de permissões para proteger dados sensíveis e garantir a integridade do sistema.
- O uso do cliente `supabaseAdmin` para listar membros é uma escolha de design para garantir visibilidade total, mas exige que as políticas de RLS sejam cuidadosamente configuradas para evitar acesso indevido em outras operações.

### Arquivo: `handlers/user-presence.ts`

**Propósito:**

Este handler fornece endpoints da API para gerenciar e recuperar informações de presença de usuários, indicando quais usuários estão "online" dentro de uma organização e período contábil específicos.

**Lógica e Fluxo:**

1.  **Instância do Serviço:** Cria uma instância de `UserPresenceService` para interagir com a lógica de negócio de presença de usuário.
2.  **`updateUserPresence(req, res, userId)`:**
    - **Propósito:** Atualiza o status de presença de um usuário. Geralmente é chamado periodicamente pelo frontend para indicar atividade do usuário.
    - **Entrada:** Espera `organizationId` e `activeAccountingPeriodId` no corpo da requisição.
    - **Fluxo:** Chama `userPresenceService.updateUserPresence` com o `userId` e os IDs de contexto fornecidos.
    - **Resposta:** Retorna um status `200 OK` com uma mensagem de sucesso.
3.  **`getOnlineUsers(req, res)`:**
    - **Propósito:** Recupera uma lista de usuários considerados "online" dentro de uma organização e período contábil específicos.
    - **Entrada:** Espera `organizationId` e `activeAccountingPeriodId` como parâmetros de query.
    - **Fluxo:** Chama `userPresenceService.getOnlineUsersInPeriod` com os IDs de contexto fornecidos.
    - **Resposta:** Retorna um status `200 OK` com uma lista de usuários online.
4.  **Tratamento de Erros:** Ambos os métodos validam a presença dos IDs de contexto necessários, retornando um `400 Bad Request` se estiverem ausentes. Incluem blocos `try...catch` para capturar e logar erros, utilizando `handleErrorResponse` para enviar respostas de erro padronizadas com status `500 Internal Server Error`.

**Observação:** Este arquivo exporta funções diretamente, o que significa que ele é importado e utilizado por um roteador ou outro handler que define as rotas da API, em vez de ser um handler padrão que lida com todos os métodos HTTP para um único endpoint. Isso promove a modularidade e a reutiluição de código.

### Arquivo: `handlers/users.ts`

**Propósito:**

Este handler fornece um endpoint da API (`/api/users`) para buscar usuários no sistema. Ele delega a operação de busca real a uma função RPC do Supabase.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `GET`.
2.  **Validação de Parâmetros:** Valida o parâmetro de query `query` usando o `searchUsersSchema` (definido com Zod), garantindo que seja uma string não vazia.
3.  **Delegação ao Supabase RPC:** Chama a função RPC do Supabase `search_users`, passando o termo de busca (`query`) como `search_term`. Esta função RPC é responsável por executar a lógica de busca de usuários diretamente no banco de dados (por exemplo, por nome de usuário, e-mail ou handle).
4.  **Resposta:** Retorna uma lista de perfis de usuários correspondentes em formato JSON com um status `200 OK`.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros de validação de parâmetros, erros da função RPC do Supabase e erros inesperados do servidor, retornando respostas de erro padronizadas.

**Considerações:**

- Este handler é uma camada fina que expõe uma funcionalidade de busca de usuários, com a lógica de busca complexa encapsulada na função RPC do Supabase. Isso mantém o handler limpo e focado em sua responsabilidade de API.

### Arquivo: `handlers/year-end-closing.ts`

**Propósito:**

Este handler fornece um endpoint da API (`/api/year-end-closing`) para iniciar o processo de fechamento do exercício contábil. Ele agora utiliza um serviço dedicado para realizar os cálculos e operações necessárias.

**Lógica e Fluxo:**

1.  **Método Permitido:** O handler aceita apenas requisições `POST`.
2.  **Validação de Entrada:** O corpo da requisição é validado usando o `yearEndClosingSchema` (definido com Zod), que espera um `closingDate` no formato de data.
3.  **Delegação ao Serviço:** A lógica de negócio para o fechamento do exercício é delegada ao `YearEndClosingService.performYearEndClosing`. Este serviço é responsável por:
    - Buscar contas e lançamentos contábeis relevantes.
    - Calcular o lucro ou prejuízo líquido do período.
    - (Futuramente) Criar lançamentos de encerramento e transferir saldos.
4.  **Resposta:** Retorna um status `200 OK` com uma mensagem de sucesso que inclui a data de fechamento e o lucro líquido calculado pelo serviço.
5.  **Tratamento de Erros:** Inclui um bloco `try...catch` para capturar erros de validação de entrada e erros inesperados do servidor, logando-os e retornando respostas de erro padronizadas.

**Considerações:**

- O design atual indica que a funcionalidade de fechamento de exercício está em desenvolvimento ou é uma prioridade futura. O handler já define a interface da API, mas a implementação da lógica de negócio ainda precisa ser concluída na camada de serviço.

### Arquivo: `services/yearEndClosingService.ts`

**Propósito:**

Este serviço é responsável por orquestrar o processo de fechamento do exercício contábil. Atualmente, ele foca no cálculo do lucro líquido do período, com placeholders para a lógica completa de geração de lançamentos de encerramento e transferência de saldos.

**Classe e Métodos:**

- **`YearEndClosingService`**: Uma classe que encapsula a lógica de fechamento de exercício.
  - **`performYearEndClosing(userId, token, closingDate)`**: 
    - **Contexto do Usuário:** Obtém o `organization_id` e `active_accounting_period_id` do usuário para garantir que as operações sejam restritas ao contexto correto.
    - **Busca de Dados:** Busca todas as contas e lançamentos contábeis (`journal_entries` e `entry_lines`) para o período ativo da organização, considerando apenas os lançamentos até a `closingDate`.
    - **Cálculo do Lucro Líquido:** Utiliza a função `calculateDreData` (do `reportService`) para calcular o lucro líquido do período com base nos dados contábeis recuperados.
    - **Placeholders para Lógica Futura:** Contém comentários indicando onde a lógica para a criação de lançamentos de encerramento, transferência de saldos e marcação do período contábil como fechado seria implementada. Atualmente, apenas o cálculo do lucro líquido é realizado.
    - **Retorno:** Retorna um objeto contendo uma mensagem de sucesso e o lucro líquido calculado.

**Utilização:**

- Este serviço é chamado pelo handler `year-end-closing.ts` para executar a lógica de fechamento do exercício. Ele serve como um ponto central para a funcionalidade de encerramento, permitindo que a lógica complexa seja desenvolvida e mantida separadamente do handler da API.