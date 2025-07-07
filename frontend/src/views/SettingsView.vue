<template>
  <div class="p-6 max-w-4xl mx-auto">
    <Toast />
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>

    <!-- Avatar Section -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Avatar</h2>
      <div class="flex items-center space-x-4">
        <div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl">
          <img :src="avatarUrl" alt="User Avatar" class="h-full w-full rounded-full object-cover" />
        </div>
        <input type="file" ref="avatarInput" @change="handleAvatarChange" class="hidden" accept="image/*" />
        <button @click="avatarInput?.click()" class="px-4 py-2 border border-[#10b981] text-[#10b981] rounded-md hover:bg-[#10b981] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-opacity-50">
          <i class="pi pi-image mr-2"></i>Mudar Avatar
        </button>
      </div>
    </div>

    <!-- Edit Profile Section -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Editar Perfil</h2>
      <form @submit.prevent="updateProfile">
        <div class="mb-4">
          <label for="fullName" class="block text-sm font-medium text-gray-700">Nome Completo</label>
          <InputText type="text" id="fullName" v-model="name" class="mt-1 block w-full" placeholder="Seu nome completo" />
        </div>
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700">E-mail</label>
          <InputText type="email" id="email" v-model="email" class="mt-1 block w-full bg-gray-50 cursor-not-allowed" placeholder="seu.email@example.com" disabled />
        </div>
        <Button type="submit" label="Salvar Alterações" icon="pi pi-check" class="bg-[#10b981] text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-opacity-50" />
      </form>
    </div>

    <!-- Change Password Section -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Alterar Senha</h2>
      <form @submit.prevent="changePassword" class="p-fluid">
        <div class="mb-4 w-full">
          <label for="newPassword" class="block text-sm font-medium text-gray-700">Nova Senha</label>
          <Password id="newPassword" v-model="newPassword" toggleMask :feedback="false" />
        </div>
        <div class="mb-4 w-full">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
          <Password id="confirmPassword" v-model="confirmPassword" toggleMask :feedback="false" />
        </div>
        <Button type="submit" label="Atualizar Senha" icon="pi pi-lock" class="bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" />
      </form>
    </div>

    <!-- Appearance Section -->
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Aparência</h2>
      <div class="mb-4">
        <label id="theme-label" class="block text-sm font-medium text-gray-700 mb-2">Tema</label>
        <SelectButton v-model="selectedTheme" :options="themeOptions" optionLabel="name" optionValue="value" aria-labelledby="theme-label" />
      </div>
      <div class="mb-4">
        <label for="language" class="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
        <Dropdown inputId="language" v-model="selectedLanguage" :options="languageOptions" optionLabel="name" optionValue="code" placeholder="Selecione o Idioma" />
      </div>
    </div>

    <!-- Delete Account Section -->
    <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
      <h2 class="text-xl font-semibold text-red-700 mb-4">Excluir Conta</h2>
      <p class="text-sm mb-4">
        A exclusão da sua conta é uma ação permanente e irreversível. Todos os seus dados serão removidos.
      </p>
      <button @click="deleteAccount" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
        <i class="pi pi-trash mr-2"></i>Excluir Minha Conta
      </button>
    </div>

    <!-- Avatar Modal -->
    <Dialog v-model:visible="showAvatarModal" modal header="Cortar e girar" :style="{ width: '25vw', height: 'auto' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <div class="mb-4">
        <div class="cropper-wrapper mb-4">
          <Cropper
            v-if="image.src"
            ref="cropper"
            :src="image.src"
            :stencil-props="{
              aspectRatio: 1/1
            }"
            class="cropper"
            :key="image.src"
            :wheel-zoom="true"
            @update="updateCroppedImage"
            @change="updateCroppedImage"
          />
          <div class="cropper-buttons">
            <Button icon="pi pi-search-minus" @click="zoomOut" text rounded severity="secondary" aria-label="Zoom Out" />
            <Button icon="pi pi-search-plus" @click="zoomIn" text rounded severity="secondary" aria-label="Zoom In" />
            <Button icon="pi pi-refresh" @click="rotateRight" text rounded severity="secondary" aria-label="Rotate Right" />
          </div>
        </div>
      </div>
      <div class="bg-gray-100 p-4 rounded-lg text-center mt-4">
        <h3 class="text-lg font-semibold mb-2 text-center mt-4">Nova foto do perfil</h3>
        <div class="relative w-32 h-32 mx-auto">
          <div class="w-full h-full rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center">
            <img :src="croppedImageUrl" alt="Preview" class="w-full h-full object-cover" v-if="croppedImageUrl" />
            <i class="pi pi-user text-5xl text-gray-400" v-else></i>
          </div>
          <div class="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 text-xs flex items-center justify-center" style="width: 24px; height: 24px;">
            <i class="pi pi-eye text-white"></i>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between w-full">
          <Button label="Cancelar" icon="pi pi-times" severity="secondary" text @click="closeAvatarModal" />
          <Button label="Salvar como foto do perfil" icon="pi pi-check" @click="saveNewAvatar" class="bg-[#10b981] text-white" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { supabase } from '../supabase'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'


const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const toast = useToast()

const name = ref('')
const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const avatarUrl = ref('../assets/LogoIcon.svg') // Default avatar
const showAvatarModal = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const cropper = ref<any>(null)
const image = ref({
  src: '',
  type: '',
})
const croppedImageUrl = ref<string | null>(null)
const initialStencilWidth = ref(0)
const initialZoom = ref(0)
const originalImageNaturalWidth = ref(0)
const originalImageNaturalHeight = ref(0)
let isAdjustingZoom = false

