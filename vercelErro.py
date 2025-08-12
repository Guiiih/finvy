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
✓ 552 modules transformed.
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
dist/assets/index-Bbb_l9vs.css                       57.01 kB │ gzip:  10.24 kB
dist/assets/check-success-NNSBHI_I.js                 0.61 kB │ gzip:   0.31 kB
dist/assets/RegistrationSuccessView-Bed2Y0Vm.js       0.99 kB │ gzip:   0.62 kB
dist/assets/PasswordResetSuccessView-BuTNL4YU.js      1.03 kB │ gzip:   0.64 kB
dist/assets/InventoryReport-CMv86CER.js               1.45 kB │ gzip:   0.72 kB
dist/assets/UpdatePasswordView-Bp9Gqf7G.js            1.65 kB │ gzip:   0.94 kB
dist/assets/productStore-D1wJzAKO.js                  2.10 kB │ gzip:   0.86 kB
dist/assets/YearEndClosingView-hQUraFCN.js            2.37 kB │ gzip:   1.21 kB
dist/assets/TrialBalance-BKbQjhs7.js                  2.41 kB │ gzip:   1.03 kB
dist/assets/ForgotPasswordView-BmmC7ElX.js            2.65 kB │ gzip:   1.40 kB
dist/assets/AccountsReceivable-CtlT-o3O.js            2.74 kB │ gzip:   1.30 kB
dist/assets/accountStore-BwWOQQOI.js                  2.77 kB │ gzip:   0.98 kB
dist/assets/AccountsPayable-D6MMgPaT.js               2.81 kB │ gzip:   1.34 kB
dist/assets/financialTransactionsStore-D4LzXXlq.js    2.86 kB │ gzip:   0.95 kB
dist/assets/IncomeStatement-DcVHi9Av.js               3.45 kB │ gzip:   1.32 kB
dist/assets/StockControlView-hqZfQjf6.js              3.50 kB │ gzip:   1.55 kB
dist/assets/InitialView-CSJ2araz.js                   3.57 kB │ gzip:   1.71 kB
dist/assets/RegisterView-Bdk_Kvbt.js                  4.20 kB │ gzip:   1.61 kB
dist/assets/CashFlow-BOhzdfXD.js                      4.35 kB │ gzip:   1.44 kB
dist/assets/LoginView-DXKUV1dW.js                     4.36 kB │ gzip:   1.98 kB
dist/assets/pinia-BbcuJRMY.js                         5.25 kB │ gzip:   2.56 kB
dist/assets/BalanceSheet--egmGQb1.js                  5.53 kB │ gzip:   1.71 kB
dist/assets/LedgerView-BFBIgFD-.js                    5.96 kB │ gzip:   2.17 kB
dist/assets/supabase-BtbB0H9Q.js                      6.12 kB │ gzip:   2.23 kB
dist/assets/journalEntryStore-sQ2qCLY3.js             7.72 kB │ gzip:   2.75 kB
dist/assets/reportStore-CmluvoTD.js                   8.99 kB │ gzip:   2.06 kB
dist/assets/AccountsPayableView-DDm_-H26.js           9.21 kB │ gzip:   2.37 kB
dist/assets/AccountsReceivableView-DCamrv_4.js        9.43 kB │ gzip:   2.40 kB
dist/assets/ProductsView-O_4SOHIg.js                 12.30 kB │ gzip:   3.88 kB
dist/assets/LandingPage-Nq2MXNla.js                  14.67 kB │ gzip:   4.35 kB
dist/assets/AccountingPeriodView-Bda-nEFf.js         20.03 kB │ gzip:   5.28 kB
dist/assets/AccountsView-C7jVc8kH.js                 20.79 kB │ gzip:   6.80 kB
dist/assets/ReportsView-kjHijxF9.js                  22.43 kB │ gzip:   6.21 kB
dist/assets/SettingsView-DtgtA7OJ.js                 35.02 kB │ gzip:   9.94 kB
dist/assets/vee-validate-COYqPtgk.js                 35.72 kB │ gzip:  12.13 kB
dist/assets/index-DDBIxozS.js                        49.94 kB │ gzip:  14.79 kB
dist/assets/zod-Dv3rLVNS.js                          55.77 kB │ gzip:  13.11 kB
dist/assets/JournalEntryView-RBpw0_Wn.js             61.86 kB │ gzip:  16.47 kB
dist/assets/vue-Cbxm3tID.js                         182.93 kB │ gzip:  60.63 kB
dist/assets/vendor-CFWbhGXP.js                      635.88 kB │ gzip: 148.63 kB
dist/assets/primevue-BXr2fnyH.js                    719.88 kB │ gzip: 163.83 kB
✓ built in 4.82s
> Success! Build completed
> Ready! Available at http://localhost:3000
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
Forcing backend rebuild
Forcing backend rebuild
Forcing backend rebuild
(node:32772) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[16:50:17.849] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[16:50:17.848] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[16:50:17.848] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[16:50:18.054] INFO: [API Router] Roteando o pedido para: GET /api/profile
[16:50:18.269] INFO: [API Router] Roteando o pedido protegido para: GET /profile
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
node_modules/@types/d3-dispatch/index.d.ts:91:5 - error TS1139: Type parameter declaration expected.

91     const EventNames extends keyof any = keyof EventMap,
       ~~~~~

node_modules/@types/d3-dispatch/index.d.ts:91:22 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                        ~~~~~~~

