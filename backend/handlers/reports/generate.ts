import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseClient, handleErrorResponse, supabase as serviceRoleSupabase } from "../../utils/supabaseClient.js";
import { generateReports } from "../../services/reportService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token);
  try {
    const { startDate, endDate } = req.query;

    const reports = await generateReports(
      user_id,
      token,
      startDate as string,
      endDate as string,
    );

    res.status(200).json(reports);
  } catch (error: unknown) {
    console.error("Erro ao gerar relatórios:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`);
  }
}
