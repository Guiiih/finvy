<template>
  <div class="p-4 sm:p-6 min-h-screen">
    <div class="max-w-4xl mx-auto p-8">
      <h1 class="text-3xl font-bold text-surface-800 mb-8 border-b pb-4">Configurações da Conta</h1>

      <!-- Seção de Avatar -->
      <div class="mb-8 p-6 border rounded-lg bg-surface-50">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">Avatar</h2>
        <div class="flex items-center space-x-6">
          <img :src="tempAvatarPreview ?? authStore.avatarUrl ?? undefined" alt="Avatar" class="h-24 w-24 rounded-full object-cover bg-surface-200 cursor-pointer shadow-lg" @click="triggerFileInput" />
          <input type="file" ref="fileInput" @change="handleAvatarSelect" accept="image/*" class="hidden" />
          <Button label="Mudar Avatar" icon="pi pi-image" class="p-button-outlined" @click="triggerFileInput" />
        </div>
      </div>

      <!-- Seção de Perfil -->
      <div class="mb-8 p-6 border rounded-lg bg-surface-50">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">Editar Perfil</h2>
        <div class="space-y-4">
          <div>
            <label for="fullName" class="block text-sm font-medium text-surface-700 mb-1">Nome</label>
            <InputText id="fullName" v-model="fullName" class="w-full p-3 border border-surface-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" />
          </div>
          <div>
            <label for="handle" class="block text-sm font-medium text-surface-700 mb-1">Nome de usuário</label>
            <InputText id="handle" v-model="displayHandle" class="w-full p-3 border border-surface-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-surface-700 mb-1">E-mail</label>
            <InputText id="email" :model-value="authStore.user?.email" class="w-full p-3 border border-surface-300 rounded-md bg-surface-100 cursor-not-allowed" disabled />
          </div>
          <Button label="Salvar Alterações" icon="pi pi-check" @click="handleUpdateProfile" :loading="loadingProfile" class="p-button-primary mt-4" />
        </div>
      </div>

      <!-- Seção de Senha -->
      <div class="mb-8 p-6 border rounded-lg bg-surface-50">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">Alterar Senha</h2>
        <div class="space-y-4">
          <div>
            <label for="newPassword" class="block text-sm font-medium text-surface-700 mb-1">Nova Senha</label>
            <Password id="newPassword" v-model="newPassword" class=" rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200" :feedback="false" toggleMask />
          </div>
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-surface-700 mb-1">Confirmar Nova Senha</label>
            <Password id="confirmPassword" v-model="confirmNewPassword" class=" rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200" :feedback="false" toggleMask />
          </div>
          <Button label="Atualizar Senha" icon="pi pi-lock" @click="handleUpdatePassword" :loading="loadingPassword" class="p-button-primary mt-4" />
        </div>
      </div>

      <!-- Seção de Aparência -->
      <div class="mb-8 p-6 border rounded-lg bg-surface-50">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">Aparência</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-2">Tema</label>
            <SelectButton v-model="themeStore.theme" :options="themeOptions" optionLabel="name" dataKey="value" @change="changeTheme" class="p-button-outlined" />
          </div>
          <div>
            <label for="language" class="block text-sm font-medium text-surface-700 mb-1">Idioma</label>
            <Dropdown id="language" v-model="languageStore.language" :options="languageOptions" optionLabel="name" optionValue="code" class="w-full md:w-1/4 p-button-outlined" @change="changeLanguage" />
          </div>
        </div>
      </div>

      <!-- Seção de Criação de Organização -->
      <div class="mb-8 p-6 border rounded-lg bg-surface-50">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">Criar Nova Organização</h2>
        <form @submit.prevent="handleCreateOrganization" class="space-y-4">
          <div>
            <label for="newOrganizationName" class="block text-sm font-medium text-gray-700">Nome da Organização:</label>
            <input
              type="text"
              id="newOrganizationName"
              v-model="newOrganizationName"
              placeholder="Nome da Organização"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button type="submit" class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50" :disabled="organizationSelectionStore.loading">
            {{ organizationSelectionStore.loading ? 'Criando...' : 'Criar Organização' }}
          </button>
        </form>
      </div>

      <!-- Seção de Gerenciamento de Organização -->
      <div class="mb-8 p-6 border rounded-lg bg-surface-50">
        <h2 class="text-2xl font-semibold text-surface-700 mb-4">Gerenciamento de Organização</h2>

        <!-- Personal Workspace Section (if personal organization exists and is not active) -->
        <div v-if="organizationSelectionStore.personalOrganization && organizationSelectionStore.activeOrganization?.id !== organizationSelectionStore.personalOrganization.id" class="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
          <h3 class="text-xl font-semibold text-blue-800 mb-3">Seu Workspace Pessoal</h3>
          <p class="text-blue-700 mb-4">
            Você tem uma organização pessoal: <strong>{{ organizationSelectionStore.personalOrganization.name }}</strong>.
            Use-a como seu espaço de trabalho individual.
          </p>
          <button
            @click="setActivePersonalOrganization"
            class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
          >
            Ativar Workspace Pessoal
          </button>
        </div>

        <div v-if="!organizationSelectionStore.activeOrganization" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p class="font-bold">Nenhuma Organização Ativa</p>
          <p>Seu usuário não está associado a nenhuma organização ativa. Crie uma nova ou selecione uma existente.</p>
        </div>

        <div v-else>
          <h3 class="text-xl font-semibold mb-3">Organização Atual: {{ organizationSelectionStore.activeOrganization.name }} <span v-if="organizationSelectionStore.activeOrganization.is_personal">(Pessoal)</span></h3>

          <!-- Detalhes da Organização -->
          <div class="space-y-4 mb-6">
            <div>
              <label for="orgCnpj" class="block text-sm font-medium text-gray-700">CNPJ:</label>
              <InputText id="orgCnpj" v-model="orgCnpj" class="w-full p-3 border border-surface-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" />
            </div>
            <div>
              <label for="orgRazaoSocial" class="block text-sm font-medium text-gray-700">Razão Social:</label>
              <InputText id="orgRazaoSocial" v-model="orgRazaoSocial" class="w-full p-3 border border-surface-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" />
            </div>
            <div>
              <label for="orgUf" class="block text-sm font-medium text-gray-700">UF:</label>
              <InputText id="orgUf" v-model="orgUf" class="w-full p-3 border border-surface-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" />
            </div>
            <div>
              <label for="orgMunicipio" class="block text-sm font-medium text-gray-700">Município:</label>
              <InputText id="orgMunicipio" v-model="orgMunicipio" class="w-full p-3 border border-surface-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" />
            </div>
            <Button label="Salvar Detalhes da Organização" icon="pi pi-save" @click="handleUpdateOrganizationDetails" :loading="organizationSelectionStore.loading" class="p-button-primary mt-4" />
          </div>

          <!-- Seletor de Organização -->
          <div class="mb-4">
            <label for="selectOrganization" class="block text-sm font-medium text-gray-700">Selecionar Organização:</label>
            <select
              id="selectOrganization"
              v-model="selectedOrganizationId"
              @change="handleOrganizationChange"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option v-for="org in organizationSelectionStore.accessibleOrganizations" :key="org.id" :value="org.id">
                {{ org.name }} <span v-if="org.is_personal">(Pessoal)</span> <span v-if="org.is_shared">(Compartilhado por {{ org.shared_from_user_name }})</span>
              </option>
            </select>
          </div>

          <!-- Botão para Excluir Organização (apenas se não for pessoal) -->
          <div v-if="organizationSelectionStore.activeOrganization && !organizationSelectionStore.activeOrganization.is_personal" class="mb-4">
            <button
              @click="confirmDeleteOrganization(organizationSelectionStore.activeOrganization.id)"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Excluir Organização Atual
            </button>
          </div>

          <!-- Gerenciamento de Membros -->
          <h3 class="text-xl font-semibold mb-3 mt-6">Membros da Organização</h3>
          <div v-if="organizationSelectionStore.activeOrganization.is_personal" class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
            <p>Organizações pessoais não permitem gerenciamento de membros.</p>
          </div>
          <div v-else>
            <!-- Search and Add Member Button -->
            <div class="mb-6 flex items-center space-x-4">
              <div class="relative flex-grow">
                <input
                  type="text"
                  v-model="memberSearchTerm"
                  placeholder="Buscar membro por nome ou email"
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <button
                v-if="organizationStore.isCurrentUserOwnerOrAdmin"
                @click="showAddMemberForm = !showAddMemberForm; editingMember = null"
                class="px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition duration-300 ease-in-out"
              >
                {{ showAddMemberForm ? 'Fechar Formulário' : 'Adicionar Membro' }}
              </button>
            </div>

            <!-- Add/Edit Member Form (for Owners/Admins) -->
            <div v-if="showAddMemberForm && organizationStore.isCurrentUserOwnerOrAdmin" class="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
              <h4 class="text-xl font-semibold mb-4">{{ editingMember ? 'Editar Membro' : 'Adicionar Novo Membro' }}</h4>
              <form @submit.prevent="handleSubmitMember" class="space-y-4">
                <div>
                  <label for="memberSearch" class="block text-sm font-medium text-gray-700">Buscar Usuário (Email):</label>
                  <input
                      type="text"
                      id="memberSearch"
                      v-model="searchUserTerm"
                      placeholder="Email do Usuário"
                      @input="debounceSearchUsers"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  <div v-if="showSearchResults && searchResults.length > 0" class="mt-2 border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto bg-white">
                    <ul class="divide-y divide-gray-200">
                      <li v-for="user in searchResults" :key="user.id" @click="selectUser(user)" class="p-3 hover:bg-gray-100 cursor-pointer">
                        <p class="font-medium">{{ user.username || user.email }}</p>
                        <p class="text-sm text-gray-500">{{ user.email }}</p>
                      </li>
                    </ul>
                  </div>
                  <div v-else-if="showSearchResults && !searchingUsers && searchResults.length === 0 && searchUserTerm.length > 0" class="mt-2 p-3 text-sm text-gray-500">
                    Nenhum usuário encontrado com este email.
                  </div>
                  <div v-else-if="searchUserTerm.length > 0 && !isValidEmail" class="mt-2 p-3 text-sm text-red-500">
                    Por favor, insira um email válido para buscar.
                  </div>
                </div>
                <div v-if="selectedUserForMembership">
                  <label class="block text-sm font-medium text-gray-700">Usuário Selecionado:</label>
                  <p class="mt-1 p-3 border border-gray-300 rounded-md bg-gray-100">{{ selectedUserForMembership.username || selectedUserForMembership.email }}</p>
                </div>
                <div>
                  <label for="memberRole" class="block text-sm font-medium text-gray-700">Papel:</label>
                  <select
                    id="memberRole"
                    v-model="newMember.role"
                    required
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Selecione um papel</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Membro</option>
                    <option value="guest">Convidado</option>
                  </select>
                </div>
                <button
                  type="submit"
                  :disabled="organizationStore.loading"
                  class="px-4 py-2 bg-emerald-400 text-white rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-50"
                >
                  {{ organizationStore.loading ? 'Processando...' : (editingMember ? 'Atualizar Membro' : 'Adicionar Membro') }}
                </button>
              </form>
            </div>

            <!-- Member List (for all members) -->
            <div class="bg-white p-4 rounded-lg shadow-sm">
              <h4 class="text-xl font-semibold mb-3">Membros Atuais</h4>
              <p v-if="organizationStore.loading" class="text-gray-600">Carregando membros...</p>
              <p v-else-if="organizationStore.error" class="text-red-500">
                Erro ao carregar membros: {{ organizationStore.error }}
              </p>
              <ul v-else-if="filteredMembers.length > 0" class="space-y-3">
                <li
                  v-for="member in filteredMembers"
                  :key="member.id"
                  class="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div class="flex items-center space-x-4">
                    <img :src="member.profiles?.avatar_url || undefined" alt="Avatar" class="h-12 w-12 rounded-full object-cover bg-surface-200 shadow-sm" />
                    <div>
                      <p class="font-semibold text-lg text-gray-800">{{ member.profiles?.username || member.user_id }}</p>
                      <p class="text-sm text-gray-500">{{ member.profiles?.email }}</p>
                      <span class="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-200 text-indigo-800">
                        {{ member.role }}
                      </span>
                    </div>
                  </div>
                  <div v-if="organizationStore.isCurrentUserOwnerOrAdmin" class="flex items-center space-x-2">
                    <button @click="startEdit(member)" class="p-2 rounded-full hover:bg-yellow-100 text-yellow-600 transition duration-300 ease-in-out" title="Editar">
                        <i class="pi pi-pencil w-5 h-5"></i>
                      </button>
                    <button @click="removeMember(member.id)" class="p-2 rounded-full hover:bg-red-100 text-red-600 transition duration-300 ease-in-out" v-tooltip.top="'Remover'" >
                      <i class="pi pi-trash w-5 h-5"></i>
                    </button>
                  </div>
                </li>
              </ul>
              <p v-else class="text-gray-600">Nenhum membro encontrado nesta organização.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção de Exclusão de Conta -->
      <div class="p-6 border rounded-lg bg-red-50 border-red-200">
        <h2 class="text-2xl font-semibold text-red-700 mb-4">Excluir Conta</h2>
        <p class="text-red-600 mb-4">A exclusão da sua conta é uma ação permanente e irreversível. Todos os seus dados serão removidos.</p>
        <Button label="Excluir Minha Conta" icon="pi pi-trash" severity="danger" @click="confirmDeleteAccount" class="p-button-danger" />
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <Dialog header="Confirmar Exclusão" v-model:visible="showDeleteModal" :modal="true" :style="{ width: '450px' }" class="p-dialog-confirm">
      <div class="flex items-center p-4">
        <i class="pi pi-exclamation-triangle mr-3 text-red-500" style="font-size: 2rem;"></i>
        <span class="text-surface-700">
          Você tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
        </span>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" @click="showDeleteModal = false" class="p-button-text" />
        <Button label="Excluir" icon="pi pi-check" @click="handleDeleteAccount" :loading="loadingDelete" class="p-button-danger" />
      </template>
    </Dialog>

    <!-- Modal de Confirmação de Exclusão de Organização -->
    <Dialog header="Confirmar Exclusão da Organização" v-model:visible="showDeleteOrganizationModal" :modal="true" :style="{ width: '450px' }" class="p-dialog-confirm">
      <div class="flex items-center p-4">
        <i class="pi pi-exclamation-triangle mr-3 text-red-500" style="font-size: 2rem;"></i>
        <span class="text-surface-700">
          Você tem certeza que deseja excluir esta organização? Esta ação é irreversível e todos os dados associados a ela serão removidos.
        </span>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" @click="showDeleteOrganizationModal = false" class="p-button-text" />
        <Button label="Excluir Organização" icon="pi pi-check" @click="handleDeleteOrganization" :loading="organizationSelectionStore.loading" class="p-button-danger" />
      </template>
    </Dialog>

    <!-- Modal de Corte de Imagem -->
    <Dialog v-model:visible="showCropperModal" :modal="true" :closable="false" :style="{ width: '500px' }" class="p-dialog-cropper">
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Cortar e girar</h2>
        <div class="cropper-container flex justify-center items-center bg-surface-800 rounded-md overflow-hidden relative" style="height: 300px;">
          <Cropper
            ref="cropperRef"
            :src="imageSrc"
            :stencil-props="{ aspectRatio: 1 / 1 }"
            :auto-zoom="true"
            image-restriction="stencil"
            @change="onCropperChange"
            class="cropper-instance"
          />
          <!-- New buttons for zoom and rotate -->
          <div class="cropper-buttons">
            <Button icon="pi pi-search-minus" class="p-button-rounded p-button-text p-button-plain" @click="zoomOut" />
            <Button icon="pi pi-search-plus" class="p-button-rounded p-button-text p-button-plain" @click="zoomIn" />
            <Button icon="pi pi-refresh" class="p-button-rounded p-button-text p-button-plain" @click="rotate" />
          </div>
        </div>
        <div class="flex flex-col items-center mt-6 p-4 bg-surface-100 rounded-lg">
          <h3 class="text-xl font-semibold mb-3">Nova foto do perfil</h3>
          <div class="relative mb-4">
            <img :src="croppedImagePreviewUrl ?? undefined" alt="Preview" class="h-32 w-32 rounded-full object-cover bg-surface-200 shadow-md border-4 border-white" />
            <span class="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 text-xs flex items-center justify-center" style="width: 24px; height: 24px;">
              <i class="pi pi-eye"></i>
            </span>
          </div>
        </div>
        <div class="flex justify-between w-full mt-4">
          <Button label="Cancelar" icon="pi pi-times" @click="cancelCropping" class="p-button-text p-button-secondary" />
          <Button label="Salvar como foto do perfil" icon="pi pi-check" @click="saveCroppedImage" :loading="loadingAvatarUpload" class="p-button-primary" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useOrganizationStore } from '@/stores/organizationStore' // Import organizationStore
