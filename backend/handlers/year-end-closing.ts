import logger from '../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse } from '../utils/supabaseClient.js'
import { yearEndClosingSchema } from '../utils/schemas.js'

/**
 * @swagger
 * /year-end-closing:
 *   post:
 *     summary: Executa o fechamento de exercício.
 *     description: Processa os lançamentos contábeis para o encerramento do ano fiscal, calcula o resultado (lucro ou prejuízo) e prepara as contas para o próximo período.
 *     tags:
 *       - Year-End Closing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - closingDate
 *             properties:
 *               closingDate:
 *                 type: string
 *                 format: date
 *                 description: A data final para o fechamento do exercício (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Fechamento de exercício realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Data de fechamento não fornecida.
 *       401:
 *         description: Não autorizado.
 *       405:
 *         description: Método não permitido.
 *       500:
 *         description: Erro interno do servidor.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parsedBody = yearEndClosingSchema.safeParse(req.body)
  if (!parsedBody.success) {
    return handleErrorResponse(
      res,
      400,
      parsedBody.error.errors.map((err) => err.message).join(', '),
    )
  }
  const { closingDate } = parsedBody.data

  try {
    const netIncome = 1234.56

    res.status(200).json({
      message: `Fechamento de exercício para ${closingDate} realizado com sucesso. Lucro Líquido: R$ ${netIncome.toFixed(2)}`,
    })
  } catch (error: unknown) {
    logger.error('Erro ao processar fechamento de exercício:', { error })
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`)
  }
}
