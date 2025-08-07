vercel dev
Vercel CLI 44.7.3
> Creating initial build

> frontend@0.0.0 build
> run-p type-check "build-only {@}" --


> frontend@0.0.0 type-check
> vue-tsc --noEmit -p tsconfig.app.json


> frontend@0.0.0 build-only
> vite build

vite v5.4.19 building for production...
✓ 530 modules transformed.
dist/assets/FinvyFavicon-eel6Tkcb.svg                 0.43 kB │ gzip:   0.30 kB
dist/index.html                                       1.11 kB │ gzip:   0.47 kB
dist/assets/primeicons-C6QP2o4f.woff2                35.15 kB
dist/assets/primeicons-MpK4pl85.ttf                  84.98 kB
dist/assets/primeicons-WjwUDZjB.woff                 85.06 kB
dist/assets/primeicons-DMOk5skT.eot                  85.16 kB
dist/assets/primeicons-Dr5RGzOO.svg                 342.53 kB │ gzip: 105.26 kB
dist/assets/JournalEntryView-tn0RQdqM.css             0.00 kB │ gzip:   0.02 kB
dist/assets/SettingsView-o-vkuNg_.css                 0.08 kB │ gzip:   0.09 kB
dist/assets/LoginView-4M6CtjCn.css                    0.34 kB │ gzip:   0.18 kB
dist/assets/RegisterView-C2z4aE8X.css                 0.60 kB │ gzip:   0.26 kB
dist/assets/UpdatePasswordView-D46nTJZz.css           0.61 kB │ gzip:   0.34 kB
dist/assets/LedgerView-B5gRfHK0.css                   0.66 kB │ gzip:   0.35 kB
dist/assets/vue-Bakm0czn.css                          4.27 kB │ gzip:   0.93 kB
dist/assets/primevue-BWJi3ZdQ.css                    11.94 kB │ gzip:   2.94 kB
dist/assets/index-8trDgjDU.css                       55.98 kB │ gzip:  10.04 kB
dist/assets/errorUtils-CVfqUmfc.js                    0.10 kB │ gzip:   0.11 kB
dist/assets/check-success-NNSBHI_I.js                 0.61 kB │ gzip:   0.31 kB
dist/assets/RegistrationSuccessView-G5QbJ1Ug.js       0.99 kB │ gzip:   0.63 kB
dist/assets/PasswordResetSuccessView-xPEGWEEV.js      1.03 kB │ gzip:   0.64 kB
dist/assets/InventoryReport-Bk3B2JeP.js               1.45 kB │ gzip:   0.72 kB
dist/assets/UpdatePasswordView-CdoK0__v.js            1.65 kB │ gzip:   0.93 kB
dist/assets/productStore-C33g1WaT.js                  2.05 kB │ gzip:   0.83 kB
dist/assets/YearEndClosingView-Fp6B7pDQ.js            2.37 kB │ gzip:   1.21 kB
dist/assets/TrialBalance-il0HR0fY.js                  2.40 kB │ gzip:   1.03 kB
dist/assets/ForgotPasswordView-DKLMqXht.js            2.65 kB │ gzip:   1.40 kB
dist/assets/AccountsReceivable-CNf8IzLl.js            2.73 kB │ gzip:   1.31 kB
dist/assets/accountStore-3mIVtK1v.js                  2.77 kB │ gzip:   0.98 kB
dist/assets/AccountsPayable-CDv3NZMV.js               2.80 kB │ gzip:   1.34 kB
dist/assets/financialTransactionsStore-UG4wwpDH.js    2.86 kB │ gzip:   0.95 kB
dist/assets/IncomeStatement-GRb_nPIN.js               3.45 kB │ gzip:   1.32 kB
dist/assets/StockControlView-2ihNJi7D.js              3.50 kB │ gzip:   1.55 kB
dist/assets/InitialView-DFQYMBof.js                   3.57 kB │ gzip:   1.71 kB
dist/assets/RegisterView-DyL8Kkwc.js                  4.20 kB │ gzip:   1.61 kB
dist/assets/CashFlow-te5o4ZSF.js                      4.35 kB │ gzip:   1.43 kB
dist/assets/LoginView-D4ZmZnTr.js                     4.36 kB │ gzip:   1.98 kB
dist/assets/pinia-Dn61C4IE.js                         5.25 kB │ gzip:   2.56 kB
dist/assets/BalanceSheet-Ot5LLHi3.js                  5.53 kB │ gzip:   1.71 kB
dist/assets/LedgerView-B6dgs3GB.js                    5.96 kB │ gzip:   2.16 kB
dist/assets/supabase-B_Sg4-6b.js                      6.12 kB │ gzip:   2.23 kB
dist/assets/journalEntryStore-BXt0zHTn.js             6.64 kB │ gzip:   2.53 kB
dist/assets/reportStore-BKdeN-Ts.js                   8.99 kB │ gzip:   2.06 kB
dist/assets/AccountsPayableView-CiqZAKT_.js           9.21 kB │ gzip:   2.37 kB
dist/assets/AccountsReceivableView-4YDeY10T.js        9.43 kB │ gzip:   2.40 kB
dist/assets/AccountsView-C5uBpbAA.js                 11.52 kB │ gzip:   4.42 kB
dist/assets/ProductsView-Dd4yZ4a_.js                 11.75 kB │ gzip:   3.78 kB
dist/assets/LandingPage-6QFY2In5.js                  14.67 kB │ gzip:   4.35 kB
dist/assets/AccountingPeriodView-EKFQHNJS.js         20.03 kB │ gzip:   5.27 kB
dist/assets/ReportsView-B1RPArrD.js                  22.43 kB │ gzip:   6.20 kB
dist/assets/SettingsView-CWb3OO5U.js                 29.88 kB │ gzip:   8.52 kB
dist/assets/vee-validate-B2e_Rt6W.js                 35.72 kB │ gzip:  12.13 kB
dist/assets/index-NwHZyKkT.js                        49.95 kB │ gzip:  14.81 kB
dist/assets/JournalEntryView-ZTFUINbN.js             51.29 kB │ gzip:  13.04 kB
dist/assets/zod-CeQqTxIs.js                          55.76 kB │ gzip:  13.10 kB
dist/assets/vue-CbqkvMrs.js                         182.94 kB │ gzip:  60.64 kB
dist/assets/vendor-mmAUbjib.js                      625.22 kB │ gzip: 147.93 kB
dist/assets/primevue-CNUZ-WPR.js                    679.67 kB │ gzip: 156.80 kB
✓ built in 4.06s
> Success! Build completed
> Ready! Available at http://localhost:3000
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
(node:27396) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[15:03:11.596] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[15:03:11.686] INFO: [API Router] Roteando o pedido para: GET /api/profile
[15:03:11.727] INFO: [API Router] Roteando o pedido protegido para: GET /profile
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
backend/handlers/reports/generate.ts:34:47 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

