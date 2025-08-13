import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getNextReferenceNumber } from '../../services/referenceService.js'
import { handleErrorResponse } from '../../utils/supabaseClient.js'
import logger from '../../utils/logger.js'

export default async function referenceGeneratorHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return handleErrorResponse(res, 405, 'Método não permitido.')
  }

  const { prefix, organization_id, accounting_period_id } = req.query

  if (!prefix || typeof prefix !== 'string') {
    return handleErrorResponse(res, 400, 'Prefixo da referência é obrigatório.')
  }
  if (!organization_id || typeof organization_id !== 'string') {
    return handleErrorResponse(res, 400, 'ID da organização é obrigatório.')
  }
  if (!accounting_period_id || typeof accounting_period_id !== 'string') {
    return handleErrorResponse(res, 400, 'ID do período contábil é obrigatório.')
  }

  try {
    const nextNumber = await getNextReferenceNumber(prefix, organization_id, accounting_period_id)
    res.status(200).json({ nextNumber })
  } catch (error) {
    logger.error({ error }, 'Erro ao gerar referência:')
    handleErrorResponse(res, 500, 'Falha ao gerar referência.')
  }
}
