<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <button class="text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-lg font-semibold text-gray-800">FINVY BOT</h2>
      <div class="w-6"></div>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto bg-gray-50">
      <div v-for="(message, index) in chatbotStore.messages" :key="index" class="mb-4">
        <div :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
          <div
            :class="[
              'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow',
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800',
            ]"
          >
            <p v-if="!message.isSolution" class="text-sm">{{ message.content }}</p>
            <div v-if="message.isSolution">
              <strong>Solução Proposta:</strong>
              <pre class="mt-2 text-sm bg-gray-100 text-gray-700 p-2 rounded">{{ message.content }}</pre>
            </div>
          </div>
        </div>
      </div>
      <div v-if="chatbotStore.isLoading || isSolving || isConfirming || isUploading" class="flex justify-start mb-4">
          <div class="bg-white text-gray-800 rounded-lg shadow px-4 py-2">
              <div class="flex items-center space-x-1">
                  <span class="block w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                  <span class="block w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                  <span class="block w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
              </div>
          </div>
      </div>

      <div v-if="chatbotStore.clarifyingQuestions.length > 0" class="p-4 my-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
        <h3 class="text-lg font-semibold">Preciso de mais informações:</h3>
        <ul class="list-disc list-inside mt-2">
          <li v-for="(question, qIdx) in chatbotStore.clarifyingQuestions" :key="qIdx">{{ question }}</li>
        </ul>
        <p class="mt-2 text-sm">Por favor, responda às perguntas acima para que eu possa continuar.</p>
      </div>

      <!-- Proposed Entries -->
      <div v-if="chatbotStore.proposedEntries.length > 0" class="p-4 my-4 bg-blue-50 border-l-4 border-blue-400">
        <h3 class="text-lg font-semibold text-blue-800">Proposta de Lançamentos:</h3>
        <div v-for="(entry, idx) in chatbotStore.proposedEntries" :key="idx" class="p-3 mt-2 bg-white rounded-lg shadow">
          <p><strong>Data:</strong> {{ entry.date }}</p>
          <p><strong>Descrição:</strong> {{ entry.description }}</p>
          <div class="grid grid-cols-2 gap-4 mt-2">
            <div>
              <h4 class="font-semibold text-green-700">Débitos:</h4>
              <ul>
                <li v-for="(debit, dIdx) in entry.debits" :key="dIdx">
                  {{ debit.account }}: R$ {{ debit.value.toFixed(2) }}
                </li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-red-700">Créditos:</h4>
              <ul>
                <li v-for="(credit, cIdx) in entry.credits" :key="cIdx">
                  {{ credit.account }}: R$ {{ credit.value.toFixed(2) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4 space-x-2">
          <Button label="Confirmar" @click="handleConfirmEntries" :loading="isConfirming" severity="success"/>
          <Button label="Cancelar" class="p-button-secondary" @click="handleCancelEntries" :disabled="isConfirming" severity="danger"/>
        </div>
      </div>

      <!-- Found Journal Entry for Confirmation -->
      <div v-if="chatbotStore.currentIntent === 'awaiting_confirmation_for_existing_journal_entry' && chatbotStore.foundJournalEntry" class="p-4 my-4 bg-green-50 border-l-4 border-green-400">
        <h3 class="text-lg font-semibold text-green-800">Lançamento Encontrado:</h3>
        <div class="p-3 mt-2 bg-white rounded-lg shadow">
          <p><strong>ID:</strong> {{ chatbotStore.foundJournalEntry.id }}</p>
          <p><strong>Data:</strong> {{ chatbotStore.foundJournalEntry.date }}</p>
          <p><strong>Descrição:</strong> {{ chatbotStore.foundJournalEntry.description }}</p>
          <!-- Adicione mais detalhes do lançamento conforme necessário -->
        </div>
        <div class="flex justify-end mt-4 space-x-2">
          <Button label="Sim, é este!" @click="handleConfirmFoundJournalEntry" severity="success"/>
          <Button label="Não, buscar outro" class="p-button-secondary" @click="handleCancelFoundJournalEntry" severity="danger"/>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 bg-white border-t border-gray-200">
      <div class="flex items-center">
        <input
          type="file"
          ref="fileInput"
          style="display: none;"
          @change="handleFileUpload"
          accept=".pdf,image/*"
        />
        <Button
            icon="pi pi-paperclip"
            class="p-button-rounded p-button-text text-gray-500 hover:text-gray-700"
            @click="fileInput?.click()"
            :disabled="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
            v-tooltip.top="'Upload de PDF ou Imagem'"
        />
        <Textarea
          v-model="newMessage"
          @keyup.enter="handleEnter"
          :placeholder="inputPlaceholder"
          :disabled="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
          rows="1"
          autoResize
          class="flex-1 px-4 py-2 mx-2 text-sm bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          icon="pi pi-send"
          class="p-button-rounded p-button-primary"
          @click="sendMessage"
          :disabled="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
        />
      </div>
       <div v-if="chatbotStore.error" class="mt-2 text-sm text-red-600">
        {{ chatbotStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useChatbotStore } from '@/stores/chatbotStore';

import { confirmJournalEntryApiService, type ProposedEntry } from '@/services/confirmJournalEntryApiService';
import { documentProcessorApiService } from '@/services/documentProcessorApiService';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';

const chatbotStore = useChatbotStore();
const newMessage = ref('');
const isSolving = ref(false);
const isConfirming = ref(false);
const isUploading = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);

const inputPlaceholder = computed(() => {
  switch (chatbotStore.currentIntent) {
    case 'awaiting_exercise_text':
      return 'Por favor, cole o texto do exercício aqui...';
    case 'awaiting_existing_journal_entry_description':
      return 'Por favor, digite a descrição do lançamento que você quer validar...';
    case 'awaiting_clarification':
      return 'Responda às perguntas de esclarecimento...';
    default:
      return 'Envie sua mensagem...';
  }
});

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

onMounted(() => {
  scrollToBottom();
});

watch(() => chatbotStore.messages, () => {
  scrollToBottom();
}, { deep: true });

const sendMessage = async () => {
  if (!newMessage.value.trim() && chatbotStore.proposedEntries.length === 0) return;

  const text = newMessage.value;
  newMessage.value = '';
  await chatbotStore.sendMessage(text);
};

const handleEnter = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    isUploading.value = true;
    try {
      const response = await documentProcessorApiService.uploadDocument(file);
      newMessage.value = response.extractedText;
      await chatbotStore.sendMessage(response.extractedText);
    } catch (error) {
      chatbotStore.setError('Falha ao processar o arquivo.');
    } finally {
      isUploading.value = false;
      target.value = '';
    }
  }
};

