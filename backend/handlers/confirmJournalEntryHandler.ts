import logger from '../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse, getUserOrganizationAndPeriod } from '../utils/supabaseClient.js'
import { z } from 'zod'
import { confirmProposedJournalEntries } from '../services/confirmJournalEntryService.js'

const confirmEntriesRequestSchema = z.object({
  proposedEntries: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido. Use YYYY-MM-DD.'),
      description: z.string().min(1, 'A descrição do lançamento não pode ser vazia.'),
      debits: z.array(
        z.object({
          account: z.string().min(1, 'O nome da conta de débito não pode ser vazio.'),
          value: z.number().positive('O valor do débito deve ser positivo.'),
        }),
      ),
      credits: z.array(
        z.object({
          account: z.string().min(1, 'O nome da conta de crédito não pode ser vazio.'),
          value: z.number().positive('O valor do crédito deve ser positivo.'),
        }),
      ),
    }),
  ),
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[ConfirmJournalEntryHandler] Recebida requisição para confirmar lançamentos.`)

  try {
    if (req.method === 'POST') {
      const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
      if (!userOrgAndPeriod) {
        return handleErrorResponse(
          res,
          403,
          'Organização ou período contábil não encontrado para o usuário.',
        )
      }
      const { organization_id, active_accounting_period_id } = userOrgAndPeriod

      const parsedBody = confirmEntriesRequestSchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.warn(
          `[ConfirmJournalEntryHandler] Erro de validação do corpo da requisição: ${parsedBody.error.errors
            .map((err) => err.message)
            .join(', ')}`,
        )
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }

      const { proposedEntries } = parsedBody.data

      const createdEntries = await confirmProposedJournalEntries(
        proposedEntries,
        organization_id,
        active_accounting_period_id,
        token,
      )

      logger.info(
        `[ConfirmJournalEntryHandler] ${createdEntries.length} lançamentos confirmados e criados.`,
      )
      return res.status(200).json({ message: 'Lançamentos criados com sucesso!', createdEntries })
    }

    logger.warn(`[ConfirmJournalEntryHandler] Método ${req.method} não permitido.`)
    res.setHeader('Allow', ['POST'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API de confirmação de lançamentos:')
    logger.error({ error }, 'Detalhes do erro:')
    return handleErrorResponse(
      res,
      500,
      error instanceof Error ? error.message : 'Erro interno do servidor ao confirmar lançamentos.',
    )
  }
}
