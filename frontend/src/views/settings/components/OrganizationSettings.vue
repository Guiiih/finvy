<template>
  <div>
    <!-- Create Organization Section -->
    <div class="mb-8 p-6 rounded-lg bg-surface-50">
      <h2 class="text-xl font-semibold text-surface-700 mb-4">Criar Nova Organização</h2>
      <form @submit.prevent="handleCreateOrganization" class="space-y-4 max-w-md">
        <div>
          <label for="newOrganizationName" class="block text-sm font-normal text-surface-700">Nome da Organização:</label>
          <InputText
            id="newOrganizationName"
            v-model="newOrganizationName"
            placeholder="Ex: Minha Empresa LTDA"
            required
            class="mt-1 block w-full"
          />
        </div>
        <Button
          type="submit"
          class="p-button-emerald"
          :loading="organizationSelectionStore.loading"
          label="Criar Organização"
        />
      </form>
    </div>

    <!-- Organization Management Section -->
    <div class="p-6 rounded-lg bg-surface-50">
      <h2 class="text-xl font-semibold text-surface-700 mb-4">Gerenciamento de Organização</h2>
      
      <div v-if="!organizationSelectionStore.activeOrganization" class="bg-yellow-50 text-yellow-700 p-4 mb-4 rounded-lg">
        <p>Nenhuma organização ativa. Crie uma nova ou selecione uma existente.</p>
      </div>

      <div v-else>
        <!-- Organization Details & Selector -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <!-- Left Side: Details -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Organização Ativa</h3>
            <div>
              <label for="selectOrganization" class="block text-sm font-normal text-surface-700">Mudar Organização Ativa</label>
              <Select
                id="selectOrganization"
                v-model="selectedOrganizationId"
                :options="organizationSelectionStore.accessibleOrganizations"
                optionLabel="name"
                optionValue="id"
                @change="handleOrganizationChange"
                class="w-full mt-1"
                placeholder="Selecione uma Organização"
              />
            </div>
            <div>
              <label for="orgCnpj" class="block text-sm font-normal text-surface-700">CNPJ:</label>
              <InputText id="orgCnpj" v-model="orgCnpj" class="w-full mt-1" />
            </div>
            <div>
              <label for="orgRazaoSocial" class="block text-sm font-normal text-surface-700">Razão Social:</label>
              <InputText id="orgRazaoSocial" v-model="orgRazaoSocial" class="w-full mt-1" />
            </div>
            <div class="flex space-x-4">
                <div class="w-1/2">
                    <label for="orgUf" class="block text-sm font-normal text-surface-700">UF:</label>
                    <InputText id="orgUf" v-model="orgUf" class="w-full mt-1" />
                </div>
                <div class="w-1/2">
                    <label for="orgMunicipio" class="block text-sm font-normal text-surface-700">Município:</label>
                    <InputText id="orgMunicipio" v-model="orgMunicipio" class="w-full mt-1" />
                </div>
            </div>
            <Button
              @click="handleUpdateOrganizationDetails"
              :loading="organizationSelectionStore.loading"
              class="p-button-outlined mt-4"
              label="Salvar Detalhes"
            />
          </div>

          <!-- Right Side: Quick Actions -->
          <div class="bg-surface-50 p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Ações</h3>
             <div v-if="organizationSelectionStore.activeOrganization && !organizationSelectionStore.activeOrganization.is_personal" class="space-y-3">
                <Button @click="confirmDeleteOrganization(organizationSelectionStore.activeOrganization.id)" label="Excluir Organização" severity="danger" class="w-full p-button-outlined" />
             </div>
             <div v-else class="text-sm text-surface-500">
                <p>Organizações pessoais não podem ser excluídas.</p>
             </div>
          </div>
        </div>

        <!-- Member Management -->
        <h3 class="text-xl font-semibold mb-4 mt-8 pt-4 border-t border-surface-200">Membros da Organização</h3>
        <div v-if="organizationSelectionStore.activeOrganization.is_personal" class="bg-blue-50 text-blue-700 p-4 rounded-lg">
          <p>Organizações pessoais não permitem gerenciamento de membros.</p>
        </div>
        <div v-else>
          <!-- Search and Add Member -->
          <div class="mb-6 flex items-center justify-between">
            <span class="p-input-icon-left w-full max-w-sm">
                <i class="pi pi-search" />
                <InputText v-model="memberSearchTerm" placeholder="Buscar membro..." class="w-full" />
            </span>
            <Button
              v-if="organizationStore.isCurrentUserOwnerOrAdmin"
              @click="showAddMemberForm = !showAddMemberForm; editingMember = null"
              :label="showAddMemberForm ? 'Fechar' : 'Convidar Membro'"
              icon="pi pi-plus"
            />
          </div>

          <!-- Add/Edit Member Form -->
          <div v-if="showAddMemberForm" class="bg-surface-50 p-6 rounded-lg shadow-md mb-6">
            <h4 class="text-lg font-semibold mb-4">
              {{ editingMember ? 'Editar Membro' : 'Adicionar Novo Membro' }}
            </h4>
            <form @submit.prevent="handleSubmitMember" class="space-y-4">
              <div>
                <label for="memberSearch" class="block text-sm font-normal text-surface-700">Buscar Usuário (Email):</label>
                <InputText
                  id="memberSearch"
                  v-model="searchUserTerm"
                  placeholder="Email do Usuário"
                  @input="debounceSearchUsers"
                  class="mt-1 block w-full"
                />
                <div v-if="showSearchResults && searchResults.length > 0" class="mt-2 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  <ul>
                    <li v-for="user in searchResults" :key="user.id" @click="selectUser(user)" class="p-3 hover:bg-surface-100 cursor-pointer">
                      <p>{{ user.username || user.email }}</p>
                    </li>
                  </ul>
                </div>
              </div>
              <div v-if="selectedUserForMembership">
                <label>Usuário Selecionado:</label>
                <p class="p-3 rounded-md bg-surface-100">{{ selectedUserForMembership.username || selectedUserForMembership.email }}</p>
              </div>
              <div>
                <label for="memberRole" class="block text-sm font-normal text-surface-700">Papel:</label>
                <Select
                  id="memberRole"
                  v-model="newMember.role"
                  :options="['owner', 'admin', 'member', 'guest']"
                  required
                  class="mt-1 block w-full"
                />
              </div>
              <Button type="submit" :loading="organizationStore.loading" :label="editingMember ? 'Atualizar Membro' : 'Adicionar Membro'" />
            </form>
          </div>

          <!-- Member List -->
          <div class="bg-surface-50 rounded-lg">
            <p v-if="organizationStore.loading">Carregando membros...</p>
            <p v-else-if="organizationStore.error">{{ organizationStore.error }}</p>
            <ul v-else-if="filteredMembers.length > 0" class="space-y-3">
              <li v-for="member in filteredMembers" :key="member.id" class="flex items-center justify-between p-4 rounded-lg bg-surface-50 hover:bg-surface-100">
                <div class="flex items-center space-x-4">
                  <img :src="member.profiles?.avatar_url || undefined" alt="Avatar" class="h-12 w-12 rounded-full" />
                  <div>
                    <p class="font-semibold">{{ member.profiles?.username || member.user_id }}</p>
                    <p class="text-sm text-surface-500">{{ member.profiles?.email }}</p>
                    <span class="text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{{ member.role }}</span>
                  </div>
                </div>
                <div v-if="organizationStore.isCurrentUserOwnerOrAdmin" class="flex items-center space-x-2">
                  <Button icon="pi pi-pencil" @click="startEdit(member)" class="p-button-rounded p-button-text" />
                  <Button icon="pi pi-trash" @click="removeMember(member.id)" class="p-button-rounded p-button-text p-button-danger" />
                </div>
              </li>
            </ul>
            <p v-else>Nenhum membro encontrado.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Dialog header="Confirmar Exclusão da Organização" v-model:visible="showDeleteOrganizationModal" :modal="true" :style="{ width: '450px' }">
      <div class="flex items-center p-4">
        <i class="pi pi-exclamation-triangle mr-3 text-red-500" style="font-size: 2rem"></i>
        <span>Tem certeza que deseja excluir esta organização? Esta ação é irreversível.</span>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" @click="showDeleteOrganizationModal = false" class="p-button-text" />
        <Button label="Excluir" icon="pi pi-check" @click="handleDeleteOrganization" :loading="organizationSelectionStore.loading" class="p-button-danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted, computed, watch } from 'vue';
