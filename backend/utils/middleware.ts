import type { VercelRequest, VercelResponse } from "@vercel/node";

import { anonSupabase, handleErrorResponse, getSupabaseClient } from "./supabaseClient.js";
import { handleCors } from "./corsHandler.js";
import { AuthApiError } from "@supabase/supabase-js";

type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
  user_role: string, // NOVO: Adicionado o nível de permissão do usuário
) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function withAuth(handler: ApiHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (handleCors(req, res)) {
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        // Manually parse the body if it's not already parsed
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
      } = await anonSupabase.auth.getUser(token); // Usando anonSupabase aqui

      if (authError || !user) {
        console.error(
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

      // NOVO: Buscar o perfil do usuário para obter a role
      const userSupabase = getSupabaseClient(token);
      const { data: profileData, error: profileError } = await userSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Erro ao buscar perfil do usuário:", profileError?.message || "Perfil não encontrado.");
        return handleErrorResponse(res, 500, "Perfil do usuário não encontrado ou erro ao buscar.");
      }

      await handler(req, res, user.id, token, profileData.role); // Passando a role para o handler
    } catch (err: unknown) {
      console.error("Erro inesperado no middleware de autenticação:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erro interno ao verificar autenticação.";
      return handleErrorResponse(res, 500, message);
    }
  };
}
