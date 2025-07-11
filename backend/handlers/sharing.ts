import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import { formatSupabaseError } from "../utils/errorUtils.js";

// Helper function to get the requesting user's role in a specific organization
async function getUserRoleInOrganization(
  user_id: string,
  organization_id: string,
  token: string,
): Promise<string | null> {
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase
    .from("user_organization_roles")
    .select("role")
    .eq("user_id", user_id)
    .eq("organization_id", organization_id)
    .single();

  if (error) {
    logger.error(
      `[Sharing] Erro ao buscar papel do usuário ${user_id} na organização ${organization_id}: ${error.message}`,
    );
    return null;
  }
  return data?.role || null;
}

// Zod schemas for validation
const sharePeriodSchema = z.object({
  accounting_period_id: z.string().uuid("ID do período contábil inválido."),
  shared_with_user_id: z.string().uuid("ID do usuário para compartilhar inválido."),
  permission_level: z.enum(["read", "write"], { message: "Nível de permissão inválido." }),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[Sharing] Recebida requisição para user_id: ${user_id}`);
  const userSupabase = getSupabaseClient(token);

  try {
    if (req.method === "POST") {
      logger.info(`[Sharing] Tentando compartilhar período contábil.`);
      const parsedBody = sharePeriodSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(
          `[Sharing] Erro de validação do corpo da requisição POST: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { accounting_period_id, shared_with_user_id, permission_level } = parsedBody.data;

      // Get the organization_id of the accounting period
      const { data: periodData, error: periodError } = await userSupabase
        .from("accounting_periods")
        .select("organization_id, organizations(is_personal)") // Select is_personal from related organization
        .eq("id", accounting_period_id)
        .single();

      if (periodError || !periodData || !periodData.organizations) {
        logger.error(
          `[Sharing] Erro ao buscar organização para o período ${accounting_period_id}: ${periodError?.message || "Período ou organização não encontrada."}`,
        );
        return handleErrorResponse(res, 404, "Período contábil ou organização não encontrado.");
      }

      // Prevent sharing from personal organizations
      if (periodData.organizations[0].is_personal) {
        logger.warn(`[Sharing] Tentativa de compartilhar período de organização pessoal ${periodData.organization_id} por user ${user_id}.`);
        return handleErrorResponse(res, 403, "Não é possível compartilhar períodos de organizações pessoais.");
      }

      // Check if the requesting user has owner/admin role in the period's organization
      const requestingUserRole = await getUserRoleInOrganization(
        user_id,
        periodData.organization_id,
        token,
      );

      if (!requestingUserRole || !["owner", "admin"].includes(requestingUserRole)) {
        logger.warn(
          `[Sharing] Usuário ${user_id} não tem permissão para compartilhar períodos da organização ${periodData.organization_id}. Papel: ${requestingUserRole}`,
        );
        return handleErrorResponse(
          res,
          403,
          "Você não tem permissão para compartilhar este período.",
        );
      }

      const { data, error: dbError } = await userSupabase
        .from("shared_accounting_periods")
        .insert({
          accounting_period_id,
          shared_with_user_id,
          permission_level,
          shared_by_user_id: user_id, // Record who shared it
        })
        .select()
        .single();

      if (dbError) {
        logger.error(
          `[Sharing] Erro ao inserir compartilhamento para período ${accounting_period_id} com usuário ${shared_with_user_id}: ${dbError.message}`,
        );
        throw dbError;
      }
      logger.info(
        `[Sharing] Período ${accounting_period_id} compartilhado com sucesso com ${shared_with_user_id}.`,
      );
      return res.status(201).json(data);
    } else if (req.method === "GET") {
      const { accounting_period_id } = req.query;
      if (!accounting_period_id || typeof accounting_period_id !== "string") {
        return handleErrorResponse(res, 400, "ID do período contábil é obrigatório para buscar compartilhamentos.");
      }

      logger.info(`[Sharing] Buscando compartilhamentos para accounting_period_id: ${accounting_period_id}`);

      // Check if the requesting user has permission to view this period (via RLS)
      // The RLS policies on shared_accounting_periods will handle access control.
      const { data, error: dbError } = await userSupabase
        .from("shared_accounting_periods")
        .select("id, accounting_period_id, shared_with_user_id, permission_level, profiles(username)")
        .eq("accounting_period_id", accounting_period_id);

      if (dbError) {
        logger.error(`[Sharing] Erro ao buscar compartilhamentos para o período ${accounting_period_id}: ${dbError.message}`);
        throw dbError;
      }
      logger.info(`[Sharing] Compartilhamentos encontrados para o período ${accounting_period_id}: ${data.length}`);
      return res.status(200).json(data);
    } else if (req.method === "DELETE") {
      const { id } = req.query; // This is the shared_accounting_periods.id
      if (!id || typeof id !== "string") {
        return handleErrorResponse(res, 400, "ID do compartilhamento é obrigatório.");
      }

      logger.info(`[Sharing] Tentando remover compartilhamento ${id}.`);

      // Get the shared period data to check permissions
      const { data: sharedData, error: sharedError } = await userSupabase
        .from("shared_accounting_periods")
        .select("accounting_period_id")
        .eq("id", id)
        .single();

      if (sharedError || !sharedData) {
        logger.error(
          `[Sharing] Erro ao buscar dados de compartilhamento ${id}: ${sharedError?.message || "Compartilhamento não encontrado."}`,
        );
        return handleErrorResponse(res, 404, "Compartilhamento não encontrado.");
      }

      // Get the organization_id of the accounting period being unshared
      const { data: periodData, error: periodError } = await userSupabase
        .from("accounting_periods")
        .select("organization_id, organizations(is_personal)") // Select is_personal from related organization
        .eq("id", sharedData.accounting_period_id)
        .single();

      if (periodError || !periodData || !periodData.organizations) {
        logger.error(
          `[Sharing] Erro ao buscar organização para o período ${sharedData.accounting_period_id}: ${periodError?.message || "Período ou organização não encontrada."}`,
        );
        return handleErrorResponse(res, 404, "Período contábil associado ao compartilhamento ou organização não encontrado.");
      }

      // Prevent unsharing from personal organizations
      if (periodData.organizations[0].is_personal) {
        logger.warn(`[Sharing] Tentativa de remover compartilhamento de organização pessoal ${periodData.organization_id} por user ${user_id}.`);
        return handleErrorResponse(res, 403, "Não é possível remover compartilhamentos de períodos de organizações pessoais.");
      }

      // Check if the requesting user has owner/admin role in the period's organization
      const requestingUserRole = await getUserRoleInOrganization(
        user_id,
        periodData.organization_id,
        token,
      );

      if (!requestingUserRole || !["owner", "admin"].includes(requestingUserRole)) {
        logger.warn(
          `[Sharing] Usuário ${user_id} não tem permissão para remover compartilhamentos da organização ${periodData.organization_id}. Papel: ${requestingUserRole}`,
        );
        return handleErrorResponse(
          res,
          403,
          "Você não tem permissão para remover este compartilhamento.",
        );
      }

      const { error: dbError, count } = await userSupabase
        .from("shared_accounting_periods")
        .delete()
        .eq("id", id);

      if (dbError) {
        logger.error(
          `[Sharing] Erro ao deletar compartilhamento ${id}: ${dbError.message}`,
        );
        throw dbError;
      }
      if (count === 0) {
        logger.warn(
          `[Sharing] Compartilhamento ${id} não encontrado ou sem permissão para deletar.`,
        );
        return handleErrorResponse(
          res,
          404,
          "Compartilhamento não encontrado ou você não tem permissão para deletar.",
        );
      }
      logger.info(`[Sharing] Compartilhamento ${id} deletado com sucesso.`);
      return res.status(204).send("");
    }

    logger.warn(`[Sharing] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de compartilhamento:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}
