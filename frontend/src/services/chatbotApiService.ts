import { api } from './api';
import type { ChatbotRequest, ChatbotResponse, ChatbotMessage } from '@/types/chatbot';

export const chatbotApiService = {
  async sendMessage(message: string, conversationHistory?: ChatbotMessage[]): Promise<ChatbotResponse> {
    const requestBody: ChatbotRequest = {
      message,
      conversationHistory,
    };
    return api.post<ChatbotResponse, ChatbotRequest>('/chatbot', requestBody);
  },
};
