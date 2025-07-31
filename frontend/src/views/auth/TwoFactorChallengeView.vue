<template>
  <div class="flex items-center justify-center min-h-screen bg-surface-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-surface-800">Verificação de Dois Fatores</h2>
        <p class="mt-2 text-sm text-surface-600">
          Digite o código do seu aplicativo autenticador para continuar.
        </p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label for="2fa-code" class="sr-only">Código de 6 dígitos</label>
            <InputText
              id="2fa-code"
              v-model="code"
              type="text"
              placeholder="Digite o código de 6 dígitos"
              class="w-full"
              :class="{ 'p-invalid': authStore.error }"
            />
            <small v-if="authStore.error" class="p-error mt-1">{{ authStore.error }}</small>
          </div>

          <Button
            type="submit"
            label="Verificar Código"
            class="w-full"
            :loading="authStore.loading"
          />
        </div>
      </form>

       <div class="text-center mt-4">
            <Button label="Usar um código de backup" text @click="showBackupChallenge = !showBackupChallenge" />
        </div>

        <div v-if="showBackupChallenge" class="mt-4">
             <InputText
              v-model="backupCode"
              type="text"
              placeholder="Digite um código de backup"
              class="w-full"
              :class="{ 'p-invalid': authStore.error }"
            />
            <Button
                label="Verificar com Backup"
                class="w-full mt-2"
                :loading="authStore.loading"
                @click="handleBackupSubmit"
                severity="secondary"
            />
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const code = ref('');
const backupCode = ref('');
const showBackupChallenge = ref(false);
const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  const success = await authStore.verify2FA(code.value);
  if (success) {
    router.push({ name: 'Dashboard' }); // Ou a rota principal da sua aplicação
  }
};

const handleBackupSubmit = async () => {
    const success = await authStore.verify2FA(backupCode.value);
    if (success) {
        router.push({ name: 'Dashboard' });
    }
};
</script>
