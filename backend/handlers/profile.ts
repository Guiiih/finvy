import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, getSupabaseAdmin, handleErrorResponse } from "../utils/supabaseClient.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);

  if (req.method === "GET") {
    try {
      const { data: profile, error: dbError } = await userSupabase
        .from("profiles")
        .select("username, role, avatar_url")
        .eq('id', user_id)
        .single();

      if (dbError) {
        console.error("Erro ao buscar perfil:", dbError);
        throw dbError;
      }

      if (!profile) {
        return handleErrorResponse(res, 404, "Perfil do usuário não encontrado.");
      }

      return res.status(200).json(profile);
    } catch (error: unknown) {
      console.error("Erro inesperado na API de perfil:", error);
      const message =
        error instanceof Error ? error.message : "Erro interno do servidor.";
      return handleErrorResponse(res, 500, message);
    }
  } else if (req.method === "DELETE") {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

      if (deleteError) {
        console.error("Erro ao deletar usuário:", deleteError);
        throw deleteError;
      }

      return res.status(200).json({ message: "Usuário excluído com sucesso." });
    } catch (error: unknown) {
      console.error("Erro inesperado ao excluir usuário:", error);
      const message =
        error instanceof Error ? error.message : "Erro interno do servidor.";
      return handleErrorResponse(res, 500, message);
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
}