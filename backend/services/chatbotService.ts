import { ChatbotMessage, ChatbotResponse } from "../types/chatbot.js";
import logger from "../utils/logger.js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Carrega as variáveis de ambiente do .env na raiz do projeto

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.error("GEMINI_API_KEY não está configurada nas variáveis de ambiente.");
  throw new Error("GEMINI_API_KEY não está configurada.");
}

logger.info(`[ChatbotService] GEMINI_API_KEY carregada (primeiros 5 chars): ${GEMINI_API_KEY.substring(0, 5)}`);

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function sendMessageToChatbot(
  message: string,
  conversationHistory: ChatbotMessage[] = [],
): Promise<ChatbotResponse> {
  logger.info(`[ChatbotService] Recebida mensagem: "${message}"`);

  try {
    const contents = conversationHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const prompt = `
      Você é um assistente contábil amigável e prestativo. Sua principal função é responder a dúvidas contábeis.
      No entanto, você também pode identificar a intenção do usuário para resolver ou validar exercícios.
      Analise a mensagem do usuário e determine a intenção principal:
      - 'general_question': Se for uma pergunta comum sobre contabilidade.
      - 'resolve_exercise_request': Se o usuário pedir para resolver um exercício (ex: "resolva este exercício", "calcule isso").
      - 'validate_solution_request': Se o usuário pedir para validar uma solução (ex: "minha solução está correta?", "verifique meu lançamento").

      Se a intenção for 'resolve_exercise_request' ou 'validate_solution_request', sua resposta (reply) deve ser uma instrução clara para o usuário fornecer o texto do exercício ou da solução.

      Sua resposta deve ser um JSON com a seguinte estrutura:
      {
        "reply": "sua resposta textual aqui",
        "intent": "general_question" | "resolve_exercise_request" | "validate_solution_request"
      }

      Exemplos de interação:
      Usuário: "O que é balanço patrimonial?"
      Assistente: { "reply": "Balanço Patrimonial é...", "intent": "general_question" }

      Usuário: "Resolva o exercício: A empresa comprou mercadorias..."
      Assistente: { "reply": "Ok, por favor, cole o texto completo do exercício.", "intent": "awaiting_exercise_text" }

      Usuário: "Minha solução para o exercício X está correta? Exercício: ... Minha Solução: ..."
      Assistente: { "reply": "Entendido. Por favor, use o modal de validação para inserir o exercício e sua solução.", "intent": "awaiting_validation_text" }

      Usuário: "Quero resolver um exercício."
      Assistente: { "reply": "Ok, por favor, cole o texto completo do exercício.", "intent": "awaiting_exercise_text" }

      Usuário: "Quero validar minha solução."
      Assistente: { "reply": "Entendido. Por favor, use o modal de validação para inserir o exercício e sua solução.", "intent": "awaiting_validation_text" }

      Considere o histórico da conversa para refinar a intenção, se necessário.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Usando o modelo flash mais recente
      contents: [...contents, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            intent: { type: Type.STRING, enum: ['general_question', 'resolve_exercise_request', 'validate_solution_request', 'awaiting_exercise_text', 'awaiting_validation_text'] },
          },
          required: ['reply', 'intent'],
        },
      },
    });

    const responseJson = JSON.parse(result.text || '{ "reply": "Não foi possível obter uma resposta.", "intent": "general_question" }');
    const replyText = responseJson.reply || 'Não foi possível obter uma resposta.';
    const intent = responseJson.intent || 'general_question';

    const newConversationHistory: ChatbotMessage[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'model',
        content: msg.content,
      })),
      { role: 'user', content: message },
      { role: 'model', content: replyText },
    ];

    logger.info(`[ChatbotService] Respondendo com: "${replyText}" e intenção: ${intent}`);

    return {
      reply: replyText,
      conversationHistory: newConversationHistory,
      intent: intent,
    };
  } catch (error) {
    logger.error("Erro ao se comunicar com o Gemini API:", error);
    throw new Error("Não foi possível obter uma resposta do assistente contábil.");
  }
}