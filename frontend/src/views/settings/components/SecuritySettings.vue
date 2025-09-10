<template>
  <div class="space-y-10">
    <div>
      <h2 class="text-base font-medium text-surface-800">Alterar Senha</h2>
      <div class="mt-4 space-y-4">
        <div>
          <label for="currentPassword" class="block text-xs text-surface-600 mb-1"
            >Senha atual</label
          >
          <Password
            id="currentPassword"
            v-model="currentPassword"
            class="w-full"
            :feedback="false"
            toggleMask
            size="small"
          />
        </div>
        <div>
          <label for="newPassword" class="block text-xs text-surface-600 mb-1">Nova senha</label>
          <Password
            id="newPassword"
            v-model="newPassword"
            class="w-full"
            :feedback="false"
            toggleMask
            size="small"
          />
        </div>
        <div>
          <label for="confirmNewPassword" class="block text-xs text-surface-600 mb-1"
            >Confirmar nova senha</label
          >
          <Password
            id="confirmNewPassword"
            v-model="confirmNewPassword"
            class="w-full"
            :feedback="false"
            toggleMask
            size="small"
          />
        </div>
        <button
          @click="handleUpdatePassword"
          :loading="loadingPassword"
          class="bg-zinc-900 text-white text-xs px-6 py-2 rounded-md hover:bg-surface-800 transition"
        >
          Alterar Senha
        </button>
      </div>
    </div>

    <div class="border-t border-zinc-200"></div>

    <div>
      <div class="flex justify-between items-center">
        <h2 class="text-base font-medium text-surface-800">Tokens de Acesso Pessoal</h2>
        <Button label="Novo Token" icon="pi pi-plus" severity="secondary" size="small" />
      </div>
      <p class="text-xs text-surface-600 mt-2 max-w-2xl">
        Gerencie tokens para acesso programático à sua conta
      </p>
      <div class="mt-8 text-center text-surface-500 text-sm">
        <p class="text-xs">Nenhum token de acesso criado ainda</p>
        <p class="text-xs">Crie seu primeiro token para acessar a API</p>
      </div>
    </div>

    <div class="border-t border-zinc-200"></div>

    <div>
      <div class="flex justify-between items-center">
        <h2 class="text-base font-medium text-surface-800">Conexões</h2>
        <Button label="Nova Conexão" severity="secondary" size="small" />
      </div>
      <p class="text-xs text-surface-600 mt-2 max-w-2xl">
        Aplicações e serviços conectados à sua conta
      </p>
      <div class="mt-8 text-center text-surface-500 text-sm">
        <p class="text-xs">Nenhuma conexão configurada ainda</p>
        <p class="text-xs">Conecte aplicações e serviços à sua conta</p>
      </div>
    </div>

    <div class="border-t border-zinc-200"></div>

    <div class="text-xs text-surface-500 flex items-center space-x-2">
      <i class="pi pi-clock"></i>
      <span>Último login: Hoje às 14:30 - São Paulo, Brasil</span>
    </div>

    <div class="border-t border-zinc-200"></div>

    <div>
      <h2 class="text-base font-medium text-surface-800">Excluir Conta</h2>
      <p class="mt-2 text-xs text-surface-600 max-w-2xl">
        Excluir permanentemente sua conta e todos os dados associados. Esta ação não pode ser
        desfeita.
      </p>

      <button
        @click="confirmDeleteAccount"
        class="mt-6 bg-red-600 text-white text-xs px-6 py-2 rounded-md hover:bg-red-700 transition"
      >
        Excluir Conta
      </button>
    </div>

    <Dialog
      header="Excluir Conta"
      v-model:visible="showDeleteModal"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex items-start p-2">
        <div>
          <p class="mt-2 text-xs text-surface-600">
            Esta ação é permanente e não pode ser desfeita. Todos os seus dados, organizações e
            configurações serão removidos permanentemente.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="showDeleteModal = false"
          text
          size="small"
        />
        <Button
          label="Excluir"
          icon="pi pi-check"
          @click="handleDeleteAccount"
          :loading="loadingDelete"
          severity="danger"
          size="small"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// import { useAuthStore } from '../../../stores/authStore'; // Uncomment when using in your project
import { useToast } from 'primevue/usetoast'

// PrimeVue components
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

// Mock authStore for demonstration purposes
const useAuthStore = () => ({
  updatePassword: async (password: string) => {
    console.log('Updating password:', password)
    return true
  },
  deleteUserAccount: async () => {
    console.log('Deleting account...')
    return true
  },
  error: null,
})
// ---

const authStore = useAuthStore()
const toast = useToast()

// Component State
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const loadingPassword = ref(false)
const loadingDelete = ref(false)
const showDeleteModal = ref(false)

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmNewPassword.value) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'As senhas não coincidem.',
      life: 3000,
    })
    return
  }
  if (!newPassword.value || !currentPassword.value) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Todos os campos de senha são obrigatórios.',
      life: 3000,
    })
    return
  }
  loadingPassword.value = true
  const success = await authStore.updatePassword(newPassword.value)
  if (success) {
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Senha atualizada com sucesso!',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: authStore.error || 'Falha ao atualizar a senha. Verifique sua senha atual.',
      life: 4000,
    })
  }
  loadingPassword.value = false
}

const confirmDeleteAccount = () => {
  showDeleteModal.value = true
}

const handleDeleteAccount = async () => {
  loadingDelete.value = true
  const success = await authStore.deleteUserAccount()
  if (success) {
    showDeleteModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Conta excluída com sucesso.',
      life: 5000,
    })
    // router.push('/login'); // Uncomment when using in your project
    console.log('Redirecting to /login')
  } else {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: authStore.error || 'Falha ao excluir a conta.',
      life: 3000,
    })
  }
  loadingDelete.value = false
}
</script>

<style>
/* For PrimeVue overrides if needed */
.p-password .p-inputtext {
  width: 100%;
  background-color: transparent !important; /* Fundo transparente */
}
</style>
