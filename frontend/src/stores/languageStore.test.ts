import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLanguageStore } from './languageStore'

describe('languageStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.lang = '' // Reset lang attribute
  })

  it('should initialize with default language if no language in localStorage', () => {
    const store = useLanguageStore()
    expect(store.language).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('should initialize with language from localStorage if available', () => {
    localStorage.setItem('language', 'en-US')
    const store = useLanguageStore()
    expect(store.language).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  it('should set language and update localStorage and document lang attribute', () => {
    const store = useLanguageStore()
    store.setLanguage('es-ES')
    expect(store.language).toBe('es-ES')
    expect(localStorage.getItem('language')).toBe('es-ES')
    expect(document.documentElement.lang).toBe('es-ES')
  })

  it('should reactively update language', () => {
    const store = useLanguageStore()
    store.setLanguage('fr-FR')
    expect(store.language).toBe('fr-FR')
  })
})