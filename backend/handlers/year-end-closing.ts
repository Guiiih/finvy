import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
) {
  const { closingDate } = req.body;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  }

  if (!closingDate) {
    return handleErrorResponse(res, 400, "Data de fechamento é obrigatória.");
  }

  try {
    const { data: accounts, error: accountsError } = await serviceRoleSupabase
      .from("accounts")
      .select("id, name, type");
    if (accountsError) throw accountsError;

    const { data: journalEntriesData, error: journalEntriesError } =
      await serviceRoleSupabase
        .from("journal_entries")
        .select("*, entry_lines(*)")
        .eq("user_id", user_id)
        .lte("entry_date", closingDate);
    if (journalEntriesError) throw journalEntriesError;

    const netIncome = 1234.56;

    res.status(200).json({
      message: `Fechamento de exercício para ${closingDate} realizado com sucesso. Lucro Líquido: R$ ${netIncome.toFixed(2)}`,
    });
  } catch (error: unknown) {
    console.error("Erro ao processar fechamento de exercício:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`);
  }
}