import { useOrganizationStore } from '../../../stores/organizationStore';
import { useOrganizationSelectionStore } from '../../../stores/organizationSelectionStore';
import { useToast } from 'primevue/usetoast';
import { api } from '../../../services/api';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import type { UserOrganizationRole, UserRoleInOrganization, User } from '../../../types';
import { getErrorMessage } from '../../../utils/errorUtils';

const organizationStore = useOrganizationStore();
const organizationSelectionStore = useOrganizationSelectionStore();
const toast = useToast();


// Component-specific state
const newOrganizationName = ref('');
const selectedOrganizationId = ref<string | null>(null);
const showDeleteOrganizationModal = ref(false);
const organizationToDeleteId = ref<string | null>(null);

// Organization Details
const orgCnpj = ref<string | null>(null);
const orgRazaoSocial = ref<string | null>(null);
const orgUf = ref<string | null>(null);
const orgMunicipio = ref<string | null>(null);

// Member Management
const memberSearchTerm = ref('');
const showAddMemberForm = ref(false);
const editingMember = ref<UserOrganizationRole | null>(null);
const newMember = ref({ user_id: '', role: '' as UserRoleInOrganization });
const searchUserTerm = ref('');
const searchResults = ref<any[]>([]);
const showSearchResults = ref(false);
const searchingUsers = ref(false);
const selectedUserForMembership = ref<any | null>(null);

