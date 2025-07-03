import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse } from "../../utils/supabaseClient.js";
import { generateReports } from "../../services/reportService.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
) {
  try {
    const { startDate, endDate } = req.query;

    const reports = await generateReports(
      user_id,
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
