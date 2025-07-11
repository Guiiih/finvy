import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import { formatSupabaseError } from "../utils/errorUtils.js";

// Helper function to get the requesting user's role in a specific organization
export async function getUserRoleInOrganization(
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
      `[UserOrgRoles] Erro ao buscar papel do usuário ${user_id} na organização ${organization_id}: ${error.message}`,
    );
    return null;
  }
  return data?.role || null;
}

// Zod schemas for validation
const validRoles = z.enum([
  "owner",
  "admin",
  "member_read_write",
  "member_read_only",
]);

const addMemberSchema = z.object({
  user_id: z.string().uuid("ID do usuário inválido."),
  organization_id: z.string().uuid("ID da organização inválido."),
  role: validRoles,
});

const updateMemberRoleSchema = z.object({
  role: validRoles,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[UserOrgRoles] Recebida requisição para user_id: ${user_id}`);
  const userSupabase = getSupabaseClient(token);

  try {
    const { organization_id } = req.query;

    if (!organization_id || typeof organization_id !== "string") {
      logger.warn("[UserOrgRoles] organization_id ausente ou inválido na query.");
      return handleErrorResponse(res, 400, "ID da organização é obrigatório.");
    }

    // Fetch organization details to check if it's a personal organization
    const { data: orgDetails, error: orgDetailsError } = await userSupabase
      .from("organizations")
      .select("is_personal")
      .eq("id", organization_id)
      .single();

    if (orgDetailsError || !orgDetails) {
      logger.error(`[UserOrgRoles] Erro ao buscar detalhes da organização ${organization_id}: ${orgDetailsError?.message || "Organização não encontrada."}`);
      return handleErrorResponse(res, 404, "Organização não encontrada.");
    }

    if (orgDetails.is_personal && req.method !== "GET") {
      logger.warn(`[UserOrgRoles] Tentativa de modificar organização pessoal ${organization_id} por user ${user_id}.`);
      return handleErrorResponse(res, 403, "Não é possível gerenciar membros de uma organização pessoal.");
    }

    // Check if the requesting user has permission to manage roles in this organization
    const requestingUserRole = await getUserRoleInOrganization(
      user_id,
      organization_id,
      token,
    );

    if (!requestingUserRole || !["owner", "admin"].includes(requestingUserRole)) {
      logger.warn(
        `[UserOrgRoles] Usuário ${user_id} não tem permissão para gerenciar papéis na organização ${organization_id}. Papel: ${requestingUserRole}`,
      );
      return handleErrorResponse(
        res,
        403,
        "Você não tem permissão para gerenciar papéis nesta organização.",
      );
    }

    if (req.method === "GET") {
      logger.info(
        `[UserOrgRoles] Buscando membros para organization_id: ${organization_id}`,
      );
      const { data, error: dbError } = await userSupabase
        .from("user_organization_roles")
        .select("id, user_id, role, profiles(username)") // Fetch user details
        .eq("organization_id", organization_id);

      if (dbError) {
        logger.error(
          `[UserOrgRoles] Erro ao buscar membros da organização ${organization_id}: ${dbError.message}`,
        );
        throw dbError;
      }
      logger.info(
        `[UserOrgRoles] Membros encontrados para organização ${organization_id}: ${data.length}`,
      );
      return res.status(200).json(data);
    } else if (req.method === "POST") {
      logger.info(
        `[UserOrgRoles] Adicionando novo membro à organization_id: ${organization_id}`,
      );
      const parsedBody = addMemberSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(
          `[UserOrgRoles] Erro de validação do corpo da requisição POST: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      const { user_id: new_member_user_id, role: new_member_role } = parsedBody.data;

      // Ensure the new member is not trying to assign themselves a higher role than the requesting user
      if (requestingUserRole === 'admin' && new_member_role === 'owner') {
        return handleErrorResponse(res, 403, "Admins não podem atribuir o papel de 'owner'.");
      }

      const { data, error: dbError } = await userSupabase
        .from("user_organization_roles")
        .insert({
          user_id: new_member_user_id,
          organization_id: organization_id,
          role: new_member_role,
        })
        .select()
        .single();

      if (dbError) {
        logger.error(
          `[UserOrgRoles] Erro ao adicionar membro ${new_member_user_id} à organização ${organization_id}: ${dbError.message}`,
        );
        throw dbError;
      }
      logger.info(
        `[UserOrgRoles] Membro ${new_member_user_id} adicionado com sucesso à organização ${organization_id}.`,
      );
      return res.status(201).json(data);
    } else if (req.method === "PUT") {
      const { member_id } = req.query; // This is the user_organization_roles.id
      if (!member_id || typeof member_id !== "string") {
        return handleErrorResponse(res, 400, "ID do membro é obrigatório.");
      }

      logger.info(
        `[UserOrgRoles] Atualizando papel do membro ${member_id} na organization_id: ${organization_id}`,
      );
      const parsedBody = updateMemberRoleSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(
          `[UserOrgRoles] Erro de validação do corpo da requisição PUT: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`,
        );
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const { role: updated_role } = parsedBody.data;

      // Prevent an admin from demoting an owner or assigning themselves owner
      const { data: targetMember, error: targetError } = await userSupabase
        .from('user_organization_roles')
        .select('user_id, role')
        .eq('id', member_id)
        .eq('organization_id', organization_id)
        .single();

      if (targetError || !targetMember) {
        return handleErrorResponse(res, 404, "Membro não encontrado ou não pertence a esta organização.");
      }

      if (targetMember.role === 'owner' && requestingUserRole === 'admin') {
        return handleErrorResponse(res, 403, "Admins não podem alterar o papel de um 'owner'.");
      }

      if (targetMember.user_id === user_id && updated_role === 'owner' && requestingUserRole === 'admin') {
        return handleErrorResponse(res, 403, "Admins não podem atribuir o papel de 'owner' a si mesmos.");
      }

      const { data, error: dbError } = await userSupabase
        .from("user_organization_roles")
        .update({ role: updated_role })
        .eq("id", member_id)
        .eq("organization_id", organization_id) // Ensure update is within the correct organization
        .select()
        .single();

      if (dbError) {
        logger.error(
          `[UserOrgRoles] Erro ao atualizar papel do membro ${member_id} na organização ${organization_id}: ${dbError.message}`,
        );
        throw dbError;
      }
      if (!data) {
        logger.warn(
          `[UserOrgRoles] Membro ${member_id} não encontrado ou sem permissão para atualizar.`,
        );
        return handleErrorResponse(
          res,
          404,
          "Membro não encontrado ou você não tem permissão para atualizar este papel.",
        );
      }
      logger.info(
        `[UserOrgRoles] Papel do membro ${member_id} atualizado com sucesso para ${updated_role}.`,
      );
      return res.status(200).json(data);
    } else if (req.method === "DELETE") {
      const { member_id } = req.query; // This is the user_organization_roles.id
      if (!member_id || typeof member_id !== "string") {
        return handleErrorResponse(res, 400, "ID do membro é obrigatório.");
      }

      logger.info(
        `[UserOrgRoles] Deletando membro ${member_id} da organization_id: ${organization_id}`,
      );

      // Prevent an owner/admin from deleting themselves if they are the last owner/admin
      const { data: targetMember, error: targetError } = await userSupabase
        .from('user_organization_roles')
        .select('user_id, role')
        .eq('id', member_id)
        .eq('organization_id', organization_id)
        .single();

      if (targetError || !targetMember) {
        return handleErrorResponse(res, 404, "Membro não encontrado ou não pertence a esta organização.");
      }

      if (targetMember.user_id === user_id) {
        // Check if this is the last owner/admin
        const { count: ownerAdminCount, error: countError } = await userSupabase
          .from('user_organization_roles')
          .select('id', { count: 'exact' })
          .eq('organization_id', organization_id)
          .in('role', ['owner', 'admin']);
        
        if (countError) throw countError;

        if (ownerAdminCount === 1 && (targetMember.role === 'owner' || targetMember.role === 'admin')) {
          return handleErrorResponse(res, 403, "Você não pode se remover se for o último 'owner' ou 'admin' da organização.");
        }
      }

      const { error: dbError, count } = await userSupabase
        .from("user_organization_roles")
        .delete()
        .eq("id", member_id)
        .eq("organization_id", organization_id); // Ensure delete is within the correct organization

      if (dbError) {
        logger.error(
          `[UserOrgRoles] Erro ao deletar membro ${member_id} da organização ${organization_id}: ${dbError.message}`,
        );
        throw dbError;
      }
      if (count === 0) {
        logger.warn(
          `[UserOrgRoles] Membro ${member_id} não encontrado ou sem permissão para deletar.`,
        );
        return handleErrorResponse(
          res,
          404,
          "Membro não encontrado ou você não tem permissão para deletar este membro.",
        );
      }
      logger.info(
        `[UserOrgRoles] Membro ${member_id} deletado com sucesso da organização ${organization_id}.`,
      );
      return res.status(204).send("");
    }

    logger.warn(`[UserOrgRoles] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de papéis de organização:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}
