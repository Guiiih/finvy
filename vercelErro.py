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
✓ 519 modules transformed.
dist/assets/FinvyFavicon-eel6Tkcb.svg                 0.43 kB │ gzip:   0.30 kB
dist/index.html                                       1.11 kB │ gzip:   0.47 kB
dist/assets/primeicons-C6QP2o4f.woff2                35.15 kB
dist/assets/primeicons-MpK4pl85.ttf                  84.98 kB
dist/assets/primeicons-WjwUDZjB.woff                 85.06 kB
dist/assets/primeicons-DMOk5skT.eot                  85.16 kB
dist/assets/primeicons-Dr5RGzOO.svg                 342.53 kB │ gzip: 105.26 kB
dist/assets/SettingsView-o-vkuNg_.css                 0.08 kB │ gzip:   0.09 kB
dist/assets/LoginView-Cu-VCW46.css                    0.34 kB │ gzip:   0.18 kB
dist/assets/RegisterView-C2z4aE8X.css                 0.60 kB │ gzip:   0.26 kB
dist/assets/UpdatePasswordView-DCdA_QTw.css           0.61 kB │ gzip:   0.34 kB
dist/assets/LedgerView-DD2qwY42.css                   0.66 kB │ gzip:   0.35 kB
dist/assets/vue-Bakm0czn.css                          4.27 kB │ gzip:   0.93 kB
dist/assets/primevue-BWJi3ZdQ.css                    11.94 kB │ gzip:   2.94 kB
dist/assets/index-BGcNYDMm.css                       55.82 kB │ gzip:  10.00 kB
dist/assets/errorUtils-CVfqUmfc.js                    0.10 kB │ gzip:   0.11 kB
dist/assets/check-success-NNSBHI_I.js                 0.61 kB │ gzip:   0.31 kB
dist/assets/RegistrationSuccessView-G5QbJ1Ug.js       0.99 kB │ gzip:   0.63 kB
dist/assets/PasswordResetSuccessView-xPEGWEEV.js      1.03 kB │ gzip:   0.64 kB
dist/assets/InventoryReport-D-h9EuBX.js               1.45 kB │ gzip:   0.72 kB
dist/assets/UpdatePasswordView-21hXo8Gh.js            1.65 kB │ gzip:   0.93 kB
dist/assets/productStore-BW7FjJTU.js                  2.05 kB │ gzip:   0.83 kB
dist/assets/YearEndClosingView-B4scZUWM.js            2.37 kB │ gzip:   1.21 kB
dist/assets/TrialBalance-5mOYRFtF.js                  2.41 kB │ gzip:   1.03 kB
dist/assets/ForgotPasswordView-CYLXnLx0.js            2.65 kB │ gzip:   1.40 kB
dist/assets/AccountsReceivable-CkJ0txBe.js            2.74 kB │ gzip:   1.30 kB
dist/assets/AccountsPayable-nXldgRHs.js               2.81 kB │ gzip:   1.33 kB
dist/assets/accountStore-BoN6wTC5.js                  2.82 kB │ gzip:   1.00 kB
dist/assets/financialTransactionsStore-ZZj5cjNd.js    2.86 kB │ gzip:   0.95 kB
dist/assets/IncomeStatement-DFLbAD5Y.js               3.45 kB │ gzip:   1.32 kB
dist/assets/StockControlView-CPplfBm0.js              3.50 kB │ gzip:   1.55 kB
dist/assets/InitialView-DPxLkxbl.js                   3.57 kB │ gzip:   1.71 kB
dist/assets/RegisterView-B0UE0Sas.js                  4.20 kB │ gzip:   1.61 kB
dist/assets/CashFlow-BbNmwcVB.js                      4.35 kB │ gzip:   1.43 kB
dist/assets/LoginView-Do-knaVx.js                     4.36 kB │ gzip:   1.97 kB
dist/assets/pinia-DjCkn48V.js                         5.25 kB │ gzip:   2.56 kB
dist/assets/BalanceSheet-BBhpHo0l.js                  5.53 kB │ gzip:   1.71 kB
dist/assets/LedgerView-DPHqdsle.js                    5.96 kB │ gzip:   2.16 kB
dist/assets/supabase-Cz4hFwfH.js                      6.13 kB │ gzip:   2.23 kB
dist/assets/journalEntryStore-Cq6z6Qhc.js             6.70 kB │ gzip:   2.33 kB
dist/assets/reportStore-DfpEYaMC.js                   8.99 kB │ gzip:   2.06 kB
dist/assets/AccountsPayableView-Dp3JA11K.js           9.21 kB │ gzip:   2.37 kB
dist/assets/AccountsReceivableView-DINvCcKK.js        9.43 kB │ gzip:   2.40 kB
dist/assets/AccountsView-A4BoLYyi.js                 11.47 kB │ gzip:   4.41 kB
dist/assets/ProductsView-BcLycy44.js                 11.75 kB │ gzip:   3.78 kB
dist/assets/LandingPage-BMjOnAvF.js                  14.65 kB │ gzip:   4.34 kB
dist/assets/AccountingPeriodView-DL_N1mxD.js         20.03 kB │ gzip:   5.27 kB
dist/assets/ReportsView-AmLfuWyS.js                  22.44 kB │ gzip:   6.23 kB
dist/assets/SettingsView-BrJY3sYc.js                 32.88 kB │ gzip:   9.24 kB
dist/assets/vee-validate-B2e_Rt6W.js                 35.72 kB │ gzip:  12.13 kB
dist/assets/JournalEntryView-DTs4IgII.js             42.47 kB │ gzip:  11.01 kB
dist/assets/index-DTxgDfws.js                        46.46 kB │ gzip:  13.98 kB
dist/assets/zod-CeQqTxIs.js                          55.76 kB │ gzip:  13.10 kB
dist/assets/vue-CbqkvMrs.js                         182.94 kB │ gzip:  60.64 kB
dist/assets/vendor-D6cu2tnV.js                      606.06 kB │ gzip: 145.09 kB
dist/assets/primevue-uF2boPsQ.js                    614.21 kB │ gzip: 142.47 kB
✓ built in 4.27s
> Success! Build completed
> Ready! Available at http://localhost:3000
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.2.1] injecting env (0) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
(node:17036) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[19:59:45.934] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[19:59:45.935] INFO: [ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): AIzaS
[19:59:46.075] INFO: [API Router] Roteando o pedido para: POST /api/user-presence
[19:59:46.113] INFO: [API Router] Roteando o pedido protegido para: POST /user-presence
[19:59:46.074] INFO: [API Router] Roteando o pedido para: GET /api/user-presence
[19:59:46.113] INFO: [API Router] Roteando o pedido protegido para: GET /user-presence
backend/services/chatbotService.ts:7:25 - error TS2459: Module '"./exerciseSolverService.js"' declares 'SolveExerciseResponse' locally, but it is not exported.

7 import { solveExercise, SolveExerciseResponse } from './exerciseSolverService.js'; // Importar o serviço de resolução de exercícios
                          ~~~~~~~~~~~~~~~~~~~~~

  backend/services/exerciseSolverService.ts:36:11
    36 interface SolveExerciseResponse {
                 ~~~~~~~~~~~~~~~~~~~~~
    'SolveExerciseResponse' is declared here.

backend/services/chatbotService.ts:9:45 - error TS2459: Module '"./journalEntrySearchService.js"' declares 'JournalEntry' locally, but it is not exported.

9 import { searchJournalEntriesByDescription, JournalEntry } from './journalEntrySearchService.js'; // Importar o serviço de busca de lançamentos
                                              ~~~~~~~~~~~~

  backend/services/journalEntrySearchService.ts:21:11
    21 interface JournalEntry {
                 ~~~~~~~~~~~~
    'JournalEntry' is declared here.


Found 2 errors in the same file, starting at: backend/services/chatbotService.ts:7