34     logger.error('Erro ao gerar relatórios:', { error })
                                                 ~~~~~~~~~

backend/handlers/sharing.ts:286:65 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

286     logger.error('Erro inesperado na API de compartilhamento:', { error })
                                                                    ~~~~~~~~~

backend/handlers/tax-regime-history.ts:293:79 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

293     logger.error('Erro inesperado na API de histórico de regime tributário:', { error })
                                                                                  ~~~~~~~~~

backend/handlers/user-organization-roles.ts:334:70 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

334     logger.error('Erro inesperado na API de papéis de organização:', { error })
                                                                         ~~~~~~~~~

backend/handlers/user-presence.ts:28:60 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

28     logger.error('Erro ao atualizar presença do usuário:', { error })
                                                              ~~~~~~~~~

backend/handlers/user-presence.ts:54:53 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

54     logger.error('Erro ao buscar usuários online:', { error })
                                                       ~~~~~~~~~

backend/handlers/users.ts:56:57 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

56     logger.error('Erro inesperado na API de usuários:', { error })
                                                           ~~~~~~~~~

backend/handlers/year-end-closing.ts:64:64 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

64     logger.error('Erro ao processar fechamento de exercício:', { error })
                                                                  ~~~~~~~~~

backend/services/accountService.ts:51:62 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

51     logger.error('Accounts Service: Erro ao buscar contas:', { dbError })
                                                                ~~~~~~~~~~~

backend/services/accountService.ts:82:71 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

82     logger.error('Accounts Service: Erro ao buscar contas por tipo:', { dbError })
                                                                         ~~~~~~~~~~~

backend/services/accountService.ts:115:88 - error TS2345: Argument of type '{ parentError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

115       logger.error('Accounts Service: Erro ao buscar conta pai para determinar tipo:', { parentError })
                                                                                           ~~~~~~~~~~~~~~~

backend/services/accountService.ts:133:9 - error TS2345: Argument of type '{ topLevelError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

133         { topLevelError },
            ~~~~~~~~~~~~~~~~~

backend/services/accountService.ts:159:87 - error TS2345: Argument of type '{ parentError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

159         logger.error('Accounts Service: Erro ao buscar conta pai para gerar código:', { parentError })
                                                                                          ~~~~~~~~~~~~~~~

backend/services/accountService.ts:176:9 - error TS2345: Argument of type '{ childrenError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

176         { childrenError },
            ~~~~~~~~~~~~~~~~~

backend/services/accountService.ts:201:9 - error TS2345: Argument of type '{ topLevelError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

