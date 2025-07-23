import { defineStore } from 'pinia';
import { chatbotApiService } from '../services/chatbotApiService';
import type { ChatbotMessage, ChatbotResponse, ProposedEntry } from '../types/chatbot';

export const useChatbotStore = defineStore('chatbot', {
  state: () => ({
    messages: [] as ChatbotMessage[],
    isLoading: false,
    error: null as string | null,
    currentIntent: 'general_question' as ChatbotResponse['intent'],
    clarifyingQuestions: [] as string[],
    proposedEntries: [] as ProposedEntry[],
    originalExerciseText: null as string | null, // Para armazenar o texto original do exercício
  }),
  actions: {
    async sendMessage(message: string) {
      this.isLoading = true;
      this.error = null;
      try {
        this.addUserMessage(message);

        let response: ChatbotResponse;

        // Se estiver aguardando esclarecimentos, concatena a mensagem com o exercício original
        if (this.currentIntent === 'awaiting_clarification' && this.originalExerciseText) {
          const fullMessage = `${this.originalExerciseText}\n${message}`;
          response = await chatbotApiService.sendMessage(fullMessage, this.messages);
          this.originalExerciseText = null; // Limpa após o envio
        } else {
          response = await chatbotApiService.sendMessage(message, this.messages);
        }

        this.addModelMessage(response.reply);
        this.currentIntent = response.intent || 'general_question';
        this.clarifyingQuestions = response.clarifyingQuestions || [];
        this.proposedEntries = response.proposedEntries || [];

        // Se a intenção for exercise_text_received e houver perguntas de esclarecimento,
        // armazena o texto original do exercício para as próximas interações.
        if (response.intent === 'awaiting_clarification' && response.clarifyingQuestions && response.clarifyingQuestions.length > 0) {
          this.originalExerciseText = message; // Armazena o texto do exercício que gerou as perguntas
        }

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
      this.clarifyingQuestions = [];
      this.proposedEntries = [];
      this.originalExerciseText = null;
    },
  },
});
