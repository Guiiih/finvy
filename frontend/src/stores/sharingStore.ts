import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { SharedAccountingPeriod, SharedPermissionLevel } from '@/types'

export const useSharingStore = defineStore('sharing', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function shareAccountingPeriod(
    accountingPeriodId: string,
    sharedWithUserId: string,
    permissionLevel: SharedPermissionLevel,
  ): Promise<SharedAccountingPeriod | null> {
    loading.value = true
    error.value = null
    try {
      const payload = {
        accounting_period_id: accountingPeriodId,
        shared_with_user_id: sharedWithUserId,
        permission_level: permissionLevel,
      }
      const sharedPeriod = await api.post<SharedAccountingPeriod, typeof payload>(
        '/sharing',
        payload,
      )
      return sharedPeriod
    } catch (err: unknown) {
      console.error('Erro ao compartilhar período contábil:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao compartilhar período contábil.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function unshareAccountingPeriod(sharingId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/sharing?id=${sharingId}`)
    } catch (err: unknown) {
      console.error('Erro ao remover compartilhamento de período contábil:', err)
      error.value =
        err instanceof Error
          ? err.message
          : 'Falha ao remover compartilhamento de período contábil.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    shareAccountingPeriod,
    unshareAccountingPeriod,
  }
})
