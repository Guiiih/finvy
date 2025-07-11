import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import { formatSupabaseError } from "../utils/errorUtils.js";

const searchUsersSchema = z.object({
  query: z.string().min(1, "A query de busca é obrigatória."),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[Users] Recebida requisição para user_id: ${user_id}`);
  const userSupabase = getSupabaseClient(token);

  try {
    if (req.method === "GET") {
      const parsedQuery = searchUsersSchema.safeParse(req.query);
      if (!parsedQuery.success) {
        logger.warn(
          `[Users] Erro de validação da query de busca: ${parsedQuery.error.errors.map((err) => err.message).join(", ")}`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedQuery.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { query } = parsedQuery.data;
      const searchTerm = `%${query.toLowerCase()}%`;

      logger.info(`[Users] Buscando usuários com query: ${query}`);

      // Search in profiles table for username or email
      const { data, error: dbError } = await userSupabase
        .from("profiles")
        .select("id, username, email")
        .or(`username.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(10); // Limit results for performance

      if (dbError) {
        logger.error(`[Users] Erro ao buscar usuários: ${dbError.message}`);
        throw dbError;
      }

      logger.info(`[Users] Usuários encontrados: ${data.length}`);
      return res.status(200).json(data);
    }

    logger.warn(`[Users] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["GET"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de usuários:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}
