import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { Organization, AccountingPeriod, UserOrganizationRole } from '@/types';
import { useAuthStore } from './authStore';
import { useAccountingPeriodStore } from './accountingPeriodStore';

export const useOrganizationSelectionStore = defineStore('organizationSelection', () => {
  const authStore = useAuthStore();
  const accountingPeriodStore = useAccountingPeriodStore();

  const accessibleOrganizations = ref<Organization[]>([]);
  const activeOrganization = ref<Organization | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed property to get the current user's role in the active organization
  const currentUserRoleInActiveOrg = computed(() => {
    if (!authStore.user?.id || !activeOrganization.value) return null;
    // This would ideally come from a more direct source, like authStore.userRoleInActiveOrg
    // For now, we'll assume the profile's organization_id is the active one and fetch the role
    // This might need refinement if a user can switch organizations without updating their profile immediately.
    // A better approach might be to fetch user_organization_roles for all user's organizations
    // and store them here.
    return null; // Placeholder for now
  });

  async function fetchUserOrganizations() {
    loading.value = true;
    error.value = null;
    try {
      // This endpoint needs to be implemented in the backend (GET /organizations/my-organizations or similar)
      // For now, I'll assume it returns a list of organizations the user is a member of.
      // The RLS on the 'organizations' table should ensure only accessible organizations are returned.
      const data = await api.get<Organization[]>('/organizations'); // Assuming GET /organizations returns user's organizations
      accessibleOrganizations.value = data;

      let targetActiveOrg: Organization | null = null;

      // 1. Tenta definir a organização ativa com base na configuração do perfil do usuário
      if (authStore.userOrganizationId) {
        targetActiveOrg = data.find(org => org.id === authStore.userOrganizationId) || null;
      }

      // 2. Se nenhuma organização ativa for encontrada no perfil, ou se a organização do perfil for inválida/excluída,
      //    tenta definir a organização pessoal do *próprio* usuário como ativa.
      if (!targetActiveOrg) {
        targetActiveOrg = data.find(org => org.is_personal && org.shared_from_user_name === null) || null;
      }

      // 3. Se ainda não houver organização ativa (por exemplo, novo usuário, nenhuma organização pessoal ainda, ou todas as organizações são compartilhadas),
      //    define como padrão a primeira organização não pessoal, ou a primeira da lista se todas forem pessoais/compartilhadas.
      if (!targetActiveOrg && data.length > 0) {
        targetActiveOrg = data.find(org => !org.is_personal) || data[0];
      }

      activeOrganization.value = targetActiveOrg;

      // Atualiza o backend se a organização ativa foi alterada/definida por padrão
      if (targetActiveOrg && authStore.userOrganizationId !== targetActiveOrg.id) {
        await setActiveOrganization(targetActiveOrg.id);
      } else if (!targetActiveOrg && authStore.userOrganizationId) {
        // Se nenhuma organização ativa for encontrada, mas o perfil ainda tiver uma, limpa-a
        await api.put('/profile', { organization_id: null, active_accounting_period_id: null });
        authStore.userOrganizationId = null;
        authStore.userActiveAccountingPeriodId = null;
      }

      // After setting active organization, fetch accounting periods for it
      if (activeOrganization.value) {
        await accountingPeriodStore.fetchAccountingPeriods();
      }

    } catch (err: unknown) {
      console.error('Erro ao buscar organizações do usuário:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao buscar organizações.';
    } finally {
      loading.value = false;
    }
  }

  async function setActiveOrganization(organizationId: string) {
    loading.value = true;
    error.value = null;
    try {
      const orgToActivate = accessibleOrganizations.value.find(org => org.id === organizationId);
      if (!orgToActivate) {
        throw new Error('Organização não encontrada.');
      }

      // Update user's profile in the backend
      // This will also update authStore.userOrganizationId and authStore.userActiveAccountingPeriodId
      // as the profile handler returns these fields.
      const { organization_id, active_accounting_period_id } = await api.put<{ organization_id: string, active_accounting_period_id: string }, { organization_id: string }>( // Added active_accounting_period_id to the return type
        '/profile', // Assuming /profile PUT can update organization_id
        { organization_id: organizationId }
      );

      activeOrganization.value = orgToActivate;
      authStore.userOrganizationId = organization_id;
      authStore.userActiveAccountingPeriodId = active_accounting_period_id; // Update with the period returned by backend

      // Re-fetch accounting periods for the newly active organization
      await accountingPeriodStore.fetchAccountingPeriods();

    } catch (err: unknown) {
      console.error('Erro ao definir organização ativa:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao definir organização ativa.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Action to create a new organization
  async function createOrganization(name: string) {
    loading.value = true;
    error.value = null;
    try {
      const newOrgData = await api.post<{ organization: Organization, accounting_period: AccountingPeriod }, { name: string }>('/organizations', { name });
      accessibleOrganizations.value.push(newOrgData.organization);
      // Automatically set the newly created organization as active
      await setActiveOrganization(newOrgData.organization.id);
      return newOrgData.organization;
    } catch (err: unknown) {
      console.error('Erro ao criar organização:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao criar organização.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteOrganization(organizationId: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/organizations?id=${organizationId}`);
      accessibleOrganizations.value = accessibleOrganizations.value.filter(org => org.id !== organizationId);
      // If the deleted organization was the active one, try to set another one as active
      if (activeOrganization.value?.id === organizationId) {
        activeOrganization.value = null;
        if (accessibleOrganizations.value.length > 0) {
          // Try to set the first non-personal organization as active, or the first one if all are personal
          const nonPersonalOrg = accessibleOrganizations.value.find(org => !org.is_personal);
          if (nonPersonalOrg) {
            await setActiveOrganization(nonPersonalOrg.id);
          } else {
            await setActiveOrganization(accessibleOrganizations.value[0].id);
          }
        } else {
          // No organizations left, clear active organization in profile
          await api.put('/profile', { organization_id: null, active_accounting_period_id: null });
          authStore.userOrganizationId = null;
          authStore.userActiveAccountingPeriodId = null;
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao deletar organização:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao deletar organização.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  const personalOrganization = computed(() => {
    return accessibleOrganizations.value.find(org => org.is_personal);
  });

  return {
    accessibleOrganizations,
    activeOrganization,
    loading,
    error,
    currentUserRoleInActiveOrg,
    fetchUserOrganizations,
    setActiveOrganization,
    createOrganization,
    deleteOrganization,
    personalOrganization,
  };
});