import { useOrganizationSelectionStore } from '@/stores/organizationSelectionStore' // Import organizationSelectionStore
import { useToast } from 'primevue/usetoast'
import { api } from '@/services/api';
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import type { UserOrganizationRole, UserRoleInOrganization, User } from '@/types'; // Import types


const authStore = useAuthStore()
const themeStore = useThemeStore()
const languageStore = useLanguageStore()
const organizationStore = useOrganizationStore() // Initialize organizationStore
const organizationSelectionStore = useOrganizationSelectionStore() // Initialize organizationSelectionStore
const toast = useToast()
const router = useRouter()

const fullName = ref('')
const handle = ref('')

const displayHandle = computed<string>({
  get() {
    return handle.value ? `@${handle.value}` : '';
  },
  set(value: string) {
    handle.value = value.startsWith('@') ? value.substring(1) : value;
  },
});
const newPassword = ref('')
const confirmNewPassword = ref('')

const loadingProfile = ref(false)
const loadingPassword = ref(false)
const loadingDelete = ref(false)
const showDeleteModal = ref(false)
const showDeleteOrganizationModal = ref(false); // New state for organization deletion modal
const organizationToDeleteId = ref<string | null>(null); // New state to store ID of org to delete

// Avatar Cropper
const showCropperModal = ref(false)
const imageSrc = ref('')
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const loadingAvatarUpload = ref(false)
const tempAvatarPreview = ref<string | null>(null)
const croppedImagePreviewUrl = ref<string | null>(null)
const croppedBlobToSave = ref<Blob | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)

