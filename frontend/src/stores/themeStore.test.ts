import { vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from './themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark') // Reset dark class
  })

  it('should initialize with default theme if no theme in localStorage', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should initialize with theme from localStorage if available', () => {
    localStorage.setItem('theme', 'dark')
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should set theme to dark and update localStorage and document class', () => {
    const store = useThemeStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should set theme to light and update localStorage and document class', () => {
    // First set to dark to ensure the class is removed
    localStorage.setItem('theme', 'dark')
    document.documentElement.classList.add('dark')

    const store = useThemeStore()
    store.setTheme('light')
    expect(store.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should reactively update theme', () => {
    const store = useThemeStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })
})