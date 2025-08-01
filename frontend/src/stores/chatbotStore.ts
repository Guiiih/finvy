import { defineStore } from 'pinia';
import { chatbotApiService } from '../services/chatbotApiService';
import type { ChatbotMessage, ChatbotResponse, ProposedEntry } from '../types/chatbot';
import type { JournalEntry } from '../types';

export const useChatbotStore = defineStore('chatbot', {
  state: () => ({
    messages: [] as ChatbotMessage[],
    isLoading: false,
    error: null as string | null,
    currentIntent: 'general_question' as ChatbotResponse['intent'],
    clarifyingQuestions: [] as string[],
    proposedEntries: [] as ProposedEntry[],
    foundJournalEntry: null as JournalEntry | null, // Para armazenar o lançamento encontrado para validação
  }),
  actions: {
    async sendMessage(message: string) {
      this.isLoading = true;
      this.error = null;
      try {
        this.addUserMessage(message);

        const response: ChatbotResponse = await chatbotApiService.sendMessage(message, this.messages);

        this.addModelMessage(response.reply);
        this.currentIntent = response.intent || 'general_question';
        this.clarifyingQuestions = response.clarifyingQuestions || [];
        this.proposedEntries = response.proposedEntries || [];
        this.foundJournalEntry = response.foundJournalEntry || null; // Atualiza o lançamento encontrado

      } catch (err: unknown) {
        if (err instanceof Error) {
          this.setError(err.message || 'Erro ao enviar mensagem para o chatbot.');
        } else {
          this.setError('Erro ao enviar mensagem para o chatbot.');
        }
        console.error('Erro no chatbot store:', err);
      } finally {
        this.isLoading = false;
      }
    },
    addUserMessage(message: string) {
      this.messages.push({ role: 'user', content: message, isSolution: false });
    },
    addModelMessage(message: string, isSolution: boolean = false) {
      this.messages.push({ role: 'model', content: message, isSolution });
    },
    setError(error: string | null) {
      this.error = error;
    },
    clearChat() {
      this.messages = [];
      this.error = null;
      this.currentIntent = 'general_question';
      this.clarifyingQuestions = [];
      this.proposedEntries = [];
      this.foundJournalEntry = null;
    },
    setFoundJournalEntry(entry: JournalEntry | null) {
      this.foundJournalEntry = entry;
    },
  },
});