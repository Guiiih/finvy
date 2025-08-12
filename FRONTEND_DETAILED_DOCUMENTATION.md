# Documentação Detalhada do Frontend (Nível Exaustivo)

Este documento fornece uma análise completa e detalhada de cada arquivo e diretório na estrutura do frontend do Finvy, com foco na lógica interna, estado, propriedades e interações de cada componente e módulo.

---

## Arquivos Principais (`src/`)

### `App.vue`

- **Propósito:** Componente Vue raiz que serve como o layout principal da aplicação, orquestrando a navegação, o estado global da UI e os componentes centrais.
- **Lógica Detalhada:**
  - **Imports:**
    - `vue-router`: `RouterLink`, `RouterView`, `useRoute` para navegação e acesso à rota atual.
    - `vue`: Funções do ciclo de vida e reatividade (`ref`, `computed`, `onMounted`, `onUnmounted`, `watch`).
    - **Stores (Pinia):**
      - `useAuthStore`: Para verificar o status de login (`isLoggedIn`), obter dados do usuário (`avatarUrl`) e carregar o perfil (`profileLoaded`).
      - `useThemeStore`: Para alternar entre temas claro/escuro (`theme`).
      - `useAccountingPeriodStore`: Para exibir o período contábil ativo.
      - `useUserPresenceStore`: Para obter a lista de `onlineUsers` e gerenciar o rastreamento de presença.
      - `useGlobalChatbotStore`: Para controlar a visibilidade e o estado do chatbot.
    - **Serviços:** `setToast` de `notificationService` para inicializar o sistema de notificações.
    - **Componentes:** `UserMenu`, `ChatbotWindow`, `UserAvatarWithPresence`.
    - **Assets:** `FinvyLogo.svg`, `FinvyLogoBlack.svg`.
  - **Estado Local (`ref`):**
    - `showUserMenu`: `ref<boolean>` - Controla a visibilidade do dropdown do menu do usuário.
    - `isMobileMenuOpen`: `ref<boolean>` - Controla a visibilidade do menu lateral em dispositivos móveis.
    - `isChatbotMaximized`: `ref<boolean>` - Controla o estado maximizado/minimizado do chatbot.
  - **Propriedades Computadas (`computed`):**
    - `shouldHideNavbar`: Retorna `true` se a rota atual tiver o metadado `hideNavbar`, ocultando a navegação em páginas como Login e Registro.
    - `logoSrc`: Retorna `FinvyLogo` ou `FinvyLogoBlack` com base no valor de `themeStore.theme`.
  - **Ciclo de Vida e Watchers:**
    - `onMounted`:
      1.  `setToast(toast)`: Passa a instância do `useToast` para o serviço de notificação, tornando-o acessível globalmente.
      2.  `authStore.initAuthListener()`: Inicia o listener de autenticação do Supabase.
      3.  `window.addEventListener('click', closeUserMenu)`: Adiciona um listener global para fechar o menu do usuário ao clicar fora dele.
    - `watch(() => authStore.profileLoaded, ...)`: Observa a flag `profileLoaded` do `authStore`. Quando se torna `true`, inicia o rastreamento de presença (`userPresenceStore.startPresenceTracking()`); quando `false`, para o rastreamento.
    - `onUnmounted`: Remove o listener de clique para evitar vazamentos de memória.
  - **Template:**
    - Renderiza o componente `<Toast />` do PrimeVue para notificações.
    - Usa `v-if="authStore.isLoggedIn && !shouldHideNavbar"` para renderizar o layout principal apenas para usuários autenticados em rotas que não o escondem.
    - Possui duas seções `<header>`, uma para desktop (`hidden lg:grid`) e outra para mobile (`lg:hidden`), garantindo um layout responsivo.
    - O `RouterView` é o container onde os componentes das rotas são renderizados.
    - O botão flutuante do chatbot usa `globalChatbotStore.toggleChatbotModal()` para controlar sua visibilidade.

### `main.ts`