201         { topLevelError },
            ~~~~~~~~~~~~~~~~~

backend/services/accountService.ts:229:60 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

229     logger.error('Accounts Service: Erro ao criar conta:', { dbError })
                                                               ~~~~~~~~~~~

backend/services/accountService.ts:254:64 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

254     logger.error('Accounts Service: Erro ao atualizar conta:', { dbError })
                                                                   ~~~~~~~~~~~

backend/services/accountService.ts:282:85 - error TS2345: Argument of type '{ fetchError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

282     logger.error('Accounts Service: Erro ao buscar conta para verificar proteção:', { fetchError })
                                                                                        ~~~~~~~~~~~~~~

backend/services/accountService.ts:299:62 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

299     logger.error('Accounts Service: Erro ao deletar conta:', { dbError })
                                                                 ~~~~~~~~~~~

backend/services/accountService.ts:331:70 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

331     logger.error('Accounts Service: Erro ao buscar conta por nome:', { dbError })
                                                                         ~~~~~~~~~~~

backend/services/accountService.ts:467:11 - error TS2345: Argument of type '{ parentProcessError: unknown; }' is not assignable to parameter of type 'undefined'.

467           { parentProcessError },
              ~~~~~~~~~~~~~~~~~~~~~~

backend/services/accountService.ts:481:7 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

481       { error },
          ~~~~~~~~~

backend/services/accountService.ts:483:47 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

483     logger.error('Erro detalhado do Gemini:', { error })
                                                  ~~~~~~~~~

backend/services/chatbotService.ts:152:71 - error TS2345: Argument of type '{ solverError: unknown; }' is not assignable to parameter of type 'undefined'.

152         logger.error('Erro ao resolver exercício no ChatbotService:', { solverError })
                                                                          ~~~~~~~~~~~~~~~

backend/services/chatbotService.ts:183:82 - error TS2345: Argument of type '{ searchError: unknown; }' is not assignable to parameter of type 'undefined'.

183         logger.error('Erro ao buscar lançamentos existentes no ChatbotService:', { searchError })
                                                                                     ~~~~~~~~~~~~~~~

backend/services/chatbotService.ts:198:71 - error TS2345: Argument of type '{ validationError: unknown; }' is not assignable to parameter of type 'undefined'.

198         logger.error('Erro ao validar lançamento no ChatbotService:', { validationError })
                                                                          ~~~~~~~~~~~~~~~~~~~

backend/services/chatbotService.ts:232:60 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

232     logger.error('Erro ao se comunicar com o Gemini API:', { error })
                                                               ~~~~~~~~~

backend/services/confirmJournalEntryService.ts:68:7 - error TS2345: Argument of type '{ linesToCreate: ({ account_id: string; debit: number; credit: null; } | { account_id: string; debit: null; credit: number; })[]; }' is not assignable to parameter of type 'undefined'.

68       { linesToCreate },
         ~~~~~~~~~~~~~~~~~

backend/services/documentProcessorService.ts:16:53 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

16       logger.error('Erro ao extrair texto de PDF:', { error })
                                                       ~~~~~~~~~

backend/services/documentProcessorService.ts:32:73 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

32       logger.error('Erro ao extrair texto de imagem com Tesseract.js:', { error })
                                                                           ~~~~~~~~~

backend/services/entryLineService.ts:32:65 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

32     logger.error('Erro ao criar linhas de lançamento simples:', { error })
                                                                   ~~~~~~~~~

backend/services/exerciseSolverService.ts:182:64 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

182     logger.error('Erro ao resolver exercício com Gemini API:', { error })
                                                                   ~~~~~~~~~

backend/services/financialTransactionService.ts:28:92 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

28     logger.error('Financial Transactions Service: Erro ao buscar transações financeiras:', { dbError })
                                                                                              ~~~~~~~~~~~

backend/services/financialTransactionService.ts:59:89 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

59     logger.error('Financial Transactions Service: Erro ao criar transação financeira:', { dbError })
                                                                                           ~~~~~~~~~~~

backend/services/journalEntrySearchService.ts:58:63 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

58       logger.error('Erro ao buscar lançamentos no Supabase:', { error })
                                                                 ~~~~~~~~~

backend/services/journalEntrySearchService.ts:65:70 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

65     logger.error('Erro inesperado no Journal Entry Search Service:', { error })
                                                                        ~~~~~~~~~

backend/services/journalEntryService.ts:63:72 - error TS2345: Argument of type '{ productError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

63         logger.error('Erro ao buscar IDs de lançamentos com produto:', { productError })
                                                                          ~~~~~~~~~~~~~~~~

backend/services/journalEntryService.ts:84:73 - error TS2345: Argument of type '{ taxError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