// Organization Management State
const newOrganizationName = ref('');
const selectedOrganizationId = ref<string | null>(null);

// Organization Details for Editing
const orgCnpj = ref<string | null>(null);
const orgRazaoSocial = ref<string | null>(null);
const orgUf = ref<string | null>(null);
const orgMunicipio = ref<string | null>(null);

const memberSearchTerm = ref('');
const showAddMemberForm = ref(false);
const editingMember = ref<UserOrganizationRole | null>(null);
const newMember = ref({
  user_id: '',
  role: '' as UserRoleInOrganization,
});

const searchUserTerm = ref('');
const searchResults = ref<any[]>([]);
const showSearchResults = ref(false);
const searchingUsers = ref(false);
const selectedUserForMembership = ref<any | null>(null);

const filteredMembers = computed(() => {
  const lowerCaseSearchTerm = memberSearchTerm.value.toLowerCase();
  return organizationStore.organizationMembers.filter(member =>
    member.profiles?.username?.toLowerCase().includes(lowerCaseSearchTerm) ||
    member.profiles?.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
    member.user_id.toLowerCase().includes(lowerCaseSearchTerm)
  );
});

// Theme options
const themeOptions = ref([
  { name: 'Claro', value: 'light' },
  { name: 'Escuro', value: 'dark' }
])

