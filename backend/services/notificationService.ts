import { supabase } from '../utils/supabaseClient.js';

export class NotificationService {
    public async createNotification(userId: string, organizationId: string, type: string, message: string): Promise<any> {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{ user_id: userId, organization_id: organizationId, type, message }])
            .select();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    }

    public async getNotificationsByUserId(userId: string): Promise<any[]> {
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
            .eq('user_id', userId); // Ensure only the owner can mark as read

        if (error) {
            throw new Error(error.message);
        }
    }
}
