import logger from '../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse, getUserOrganizationAndPeriod } from '../utils/supabaseClient.js'
import { createJournalEntrySchema, updateJournalEntrySchema } from '../utils/schemas.js'
import { formatSupabaseError } from '../utils/errorUtils.js'
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../services/journalEntryService.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`Journal Entries Handler: Recebendo requisição ${req.method} para ${req.url}`)

  const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
  if (!userOrgAndPeriod) {
    return handleErrorResponse(
      res,
      403,
      'Organização ou período contábil não encontrado para o usuário.',
    )
  }
  const { organization_id, active_accounting_period_id } = userOrgAndPeriod

  try {
    if (req.method === 'GET') {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const { data, count } = await getJournalEntries(
        organization_id,
        active_accounting_period_id,
        token,
        page,
        limit,
      )
      return res.status(200).json({ data, count })
    }

    /**
     * @swagger
     * /journal-entries:
     *   post:
     *     summary: Cria um novo lançamento de diário.
     *     description: Cria um novo lançamento de diário para o usuário autenticado.
     *     tags:
     *       - Journal Entries
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - entry_date
     *               - description
     *             properties:
     *               entry_date:
     *                 type: string
     *                 format: date
     *                 description: A data do lançamento.
     *               description:
     *                 type: string
     *                 description: A descrição do lançamento.
     *     responses:
     *       201:
     *         description: Lançamento de diário criado com sucesso.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID único do lançamento de diário criado.
     *                 entry_date:
     *                   type: string
     *                   format: date
     *                   description: A data do lançamento criado.
     *                 description:
     *                   type: string
     *                   description: A descrição do lançamento criado.
     *                 user_id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID do usuário ao qual o lançamento pertence.
     *       400:
     *         description: Requisição inválida. Dados fornecidos são inválidos.
     *       401:
     *         description: Não autorizado. Token de autenticação ausente ou inválido.
     *       500:
     *         description: Erro interno do servidor.
     */
    if (req.method === 'POST') {
      logger.info('Journal Entries Handler: Processando POST para criar lançamento.')
      const parsedBody = createJournalEntrySchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.error('Journal Entries Handler: Erro de validação no POST:', parsedBody.error.errors)
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }
      const { entry_date, description, reference, status } = parsedBody.data

      const newEntry = { entry_date, description, reference, status }
      const createdEntry = await createJournalEntry(
        newEntry,
        organization_id,
        active_accounting_period_id,
        token,
      )
      logger.info('Journal Entries Handler: Lançamento criado com sucesso.')
      return res.status(201).json(createdEntry)
    }

    /**
     * @swagger
     * /journal-entries/{id}:
     *   put:
     *     summary: Atualiza um lançamento de diário existente.
     *     description: Atualiza os detalhes de um lançamento de diário específico pelo seu ID.
     *     tags:
     *       - Journal Entries
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: O ID do lançamento de diário a ser atualizado.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               entry_date:
     *                 type: string
     *                 format: date
     *                 description: A nova data do lançamento.
     *               description:
     *                 type: string
     *                 description: A nova descrição do lançamento.
     *     responses:
     *       200:
     *         description: Lançamento de diário atualizado com sucesso.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID único do lançamento de diário atualizado.
     *                 entry_date:
     *                   type: string
     *                   format: date
     *                   description: A data do lançamento atualizado.
     *                 description:
     *                   type: string
     *                   description: A descrição do lançamento atualizado.
     *                 user_id:
     *                   type: string
     *                   format: uuid
     *                   description: O ID do usuário ao qual o lançamento pertence.
     *       400:
     *         description: Requisição inválida. Dados fornecidos são inválidos ou nenhum campo para atualizar foi fornecido.
     *       401:
     *         description: Não autorizado. Token de autenticação ausente ou inválido.
     *       404:
     *         description: Lançamento de diário não encontrado ou você não tem permissão para atualizar este lançamento.
     *       500:
     *         description: Erro interno do servidor.
     */
    if (req.method === 'PUT') {
      const id = req.url?.split('?')[0].split('/').pop() as string
      logger.info(`Journal Entries Handler: Processando PUT para atualizar lançamento ${id}.`)
      const parsedBody = updateJournalEntrySchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.error('Journal Entries Handler: Erro de validação no PUT:', parsedBody.error.errors)
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }
      const updateData = parsedBody.data

      if (Object.keys(updateData).length === 0) {
        logger.warn('Journal Entries Handler: Nenhuma campo para atualizar fornecido no PUT.')
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.')
      }

      const updatedEntry = await updateJournalEntry(
        id,
        updateData,
        organization_id,
        active_accounting_period_id,
        token,
      )

      if (!updatedEntry) {
        logger.warn(
          `Journal Entries Handler: Lançamento ${id} não encontrado ou sem permissão para atualizar.`,
        )
        return handleErrorResponse(
          res,
          404,
          'Lançamento não encontrado ou você não tem permissão para atualizar.',
        )
      }
      logger.info(`Journal Entries Handler: Lançamento ${id} atualizado com sucesso.`)
      return res.status(200).json(updatedEntry)
    }

    /**
     * @swagger
     * /journal-entries/{id}:
     *   delete:
     *     summary: Deleta um lançamento de diário.
     *     description: Deleta um lançamento de diário específico pelo seu ID, incluindo todas as suas linhas de lançamento associadas.
     *     tags:
     *       - Journal Entries
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *           format: uuid
     *         required: true
     *         description: O ID do lançamento de diário a ser deletado.
     *     responses:
     *       204:
     *         description: Lançamento de diário e suas linhas associadas deletados com sucesso. Nenhuma resposta de conteúdo.
     *       400:
     *         description: Requisição inválida. ID do lançamento de diário fornecido é inválido.
     *       401:
     *         description: Não autorizado. Token de autenticação ausente ou inválido.
     *       404:
     *         description: Lançamento de diário não encontrado ou você não tem permissão para deletar este lançamento.
     *       500:
     *         description: Erro interno do servidor.
     */
    if (req.method === 'DELETE') {
      const id = req.url?.split('?')[0].split('/').pop() as string
      logger.info(`Journal Entries Handler: Processando DELETE para lançamento ${id}.`)

      const deleted = await deleteJournalEntry(
        id,
        organization_id,
        active_accounting_period_id,
        token,
        user_id,
      )

      if (!deleted) {
        logger.warn(
          `Journal Entries Handler: Lançamento ${id} não encontrado ou sem permissão para deletar.`,
        )
        return handleErrorResponse(
          res,
          404,
          'Lançamento não encontrado ou você não tem permissão para deletar.',
        )
      }
      logger.info(`Journal Entries Handler: Lançamento ${id} deletado com sucesso.`)
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    console.warn(`Journal Entries Handler: Método ${req.method} não permitido.`)
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error('Journal Entries Handler: Erro inesperado na API de lançamentos:', error)
    const message = formatSupabaseError(error)
    return handleErrorResponse(res, 500, message)
  }
}