node_modules/@types/d3-dispatch/index.d.ts:91:36 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                                      ~~~

node_modules/@types/d3-dispatch/index.d.ts:91:48 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                                                  ~~~~~~~~

node_modules/@types/d3-dispatch/index.d.ts:92:1 - error TS1109: Expression expected.

92 >(
   ~

node_modules/@types/d3-dispatch/index.d.ts:93:5 - error TS1109: Expression expected.

93     ...types: EventNames[]
       ~~~

node_modules/@types/d3-dispatch/index.d.ts:93:26 - error TS1011: An element access expression should take an argument.

93     ...types: EventNames[]
  

node_modules/@types/d3-dispatch/index.d.ts:94:1 - error TS1128: Declaration or statement expected.

94 ): Dispatch<This, EventMap>;
   ~

node_modules/@types/d3-dispatch/index.d.ts:94:2 - error TS1128: Declaration or statement expected.

94 ): Dispatch<This, EventMap>;
    ~


Found 9 errors in the same file, starting at: node_modules/@types/d3-dispatch/index.d.ts:91

node_modules/@types/d3-dispatch/index.d.ts:91:5 - error TS1139: Type parameter declaration expected.

91     const EventNames extends keyof any = keyof EventMap,
       ~~~~~

node_modules/@types/d3-dispatch/index.d.ts:91:22 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                        ~~~~~~~

node_modules/@types/d3-dispatch/index.d.ts:91:36 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                                      ~~~

node_modules/@types/d3-dispatch/index.d.ts:91:48 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                                                  ~~~~~~~~

node_modules/@types/d3-dispatch/index.d.ts:92:1 - error TS1109: Expression expected.

92 >(
   ~

node_modules/@types/d3-dispatch/index.d.ts:93:5 - error TS1109: Expression expected.

93     ...types: EventNames[]
       ~~~

node_modules/@types/d3-dispatch/index.d.ts:93:26 - error TS1011: An element access expression should take an argument.

93     ...types: EventNames[]
  

node_modules/@types/d3-dispatch/index.d.ts:94:1 - error TS1128: Declaration or statement expected.

94 ): Dispatch<This, EventMap>;
   ~

node_modules/@types/d3-dispatch/index.d.ts:94:2 - error TS1128: Declaration or statement expected.

94 ): Dispatch<This, EventMap>;
    ~


Found 9 errors in the same file, starting at: node_modules/@types/d3-dispatch/index.d.ts:91

node_modules/@types/d3-dispatch/index.d.ts:91:5 - error TS1139: Type parameter declaration expected.

91     const EventNames extends keyof any = keyof EventMap,
       ~~~~~

node_modules/@types/d3-dispatch/index.d.ts:91:22 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                        ~~~~~~~

node_modules/@types/d3-dispatch/index.d.ts:91:36 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                                      ~~~

node_modules/@types/d3-dispatch/index.d.ts:91:48 - error TS1005: ',' expected.

91     const EventNames extends keyof any = keyof EventMap,
                                                  ~~~~~~~~

node_modules/@types/d3-dispatch/index.d.ts:92:1 - error TS1109: Expression expected.

92 >(
   ~

node_modules/@types/d3-dispatch/index.d.ts:93:5 - error TS1109: Expression expected.

93     ...types: EventNames[]
       ~~~

node_modules/@types/d3-dispatch/index.d.ts:93:26 - error TS1011: An element access expression should take an argument.

93     ...types: EventNames[]
  

node_modules/@types/d3-dispatch/index.d.ts:94:1 - error TS1128: Declaration or statement expected.

94 ): Dispatch<This, EventMap>;
   ~

node_modules/@types/d3-dispatch/index.d.ts:94:2 - error TS1128: Declaration or statement expected.

94 ): Dispatch<This, EventMap>;
    ~


Found 9 errors in the same file, starting at: node_modules/@types/d3-dispatch/index.d.ts:91

[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
Forcing backend rebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[16:50:21.732] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
Forcing backend rebuild
Forcing backend rebuild
[16:50:21.815] INFO: [API Router] Roteando o pedido para: GET /api/profile
[16:50:21.773] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[16:50:21.885] INFO: [API Router] Roteando o pedido protegido para: GET /profile
[16:50:21.876] INFO: [API Router] Roteando o pedido para: GET /api/profile
[16:50:21.773] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[16:50:21.885] INFO: [API Router] Roteando o pedido para: GET /api/reports/generate
[16:50:22.073] INFO: [API Router] Roteando o pedido protegido para: GET /profile
[16:50:22.043] INFO: [API Router] Roteando o pedido protegido para: GET /reports/generate
[16:50:22.044] INFO: [SupabaseClient] getUserOrganizationAndPeriod: Buscando perfil para user_id: e0d47098-9da1-4f46-bd31-545aae480b53
[16:50:22.075] INFO: [SupabaseClient] Perfil encontrado para user_id e0d47098-9da1-4f46-bd31-545aae480b53. Organization ID: 47500b69-37a9-4a25-b49c-13e0bf2419a4, Active Accounting Period ID: 9502fa04-6872-4890-9006-00559eb1f822
[16:50:22.171] WARN: Conta 'Estoques' n├úo encontrada. O balan├ºo de estoque n├úo pode ser calculado.
PS C:\Users\guilh\OneDrive\Documentos\GitHub\finvy> 