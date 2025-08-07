import logger from '../../utils/logger.js'

// TODO: Para otimização de relatórios com grandes conjuntos de dados, considerar:
// 1. Implementar streaming na geração do relatório (se o PDFKit/ExcelJS suportarem).
// 2. Para exports muito grandes, implementar um mecanismo de fila de tarefas e workers em segundo plano
//    para evitar timeouts e estouro de memória no Vercel. O usuário seria notificado quando o relatório estivesse pronto.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse } from '../../utils/supabaseClient.js'
import { generateReports } from '../../services/reportService.js'
import { reportQuerySchema } from '../../utils/schemas.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  try {
    const parsedQuery = reportQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      return handleErrorResponse(
        res,
        400,
        parsedQuery.error.errors.map((err) => err.message).join(', '),
      )
    }
    const { startDate, endDate } = parsedQuery.data

    const reports = await generateReports(user_id, token, startDate as string, endDate as string)

    res.status(200).json(reports)
  } catch (error: unknown) {
    logger.error('Erro ao gerar relatórios:', { error })
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`)
  }
}
