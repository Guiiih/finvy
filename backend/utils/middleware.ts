import type { VercelRequest, VercelResponse } from "@vercel/node";
import { anonSupabase, handleErrorResponse } from "./supabaseClient.js";
import { handleCors } from "./corsHandler.js";
import { AuthApiError } from "@supabase/supabase-js";

type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string, // Adicionado o token como argumento
) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function withAuth(handler: ApiHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (handleCors(req, res)) {
      return;
    }

    const authHeader = req.headers.authorization;
    console.log("Middleware: Authorization Header:", authHeader);
    const token = authHeader?.split(" ")[1];
    console.log("Middleware: Extracted Token:", token);

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

      await handler(req, res, user.id, token); // Passando o token para o handler
    } catch (error: unknown) {
      console.error("Erro inesperado no middleware de autenticação:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao verificar autenticação.";
      return handleErrorResponse(res, 500, message);
    }
  };
}
