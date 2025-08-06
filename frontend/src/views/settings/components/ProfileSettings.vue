<template>
  <div>
    <!-- Avatar -->
    <div class="mb-8">
      <h2 class="text-lg font-medium text-surface-800 mb-4">Foto de perfil</h2>
      <div class="flex items-center gap-6">
        <img
          :src="tempAvatarPreview ?? authStore.avatarUrl ?? undefined"
          alt="Avatar"
          class="h-20 w-20 rounded-full object-cover bg-surface-200 cursor-pointer"
        />
        <input type="file" ref="fileInput" class="hidden" @change="handleAvatarSelect" accept="image/*"/>
        <button @click="triggerFileInput" class="bg-zinc-900 text-white px-4 py-2 text-sm rounded-md hover:bg-surface-800 transition">Mudar</button>
      </div>
    </div>

    <!-- Editar Perfil -->
    <div class="space-y-6">
      <h2 class="text-lg font-medium text-surface-800">Editar Perfil</h2>

      <div>
        <label for="fullName" class="block text-sm text-surface-600 mb-1">Nome</label>
        <input
          id="fullName"
          v-model="fullName"
          type="text"
          class="w-full border-0 border-b border-zinc-300 focus:ring-0 focus:border-zinc-900 placeholder:text-surface-400"
          placeholder="Digite seu nome"
        />
      </div>

      <div>
        <label for="handle" class="block text-sm text-surface-600 mb-1">Nome de usuário</label>
        <input
          id="handle"
          v-model="displayHandle"
          type="text"
          class="w-full border-0 border-b border-zinc-300 focus:ring-0 focus:border-zinc-900 placeholder:text-surface-400"
          placeholder="@usuario"
        />
      </div>

      <div>
        <label for="email" class="block text-sm text-surface-600 mb-1">E-mail</label>
        <input
          id="email"
          :value="authStore.user?.email"
          disabled
          class="w-full bg-surface-100 text-surface-500 cursor-not-allowed border-0 border-b border-zinc-200"
        />
      </div>

      <button
        @click="handleUpdateProfile"
        :disabled="loadingProfile"
        class="bg-zinc-900 text-white text-sm px-6 py-2 rounded-md hover:bg-surface-800 transition"
      >
        Salvar Alterações
      </button>
    </div>
    <!-- Image Cropper Modal -->
    <Dialog
      v-model:visible="showCropperModal"
      :modal="true"
      :closable="false"
      :style="{ width: '500px' }"
      class="p-dialog-cropper"
    >
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Cortar e girar</h2>
        <div
          class="cropper-container flex justify-center items-center bg-surface-900 rounded-md overflow-hidden relative"
          style="height: 300px"
        >
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
            <Button
              class="p-button-rounded p-button-text p-button-plain"
              @click="zoomOut"
            >
              <i class="pi pi-search-minus"></i>
            </Button>
            <Button
              class="p-button-rounded p-button-text p-button-plain"
              @click="zoomIn"
            >
              <i class="pi pi-search-plus"></i>
            </Button>
            <Button
              class="p-button-rounded p-button-text p-button-plain"
              @click="rotate"
            >
              <i class="pi pi-refresh"></i>
            </Button>
          </div>
        </div>
        <div class="flex flex-col items-center mt-6 p-4 bg-surface-100 rounded-lg">
          <h3 class="text-xl font-semibold mb-3">Nova foto do perfil</h3>
          <div class="relative mb-4">
            <img
              :src="croppedImagePreviewUrl ?? undefined"
              alt="Preview"
              class="h-32 w-32 rounded-full object-cover bg-surface-200 shadow-md border-4 border-white"
            />
            <span
              class="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1 text-xs flex items-center justify-center"
              style="width: 24px; height: 24px"
            >
              <i class="pi pi-eye"></i>
            </span>
          </div>
        </div>
        <div class="flex justify-between w-full mt-4">
          <Button
            @click="cancelCropping"
            class="p-button-text p-button-secondary"
          >
            <i class="pi pi-times"></i> Cancelar
          </Button>
          <Button
            @click="saveCroppedImage"
            :loading="loadingAvatarUpload"
            class="p-button-emerald"
          >
            <i class="pi pi-check"></i> Salvar como foto do perfil
          </Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const authStore = useAuthStore();
const toast = useToast();

const fullName = ref('');
const handle = ref('');
const loadingProfile = ref(false);

const displayHandle = computed<string>({
  get() {
    return handle.value ? `@${handle.value}` : '';
  },
  set(value: string) {
    handle.value = value.startsWith('@') ? value.substring(1) : value;
  },
});

const showCropperModal = ref(false);
const imageSrc = ref('');
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);
const loadingAvatarUpload = ref(false);
const tempAvatarPreview = ref<string | null>(null);
const croppedImagePreviewUrl = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  fullName.value = authStore.username || '';
  handle.value = authStore.handle || '';
});

const handleAvatarSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageSrc.value = e.target?.result as string;
      showCropperModal.value = true;
      tempAvatarPreview.value = null;
      croppedImagePreviewUrl.value = null;
    };
    reader.readAsDataURL(file);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onCropperChange = () => {
  if (cropperRef.value) {
    const { canvas } = cropperRef.value.getResult();
    if (canvas) {
      croppedImagePreviewUrl.value = canvas.toDataURL('image/png');
    }
  }
};

const saveCroppedImage = async () => {
  if (cropperRef.value) {
    loadingAvatarUpload.value = true;
    const { canvas } = cropperRef.value.getResult();
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const success = await authStore.uploadAvatar(blob);
          if (success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Avatar atualizado!', life: 3000 });
            showCropperModal.value = false;
            tempAvatarPreview.value = URL.createObjectURL(blob);
          } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao atualizar o avatar.', life: 3000 });
          }
        } else {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao obter a imagem cortada.', life: 3000 });
        }
        loadingAvatarUpload.value = false;
      }, 'image/png');
    }
  }
};

const cancelCropping = () => {
  showCropperModal.value = false;
  imageSrc.value = '';
  croppedImagePreviewUrl.value = null;
};

const zoomIn = () => cropperRef.value?.zoom(1.1);
const zoomOut = () => cropperRef.value?.zoom(0.9);
const rotate = () => cropperRef.value?.rotate(90);

const handleUpdateProfile = async () => {
  loadingProfile.value = true;
  const profileUpdateSuccess = await authStore.updateUserProfile(fullName.value, handle.value);
  if (profileUpdateSuccess) {
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado!', life: 3000 });
    tempAvatarPreview.value = null;
  } else {
    toast.add({ severity: 'error', summary: 'Erro', detail: authStore.error || 'Falha ao atualizar o perfil.', life: 3000 });
  }
  loadingProfile.value = false;
};
</script>