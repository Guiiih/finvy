import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  const language = ref(localStorage.getItem('language') || 'pt-BR')

  const setLanguage = (newLanguage: string) => {
    language.value = newLanguage
  }

  watch(language, (newLanguage) => {
    localStorage.setItem('language', newLanguage)
    document.documentElement.lang = newLanguage
  })

  document.documentElement.lang = language.value

  return { language, setLanguage }
})