import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, getSupabaseAdmin, handleErrorResponse } from "../utils/supabaseClient.js";

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Retorna o perfil do usuário autenticado.
 *     description: Retorna informações do perfil, como nome de usuário, função e URL do avatar.
 *     tags:
 *       - Profile
 *     responses:
 *       200:
 *         description: Perfil do usuário.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 avatar_url:
 *                   type: string
 *       401:
 *         description: Não autorizado.
 *       404:
 *         description: Perfil não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 *   delete:
 *     summary: Deleta o perfil do usuário autenticado.
 *     description: Deleta permanentemente o usuário e todos os seus dados associados do sistema.
 *     tags:
 *       - Profile
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
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
        logger.error("Erro ao buscar perfil:", dbError);
        throw dbError;
      }

      if (!profile) {
        return handleErrorResponse(res, 404, "Perfil do usuário não encontrado.");
      }

      return res.status(200).json(profile);
    } catch (error: unknown) {
      logger.error("Erro inesperado na API de perfil:", error);
      const message =
        error instanceof Error ? error.message : "Erro interno do servidor.";
      return handleErrorResponse(res, 500, message);
    }
  } else if (req.method === "DELETE") {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

      if (deleteError) {
        logger.error("Erro ao deletar usuário:", deleteError);
        throw deleteError;
      }

      return res.status(200).json({ message: "Usuário excluído com sucesso." });
    } catch (error: unknown) {
      logger.error("Erro inesperado ao excluir usuário:", error);
      const message =
        error instanceof Error ? error.message : "Erro interno do servidor.";
      return handleErrorResponse(res, 500, message);
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
}