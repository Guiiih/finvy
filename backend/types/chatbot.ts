export interface ChatbotMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatbotRequest {
  message: string;
}

export interface ChatbotResponse {
  reply: string;
  conversationHistory?: ChatbotMessage[];
  intent?: 'general_question' | 'resolve_exercise_request' | 'validate_solution_request' | 'awaiting_exercise_text' | 'awaiting_validation_text' | 'exercise_text_received';
}
