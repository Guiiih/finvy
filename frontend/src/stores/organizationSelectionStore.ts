import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { Organization, AccountingPeriod, UserOrganizationRole } from '@/types';
import { useAuthStore } from './authStore';
import { useAccountingPeriodStore } from './accountingPeriodStore';

export const useOrganizationSelectionStore = defineStore('organizationSelection', () => {
  const authStore = useAuthStore();
  const accountingPeriodStore = useAccountingPeriodStore();

  const userOrganizations = ref<Organization[]>([]);
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
      userOrganizations.value = data;

      // Set active organization based on user's profile or default to the first one
      if (authStore.userOrganizationId) {
        const foundOrg = data.find(org => org.id === authStore.userOrganizationId);
        if (foundOrg) {
          activeOrganization.value = foundOrg;
        } else if (data.length > 0) {
          // If profile's org not found (e.g., deleted), default to first available
          activeOrganization.value = data[0];
          await setActiveOrganization(data[0].id); // Update profile in backend
        }
      } else if (data.length > 0) {
        // If no organization set in profile, default to the first non-personal one, or the first one if all are personal
        const nonPersonalOrg = data.find(org => !org.is_personal);
        if (nonPersonalOrg) {
          activeOrganization.value = nonPersonalOrg;
          await setActiveOrganization(nonPersonalOrg.id);
        } else {
          activeOrganization.value = data[0];
          await setActiveOrganization(data[0].id);
        }
      } else {
        activeOrganization.value = null;
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
      const orgToActivate = userOrganizations.value.find(org => org.id === organizationId);
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
      userOrganizations.value.push(newOrgData.organization);
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
      userOrganizations.value = userOrganizations.value.filter(org => org.id !== organizationId);
      // If the deleted organization was the active one, try to set another one as active
      if (activeOrganization.value?.id === organizationId) {
        activeOrganization.value = null;
        if (userOrganizations.value.length > 0) {
          // Try to set the first non-personal organization as active, or the first one if all are personal
          const nonPersonalOrg = userOrganizations.value.find(org => !org.is_personal);
          if (nonPersonalOrg) {
            await setActiveOrganization(nonPersonalOrg.id);
          } else {
            await setActiveOrganization(userOrganizations.value[0].id);
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

  return {
    userOrganizations,
    activeOrganization,
    loading,
    error,
    currentUserRoleInActiveOrg,
    fetchUserOrganizations,
    setActiveOrganization,
    createOrganization,
    deleteOrganization,
  };
});
