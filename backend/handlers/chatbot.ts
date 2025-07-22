import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse } from "../utils/supabaseClient.js";
import { z } from "zod";
import { sendMessageToChatbot } from "../services/chatbotService.js";
import { ChatbotMessage } from "../types/chatbot.js";

const chatbotRequestSchema = z.object({
  message: z.string().min(1, "A mensagem não pode ser vazia."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[ChatbotHandler] Recebida requisição para o chatbot.`);

  try {
    if (req.method === "POST") {
      const parsedBody = chatbotRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(
          `[ChatbotHandler] Erro de validação do corpo da requisição: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { message, conversationHistory } = parsedBody.data;

      const response = await sendMessageToChatbot(message, conversationHistory as ChatbotMessage[]);

      logger.info(`[ChatbotHandler] Resposta do chatbot enviada.`);
      return res.status(200).json(response);
    }

    logger.warn(`[ChatbotHandler] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["POST"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API do chatbot:", error);
    return handleErrorResponse(res, 500, "Erro interno do servidor.");
  }
}