const filteredMembers = computed(() => {
  const term = memberSearchTerm.value.toLowerCase();
  return organizationStore.organizationMembers.filter(
    (m) =>
      m.profiles?.username?.toLowerCase().includes(term) ||
      m.profiles?.email?.toLowerCase().includes(term)
  );
});

const isValidEmail = computed(() => {
  const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(searchUserTerm.value);
});

onMounted(async () => {
  await organizationSelectionStore.fetchUserOrganizations();
  if (organizationSelectionStore.activeOrganization) {
    updateLocalOrgDetails(organizationSelectionStore.activeOrganization);
    await organizationStore.fetchOrganizationMembers();
  }
});

watch(() => organizationSelectionStore.activeOrganization,
  async (newOrg) => {
    if (newOrg) {
      updateLocalOrgDetails(newOrg);
      await organizationStore.fetchOrganizationMembers();
    } else {
      organizationStore.organizationMembers = [];
      updateLocalOrgDetails(null);
    }
  }
);

function updateLocalOrgDetails(org: any) {
    selectedOrganizationId.value = org?.id || null;
    orgCnpj.value = org?.cnpj || null;
    orgRazaoSocial.value = org?.razao_social || null;
    orgUf.value = org?.uf || null;
    orgMunicipio.value = org?.municipio || null;
}

async function handleCreateOrganization() {
  if (!newOrganizationName.value) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O nome da organização é obrigatório.', life: 3000 });
    return;
  }
   
  try {
    await organizationSelectionStore.createOrganization(newOrganizationName.value);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Organização criada com sucesso!', life: 3000 });
    newOrganizationName.value = '';
  } catch (_err: unknown) {
    toast.add({ severity: 'error', summary: 'Erro', detail: getErrorMessage(_err), life: 3000 });
  }
}

async function handleOrganizationChange() {
  if (selectedOrganizationId.value) {
     
    try {
      await organizationSelectionStore.setActiveOrganization(selectedOrganizationId.value);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Organização ativa alterada!', life: 3000 });
    } catch (_err: unknown) {
      toast.add({ severity: 'error', summary: 'Erro', detail: getErrorMessage(_err), life: 3000 });
    }
  }
}

