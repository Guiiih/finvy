import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { AccountingPeriod } from '@/types';
import { useOrganizationSelectionStore } from './organizationSelectionStore'; // Import new store

type NewAccountingPeriodPayload = Omit<AccountingPeriod, 'id' | 'created_at' | 'organization_id'>;

export const useAccountingPeriodStore = defineStore('accountingPeriod', () => {
  const accountingPeriods = ref<AccountingPeriod[]>([]);
  const activeAccountingPeriod = ref<AccountingPeriod | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const organizationSelectionStore = useOrganizationSelectionStore(); // Initialize new store

  const getAllAccountingPeriods = computed(() => accountingPeriods.value);
  const getActiveAccountingPeriod = computed(() => activeAccountingPeriod.value);

  async function fetchAccountingPeriods() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<AccountingPeriod[]>('/accounting-periods');
      accountingPeriods.value = data;
      // Tenta encontrar o período ativo, se não encontrar, define o primeiro como ativo
      const active = data.find(period => period.is_active);
      if (active) {
        activeAccountingPeriod.value = active;
        // Update active period in authStore via organizationSelectionStore
        if (organizationSelectionStore.activeOrganization?.id) {
          await api.put('/profile', { active_accounting_period_id: active.id });
        }
      } else if (data.length > 0) {
        // Se não houver período ativo, define o primeiro como ativo (ou o mais recente)
        activeAccountingPeriod.value = data[0];
        // Update active period in authStore via organizationSelectionStore
        if (organizationSelectionStore.activeOrganization?.id) {
          await api.put('/profile', { active_accounting_period_id: data[0].id });
        }
        // Opcional: Chamar API para definir este como ativo no backend
        await updateAccountingPeriod(data[0].id, { is_active: true });
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar períodos contábeis:', err);
      error.value = err instanceof Error ? err.message : 'Ocorreu uma falha desconhecida ao buscar períodos contábeis.';
    } finally {
      loading.value = false;
    }
  }

  async function addAccountingPeriod(newPeriod: NewAccountingPeriodPayload) {
    loading.value = true;
    error.value = null;
    try {
      const addedPeriod = await api.post<AccountingPeriod, NewAccountingPeriodPayload>('/accounting-periods', newPeriod);
      accountingPeriods.value.push(addedPeriod);
      if (addedPeriod.is_active) {
        activeAccountingPeriod.value = addedPeriod;
        // Update active period in authStore via organizationSelectionStore
        if (organizationSelectionStore.activeOrganization?.id) {
          await api.put('/profile', { active_accounting_period_id: addedPeriod.id });
        }
        // Desativar outros períodos no frontend, se houver
        accountingPeriods.value.forEach(p => {
          if (p.id !== addedPeriod.id) p.is_active = false;
        });
      }
      return addedPeriod;
    } catch (err: unknown) {
      console.error('Erro ao adicionar período contábil:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar período contábil.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateAccountingPeriod(id: string, updatedFields: Partial<AccountingPeriod>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put<AccountingPeriod, Partial<AccountingPeriod>>(`/accounting-periods/${id}`, updatedFields);
      const index = accountingPeriods.value.findIndex(p => p.id === id);
      if (index !== -1) {
        accountingPeriods.value[index] = { ...accountingPeriods.value[index], ...response };
        if (response.is_active) {
          activeAccountingPeriod.value = response;
          // Update active period in authStore via organizationSelectionStore
          if (organizationSelectionStore.activeOrganization?.id) {
            await api.put('/profile', { active_accounting_period_id: response.id });
          }
          // Desativar outros períodos no frontend, se houver
          accountingPeriods.value.forEach(p => {
            if (p.id !== response.id) p.is_active = false;
          });
        }
      }
      return response;
    } catch (err: unknown) {
      console.error('Erro ao atualizar período contábil:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao atualizar período contábil.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAccountingPeriod(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/accounting-periods/${id}`);
      accountingPeriods.value = accountingPeriods.value.filter(p => p.id !== id);
      if (activeAccountingPeriod.value?.id === id) {
        activeAccountingPeriod.value = null; // O período ativo foi deletado
        // Reset active period in authStore via organizationSelectionStore
        if (organizationSelectionStore.activeOrganization?.id) {
          await api.put('/profile', { active_accounting_period_id: null });
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao deletar período contábil:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao deletar período contábil.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setActivePeriod(periodId: string) {
    const periodToActivate = accountingPeriods.value.find(p => p.id === periodId);
    if (periodToActivate && !periodToActivate.is_active) {
      await updateAccountingPeriod(periodId, { is_active: true });
      // O updateAccountingPeriod já atualiza activeAccountingPeriod.value e desativa outros no frontend
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
  };
});
