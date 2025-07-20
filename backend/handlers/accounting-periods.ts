import logger from "../utils/logger.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from "../utils/supabaseClient.js";
import { z } from "zod";
import { formatSupabaseError } from "../utils/errorUtils.js";
import { TaxRegime } from "../types/index.js";

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
  regime: z.nativeEnum(TaxRegime, { invalid_type_error: "Regime tributário inválido." }),
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
    regime: z.nativeEnum(TaxRegime, { invalid_type_error: "Regime tributário inválido." }).optional(),
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
      const { name, start_date, end_date, regime } = parsedBody.data;

      // Validação de sobreposição de datas para tax_regime_history
      const { data: existingRegimes, error: fetchError } = await userSupabase
        .from("tax_regime_history")
        .select("start_date, end_date")
        .eq("organization_id", organization_id)
        .order("start_date", { ascending: true });

      if (fetchError) {
        logger.error(`[Accounting Periods] Erro ao buscar regimes existentes para validação: ${fetchError.message}`);
        throw fetchError;
      }

      const newStartDate = new Date(start_date);
      const newEndDate = new Date(end_date);

      if (newStartDate > newEndDate) {
        return handleErrorResponse(res, 400, "A data de início não pode ser posterior à data de fim.");
      }

      for (const existing of existingRegimes) {
        const existingStartDate = new Date(existing.start_date);
        const existingEndDate = new Date(existing.end_date);

        // Check for overlap
        if (
          (newStartDate <= existingEndDate && newEndDate >= existingStartDate)
        ) {
          return handleErrorResponse(
            res,
            400,
            "O período do regime tributário especificado se sobrepõe a um regime tributário existente.",
          );
        }
      }

      logger.info(`[Accounting Periods] Inserindo novo período contábil para organization_id: ${organization_id}`);
      const { data: accountingPeriod, error: dbError } = await userSupabase
        .from("accounting_periods")
        .insert([{ name, start_date, end_date, organization_id }])
        .select()
        .single();

      if (dbError) {
        logger.error(`[Accounting Periods] Erro ao inserir novo período contábil: ${dbError.message}`);
        throw dbError;
      }

      logger.info(`[Accounting Periods] Novo período contábil criado com sucesso: ${accountingPeriod.id}`);

      // Inserir no tax_regime_history
      logger.info(`[Accounting Periods] Inserindo novo regime tributário para organization_id: ${organization_id}`);
      const { data: taxRegimeHistory, error: taxDbError } = await userSupabase
        .from("tax_regime_history")
        .insert([{ organization_id, regime, start_date, end_date }])
        .select()
        .single();

      if (taxDbError) {
        logger.error(`[Accounting Periods] Erro ao inserir novo regime tributário: ${taxDbError.message}`);
        // Consider rolling back accounting period creation if tax regime history fails
        throw taxDbError;
      }
      logger.info(`[Accounting Periods] Novo regime tributário criado com sucesso: ${taxRegimeHistory.id}`);

      return res.status(201).json({
        accountingPeriod,
        taxRegimeHistory,
      });
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
          .select("id, name, start_date, end_date")
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

        // Remove 'regime' from updateData as it's handled separately in tax_regime_history
        const { regime: _, ...accountingPeriodUpdateData } = updateData;

        if (Object.keys(accountingPeriodUpdateData).length === 0 && !newRegime) {
          logger.warn(`[Accounting Periods] Nenhuma campo para atualizar fornecido para período ${id}`);
          return handleErrorResponse(
            res,
            400,
            "Nenhum campo para atualizar fornecido.",
          );
        }

        // Fetch current accounting period to get original dates if not updated
        const { data: currentPeriod, error: fetchCurrentPeriodError } = await userSupabase
          .from("accounting_periods")
          .select("start_date, end_date")
          .eq("id", id)
          .single();

        if (fetchCurrentPeriodError || !currentPeriod) {
          logger.error(`[Accounting Periods] Erro ao buscar período contábil atual ${id}: ${fetchCurrentPeriodError?.message || "Período contábil não encontrado."}`);
          return handleErrorResponse(res, 404, "Período contábil não encontrado.");
        }

        const newStartDate = updateData.start_date || currentPeriod.start_date;
        const newEndDate = updateData.end_date || currentPeriod.end_date;
        const newRegime = updateData.regime;

        // Validação de sobreposição de datas para tax_regime_history no PUT
        if (newRegime || updateData.start_date || updateData.end_date) {
          const { data: existingRegimes, error: fetchError } = await userSupabase
            .from("tax_regime_history")
            .select("id, start_date, end_date")
            .eq("organization_id", organization_id)
            .neq("id", id); // Excluir o regime atual da verificação de sobreposição

          if (fetchError) {
            logger.error(`[Accounting Periods] Erro ao buscar regimes existentes para PUT: ${fetchError.message}`);
            throw fetchError;
          }

          const updatedStartDate = new Date(newStartDate);
          const updatedEndDate = new Date(newEndDate);

          if (updatedStartDate > updatedEndDate) {
            return handleErrorResponse(res, 400, "A data de início não pode ser posterior à data de fim.");
          }

          for (const existing of existingRegimes) {
            const existingStartDate = new Date(existing.start_date);
            const existingEndDate = new Date(existing.end_date);

            if (
              (updatedStartDate <= existingEndDate && updatedEndDate >= existingStartDate)
            ) {
              return handleErrorResponse(
                res,
                400,
                "O período do regime tributário atualizado se sobrepõe a um regime tributário existente.",
              );
            }
          }

          // Atualizar ou inserir no tax_regime_history
          const { data: existingTaxRegime, error: fetchTaxRegimeError } = await userSupabase
            .from("tax_regime_history")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("start_date", currentPeriod.start_date) // Assuming start_date is unique for a period
            .eq("end_date", currentPeriod.end_date)
            .single();

          if (existingTaxRegime) {
            // Update existing tax regime history entry
            const { error: updateTaxError } = await userSupabase
              .from("tax_regime_history")
              .update({
                regime: newRegime || undefined,
                start_date: newStartDate,
                end_date: newEndDate,
              })
              .eq("id", existingTaxRegime.id);

            if (updateTaxError) {
              logger.error(`[Accounting Periods] Erro ao atualizar regime tributário existente: ${updateTaxError.message}`);
              throw updateTaxError;
            }
          } else if (newRegime) {
            // Insert new tax regime history entry if it doesn't exist and a regime is provided
            const { error: insertTaxError } = await userSupabase
              .from("tax_regime_history")
              .insert({
                organization_id,
                regime: newRegime,
                start_date: newStartDate,
                end_date: newEndDate,
              });

            if (insertTaxError) {
              logger.error(`[Accounting Periods] Erro ao inserir novo regime tributário: ${insertTaxError.message}`);
              throw insertTaxError;
            }
          }
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

        // Fetch the accounting period to get its start_date and end_date
        const { data: accountingPeriodToDelete, error: fetchPeriodError } = await userSupabase
          .from("accounting_periods")
          .select("start_date, end_date")
          .eq("id", id)
          .single();

        if (fetchPeriodError || !accountingPeriodToDelete) {
          logger.error(`[Accounting Periods] Erro ao buscar período contábil ${id} para exclusão: ${fetchPeriodError?.message || "Período contábil não encontrado."}`);
          return handleErrorResponse(res, 404, "Período contábil não encontrado ou você não tem permissão para deletar este período.");
        }

        // Delete corresponding tax_regime_history entry
        const { error: deleteTaxRegimeError, count: taxRegimeCount } = await userSupabase
          .from("tax_regime_history")
          .delete()
          .eq("organization_id", organization_id)
          .eq("start_date", accountingPeriodToDelete.start_date)
          .eq("end_date", accountingPeriodToDelete.end_date);

        if (deleteTaxRegimeError) {
          logger.error(`[Accounting Periods] Erro ao deletar regime tributário associado ao período ${id}: ${deleteTaxRegimeError.message}`);
          throw deleteTaxRegimeError;
        }
        if (taxRegimeCount === 0) {
          logger.warn(`[Accounting Periods] Nenhum regime tributário associado encontrado para o período ${id}.`);
        }

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
