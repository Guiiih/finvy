import { defineStore } from 'pinia';
import { chatbotApiService } from '../services/chatbotApiService';
import type { ChatbotMessage, ChatbotResponse } from '../types/chatbot';

export const useChatbotStore = defineStore('chatbot', {
  state: () => ({
    messages: [] as ChatbotMessage[],
    isLoading: false,
    error: null as string | null,
    currentIntent: 'general_question' as ChatbotResponse['intent'],
  }),
  actions: {
    async sendMessage(message: string) {
      this.isLoading = true;
      this.error = null;
      try {
        this.addUserMessage(message);

        const response = await chatbotApiService.sendMessage(message, this.messages);
        this.messages = response.conversationHistory || this.messages;
        this.currentIntent = response.intent || 'general_question';
      } catch (err: any) {
        this.setError(err.message || 'Erro ao enviar mensagem para o chatbot.');
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
    },
  },
});