watch(showAvatarModal, (newValue) => {
  if (newValue && cropper.value) {
    // Wait for the cropper to render and get its initial state
    nextTick(() => {
      const { coordinates, image } = cropper.value.getResult()
      initialStencilWidth.value = coordinates.width
      initialZoom.value = image.zoom
    })
  }
})

onMounted(() => {
  if (user.value) {
    name.value = user.value.user_metadata?.name || ''
    email.value = user.value.email || ''
    if (user.value.user_metadata?.avatar_url) {
      avatarUrl.value = user.value.user_metadata.avatar_url
    }
  }
})

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        originalImageNaturalWidth.value = img.naturalWidth
        originalImageNaturalHeight.value = img.naturalHeight
        image.value = {
          src: e.target?.result as string,
          type: file.type,
        }
        croppedImageUrl.value = e.target?.result as string // Set initial preview
        console.log("Image src:", image.value.src) // Log the image src
        showAvatarModal.value = true
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const closeAvatarModal = () => {
  showAvatarModal.value = false
  image.value = { src: '', type: '' } // Clear image data
  croppedImageUrl.value = null // Clear cropped image preview
  if (avatarInput.value) {
    avatarInput.value.value = '' // Clear the file input
  }
}

const updateCroppedImage = ({ coordinates, image, canvas }: { coordinates: any, image: any, canvas: HTMLCanvasElement }) => {
  if (canvas) {
    croppedImageUrl.value = canvas.toDataURL(image.type)
  }

  if (isAdjustingZoom) {
    return
  }

  if (initialStencilWidth.value > 0 && cropper.value) {
    const currentStencilWidth = coordinates.width
    const currentImageZoom = image.zoom

    const stencilWidthRatio = currentStencilWidth / initialStencilWidth.value
    const newZoom = initialZoom.value * stencilWidthRatio

    isAdjustingZoom = true
    cropper.value.zoom(newZoom / currentImageZoom)
    nextTick(() => {
      isAdjustingZoom = false
    })
  }
}

const zoomIn = () => {
  if (cropper.value) {
    cropper.value.zoom(1.1)
  }
}

const zoomOut = () => {
  if (cropper.value) {
    cropper.value.zoom(0.9)
  }
}

const rotateRight = () => {
  if (cropper.value) {
    cropper.value.rotate(90)
  }
}

const saveNewAvatar = async () => {
  if (cropper.value) {
    const { canvas } = cropper.value.getResult()
    if (canvas) {
      croppedImageUrl.value = canvas.toDataURL(image.value.type) // Update preview with cropped image
      canvas.toBlob(async (blob: Blob) => {
        if (blob) {
          const fileExt = image.value.type.split('/')[1]
          const fileName = `${user.value?.id}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`

          try {
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false,
              })

            if (uploadError) throw uploadError

            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath)

            if (publicUrlData) {
              const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrlData.publicUrl },
              })

              if (updateError) throw updateError

              avatarUrl.value = publicUrlData.publicUrl
              toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Avatar atualizado com sucesso!', life: 3000 })
              closeAvatarModal()
            }
          } catch (error: any) {
            toast.add({ severity: 'error', summary: 'Erro', detail: error.message, life: 3000 })
          }
        }
      }, image.value.type)
    }
  }
}

const updateProfile = async () => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { name: name.value },
    })
    if (error) throw error
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado com sucesso!', life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: error.message, life: 3000 })
  }
}

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'As senhas não coincidem.', life: 3000 })
    return
  }

  try {
    const success = await authStore.updatePassword(newPassword.value)
    if (success) {
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Senha atualizada com sucesso!', life: 3000 })
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao atualizar senha.', life: 3000 })
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Erro', detail: error.message, life: 3000 })
  }
}

const selectedTheme = ref(localStorage.getItem('theme') || 'light');
const selectedLanguage = ref(localStorage.getItem('language') || 'pt-BR');

const themeOptions = ref([
  { name: 'Claro', value: 'light' },
  { name: 'Escuro', value: 'dark' }
]);

const languageOptions = ref([
  { name: 'Português (Brasil)', code: 'pt-BR' },
  { name: 'English (United States)', code: 'en-US' }
]);

const applyTheme = (theme: string) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', theme)
}

watch(selectedTheme, (newTheme) => {
  applyTheme(newTheme)
})

watch(selectedLanguage, (newLang) => {
  localStorage.setItem('language', newLang)
  // Aqui você pode adicionar lógica para mudar o idioma da aplicação
  // Por exemplo, usando uma biblioteca de i18n
})

onMounted(() => {
  applyTheme(selectedTheme.value)
})

const deleteAccount = async () => {
  if (confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) {
    try {
      await authStore.signOut()
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Conta excluída com sucesso!', life: 3000 })
      // Redirecionar para a página de login ou home após a exclusão
      // router.push('/login') // Se houver um router disponível
    } catch (error: any) {
      toast.add({ severity: 'error', summary: 'Erro', detail: error.message, life: 3000 })
    }
  }
}
</script>

<style>
.cropper-wrapper {
  position: relative;
  width: 100%;
  height: 300px; /* Increased height */
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000000; /* bg-gray-100 */
  border-radius: 0.5rem; /* rounded-lg */
  border: 1px solid #000000; /* border-gray-200 */
}
.cropper-buttons {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px 10px;
  border-radius: 20px;
}
.cropper {
  max-height: 100%;
  max-width: 100%;
  background: #000000; /* Slightly darker gray for the cropper itself */
}
</style>