- **Propósito:** Ponto de entrada da aplicação, responsável pela inicialização e configuração de todas as bibliotecas e plugins principais.
- **Lógica Detalhada:**
  1.  **Criação da Aplicação:** `const app = createApp(App)` cria a instância raiz do Vue.
  2.  **Pinia:** `const pinia = createPinia()` cria a instância do Pinia. `pinia.use(piniaPluginPersistedstate)` adiciona o plugin para persistir o estado no `localStorage`.
  3.  **PrimeVue:** `app.use(PrimeVue, ...)` instala a biblioteca de componentes. A configuração inclui um `preset` de tema customizado (`MyAuraPreset`) e a opção `darkModeSelector: '.dark'`, que instrui o PrimeVue a aplicar estilos de modo escuro quando a classe `.dark` estiver presente no elemento `<html>`.
  4.  **Serviços e Diretivas:** Instala `ToastService`, `ConfirmationService` e a diretiva `v-tooltip`.
  5.  **Componentes Globais:** Registra vários componentes do PrimeVue (`InputText`, `Button`, etc.) e o `Cropper` globalmente, para que possam ser usados em qualquer lugar sem importação explícita.
  6.  **Inicialização (`initApp`):** Esta função `async` é crucial. Ela primeiro chama `await authStore.initAuthListener()`, garantindo que o estado de autenticação seja verificado e estabelecido. Somente após essa verificação, `app.use(router)` é chamado para instalar o roteador, e `app.mount('#app')` renderiza a aplicação. Isso evita "flashes" de conteúdo e garante que as guardas de rota funcionem corretamente no primeiro carregamento.

### `supabase.ts`

- **Propósito:** Isolar a configuração do cliente Supabase em um único módulo.
- **Lógica Detalhada:**
  - Lê a URL e a chave anônima do Supabase das variáveis de ambiente (`import.meta.env`).
  - Valida se as variáveis existem, lançando um erro claro se não forem encontradas, o que interrompe a inicialização da aplicação e facilita a depuração.
  - Exporta uma única instância do cliente Supabase (`createClient`) para ser importada e utilizada por outros módulos, principalmente o `authStore`.

---

## Diretório: `services`

### `apiClient.ts`

- **Propósito:** Criar um cliente HTTP centralizado que encapsula a lógica de autenticação e tratamento de erros para todas as chamadas de API.
- **Lógica Detalhada:**
  - **`getHeaders()`**: Função interna que obtém o token de acesso JWT do `authStore` e o insere no cabeçalho `Authorization` como `Bearer ${token}`.
  - **`handleResponse(response)`**: Função `async` que processa a resposta de uma chamada `fetch`.
    - Se `response.ok` for `true`, ela retorna o JSON da resposta ou `null` se o status for 204 (No Content).
    - Se `response.ok` for `false`, ela trata os erros:
      - **401 (Unauthorized):** Exibe um toast de "Sessão Expirada", chama `authStore.signOut()` e redireciona o usuário para a página de login.
      - **422 (Unprocessable Entity):** Extrai os erros de validação do corpo da resposta e os exibe em um toast.
      - **5xx (Server Error):** Exibe um toast genérico de erro no servidor.
      - **Outros Erros:** Exibe a mensagem de erro contida no corpo da resposta.
    - Finalmente, lança um `Error` para que a chamada original possa ser capturada por um bloco `try...catch`.
  - **Exportação:** Exporta um objeto com os métodos `get`, `post`, `put`, e `delete`, que são wrappers da `fetch` API. Cada método adiciona automaticamente os cabeçalhos de autenticação e passa a resposta pelo `handleResponse`.

### `api.ts`

- **Propósito:** Fornecer uma camada de abstração ainda mais simples sobre o `apiClient`.
- **Lógica Detalhada:**
  - Importa o `apiClient`.
  - Exporta um objeto `api` com os mesmos métodos (`get`, `post`, `put`, `delete`).
  - Cada método envolve a chamada correspondente do `apiClient` em um bloco `try...catch`. Isso simplifica o tratamento de erros nos `stores`, que podem simplesmente chamar `await api.get(...)` e usar `try...catch` para lidar com falhas, sem se preocupar com os detalhes da resposta HTTP.

### `chatbotApiService.ts`

- **Propósito:** Agrupar todas as chamadas de API relacionadas ao chatbot.
- **Lógica Detalhada:**
  - **`sendMessage(message, conversationHistory)`**: Envia uma mensagem do usuário e o histórico da conversa para o endpoint `/api/chatbot`. Retorna uma `Promise<ChatbotResponse>`, garantindo que a resposta do backend seja tipada corretamente.

### `confirmJournalEntryApiService.ts`

- **Propósito:** Lidar com a confirmação de lançamentos contábeis propostos pela IA.
- **Lógica Detalhada:**
  - **`confirmEntries(proposedEntries)`**: Envia um array de `ProposedEntry` para o endpoint `/api/confirm-journal-entries`.

### `documentProcessorApiService.ts`

- **Propósito:** Lidar com o upload de documentos para extração de texto.
- **Lógica Detalhada:**
  - **`uploadDocument(file)`**: Cria um objeto `FormData`, anexa o arquivo e o envia para o endpoint `/api/document-processor`. É importante notar que ele define o `Content-Type` como `multipart/form-data`, que é tratado de forma especial pelo `apiClient` (que não o define como `application/json`).

