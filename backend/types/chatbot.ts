export interface ChatbotMessage {
  role: 'user' | 'model'
  content: string
}

export interface ChatbotRequest {
  message: string
}

export interface ProposedEntry {
  date: string
  description: string
  debits: Array<{ account: string; value: number }>
  credits: Array<{ account: string; value: number }>
}

export interface ChatbotResponse {
  reply: string
  conversationHistory?: ChatbotMessage[]
  intent?:
    | 'general_question'
    | 'resolve_exercise_request'
    | 'validate_journal_entry_request'
    | 'validate_existing_journal_entry_request'
    | 'awaiting_exercise_text'
    | 'journal_entry_text_received'
    | 'awaiting_existing_journal_entry_description'
    | 'awaiting_confirmation_for_existing_journal_entry'
    | 'awaiting_clarification'
  clarifyingQuestions?: string[]
  proposedEntries?: ProposedEntry[]
}
