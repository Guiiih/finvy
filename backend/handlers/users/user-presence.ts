import type { VercelRequest, VercelResponse } from '@vercel/node'
import { UserPresenceService } from '../../services/userPresenceService.js'
import { handleErrorResponse } from '../../utils/supabaseClient.js'
import logger from '../../utils/logger.js'

const userPresenceService = new UserPresenceService()

import { getSupabaseClient } from '../../utils/supabaseClient.js'

export async function updateUserPresence(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  token: string,
): Promise<void> {
  try {
    const { organizationId } = req.body

    if (!organizationId) {
      return handleErrorResponse(
        res,
        400,
        'organizationId is required.',
      )
    }

    const userSupabase = getSupabaseClient(token)

    // Fetch the active_accounting_period_id from the profiles table
    const { data: profile, error: profileError } = await userSupabase
      .from('profiles')
      .select('active_accounting_period_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      logger.error(
        `[User Presence] Erro ao buscar perfil para user_id ${userId}: ${profileError.message}`,
      )
      return handleErrorResponse(res, 500, 'Erro ao buscar informações do perfil.')
    }

    const activeAccountingPeriodId = profile?.active_accounting_period_id || null

    await userPresenceService.updateUserPresence(userId, organizationId, activeAccountingPeriodId)
    res.status(200).json({ message: 'User presence updated.' })
  } catch (error: unknown) {
    logger.error({ error }, 'Erro ao atualizar presença do usuário:')
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.'
    handleErrorResponse(res, 500, message)
  }
}

export async function getOnlineUsers(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const { organizationId, activeAccountingPeriodId } = req.query

    if (!organizationId || !activeAccountingPeriodId) {
      return handleErrorResponse(
        res,
        400,
        'organizationId and activeAccountingPeriodId are required.',
      )
    }

    const onlineUsers = await userPresenceService.getOnlineUsersInPeriod(
      organizationId as string,
      activeAccountingPeriodId as string,
    )
    res.status(200).json(onlineUsers)
  } catch (error: unknown) {
    // <-- Alterado de 'any' para 'unknown'
    logger.error({ error }, 'Erro ao buscar usuários online:')
    // Adicionada verificação de tipo para acessar 'message' com segurança
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.'
    handleErrorResponse(res, 500, message)
  }
}
