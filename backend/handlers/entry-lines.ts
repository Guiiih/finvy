import type { VercelRequest, VercelResponse } from "@vercel/node";
const { getSupabaseClient, handleErrorResponse, supabase: serviceRoleSupabase } = require("../utils/supabaseClient.js");
import { createEntryLineSchema } from "../utils/schemas.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);
  try {
    if (req.method === "GET") {
      const { journal_entry_id } = req.query;

      if (journal_entry_id) {
        // Rota para buscar linhas de um lançamento específico
        const { data, error: dbError } = await serviceRoleSupabase
          .from("entry_lines")
          .select("*, product_id, quantity, unit_cost")
          .eq("journal_entry_id", journal_entry_id as string);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      } else {
        // Rota antiga para buscar todas as linhas do utilizador (pode ser mantida ou removida)
        const { data, error: dbError } = await serviceRoleSupabase
          .from("entry_lines")
          .select("*, journal_entry_id(user_id)")
          .eq("journal_entry_id.user_id", user_id);

        if (dbError) throw dbError;
        return res.status(200).json(data);
      }
    }

    if (req.method === "POST") {
      const parsedBody = createEntryLineSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const {
        journal_entry_id,
        account_id,
        debit,
        credit,
        product_id,
        quantity,
        unit_cost,
        total_gross,
        icms_value,
        total_net,
      } = parsedBody.data;

      // Verifica se o utilizador tem permissão para o lançamento principal
      const { data: journalEntry } = await userSupabase
        .from("journal_entries")
        .select("id")
        .eq("id", journal_entry_id)
        .eq("user_id", user_id)
        .single();

      if (!journalEntry) {
        return handleErrorResponse(
          res,
          403,
          "Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.",
        );
      }

      const { data: newLine, error: insertError } = await userSupabase
        .from("entry_lines")
        .insert([
          {
            journal_entry_id,
            account_id,
            debit,
            credit,
            product_id,
            quantity,
            unit_cost,
            total_gross,
            icms_value,
            total_net,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Lógica para atualizar o stock
      if (newLine.product_id && newLine.quantity) {
        const { data: product } = await userSupabase
          .from("products")
          .select("current_stock")
          .eq("id", newLine.product_id)
          .eq("user_id", user_id)
          .single();

        if (product) {
          let newStock = product.current_stock || 0;
          const isPurchase = newLine.debit && newLine.debit > 0;
          newStock = isPurchase
            ? newStock + newLine.quantity
            : newStock - newLine.quantity;

          await userSupabase
            .from("products")
            .update({ current_stock: newStock })
            .eq("id", newLine.product_id);
        }
      }

      return res.status(201).json(newLine);
    }

    // A lógica para PUT e DELETE seguiria um padrão semelhante,
    // sempre verificando a permissão do utilizador no `journal_entry` associado.

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    console.error("Erro inesperado na API de linhas de lançamento:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}
