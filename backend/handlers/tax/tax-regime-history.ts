import logger from '../../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from '../../utils/supabaseClient.js'
import { z } from 'zod'
import { formatSupabaseError } from '../../utils/errorUtils.js'
import { TaxRegime } from '../../types/index.js'

// Esquemas de validação para o histórico de regime tributário
const createTaxRegimeHistorySchema = z.object({
  regime: z.nativeEnum(TaxRegime, { invalid_type_error: 'Regime tributário inválido.' }),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de início inválido. Use YYYY-MM-DD.'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de fim inválido. Use YYYY-MM-DD.'),
})

const updateTaxRegimeHistorySchema = z
  .object({
    regime: z
      .nativeEnum(TaxRegime, { invalid_type_error: 'Regime tributário inválido.' })
      .optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de início inválido. Use YYYY-MM-DD.')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de fim inválido. Use YYYY-MM-DD.')
      .optional(),
  })
  .partial()

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[TaxRegimeHistory] Recebida requisição para user_id: ${user_id}`)
  const userSupabase = getSupabaseClient(token)

  try {
    const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
    if (!userOrgAndPeriod) {
      logger.warn(
        `[TaxRegimeHistory] Organização ou período contábil não encontrado para user_id: ${user_id}`,
      )
      return handleErrorResponse(
        res,
        403,
        'Organização ou período contábil não encontrado para o usuário.',
      )
    }
    const { organization_id } = userOrgAndPeriod

    if (req.method === 'POST') {
      const parsedBody = createTaxRegimeHistorySchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.warn(
          `[TaxRegimeHistory] Erro de validação do corpo da requisição: ${parsedBody.error.errors.map((err) => err.message).join(', ')}`,
        )
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }

      const { regime, start_date, end_date } = parsedBody.data

      // Validação de sobreposição de datas
      const { data: existingRegimes, error: fetchError } = await userSupabase
        .from('tax_regime_history')
        .select('start_date, end_date')
        .eq('organization_id', organization_id)
        .order('start_date', { ascending: true })

      if (fetchError) {
        logger.error(`[TaxRegimeHistory] Erro ao buscar regimes existentes: ${fetchError.message}`)
        throw fetchError
      }

      const newStartDate = new Date(start_date)
      const newEndDate = new Date(end_date)

      if (newStartDate > newEndDate) {
        return handleErrorResponse(
          res,
          400,
          'A data de início não pode ser posterior à data de fim.',
        )
      }

      for (const existing of existingRegimes) {
        const existingStartDate = new Date(existing.start_date)
        const existingEndDate = new Date(existing.end_date)

        // Check for overlap
        if (newStartDate <= existingEndDate && newEndDate >= existingStartDate) {
          return handleErrorResponse(
            res,
            400,
            'O período especificado se sobrepõe a um regime tributário existente.',
          )
        }
      }

      logger.info(
        `[TaxRegimeHistory] Inserindo novo regime tributário para organization_id: ${organization_id}`,
      )
      const { data, error: dbError } = await userSupabase
        .from('tax_regime_history')
        .insert([{ organization_id, regime, start_date, end_date }])
        .select()
        .single()

      if (dbError) {
        logger.error(
          `[TaxRegimeHistory] Erro ao inserir novo regime tributário: ${dbError.message}`,
        )
        throw dbError
      }
      logger.info(`[TaxRegimeHistory] Novo regime tributário criado com sucesso: ${data.id}`)
      return res.status(201).json(data)
    } else if (req.method === 'GET') {
      logger.info(
        `[TaxRegimeHistory] Buscando regimes tributários para organization_id: ${organization_id}`,
      )
      const { data, error: dbError } = await userSupabase
        .from('tax_regime_history')
        .select('id, regime, start_date, end_date, created_at, updated_at')
        .eq('organization_id', organization_id)
        .order('start_date', { ascending: false })

      if (dbError) {
        logger.error(`[TaxRegimeHistory] Erro ao buscar regimes tributários: ${dbError.message}`)
        throw dbError
      }
      logger.info(`[TaxRegimeHistory] Regimes tributários encontrados: ${data.length}`)
      return res.status(200).json(data)
    } else if (req.method === 'PUT') {
      const { id } = req.query // This is the tax_regime_history_id
      if (!id || typeof id !== 'string') {
        return handleErrorResponse(res, 400, 'ID do histórico de regime tributário é obrigatório.')
      }

      logger.info(
        `[TaxRegimeHistory] Atualizando regime tributário ${id} para organization_id: ${organization_id}`,
      )
      const parsedBody = updateTaxRegimeHistorySchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.warn(
          `[TaxRegimeHistory] Erro de validação do corpo da requisição PUT: ${parsedBody.error.errors.map((err) => err.message).join(', ')}`,
        )
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }
      const updateData = parsedBody.data

      if (Object.keys(updateData).length === 0) {
        logger.warn(`[TaxRegimeHistory] Nenhum campo para atualizar fornecido para regime ${id}`)
        return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.')
      }

      // Validação de sobreposição de datas para PUT
      if (updateData.start_date || updateData.end_date) {
        const { data: currentRegime, error: fetchCurrentError } = await userSupabase
          .from('tax_regime_history')
          .select('start_date, end_date')
          .eq('id', id)
          .single()

        if (fetchCurrentError || !currentRegime) {
          logger.error(
            `[TaxRegimeHistory] Erro ao buscar regime atual ${id}: ${fetchCurrentError?.message || 'Regime não encontrado.'}`,
          )
          return handleErrorResponse(res, 404, 'Regime tributário não encontrado.')
        }

        const newStartDate = new Date(updateData.start_date || currentRegime.start_date)
        const newEndDate = new Date(updateData.end_date || currentRegime.end_date)

        if (newStartDate > newEndDate) {
          return handleErrorResponse(
            res,
            400,
            'A data de início não pode ser posterior à data de fim.',
          )
        }

        const { data: existingRegimes, error: fetchError } = await userSupabase
          .from('tax_regime_history')
          .select('id, start_date, end_date')
          .eq('organization_id', organization_id)
          .neq('id', id) // Exclude the current regime from overlap check

        if (fetchError) {
          logger.error(
            `[TaxRegimeHistory] Erro ao buscar regimes existentes para PUT: ${fetchError.message}`,
          )
          throw fetchError
        }

        for (const existing of existingRegimes) {
          const existingStartDate = new Date(existing.start_date)
          const existingEndDate = new Date(existing.end_date)

          if (newStartDate <= existingEndDate && newEndDate >= existingStartDate) {
            return handleErrorResponse(
              res,
              400,
              'O período atualizado se sobrepõe a um regime tributário existente.',
            )
          }
        }
      }

      const { data, error: dbError } = await userSupabase
        .from('tax_regime_history')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organization_id)
        .select()
        .single()

      if (dbError) {
        logger.error(
          `[TaxRegimeHistory] Erro ao atualizar regime tributário ${id}: ${dbError.message}`,
        )
        throw dbError
      }
      if (!data) {
        logger.warn(
          `[TaxRegimeHistory] Regime tributário ${id} não encontrado ou sem permissão para atualizar.`,
        )
        return handleErrorResponse(
          res,
          404,
          'Regime tributário não encontrado ou você não tem permissão para atualizar este regime.',
        )
      }
      logger.info(`[TaxRegimeHistory] Regime tributário ${id} atualizado com sucesso.`)
      return res.status(200).json(data)
    } else if (req.method === 'DELETE') {
      const { id } = req.query // This is the tax_regime_history_id
      if (!id || typeof id !== 'string') {
        return handleErrorResponse(res, 400, 'ID do histórico de regime tributário é obrigatório.')
      }

      logger.info(
        `[TaxRegimeHistory] Deletando regime tributário ${id} para organization_id: ${organization_id}`,
      )

      const { error: dbError, count } = await userSupabase
        .from('tax_regime_history')
        .delete()
        .eq('id', id)
        .eq('organization_id', organization_id)

      if (dbError) {
        logger.error(
          `[TaxRegimeHistory] Erro ao deletar regime tributário ${id}: ${dbError.message}`,
        )
        throw dbError
      }
      if (count === 0) {
        logger.warn(
          `[TaxRegimeHistory] Regime tributário ${id} não encontrado ou sem permissão para deletar.`,
        )
        return handleErrorResponse(
          res,
          404,
          'Regime tributário não encontrado ou você não tem permissão para deletar este regime.',
        )
      }
      logger.info(`[TaxRegimeHistory] Regime tributário ${id} deletado com sucesso.`)
      return res.status(204).send('')
    }

    logger.warn(`[TaxRegimeHistory] Método ${req.method} não permitido.`)
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API de histórico de regime tributário:')
    const message = formatSupabaseError(error)
    return handleErrorResponse(res, 500, message)
  }
}