// Language options
const languageOptions = ref([
  { name: 'Português (Brasil)', code: 'pt-BR' },
  { name: 'English', code: 'en-US' }
])

onMounted(async () => {
  fullName.value = authStore.username || ''
  handle.value = authStore.handle || ''
  console.log('UserConfigurationView mounted. authStore.avatarUrl:', authStore.avatarUrl)
  console.log('authStore.user:', authStore.user)

  // Fetch organizations and members on mount
  await organizationSelectionStore.fetchUserOrganizations();
  if (organizationSelectionStore.activeOrganization) {
    selectedOrganizationId.value = organizationSelectionStore.activeOrganization.id;
    orgCnpj.value = organizationSelectionStore.activeOrganization.cnpj || null;
    orgRazaoSocial.value = organizationSelectionStore.activeOrganization.razao_social || null;
    orgUf.value = organizationSelectionStore.activeOrganization.uf || null;
    orgMunicipio.value = organizationSelectionStore.activeOrganization.municipio || null;
    await organizationStore.fetchOrganizationMembers();
  }
});

// Watch for changes in active organization to refetch members and update organization details
watch(() => organizationSelectionStore.activeOrganization, async (newOrg) => {
  if (newOrg) {
    selectedOrganizationId.value = newOrg.id;
    orgCnpj.value = newOrg.cnpj || null;
    orgRazaoSocial.value = newOrg.razao_social || null;
    orgUf.value = newOrg.uf || null;
    orgMunicipio.value = newOrg.municipio || null;
    await organizationStore.fetchOrganizationMembers();
  } else {
    organizationStore.organizationMembers = []; // Clear members if no active organization
    orgCnpj.value = null;
    orgRazaoSocial.value = null;
    orgUf.value = null;
    orgMunicipio.value = null;
  }
});

const handleAvatarSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageSrc.value = e.target?.result as string
      showCropperModal.value = true
      // Limpa a pré-visualização temporária e o blob cortado ao selecionar nova imagem
      tempAvatarPreview.value = null
      croppedBlobToSave.value = null
      croppedImagePreviewUrl.value = null
    }
    reader.readAsDataURL(file)
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onCropperChange = () => {
  // Atualiza a pré-visualização em tempo real enquanto o usuário corta
  if (cropperRef.value) {
    const { canvas } = cropperRef.value.getResult()
    if (canvas) {
      croppedImagePreviewUrl.value = canvas.toDataURL('image/png')
    }
  }
}

const saveCroppedImage = async () => {
  if (cropperRef.value) {
    loadingAvatarUpload.value = true
    const { canvas } = cropperRef.value.getResult()
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const success = await authStore.uploadAvatar(blob)
          if (success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Avatar atualizado com sucesso!', life: 3000 })
            showCropperModal.value = false
            tempAvatarPreview.value = URL.createObjectURL(blob) // Atualiza a miniatura imediatamente
          } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao atualizar o avatar.', life: 3000 })
          }
        } else {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao obter a imagem cortada.', life: 3000 })
        }
        loadingAvatarUpload.value = false
      }, 'image/png') // Você pode escolher o formato da imagem de saída
    }
  }
}

