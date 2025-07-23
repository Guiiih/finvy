import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotificationService } from '../services/notificationService.js';
import { handleErrorResponse } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const notificationService = new NotificationService();

export async function getNotifications(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
    try {
        const notifications = await notificationService.getNotificationsByUserId(userId);
        res.status(200).json(notifications);
    } catch (error: any) {
        logger.error('Erro ao buscar notificações:', error);
        handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
    }
}

export async function markNotificationAsRead(req: VercelRequest, res: VercelResponse, userId: string, notificationId: string): Promise<void> {
    try {
        await notificationService.markAsRead(notificationId, userId);
        res.status(204).send('');
    } catch (error: any) {
        logger.error('Erro ao marcar notificação como lida:', error);
        handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
    }
}
