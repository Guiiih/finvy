import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  const language = ref(localStorage.getItem('language') || 'pt-BR')

  const setLanguage = (newLanguage: string) => {
    language.value = newLanguage
  }

  watch(language, (newLanguage) => {
    localStorage.setItem('language', newLanguage)
    // Aqui você pode adicionar lógica para carregar arquivos de tradução
    // ou mudar o atributo lang do html, por exemplo.
    document.documentElement.lang = newLanguage
  })

  // Aplica o idioma inicial
  document.documentElement.lang = language.value

  return { language, setLanguage }
})