const cancelCropping = () => {
  showCropperModal.value = false
  imageSrc.value = ''
  croppedBlobToSave.value = null
  croppedImagePreviewUrl.value = null
}

const zoomIn = () => {
  if (cropperRef.value) {
    cropperRef.value.zoom(1.1)
  }
}

const zoomOut = () => {
  if (cropperRef.value) {
    cropperRef.value.zoom(0.9)
  }
}

const rotate = () => {
  if (cropperRef.value) {
    cropperRef.value.rotate(90)
  }
}

const handleUpdateProfile = async () => {
  loadingProfile.value = true

  const profileUpdateSuccess = await authStore.updateUserProfile(fullName.value, handle.value)
  if (profileUpdateSuccess) {
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso!', life: 3000 })
    tempAvatarPreview.value = null // Limpa a pré-visualização temporária
  } else {
    toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao atualizar o perfil.', life: 3000 })
  }
  loadingProfile.value = false
}

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmNewPassword.value) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'As senhas não coincidem.', life: 3000 })
    return
  }
  if (!newPassword.value) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'A nova senha não pode estar em branco.', life: 3000 })
    return
  }
  loadingPassword.value = true
  const success = await authStore.updatePassword(newPassword.value)
  if (success) {
    newPassword.value = ''
    confirmNewPassword.value = ''
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Senha atualizada com sucesso!', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao atualizar a senha.', life: 3000 })
  }
  loadingPassword.value = false
}

const confirmDeleteAccount = () => {
  showDeleteModal.value = true
}

const confirmDeleteOrganization = (orgId: string) => {
  organizationToDeleteId.value = orgId;
  showDeleteOrganizationModal.value = true;
};

const handleDeleteAccount = async () => {
  loadingDelete.value = true
  const success = await authStore.deleteUserAccount()
  if (success) {
    showDeleteModal.value = false
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Conta excluída com sucesso.', life: 5000 })
    router.push('/login') // Redireciona para a página de login
  } else {
    toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao excluir a conta.', life: 3000 })
  }
  loadingDelete.value = false
}

async function handleDeleteOrganization() {
  if (!organizationToDeleteId.value) return;

  try {
    await organizationSelectionStore.deleteOrganization(organizationToDeleteId.value);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Organização excluída com sucesso!', life: 3000 });
    showDeleteOrganizationModal.value = false;
    organizationToDeleteId.value = null;
    // After deletion, re-fetch organizations and potentially redirect or set a new active org
    await organizationSelectionStore.fetchUserOrganizations();
    router.push('/settings'); // Stay on settings or redirect to a dashboard
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao excluir organização.', life: 3000 });
  }
}

async function handleUpdateOrganizationDetails() {
  if (!organizationSelectionStore.activeOrganization) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nenhuma organização ativa para atualizar.', life: 3000 });
    return;
  }

  try {
    await organizationSelectionStore.updateOrganizationDetails(
      organizationSelectionStore.activeOrganization.id,
      {
        cnpj: orgCnpj.value,
        razao_social: orgRazaoSocial.value,
        uf: orgUf.value,
        municipio: orgMunicipio.value,
      }
    );
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Detalhes da organização atualizados com sucesso!', life: 3000 });
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao atualizar detalhes da organização.', life: 3000 });
  }
}

