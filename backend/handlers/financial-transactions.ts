import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../utils/supabaseClient.js";
import { createFinancialTransactionSchema } from "../utils/schemas.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);
  try {
    const { type } = req.query;
    const tableName =
      type === "payable" ? "accounts_payable" : "accounts_receivable";

    if (req.method === "GET") {
      const { data, error: dbError } = await serviceRoleSupabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const parsedBody = createFinancialTransactionSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(", "),
        );
      }
      const newTransaction = { ...parsedBody.data, user_id };

      const { data: newFinancialTransaction, error: dbError } =
        await userSupabase
          .from(tableName)
          .insert([newTransaction])
          .select()
          .single();

      if (dbError) throw dbError;

      return res.status(201).json(newFinancialTransaction);
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    console.error("Erro inesperado na API de transações financeiras:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return handleErrorResponse(res, 500, message);
  }
}