export interface ChatbotMessage {
  role: 'user' | 'model';
  content: string;
  isSolution?: boolean; // Adicionado para formatar a solução do exercício
}

export interface ChatbotRequest {
  message: string;
  conversationHistory?: ChatbotMessage[];
}

export interface ChatbotResponse {
  reply: string;
  conversationHistory?: ChatbotMessage[];
  intent?: 'general_question' | 'resolve_exercise_request' | 'validate_solution_request' | 'awaiting_exercise_text' | 'awaiting_validation_text' | 'exercise_text_received';
}
