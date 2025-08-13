import type { VercelRequest, VercelResponse } from '@vercel/node'
import { NotificationService } from '../../services/notificationService.js'
import { handleErrorResponse } from '../../utils/supabaseClient.js'
import logger from '../../utils/logger.js'

const notificationService = new NotificationService()

export async function getNotifications(
  _req: VercelRequest,
  res: VercelResponse,
  userId: string,
): Promise<void> {
  try {
    const notifications = await notificationService.getNotificationsByUserId(userId)
    res.status(200).json(notifications)
  } catch (error: unknown) {
    // <-- Alterado de 'any' para 'unknown'
    logger.error({ error }, 'Erro ao buscar notificações:')
    // Adicionada verificação de tipo para acessar 'message' com segurança
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.'
    handleErrorResponse(res, 500, message)
  }
}

export async function markNotificationAsRead(
  _req: VercelRequest,
  res: VercelResponse,
  userId: string,
  notificationId: string,
): Promise<void> {
  try {
    await notificationService.markAsRead(notificationId, userId)
    res.status(204).send('')
  } catch (error: unknown) {
    // <-- Alterado de 'any' para 'unknown'
    logger.error({ error }, 'Erro ao marcar notificação como lida:')
    // Adicionada verificação de tipo para acessar 'message' com segurança
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.'
    handleErrorResponse(res, 500, message)
  }
}
