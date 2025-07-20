import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { AccountingPeriod, TaxRegime, TaxRegimeHistory } from '@/types'

import { useAuthStore } from './authStore'

type NewAccountingPeriodPayload = Omit<
  AccountingPeriod,
  'id' | 'created_at' | 'organization_id'
> & { regime: TaxRegime }

export const useAccountingPeriodStore = defineStore('accountingPeriod', () => {
  const accountingPeriods = ref<AccountingPeriod[]>([])
  const activeAccountingPeriod = ref<AccountingPeriod | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()

  const getAllAccountingPeriods = computed(() => accountingPeriods.value)
  const getActiveAccountingPeriod = computed(() => activeAccountingPeriod.value)

  async function fetchAccountingPeriods() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get<AccountingPeriod[]>('/accounting-periods')
      const taxRegimes = await api.get<TaxRegimeHistory[]>('/tax-regime-history')
      const userActivePeriodId = authStore.userActiveAccountingPeriodId

      // Garante que cada período tenha a propriedade is_active e regime definida corretamente
      const periodsWithStatus = data.map((period) => {
        const matchingRegime = taxRegimes.find(
          (regime) =>
            new Date(period.start_date).getTime() === new Date(regime.start_date).getTime() &&
            new Date(period.end_date).getTime() === new Date(regime.end_date).getTime(),
        )
        return {
          ...period,
          is_active: period.id === userActivePeriodId,
          regime: matchingRegime ? matchingRegime.regime : undefined, // Adiciona o regime
        }
      })

      accountingPeriods.value = periodsWithStatus

      const active = periodsWithStatus.find((period) => period.is_active)

      if (active) {
        activeAccountingPeriod.value = active
      } else if (data.length > 0) {
        // Se nenhum período ativo for encontrado, define o primeiro como ativo
        const firstPeriod = data[0]
        activeAccountingPeriod.value = { ...firstPeriod, is_active: true }
        accountingPeriods.value[0].is_active = true

        // E atualiza o perfil do usuário no backend
        if (authStore.user?.id) {
          await api.put('/profile', { active_accounting_period_id: firstPeriod.id })
          authStore.userActiveAccountingPeriodId = firstPeriod.id
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar períodos contábeis:', err)
      error.value =
        err instanceof Error
          ? err.message
          : 'Ocorreu uma falha desconhecida ao buscar períodos contábeis.'
    } finally {
      loading.value = false
    }
  }

  async function addAccountingPeriod(newPeriod: NewAccountingPeriodPayload) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<
        { accountingPeriod: AccountingPeriod; taxRegimeHistory: TaxRegimeHistory },
        NewAccountingPeriodPayload
      >('/accounting-periods', newPeriod)
      accountingPeriods.value.push(response.accountingPeriod)
      // Não define automaticamente como ativo aqui, use setActivePeriod para isso
      return response.accountingPeriod
    } catch (err: unknown) {
      console.error('Erro ao adicionar período contábil:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar período contábil.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAccountingPeriod(id: string, updatedFields: Partial<AccountingPeriod>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put<AccountingPeriod, Partial<AccountingPeriod>>(
        `/accounting-periods/${id}`,
        updatedFields,
      )
      const index = accountingPeriods.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        accountingPeriods.value[index] = { ...accountingPeriods.value[index], ...response }
        // Se o período atualizado for o período ativo, atualiza o store
        if (activeAccountingPeriod.value?.id === id) {
          activeAccountingPeriod.value = { ...activeAccountingPeriod.value, ...response }
        }
      }
      return response
    } catch (err: unknown) {
      console.error('Erro ao atualizar período contábil:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao atualizar período contábil.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAccountingPeriod(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/accounting-periods/${id}`)
      accountingPeriods.value = accountingPeriods.value.filter((p) => p.id !== id)
      if (activeAccountingPeriod.value?.id === id) {
        activeAccountingPeriod.value = null // O período ativo foi deletado
        // Reset active period in authStore via organizationSelectionStore
        if (authStore.user?.id) {
          // Usar user.id do authStore para garantir que o usuário está logado
          await api.put('/profile', { active_accounting_period_id: null })
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao deletar período contábil:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao deletar período contábil.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setActivePeriod(periodId: string) {
    loading.value = true
    error.value = null
    try {
      const periodToActivate = accountingPeriods.value.find((p) => p.id === periodId)
      if (periodToActivate) {
        // Atualiza o perfil do usuário no backend
        if (authStore.user?.id) {
          await api.put('/profile', { active_accounting_period_id: periodId })

          // Atualiza o estado local para refletir a mudança
          accountingPeriods.value.forEach((p) => {
            p.is_active = p.id === periodId
          })

          activeAccountingPeriod.value = { ...periodToActivate, is_active: true }

          // Atualiza o estado do usuário no authStore
          authStore.userActiveAccountingPeriodId = periodId
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao definir período ativo:', err)
      error.value = err instanceof Error ? err.message : 'Falha ao definir período ativo.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    accountingPeriods,
    activeAccountingPeriod,
    loading,
    error,
    fetchAccountingPeriods,
    addAccountingPeriod,
    updateAccountingPeriod,
    deleteAccountingPeriod,
    setActivePeriod,
    getAllAccountingPeriods,
    getActiveAccountingPeriod,
  }
})
