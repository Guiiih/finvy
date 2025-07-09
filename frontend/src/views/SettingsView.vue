<template>
  <div class="p-6 min-h-screen">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const languageStore = useLanguageStore()
const toast = useToast()
const router = useRouter()

const fullName = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

const loadingProfile = ref(false)
const loadingPassword = ref(false)
const loadingDelete = ref(false)
const showDeleteModal = ref(false)

// Avatar Cropper
const showCropperModal = ref(false)
const imageSrc = ref('')
const cropperRef = ref<any>(null)
const loadingAvatarUpload = ref(false)
const tempAvatarPreview = ref<string | null>(null)
const croppedImagePreviewUrl = ref<string | null>(null)
const croppedBlobToSave = ref<Blob | null>(null)

const fileInput = ref<HTMLInputElement | null>(null)

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

onMounted(() => {
  fullName.value = authStore.username || ''
  console.log('UserConfigurationView mounted. authStore.avatarUrl:', authStore.avatarUrl)
  console.log('authStore.user:', authStore.user)
})

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
      canvas.toBlob(async (blob: Blob) => {
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

  const profileUpdateSuccess = await authStore.updateUserProfile(fullName.value)
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

const changeTheme = (event: any) => {
  themeStore.setTheme(event.value.value);
}

const changeLanguage = (event: any) => {
  languageStore.setLanguage(event.value)
}
</script>