84         logger.error('Erro ao buscar IDs de lançamentos com impostos:', { taxError })
                                                                           ~~~~~~~~~~~~

backend/services/journalEntryService.ts:104:70 - error TS2345: Argument of type '{ accountError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

104         logger.error('Erro ao buscar IDs de lançamentos por conta:', { accountError })
                                                                         ~~~~~~~~~~~~~~~~

backend/services/journalEntryService.ts:135:84 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

135     logger.error('Journal Entries Service: Erro ao buscar lançamentos de diário:', { dbError })
                                                                                       ~~~~~~~~~~~

backend/services/journalEntryService.ts:162:82 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

162     logger.error('Journal Entries Service: Erro ao criar lançamento de diário:', { dbError })
                                                                                     ~~~~~~~~~~~

backend/services/journalEntryService.ts:187:86 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

187     logger.error('Journal Entries Service: Erro ao atualizar lançamento de diário:', { dbError })
                                                                                         ~~~~~~~~~~~

backend/services/journalEntryService.ts:217:7 - error TS2345: Argument of type '{ dbError: PostgrestError; }' is not assignable to parameter of type 'undefined'.

217       { dbError },
          ~~~~~~~~~~~

backend/services/journalEntryService.ts:238:89 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

238       logger.error(`Error fetching entry lines for journal entry ${journal_entry_id}:`, { error })
                                                                                            ~~~~~~~~~

backend/services/journalEntryService.ts:267:7 - error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'undefined'.

267       error,
          ~~~~~

backend/services/journalEntryValidatorService.ts:55:64 - error TS2345: Argument of type '{ error: unknown; }' is not assignable to parameter of type 'undefined'.

55     logger.error('Erro ao validar lançamento com Gemini API:', { error })
                                                                  ~~~~~~~~~

backend/services/referenceService.ts:46:82 - error TS2345: Argument of type '{ err: unknown; }' is not assignable to parameter of type 'undefined'.

46     logger.error(`Erro ao obter o próximo número de referência para ${prefix}:`, { err })
                                                                                    ~~~~~~~

backend/services/taxSettingService.ts:21:85 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

21     logger.error('Tax Settings Service: Erro ao buscar configurações de impostos:', { error })
                                                                                       ~~~~~~~~~

backend/services/userPresenceService.ts:25:62 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

25       logger.error('Erro ao atualizar presença do usuário:', { error })
                                                                ~~~~~~~~~

backend/services/userPresenceService.ts:48:55 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

48       logger.error('Erro ao buscar usuários online:', { error })
                                                         ~~~~~~~~~

backend/utils/middleware.ts:52:47 - error TS2345: Argument of type '{ message: string; }' is not assignable to parameter of type 'undefined'.

52         logger.error('Erro de autenticação:', { message: authError?.message || 'Usuário não encontrado.' })
                                                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

backend/utils/middleware.ts:71:11 - error TS2345: Argument of type '{ message: string; }' is not assignable to parameter of type 'undefined'.

71           { message: profileError?.message || 'Perfil não encontrado.' },
             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

backend/utils/middleware.ts:78:70 - error TS2345: Argument of type '{ err: unknown; }' is not assignable to parameter of type 'undefined'.

78       logger.error('Erro inesperado no middleware de autenticação:', { err })
                                                                        ~~~~~~~

backend/utils/supabaseClient.ts:56:7 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

56       { error },
         ~~~~~~~~~

backend/utils/supabaseClient.ts:101:7 - error TS2345: Argument of type '{ error: PostgrestError; }' is not assignable to parameter of type 'undefined'.

101       { error },
          ~~~~~~~~~


Found 55 errors in 22 files.

Errors  Files
     1  backend/handlers/reports/generate.ts:34
     1  backend/handlers/sharing.ts:286
     1  backend/handlers/tax-regime-history.ts:293
     1  backend/handlers/user-organization-roles.ts:334
     2  backend/handlers/user-presence.ts:28
     1  backend/handlers/users.ts:56
     1  backend/handlers/year-end-closing.ts:64
    15  backend/services/accountService.ts:51
     4  backend/services/chatbotService.ts:152
     1  backend/services/confirmJournalEntryService.ts:68
     2  backend/services/documentProcessorService.ts:16
     1  backend/services/entryLineService.ts:32
     1  backend/services/exerciseSolverService.ts:182
     2  backend/services/financialTransactionService.ts:28
     2  backend/services/journalEntrySearchService.ts:58
     9  backend/services/journalEntryService.ts:63
     1  backend/services/journalEntryValidatorService.ts:55
     1  backend/services/referenceService.ts:46
     1  backend/services/taxSettingService.ts:21
     2  backend/services/userPresenceService.ts:25
     3  backend/utils/middleware.ts:52
     2  backend/utils/supabaseClient.ts:56