const handleConfirmEntries = async () => {
  isConfirming.value = true;
  try {
    await confirmJournalEntryApiService.confirmEntries(chatbotStore.proposedEntries);
    chatbotStore.addModelMessage('Lançamentos confirmados com sucesso!');
    chatbotStore.proposedEntries = [];
  } catch (error) {
    chatbotStore.setError('Erro ao confirmar os lançamentos.');
  } finally {
    isConfirming.value = false;
  }
};

const handleCancelEntries = () => {
  chatbotStore.proposedEntries = [];
  chatbotStore.addModelMessage('Proposta de lançamento cancelada.');
};

const handleConfirmFoundJournalEntry = async () => {
  if (chatbotStore.foundJournalEntry) {
    // Aqui você enviaria o lançamento encontrado para validação
    // Por enquanto, apenas adiciona uma mensagem de confirmação
    chatbotStore.addModelMessage(`Confirmado! Lançamento ${chatbotStore.foundJournalEntry.id} será validado.`);
    // Limpa o lançamento encontrado e reseta a intenção
    chatbotStore.setFoundJournalEntry(null);
    chatbotStore.currentIntent = 'general_question'; // Ou uma nova intenção para o processo de validação
  }
};

const handleCancelFoundJournalEntry = () => {
  chatbotStore.addModelMessage('Busca de lançamento cancelada. Por favor, tente outra descrição.');
  chatbotStore.setFoundJournalEntry(null);
  chatbotStore.currentIntent = 'awaiting_existing_journal_entry_description'; // Volta para o estado de aguardar descrição
};

</script>

<style scoped>
/* All styles are now handled by TailwindCSS */
</style>
