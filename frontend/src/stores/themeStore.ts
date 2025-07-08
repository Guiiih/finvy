import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')

  const setTheme = (newTheme: string) => {
    theme.value = newTheme
  }

  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  // Aplica o tema inicial
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  }

  return { theme, setTheme }
})