async function handleUpdateOrganizationDetails() {
    if (!organizationSelectionStore.activeOrganization) return;
     
    try {
        await organizationSelectionStore.updateOrganizationDetails(
            organizationSelectionStore.activeOrganization.id,
            { cnpj: orgCnpj.value, razao_social: orgRazaoSocial.value, uf: orgUf.value, municipio: orgMunicipio.value }
        );
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Detalhes da organização atualizados!', life: 3000 });
    } catch (_err: unknown) {
        toast.add({ severity: 'error', summary: 'Erro', detail: getErrorMessage(_err), life: 3000 });
    }
}

function confirmDeleteOrganization(orgId: string) {
  organizationToDeleteId.value = orgId;
  showDeleteOrganizationModal.value = true;
}

async function handleDeleteOrganization() {
  if (!organizationToDeleteId.value) return;
   
  try {
    await organizationSelectionStore.deleteOrganization(organizationToDeleteId.value);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Organização excluída!', life: 3000 });
    showDeleteOrganizationModal.value = false;
  } catch (_err: unknown) {
    toast.add({ severity: 'error', summary: 'Erro', detail: getErrorMessage(_err), life: 3000 });
  }
}

let searchTimeout: ReturnType<typeof setTimeout>;

async function searchUsers() {
  if (!searchUserTerm.value || !isValidEmail.value) {
    searchResults.value = [];
    showSearchResults.value = false;
    return;
  }
  searchingUsers.value = true;
   
  try {
    const response = await api.get<User[]>(`/users?query=${searchUserTerm.value}`);
    searchResults.value = response;
    showSearchResults.value = true;
  } catch (_err: unknown) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao buscar usuários.', life: 3000 });
    searchResults.value = [];
  } finally {
    searchingUsers.value = false;
  }
}

function debounceSearchUsers() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (isValidEmail.value) {
      searchUsers();
    }
  }, 500);
}

function selectUser(user: User) {
  selectedUserForMembership.value = user;
  newMember.value.user_id = user.id;
  searchUserTerm.value = user.username || user.email;
  showSearchResults.value = false;
}

async function handleSubmitMember() {
  if (!selectedUserForMembership.value || !newMember.value.role) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um usuário e um papel.', life: 3000 });
    return;
  }
   
  try {
    if (editingMember.value) {
      await organizationStore.updateOrganizationMemberRole(editingMember.value.id, newMember.value.role);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Membro atualizado!', life: 3000 });
    } else {
      await organizationStore.addOrganizationMember(newMember.value.user_id, newMember.value.role);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Membro adicionado!', life: 3000 });
    }
    resetMemberForm();
    await organizationStore.fetchOrganizationMembers();
  } catch (_err: unknown) {
    toast.add({ severity: 'error', summary: 'Erro', detail: getErrorMessage(_err), life: 3000 });
  }
}

async function removeMember(memberRoleId: string) {
  if (confirm('Tem certeza que deseja remover este membro?')) {
     
    try {
      await organizationStore.removeOrganizationMember(memberRoleId);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Membro removido!', life: 3000 });
      await organizationStore.fetchOrganizationMembers();
    } catch (_err: unknown) {
      toast.add({ severity: 'error', summary: 'Erro', detail: getErrorMessage(_err), life: 3000 });
    }
  }
}

function startEdit(member: UserOrganizationRole) {
  editingMember.value = { ...member };
  newMember.value.user_id = member.user_id;
  newMember.value.role = member.role;
  showAddMemberForm.value = true;
  selectedUserForMembership.value = { id: member.user_id, username: member.profiles?.username, email: member.profiles?.email };
  searchUserTerm.value = member.profiles?.email || '';
}

function resetMemberForm() {
  newMember.value = { user_id: '', role: '' as UserRoleInOrganization };
  editingMember.value = null;
  showAddMemberForm.value = false;
  searchUserTerm.value = '';
  searchResults.value = [];
  showSearchResults.value = false;
  searchingUsers.value = false;
  selectedUserForMembership.value = null;
}
</script>
