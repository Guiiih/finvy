import logger from "./logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { anonSupabase, handleErrorResponse, getSupabaseClient } from "./supabaseClient.js";
import { handleCors } from "./corsHandler.js";
import { AuthApiError } from "@supabase/supabase-js";

type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string,
) => Promise<any>;

export function withAuth(handler: ApiHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (handleCors(req, res)) {
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        if (typeof req.body === 'string') {
          req.body = JSON.parse(req.body);
        } else if (Buffer.isBuffer(req.body)) {
          req.body = JSON.parse(req.body.toString());
        }
      } catch (err: unknown) {
        return handleErrorResponse(res, 400, `Corpo da requisição JSON inválido: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return handleErrorResponse(
        res,
        401,
        "Token de autenticação não fornecido.",
      );
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await anonSupabase.auth.getUser(token);

      if (authError || !user) {
        logger.error(
          "Erro de autenticação:",
          authError?.message || "Usuário não encontrado.",
        );
        const status =
          authError instanceof AuthApiError ? authError.status : 401;
        return handleErrorResponse(
          res,
          status,
          `Falha na autenticação: ${authError?.message || "Token inválido ou expirado."}`,
        );
      }

      const userSupabase = getSupabaseClient(token);
      const { data: profileData, error: profileError } = await userSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        logger.error("Erro ao buscar perfil do usuário:", profileError?.message || "Perfil não encontrado.");
        return handleErrorResponse(res, 500, "Perfil do usuário não encontrado ou erro ao buscar.");
      }

      await handler(req, res, user.id, token, profileData.role);
    } catch (err: unknown) {
      logger.error("Erro inesperado no middleware de autenticação:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erro interno ao verificar autenticação.";
      return handleErrorResponse(res, 500, message);
    }
  };
}