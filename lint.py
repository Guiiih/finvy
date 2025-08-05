 npm run lint 

> lint
> eslint . --ext .ts


C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\.eslintrc.cjs
  1:1  error  'module' is not defined  no-undef

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\handlers\documentProcessor.ts
  32:12  error  'fields' is assigned a value but never used  @typescript-eslint/no-unused-vars
  44:30  error  A `require()` style import is forbidden      @typescript-eslint/no-require-imports

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\handlers\notifications.ts
  12:21  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  22:21  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\handlers\products.ts
  158:26  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  179:26  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\handlers\user-presence.ts
  18:21  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  34:21  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\chatbotService.ts
   88:26  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
   89:28  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
  120:29  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
  137:11  error  'foundJournalEntry' is assigned a value but never used  @typescript-eslint/no-unused-vars
  147:29  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
  158:33  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
  187:19  error  Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\confirmJournalEntryService.ts
   2:10  error  'findAccountByName' is defined but never used  @typescript-eslint/no-unused-vars
  19:12  error  Unexpected any. Specify a different type       @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\documentProcessorService.ts
   8:7   error  'worker' is defined but never used        @typescript-eslint/no-unused-vars
  24:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  25:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  26:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  27:51  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\exerciseSolverService.ts
  27:3   error  'organization_id' is defined but never used              @typescript-eslint/no-unused-vars
  28:3   error  'active_accounting_period_id' is defined but never used  @typescript-eslint/no-unused-vars
  29:3   error  'token' is defined but never used                        @typescript-eslint/no-unused-vars
  30:12  error  Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  56:62  error  Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  57:64  error  Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  72:65  error  Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\journalEntrySearchService.ts
  25:12  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\notificationService.ts
   4:117  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  16:68   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\services\userPresenceService.ts
   5:120  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  23:108  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend\swagger.js
  46:1  error  'console' is not defined  no-undef

✖ 36 problems (36 errors, 0 warnings)

npm error Lifecycle script `lint` failed with error:
npm error code 1
npm error path C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend
npm error workspace undefined
npm error location C:\Users\guilh\OneDrive\Documentos\GitHub\finvy\backend
npm error command failed
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c eslint . --ext .ts