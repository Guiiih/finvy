<template>
  <PDialog
    :visible="globalChatbotStore.isChatbotModalVisible"
    :modal="true"
    header="Assistente Contábil"
    position="center"
    :style="{ width: '500px', height: '700px' }"
    :showMask="true"
    :closable="true"
    :draggable="true"
    @update:visible="(value) => globalChatbotStore.setChatbotModalVisibility(value)"
    @hide="globalChatbotStore.setChatbotModalVisibility(false)"
  >
    <ChatbotWindow />
  </PDialog>
</template>

<script setup lang="ts">
import PDialog from 'primevue/dialog'; // Importar como PDialog
import ChatbotWindow from './ChatbotWindow.vue';
import { useGlobalChatbotStore } from '@/stores/globalChatbotStore';

const globalChatbotStore = useGlobalChatbotStore();
</script>
