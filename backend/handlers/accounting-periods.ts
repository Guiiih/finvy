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
  const userSupabase = getSupabaseClient(token);

  try {
    if (req.method === "POST") {
      const parsedBody = createAccountingPeriodSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }

      // Try to get organization_id from profiles table directly
      const { data: profile, error: profileError } = await userSupabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user_id)
        .single();

      if (profileError || !profile || !profile.organization_id) {
        logger.error(
          "Não foi possível determinar a organização do usuário ao criar um novo período contábil:",
          profileError,
        );
        return handleErrorResponse(
          res,
          403,
          "Não foi possível determinar a organização do usuário.",
        );
      }

      const { organization_id } = profile;
      const newPeriodData = { ...parsedBody.data, organization_id };

      if (newPeriodData.is_active) {
        await userSupabase
          .from("accounting_periods")
          .update({ is_active: false })
          .eq("organization_id", organization_id)
          .eq("is_active", true);
      }

      const { data, error: dbError } = await userSupabase
        .from("accounting_periods")
        .insert([newPeriodData])
        .select()
        .single();

      if (dbError) throw dbError;
      return res.status(201).json(data);
    } else {
      // For GET, PUT, DELETE, we still need the organization and active period
      const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token);
      if (!userOrgAndPeriod) {
        return handleErrorResponse(
          res,
          403,
          "Organização ou período contábil não encontrado para o usuário.",
        );
      }
      const { organization_id } = userOrgAndPeriod;

      if (req.method === "GET") {
        const { data, error: dbError } = await userSupabase
          .from("accounting_periods")
          .select("id, name, start_date, end_date, is_active")
          .eq("organization_id", organization_id)
          .order("start_date", { ascending: false });

        if (dbError) throw dbError;
        return res.status(200).json(data);
      } else if (req.method === "PUT") {
        const id = req.url?.split("?")[0].split("/").pop() as string;
        const parsedBody = updateAccountingPeriodSchema.safeParse(req.body);
        if (!parsedBody.success) {
          return handleErrorResponse(
            res,
            400,
            parsedBody.error.errors.map((err) => err.message).join(", "),
          );
        }
        const updateData = parsedBody.data;

        if (Object.keys(updateData).length === 0) {
          return handleErrorResponse(
            res,
            400,
            "Nenhum campo para atualizar fornecido.",
          );
        }

        if (updateData.is_active) {
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

        if (dbError) throw dbError;
        if (!data) {
          return handleErrorResponse(
            res,
            404,
            "Período contábil não encontrado ou você não tem permissão para atualizar este período.",
          );
        }
        return res.status(200).json(data);
      } else if (req.method === "DELETE") {
        const id = req.url?.split("?")[0].split("/").pop() as string;

        const { error: dbError, count } = await userSupabase
          .from("accounting_periods")
          .delete()
          .eq("id", id)
          .eq("organization_id", organization_id);

        if (dbError) throw dbError;
        if (count === 0) {
          return handleErrorResponse(
            res,
            404,
            "Período contábil não encontrado ou você não tem permissão para deletar este período.",
          );
        }
        return res.status(204).send("");
      }
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    logger.error("Erro inesperado na API de períodos contábeis:", error);
    const message = formatSupabaseError(error);
    return handleErrorResponse(res, 500, message);
  }
}
