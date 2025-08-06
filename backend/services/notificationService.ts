import { supabase } from '../utils/supabaseClient.js';

// Interface para representar uma notificação
interface Notification {
    id: number;
    user_id: string;
    organization_id: string;
    type: string;
    message: string;
    read: boolean;
    created_at: string;
}

export class NotificationService {
    public async createNotification(userId: string, organizationId: string, type: string, message: string): Promise<Notification[]> { // CORRIGIDO: de any para Notification[]
        const { data, error } = await supabase
            .from('notifications')
            .insert([{ user_id: userId, organization_id: organizationId, type, message }])
            .select();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    }

    public async getNotificationsByUserId(userId: string): Promise<Notification[]> { // CORRIGIDO: de any[] para Notification[]
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }
        return data || [];
    }

    public async markAsRead(notificationId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }
    }
}