import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, handleErrorResponse } from "./supabaseClient.js";
import { handleCors } from "./corsHandler.js";
import { AuthApiError } from "@supabase/supabase-js";

// Alteração aqui: mudamos o tipo de retorno para Promise<any> ou Promise<void | VercelResponse>
// Usar 'any' é mais simples e resolve o problema de imediato.
type ApiHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
) => Promise<any>;

// O resto do ficheiro permanece igual...
export function withAuth(handler: ApiHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (handleCors(req, res)) {
      return;
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
      } = await supabase.auth.getUser(token);

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

      await handler(req, res, user.id);
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
