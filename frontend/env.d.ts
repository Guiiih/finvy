/// <reference types="vite/client" />
/// <reference types="vitest/globals" />
/// <reference types="vue/ref-macros" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}