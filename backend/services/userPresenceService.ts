import { supabase } from '../utils/supabaseClient.js'
import logger from '../utils/logger.js'
import { UserPresence, OnlineUser } from '../types/index.js'

export class UserPresenceService {
  public async updateUserPresence(
    userId: string,
    organizationId: string,
    activeAccountingPeriodId: string,
  ): Promise<UserPresence> {
    const { data, error } = await supabase
      .from('user_presence')
      .upsert(
        {
          user_id: userId,
          organization_id: organizationId,
          active_accounting_period_id: activeAccountingPeriodId,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()

    if (error) {
      logger.error('Erro ao atualizar presença do usuário:', error)
      throw new Error(error.message)
    }
    return data[0]
  }

  public async getOnlineUsersInPeriod(
    organizationId: string,
    activeAccountingPeriodId: string,
  ): Promise<OnlineUser[]> {
    // Consider users online if they've updated their presence in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('user_presence')
      .select(
        'user_id, last_seen, organization_id, active_accounting_period_id, profiles(username, avatar_url)',
      ) // Assuming 'profiles' table has 'username'
      .eq('organization_id', organizationId)
      .eq('active_accounting_period_id', activeAccountingPeriodId)
      .gte('last_seen', fiveMinutesAgo)

    if (error) {
      logger.error('Erro ao buscar usuários online:', error)
      throw new Error(error.message)
    }
    return data || []
  }
}
