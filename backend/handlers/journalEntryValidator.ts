import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse } from "../utils/supabaseClient.js";
import { z } from "zod";
import { validateJournalEntry } from "../services/journalEntryValidatorService.js";

const journalEntryValidationRequestSchema = z.object({
  journalEntryDescription: z.string().min(1, "A descrição do lançamento não pode ser vazia."),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  logger.info(`[JournalEntryValidatorHandler] Recebida requisição para o validador de lançamentos.`);

  try {
    if (req.method === "POST") {
      const parsedBody = journalEntryValidationRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(
          `[JournalEntryValidatorHandler] Erro de validação do corpo da requisição: ${
            parsedBody.error.errors.map((err) => err.message).join(", ")
          }`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { journalEntryDescription } = parsedBody.data;

      const validationResult = await validateJournalEntry(journalEntryDescription);

      logger.info(`[JournalEntryValidatorHandler] Resultado da validação enviado.`);
      return res.status(200).json({ validationResult });
    }

    logger.warn(`[JournalEntryValidatorHandler] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["POST"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API do validador de lançamentos:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return handleErrorResponse(
      res,
      500,
      `Erro interno do servidor ao validar lançamento: ${errorMessage}`,
    );
  }
}