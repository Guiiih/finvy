import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse } from "../utils/supabaseClient.js";
import { z } from "zod";
import { validateExerciseSolution } from "../services/exerciseValidatorService.js";

const exerciseValidationRequestSchema = z.object({
  exercise: z.string().min(1, "O texto do exercício não pode ser vazio."),
  userSolution: z.string().min(1, "A solução do usuário não pode ser vazia."),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[ExerciseValidatorHandler] Recebida requisição para o validador de exercícios.`);

  try {
    if (req.method === "POST") {
      const parsedBody = exerciseValidationRequestSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(
          `[ExerciseValidatorHandler] Erro de validação do corpo da requisição: ${
            parsedBody.error.errors.map((err) => err.message).join(", ")
          }`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { exercise, userSolution } = parsedBody.data;

      const validationResult = await validateExerciseSolution(exercise, userSolution);

      logger.info(`[ExerciseValidatorHandler] Resultado da validação enviado.`);
      return res.status(200).json({ validationResult });
    }

    logger.warn(`[ExerciseValidatorHandler] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["POST"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API do validador de exercícios:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return handleErrorResponse(
      res,
      500,
      `Erro interno do servidor ao validar exercício: ${errorMessage}`,
    );
  }
}
