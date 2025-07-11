import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type { UserOrganizationRole, UserRoleInOrganization } from '@/types';
import { useAuthStore } from './authStore';

export const useOrganizationStore = defineStore('organization', () => {
  const authStore = useAuthStore();

  const organizationMembers = ref<UserOrganizationRole[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const currentOrganizationId = computed(() => authStore.userOrganizationId);
  const isCurrentUserOwnerOrAdmin = computed(() => {
    const currentUserRole = organizationMembers.value.find(member => member.user_id === authStore.user?.id)?.role;
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  });

  async function fetchOrganizationMembers() {
    if (!currentOrganizationId.value) {
      organizationMembers.value = [];
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<UserOrganizationRole[]>(`/user-organization-roles?organization_id=${currentOrganizationId.value}`);
      organizationMembers.value = data;
    } catch (err: unknown) {
      console.error('Erro ao buscar membros da organização:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao buscar membros da organização.';
    } finally {
      loading.value = false;
    }
  }

  async function addOrganizationMember(userId: string, role: UserRoleInOrganization) {
    if (!currentOrganizationId.value) {
      throw new Error('ID da organização não disponível.');
    }
    loading.value = true;
    error.value = null;
    try {
      const newMember = await api.post<UserOrganizationRole, { user_id: string; organization_id: string; role: UserRoleInOrganization }>(
        `/user-organization-roles?organization_id=${currentOrganizationId.value}`,
        {
          user_id: userId,
          organization_id: currentOrganizationId.value,
          role: role,
        }
      );
      organizationMembers.value.push(newMember);
      return newMember;
    } catch (err: unknown) {
      console.error('Erro ao adicionar membro da organização:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao adicionar membro da organização.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateOrganizationMemberRole(memberRoleId: string, newRole: UserRoleInOrganization) {
    if (!currentOrganizationId.value) {
      throw new Error('ID da organização não disponível.');
    }
    loading.value = true;
    error.value = null;
    try {
      const updatedMember = await api.put<UserOrganizationRole, { role: UserRoleInOrganization }>(
        `/user-organization-roles?organization_id=${currentOrganizationId.value}&member_id=${memberRoleId}`,
        { role: newRole }
      );
      const index = organizationMembers.value.findIndex(m => m.id === memberRoleId);
      if (index !== -1) {
        organizationMembers.value[index] = { ...organizationMembers.value[index], ...updatedMember };
      }
      return updatedMember;
    } catch (err: unknown) {
      console.error('Erro ao atualizar papel do membro da organização:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao atualizar papel do membro da organização.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function removeOrganizationMember(memberRoleId: string) {
    if (!currentOrganizationId.value) {
      throw new Error('ID da organização não disponível.');
    }
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/user-organization-roles?organization_id=${currentOrganizationId.value}&member_id=${memberRoleId}`);
      organizationMembers.value = organizationMembers.value.filter(member => member.id !== memberRoleId);
    } catch (err: unknown) {
      console.error('Erro ao remover membro da organização:', err);
      error.value = err instanceof Error ? err.message : 'Falha ao remover membro da organização.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    organizationMembers,
    loading,
    error,
    currentOrganizationId,
    isCurrentUserOwnerOrAdmin,
    fetchOrganizationMembers,
    addOrganizationMember,
    updateOrganizationMemberRole,
    removeOrganizationMember,
  };
});