### `entryLineService.ts`

- **Propósito:** Gerenciar as linhas de um lançamento contábil.
- **Lógica Detalhada:**
  - **`createEntryLine(lineData)`**: Envia os dados de uma nova linha para o endpoint `/api/entry-lines`.
  - **`deleteEntryLinesByJournalEntryId(...)`**: Envia uma requisição `DELETE` para o endpoint `/api/entry-lines` com os IDs necessários como parâmetros de query para deletar todas as linhas de um lançamento específico.

### `notificationService.ts`

- **Propósito:** Fornecer uma maneira de exibir notificações (toasts) de qualquer lugar da aplicação, mesmo fora de um componente Vue.
- **Lógica Detalhada:**
  - **Padrão Singleton "Injetado":** Declara uma variável `toast` no escopo do módulo.
  - **`setToast(instance)`**: Função chamada em `App.vue` para injetar a instância do `useToast()` na variável `toast` do módulo.
  - **`showToast(...)`**: Função exportada que pode ser chamada de qualquer lugar (ex: do `apiClient`). Ela verifica se a instância do `toast` foi injetada e, em caso afirmativo, chama o método `.add()` para exibir a notificação.

---

## Diretório: `stores`

(A descrição detalhada de cada store já foi fornecida na resposta anterior e permanece a mesma, pois já estava em um nível granular).

---

## Diretório: `views`

(A descrição detalhada das views já foi fornecida na resposta anterior e permanece a mesma, pois já estava em um nível granular).

---

## Diretório: `types`

### `index.ts`

- **Propósito:** Arquivo central que agrega e exporta todas as principais interfaces e tipos de dados da aplicação, servindo como um único ponto de importação para os outros módulos.
- **Estruturas Definidas:** `Account`, `Product`, `EntryLine`, `JournalEntry`, `Organization`, `User`, `TaxRegime`, `AccountingPeriod`, etc. Cada interface define a "forma" de um objeto de dados, garantindo consistência e permitindo que o TypeScript verifique o código em tempo de compilação.

### `chatbot.ts`

- **Propósito:** Isolar as definições de tipo específicas da funcionalidade do chatbot.
- **Estruturas Definidas:**
  - `ChatbotMessage`: Define a estrutura de uma única mensagem na conversa (`role` e `content`).
  - `ProposedEntry`: Define a estrutura JSON para uma proposta de lançamento contábil gerada pela IA.
  - `ChatbotResponse`: Define a estrutura completa da resposta da API do chatbot, incluindo a resposta textual, o histórico, a intenção detectada, e dados opcionais como perguntas de esclarecimento ou propostas de lançamento.

### `organization.ts`

- **Propósito:** Definição de tipo para a entidade `Organization`.
- **Observação:** Este arquivo parece redundante, pois a interface `Organization` já está definida em `types/index.ts`. Poderia ser um candidato a refatoração para consolidar as definições.

### `swagger-ui-dist.d.ts`

- **Propósito:** Arquivo de declaração de tipo do TypeScript (`.d.ts`) para o módulo `swagger-ui-dist`.
- **Lógica:** Informa ao TypeScript que o módulo `swagger-ui-dist/swagger-ui-bundle.js` existe e exporta um objeto `SwaggerUI`, permitindo que ele seja importado em um arquivo TypeScript sem causar erros de tipo.

---

## Diretório: `utils`

### `accountTypeTranslations.ts`

- **Propósito:** Fornecer um mapeamento simples entre os tipos de conta (em inglês, como 'asset') e suas traduções para o português.
- **Lógica:** Exporta um objeto `accountTypeTranslations` que funciona como um dicionário para tradução na interface do usuário.

### `errorUtils.ts`

- **Propósito:** Centralizar o tratamento de erros.
- **Lógica:** A função `getErrorMessage(error: unknown)` recebe um erro de tipo desconhecido, verifica se é uma instância de `Error` e retorna a propriedade `message`. Caso contrário, retorna uma mensagem de erro genérica, evitando que a aplicação quebre ao tentar acessar propriedades de um objeto de erro não padrão.

### `taxHelpers.ts`

- **Propósito:** Armazenar constantes e estruturas de dados relacionadas à lógica de impostos.
- **Lógica:** Exporta o objeto `TAX_SECTIONS`, que agrupa os tipos de impostos em categorias (Vendas, Federais, Retenções), facilitando a construção de formulários e interfaces relacionadas a impostos.
