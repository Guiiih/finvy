<template>
  <div class="space-y-10">

    <div>
      <h2 class="text-lg font-medium text-surface-800">Personalização</h2>
      <div class="mt-4 grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-2">Idioma</label>
          <Select
            id="language"
            v-model="languageStore.language"
            :options="languageOptions"
            optionLabel="name"
            optionValue="code"
            class="w-full"
            @change="changeLanguage"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-2">Tema</label>
          <Select
            id="theme"
            v-model="themeStore.theme"
            :options="themeOptions"
            optionLabel="name"
            optionValue="value"
            class="w-full"
            @change="changeTheme"
          />
        </div>
      </div>
    </div>

    <div class="border-t border-zinc-200"></div>
    
    <div>
      <h2 class="text-lg font-medium text-surface-800">Notificações</h2>
      <div class="space-y-6 mt-4">
        <div class="flex items-center justify-between p-4 rounded-lg bg-surface-50 border border-surface-200">
          <div>
            <h3 class="font-semibold text-surface-800">Notificações por email</h3>
            <p class="text-sm text-surface-600">Receber atualizações importantes por email.</p>
          </div>
          <InputSwitch v-model="notificationSettings.email" @change="saveSettings" />
        </div>

        <div class="flex items-center justify-between p-4 rounded-lg bg-surface-50 border border-surface-200">
          <div>
            <h3 class="font-semibold text-surface-800">Notificações push</h3>
            <p class="text-sm text-surface-600">Receber notificações no navegador.</p>
          </div>
          <InputSwitch v-model="notificationSettings.push" @change="saveSettings" />
        </div>

        <div class="flex items-center justify-between p-4 rounded-lg bg-surface-50 border border-surface-200">
          <div>
            <h3 class="font-semibold text-surface-800">Atualizações de segurança</h3>
            <p class="text-sm text-surface-600">Alertas sobre atividades suspeitas.</p>
          </div>
          <InputSwitch v-model="notificationSettings.security" @change="saveSettings" />
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useThemeStore } from '../../../stores/themeStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { useToast } from 'primevue/usetoast';
import Select from 'primevue/select';
import InputSwitch from 'primevue/inputswitch';

// Lógica de Aparência
const themeStore = useThemeStore();
const languageStore = useLanguageStore();
const transparencyEffects = ref(false);

const themeOptions = ref([
  { name: 'Claro', value: 'light' },
  { name: 'Escuro', value: 'dark' },
]);

const languageOptions = ref([
  { name: 'Português (Brasil)', code: 'pt-BR' },
  { name: 'English', code: 'en-US' },
]);

const changeTheme = (event: { value: string }) => {
  themeStore.setTheme(event.value)
};

const changeLanguage = (event: { value: string }) => {
  languageStore.setLanguage(event.value);
};

// Lógica de Notificações
const toast = useToast();
const notificationSettings = ref({
  email: true,
  push: false,
  security: true,
});

const saveSettings = () => {
  console.log('Salvando configurações de notificação:', notificationSettings.value);
  toast.add({
    severity: 'success',
    summary: 'Sucesso',
    detail: 'Configurações de notificação salvas.',
    life: 3000,
  });
};
</script>
