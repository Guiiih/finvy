import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import { formatSupabaseError } from "../utils/errorUtils.js";

// Esquemas de validação para períodos contábeis
const createAccountingPeriodSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do período é obrigatório.")
    .max(100, "Nome do período muito longo."),
  start_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de início inválido. Use YYYY-MM-DD.",
    ),
  end_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de data de fim inválido. Use YYYY-MM-DD.",
    ),
  is_active: z.boolean().optional().default(false),
});

const updateAccountingPeriodSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome do período é obrigatório.")
      .max(100, "Nome do período muito longo.")
      .optional(),
    start_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Formato de data de início inválido. Use YYYY-MM-DD.",
      )
      .optional(),
    end_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Formato de data de fim inválido. Use YYYY-MM-DD.",
      )
      .optional(),
    is_active: z.boolean().optional(),
  })
  .partial();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[Accounting Periods] Recebida requisição para user_id: ${user_id}`);
  const userSupabase = getSupabaseClient(token);

  try {
    if (req.method === "POST") {
      const parsedBody = createAccountingPeriodSchema.safeParse(req.body);
      if (!parsedBody.success) {
        logger.warn(`[Accounting Periods] Erro de validação do corpo da requisição: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`);
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      logger.info(`[Accounting Periods] Tentando obter organization_id para user_id: ${user_id}`);
      const { data: profile, error: profileError } = await userSupabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user_id)
        .single();

      if (profileError) {
        logger.error(`[Accounting Periods] Erro ao buscar perfil para user_id ${user_id}: ${profileError.message}`);
        return handleErrorResponse(
          res,
          403,
          "Não foi possível determinar a organização do usuário.",
        );
      }

      if (!profile || !profile.organization_id) {
        logger.warn(`[Accounting Periods] Perfil encontrado, mas organization_id ausente para user_id: ${user_id}. Perfil: ${JSON.stringify(profile)}`);
        return handleErrorResponse(
          res,
          403,
          "Não foi possível determinar a organização do usuário.",
        );
      }

      logger.info(`[Accounting Periods] organization_id encontrado para user_id ${user_id}: ${profile.organization_id}`);
      const { organization_id } = profile;
      const newPeriodData = { ...parsedBody.data, organization_id };

      if (newPeriodData.is_active) {
        logger.info(`[Accounting Periods] Desativando períodos contábeis ativos existentes para organization_id: ${organization_id}`);
        await userSupabase
          .from("accounting_periods")
          .update({ is_active: false })
          .eq("organization_id", organization_id)
          .eq("is_active", true);
      }

      logger.info(`[Accounting Periods] Inserindo novo período contábil para organization_id: ${organization_id}`);
      const { data, error: dbError } = await userSupabase
        .from("accounting_periods")
        .insert([newPeriodData])
        .select()
        .single();

      if (dbError) {
        logger.error(`[Accounting Periods] Erro ao inserir novo período contábil: ${dbError.message}`);
        throw dbError;
      }
      logger.info(`[Accounting Periods] Novo período contábil criado com sucesso: ${data.id}`);
      return res.status(201).json(data);
    } else {
      logger.info(`[Accounting Periods] Tentando obter organização e período para user_id: ${user_id} (GET/PUT/DELETE)`);
      const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token);
      if (!userOrgAndPeriod) {
        logger.warn(`[Accounting Periods] Organização ou período contábil não encontrado para user_id: ${user_id} (GET/PUT/DELETE)`);
        return handleErrorResponse(
          res,
          403,
          "Organização ou período contábil não encontrado para o usuário.",
        );
      }
      logger.info(`[Accounting Periods] Organização e período encontrados para user_id ${user_id}: Org ID ${userOrgAndPeriod.organization_id}, Period ID ${userOrgAndPeriod.active_accounting_period_id}`);
      const { organization_id } = userOrgAndPeriod;

      if (req.method === "GET") {
        logger.info(`[Accounting Periods] Buscando períodos contábeis para organization_id: ${organization_id}`);
        const { data, error: dbError } = await userSupabase
          .from("accounting_periods")
          .select("id, name, start_date, end_date, is_active")
          .eq("organization_id", organization_id)
          .order("start_date", { ascending: false });

        if (dbError) {
          logger.error(`[Accounting Periods] Erro ao buscar períodos contábeis: ${dbError.message}`);
          throw dbError;
        }
        logger.info(`[Accounting Periods] Períodos contábeis encontrados: ${data.length}`);
        return res.status(200).json(data);
      } else if (req.method === "PUT") {
        const id = req.url?.split("?")[0].split("/").pop() as string;
        logger.info(`[Accounting Periods] Atualizando período contábil ${id} para organization_id: ${organization_id}`);
        const parsedBody = updateAccountingPeriodSchema.safeParse(req.body);
        if (!parsedBody.success) {
          logger.warn(`[Accounting Periods] Erro de validação do corpo da requisição PUT: ${parsedBody.error.errors.map((err) => err.message).join(", ")}`);
          return handleErrorResponse(
            res,
            400,
            parsedBody.error.errors.map((err) => err.message).join(", "),
          );
        }
        const updateData = parsedBody.data;

        if (Object.keys(updateData).length === 0) {
          logger.warn(`[Accounting Periods] Nenhuma campo para atualizar fornecido para período ${id}`);
          return handleErrorResponse(
            res,
            400,
            "Nenhum campo para atualizar fornecido.",
          );
        }

        if (updateData.is_active) {
          logger.info(`[Accounting Periods] Desativando outros períodos ativos para organization_id: ${organization_id} antes de ativar ${id}`);
          await userSupabase
            .from("accounting_periods")
            .update({ is_active: false })
            .eq("organization_id", organization_id)
            .eq("is_active", true);
        }

        const { data, error: dbError } = await userSupabase
          .from("accounting_periods")
          .update(updateData)
          .eq("id", id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (dbError) {
          logger.error(`[Accounting Periods] Erro ao atualizar período contábil ${id}: ${dbError.message}`);
          throw dbError;
        }
        if (!data) {
          logger.warn(`[Accounting Periods] Período contábil ${id} não encontrado ou sem permissão para atualizar.`);
          return handleErrorResponse(
            res,
            404,
            "Período contábil não encontrado ou você não tem permissão para atualizar este período.",
          );
        }
        logger.info(`[Accounting Periods] Período contábil ${id} atualizado com sucesso.`);
        return res.status(200).json(data);
      } else if (req.method === "DELETE") {
        const id = req.url?.split("?")[0].split("/").pop() as string;
        logger.info(`[Accounting Periods] Deletando período contábil ${id} para organization_id: ${organization_id}`);

        const { error: dbError, count } = await userSupabase
          .from("accounting_periods")
          .delete()
          .eq("id", id)
          .eq("organization_id", organization_id);

        if (dbError) {
          logger.error(`[Accounting Periods] Erro ao deletar período contábil ${id}: ${dbError.message}`);
          throw dbError;
        }
        if (count === 0) {
          logger.warn(`[Accounting Periods] Período contábil ${id} não encontrado ou sem permissão para deletar.`);
          return handleErrorResponse(
            res,
            404,
            "Período contábil não encontrado ou você não tem permissão para deletar este período.",
          );
        }
        logger.info(`[Accounting Periods] Período contábil ${id} deletado com sucesso.`);
        return res.status(204).send("");
      }
    }

    logger.warn(`[Accounting Periods] Método ${req.method} não permitido.`);
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de períodos contábeis:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}
