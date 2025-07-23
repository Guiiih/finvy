import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserPresenceService } from '../services/userPresenceService.js';
import { handleErrorResponse } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';

const userPresenceService = new UserPresenceService();

export async function updateUserPresence(req: VercelRequest, res: VercelResponse, userId: string, token: string): Promise<void> {
    try {
        const { organizationId, activeAccountingPeriodId } = req.body;

        if (!organizationId || !activeAccountingPeriodId) {
            return handleErrorResponse(res, 400, 'organizationId and activeAccountingPeriodId are required.');
        }

        await userPresenceService.updateUserPresence(userId, organizationId, activeAccountingPeriodId);
        res.status(200).json({ message: 'User presence updated.' });
    } catch (error: any) {
        logger.error('Erro ao atualizar presença do usuário:', error);
        handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
    }
}

export async function getOnlineUsers(req: VercelRequest, res: VercelResponse, userId: string, token: string): Promise<void> {
    try {
        const { organizationId, activeAccountingPeriodId } = req.query;

        if (!organizationId || !activeAccountingPeriodId) {
            return handleErrorResponse(res, 400, 'organizationId and activeAccountingPeriodId are required.');
        }

        const onlineUsers = await userPresenceService.getOnlineUsersInPeriod(organizationId as string, activeAccountingPeriodId as string);
        res.status(200).json(onlineUsers);
    } catch (error: any) {
        logger.error('Erro ao buscar usuários online:', error);
        handleErrorResponse(res, 500, error.message || 'Erro interno do servidor.');
    }
}
