import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import { formatSupabaseError } from "../utils/errorUtils.js";
import { getUserRoleInOrganization } from "./user-organization-roles.js"; // Import the helper


// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PostgrestResponse } from "@supabase/supabase-js"; // Import PostgrestResponse

interface AccessibleOrganization {
  id: string;
  name: string;
  created_at: string;
  is_personal: boolean;
  is_shared: boolean;
  shared_from_user_name: string | null;
}

// Validation schema for creating an organization
const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Nome da organização é obrigatório.")
    .max(100, "Nome da organização muito longo."),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[Organizations] Recebida requisição para user_id: ${user_id}`);
  const userSupabase = getSupabaseClient(token);

  try {
    if (req.method === "POST") {
      const parsedBody = createOrganizationSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(`[Organizations] Erro de validação do corpo da requisição: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`);
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { name: organizationName } = parsedBody.data;

      logger.info(`[Organizations] Chamando fun├º├úo create_organization_and_assign_owner para user_id: ${user_id}`);
      const { data: result, error: rpcError } = await userSupabase.rpc('create_organization_and_assign_owner', {
        p_organization_name: organizationName,
        p_user_id: user_id,
      });

      if (rpcError) {
        logger.error(`[Organizations] Erro ao chamar RPC create_organization_and_assign_owner: ${rpcError.message}`);
        throw rpcError;
      }

      // The RPC returns a table, so we need to extract the single row
      const newOrgData = result[0];

      logger.info(`[Organizations] Organiza├º├úo e per├¡odo padr├úo criados com sucesso via RPC.`);

      return res.status(201).json({
        organization: {
          id: newOrgData.organization_id,
          name: newOrgData.organization_name,
          is_personal: false, // Always false for newly created non-personal orgs
        },
        accounting_period: {
          id: newOrgData.accounting_period_id,
          name: newOrgData.accounting_period_name,
          // Other period fields are not returned by RPC, but can be fetched if needed
        },
        message: "Organiza├º├úo e per├¡odo padr├úo criados com sucesso.",
      });
    } else if (req.method === "GET") {
      logger.info(`[Organizations] Buscando organizações acessíveis para user_id: ${user_id}`);
      const { data, error: rpcError } = await userSupabase.rpc<'get_user_accessible_organizations', AccessibleOrganization[]>('get_user_accessible_organizations', { p_user_id: user_id });

      if (rpcError) {
        logger.error(`[Organizations] Erro ao buscar organizações acessíveis: ${rpcError.message}`);
        logger.error(`[Organizations] Detalhes do erro RPC:`, rpcError);
        throw rpcError;
      }
      logger.info(`[Organizations] Dados brutos da RPC:`, data);
      logger.info(`[Organizations] Organizações encontradas: ${(data as AccessibleOrganization[]).length}`);
      return res.status(200).json(data);
    } else if (req.method === "DELETE") {
      const { id } = req.query; // This is the organization_id
      if (!id || typeof id !== "string") {
        return handleErrorResponse(res, 400, "ID da organização é obrigatório.");
      }

      logger.info(`[Organizations] Tentando deletar organização ${id}.`);

      // Fetch organization details to check is_personal and ownership
      const { data: orgToDelete, error: fetchOrgError } = await userSupabase
        .from("organizations")
        .select("id, name, is_personal")
        .eq("id", id)
        .single();

      if (fetchOrgError || !orgToDelete) {
        logger.error(`[Organizations] Erro ao buscar organização ${id}: ${fetchOrgError?.message || "Organização não encontrada."}`);
        return handleErrorResponse(res, 404, "Organização não encontrada.");
      }

      // Prevent deletion of personal organizations
      if (orgToDelete.is_personal) {
        logger.warn(`[Organizations] Tentativa de deletar organização pessoal ${id} por user ${user_id}.`);
        return handleErrorResponse(res, 403, "Não é possível deletar sua organização pessoal.");
      }

      // Check if the requesting user has owner/admin role in this organization
      const requestingUserRole = await getUserRoleInOrganization(
        user_id,
        id,
        token,
      );

      if (!requestingUserRole || !["owner", "admin"].includes(requestingUserRole)) {
        logger.warn(
          `[Organizations] Usuário ${user_id} não tem permissão para deletar a organização ${id}. Papel: ${requestingUserRole}`,
        );
        return handleErrorResponse(
          res,
          403,
          "Você não tem permissão para deletar esta organização.",
        );
      }

      // Perform deletion
      const { error: deleteError, count } = await userSupabase
        .from("organizations")
        .delete()
        .eq("id", id);

      if (deleteError) {
        logger.error(`[Organizations] Erro ao deletar organização ${id}: ${deleteError.message}`);
        throw deleteError;
      }
      if (count === 0) {
        logger.warn(`[Organizations] Organização ${id} não encontrada ou sem permissão para deletar.`);
        return handleErrorResponse(
          res,
          404,
          "Organização não encontrada ou você não tem permissão para deletar.",
        );
      }

      logger.info(`[Organizations] Organização ${id} deletada com sucesso.`);
      return res.status(204).send("");
    }

    logger.warn(`[Organizations] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["POST", "GET", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de organizações:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}
