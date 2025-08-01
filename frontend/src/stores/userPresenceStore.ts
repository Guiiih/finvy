import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

interface UserPresence {
  user_id: string;
  username: string;
  last_seen: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

export const useUserPresenceStore = defineStore('userPresence', {
  state: () => ({
    onlineUsers: [] as UserPresence[],
    presenceInterval: null as number | null,
  }),
  actions: {
    async updateMyPresence() {
      const authStore = useAuthStore();

      const userId = authStore.user?.id;
      const organizationId = authStore.userOrganizationId;
      const activeAccountingPeriodId = authStore.userActiveAccountingPeriodId;

      if (userId && organizationId && activeAccountingPeriodId) {
        try {
          // Call backend to update presence
          await fetch('/api/user-presence', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authStore.token}`,
            },
            body: JSON.stringify({
              organizationId,
              activeAccountingPeriodId,
            }),
          });
        } catch (error) {
          console.error('Erro ao atualizar presença:', error);
        }
      }
    },

    async fetchOnlineUsers() {
      const authStore = useAuthStore();

      const organizationId = authStore.userOrganizationId;
      const activeAccountingPeriodId = authStore.userActiveAccountingPeriodId;

      if (organizationId && activeAccountingPeriodId) {
        try {
          const response = await fetch(
            `/api/user-presence?organizationId=${organizationId}&activeAccountingPeriodId=${activeAccountingPeriodId}`,
            {
              headers: {
                'Authorization': `Bearer ${authStore.token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            this.onlineUsers = data.map((item: UserPresence) => ({
              user_id: item.user_id,
              username: item.profiles?.username || 'Usuário Desconhecido',
              last_seen: item.last_seen,
              avatar_url: item.profiles?.avatar_url, // Mapeando avatar_url
            }));
          } else {
            console.error('Erro ao buscar usuários online:', response.statusText);
          }
        } catch (error) {
          console.error('Erro ao buscar usuários online:', error);
        }
      }
    },

    startPresenceTracking() {
      if (this.presenceInterval) {
        clearInterval(this.presenceInterval);
      }
      // Update presence every 30 seconds
      this.presenceInterval = setInterval(() => {
        this.updateMyPresence();
        this.fetchOnlineUsers(); // Also fetch others' presence periodically
      }, 30000) as unknown as number; // Explicitly cast to number
    },

    stopPresenceTracking() {
      if (this.presenceInterval) {
        clearInterval(this.presenceInterval);
        this.presenceInterval = null;
      }
    },
  },
});