const changeTheme = (event: { value: { value: string } }) => {
  themeStore.setTheme(event.value.value);
}

const changeLanguage = (event: { value: string }) => {
  languageStore.setLanguage(event.value)
}

// Organization Management Functions
async function handleCreateOrganization() {
  if (!newOrganizationName.value) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O nome da organização é obrigatório.', life: 3000 });
    return;
  }

  try {
    await organizationSelectionStore.createOrganization(newOrganizationName.value);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Organização criada com sucesso!', life: 3000 });
    newOrganizationName.value = ''; // Clear form
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao criar organização.', life: 3000 });
  }
}

async function setActivePersonalOrganization() {
  if (organizationSelectionStore.personalOrganization) {
    try {
      await organizationSelectionStore.setActiveOrganization(organizationSelectionStore.personalOrganization.id);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Workspace pessoal ativado com sucesso!', life: 3000 });
    } catch (err: any) {
      toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao ativar workspace pessoal.', life: 3000 });
    }
  }
}

async function handleOrganizationChange() {
  if (selectedOrganizationId.value) {
    try {
      await organizationSelectionStore.setActiveOrganization(selectedOrganizationId.value);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Organização ativa alterada com sucesso!', life: 3000 });
    } catch (err: any) {
      toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Falha ao alterar organização ativa.', life: 3000 });
    }
  }
}

let searchTimeout: ReturnType<typeof setTimeout>;

const isValidEmail = computed(() => {
  // Basic email validation regex
  const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(searchUserTerm.value);
});

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
  } catch (err: unknown) {
    console.error('Erro ao buscar usuários:', err);
    toast.add({ severity: 'error', summary: 'Erro', detail: err instanceof Error ? err.message : 'Falha ao buscar usuários.', life: 3000 });
    searchResults.value = [];
    showSearchResults.value = false;
  } finally {
    searchingUsers.value = false;
  }
}

function debounceSearchUsers() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (isValidEmail.value) {
      searchUsers();
    } else {
      searchResults.value = [];
      showSearchResults.value = false;
    }
  }, 500); // Debounce por 500ms
}

function selectUser(user: User) {
  selectedUserForMembership.value = user;
  newMember.value.user_id = user.id; // Define o user_id real para o envio
  searchUserTerm.value = user.username || user.email; // Exibe o nome/email no campo de busca
  showSearchResults.value = false; // Esconde os resultados da busca
}

async function handleSubmitMember() {
  if (!selectedUserForMembership.value || !newMember.value.role) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um usuário e um papel.', life: 3000 });
    return;
  }

  try {
    if (editingMember.value) {
      // Update existing member
      await organizationStore.updateOrganizationMemberRole(editingMember.value.id, newMember.value.role);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Papel do membro atualizado com sucesso!', life: 3000 });
    } else {
      // Add new member
      await organizationStore.addOrganizationMember(newMember.value.user_id, newMember.value.role);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Membro adicionado com sucesso!', life: 3000 });
    }
    resetMemberForm();
    await organizationStore.fetchOrganizationMembers(); // Refresh the list
  } catch (err: unknown) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err instanceof Error ? err.message : 'Falha na operação.', life: 3000 });
  }
}

async function removeMember(memberRoleId: string) {
  if (confirm('Tem certeza que deseja remover este membro da organização?')) {
    try {
      await organizationStore.removeOrganizationMember(memberRoleId);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Membro removido com sucesso!', life: 3000 });
      await organizationStore.fetchOrganizationMembers(); // Refresh the list
    } catch (err: unknown) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err instanceof Error ? err.message : 'Falha ao remover membro.', life: 3000 });
  }
  }
}

function startEdit(member: UserOrganizationRole) {
  editingMember.value = { ...member };
  newMember.value.user_id = member.user_id;
  newMember.value.role = member.role;
  showAddMemberForm.value = true;

  // Pre-fill search term and selected user information consistently
  const displayName = member.profiles?.username || member.profiles?.email || member.user_id;
  searchUserTerm.value = displayName;
  selectedUserForMembership.value = {
    id: member.user_id,
    username: member.profiles?.username,
    email: member.profiles?.email,
  };
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

