<template>
  <div class="chatbot-window">
    <div class="messages">
      <div v-for="(message, index) in chatbotStore.messages" :key="index" :class="['message', message.role]">
        <div v-if="message.isSolution">
          <strong>Solução Proposta:</strong>
          <pre>{{ message.content }}</pre>
        </div>
        <p v-else>{{ message.content }}</p>
      </div>
      <div v-if="chatbotStore.isLoading || isSolving || isModalLoading || isConfirming || isUploading" class="message model loading">
        <p>Digitando...</p>
      </div>

      <div v-if="proposedEntries.length > 0" class="proposed-entries-section">
        <h3>Proposta de Lançamentos:</h3>
        <div v-for="(entry, idx) in proposedEntries" :key="idx" class="proposed-entry-card">
          <p><strong>Data:</strong> {{ entry.date }}</p>
          <p><strong>Descrição:</strong> {{ entry.description }}</p>
          <div class="entry-lines">
            <div class="debits">
              <h4>Débitos:</h4>
              <ul>
                <li v-for="(debit, dIdx) in entry.debits" :key="dIdx">
                  {{ debit.account }}: R$ {{ debit.value.toFixed(2) }}
                </li>
              </ul>
            </div>
            <div class="credits">
              <h4>Créditos:</h4>
              <ul>
                <li v-for="(credit, cIdx) in entry.credits" :key="cIdx">
                  {{ credit.account }}: R$ {{ credit.value.toFixed(2) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="confirmation-buttons">
          <Button label="Confirmar Lançamento" @click="handleConfirmEntries" :loading="isConfirming" />
          <Button label="Cancelar" class="p-button-secondary" @click="handleCancelEntries" :disabled="isConfirming" />
        </div>
      </div>
    </div>
    <div class="input-area">
      <input
        type="file"
        ref="fileInput"
        style="display: none;"
        @change="handleFileUpload"
        accept=".pdf,image/*"
      />
      <Button
        icon="pi pi-upload"
        class="p-button-secondary p-button-text"
        @click="fileInput?.click()"
        :disabled="chatbotStore.isLoading || isSolving || isModalLoading || isConfirming || isUploading"
        v-tooltip.top="'Upload de PDF ou Imagem'"
      />
      <Textarea
        v-model="newMessage"
        @keyup.enter="handleEnter"
        :placeholder="inputPlaceholder"
        :disabled="chatbotStore.isLoading || isSolving || isModalLoading || isConfirming || isUploading"
        rows="3"
        autoResize
      />
      <Button @click="sendMessage" :disabled="chatbotStore.isLoading || isSolving || isModalLoading || isConfirming || isUploading" label="Enviar" />
    </div>
    <div v-if="chatbotStore.error" class="error-message">
      {{ chatbotStore.error }}
    </div>

    <ValidationModal
      :visible="isValidationModalVisible"
      @close="isValidationModalVisible = false"
      @submit="handleValidationSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useChatbotStore } from '@/stores/chatbotStore';
import { solveExercise } from '@/services/exerciseSolverService';
import { exerciseValidatorApiService } from '@/services/exerciseValidatorApiService';
import { confirmJournalEntryApiService, type ProposedEntry } from '@/services/confirmJournalEntryApiService';
import { documentProcessorApiService } from '@/services/documentProcessorApiService';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import ValidationModal from './ValidationModal.vue';
import Tooltip from 'primevue/tooltip';

const chatbotStore = useChatbotStore();
const newMessage = ref('');
const isSolving = ref(false);
const isValidationModalVisible = ref(false);
const isModalLoading = ref(false);
const isConfirming = ref(false);
const isUploading = ref(false);
const proposedEntries = ref<ProposedEntry[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const inputPlaceholder = computed(() => {
  switch (chatbotStore.currentIntent) {
    case 'awaiting_exercise_text':
      return 'Por favor, cole o texto do exercício aqui...';
    case 'awaiting_validation_text':
      return 'Por favor, use o modal de validação para inserir o exercício e sua solução.';
    default:
      return 'Digite sua mensagem ou dúvida contábil...';
  }
});

const handleConfirmEntries = () => {
  // Logic for confirming entries
  console.log('Confirming entries');
};

const handleCancelEntries = () => {
  // Logic for canceling entries
  console.log('Canceling entries');
};

const handleFileUpload = (event: Event) => {
  // Logic for file upload
  console.log('File uploaded', event);
};

const handleEnter = () => {
  // Logic for handling enter key press
  console.log('Enter pressed');
};

const sendMessage = () => {
  // Logic for sending message
  console.log('Sending message');
};

const handleValidationSubmit = () => {
  // Logic for validation submit
  console.log('Validation submitted');
};
</script>

<style scoped>
.chatbot-window {
  display: flex;
  flex-direction: column;
  height: 70vh;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
}

.messages {
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 15px;
  max-width: 80%;
  word-wrap: break-word;
}

.message.user {
  background-color: #007bff;
  color: white;
  align-self: flex-end;
  margin-left: auto;
}

.message.model {
  background-color: #e2e2e2;
  color: #333;
  align-self: flex-start;
  margin-right: auto;
}

.message.loading {
  font-style: italic;
  color: #666;
}

pre {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.input-area {
  display: flex;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #ccc;
}

.input-area .p-inputtextarea {
  flex-grow: 1;
  margin-right: 10px;
}

.error-message {
  color: red;
  padding: 10px;
  background-color: #ffe0e0;
  border-top: 1px solid #ffc0c0;
}

.suggested-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: center; /* Centraliza os botões */
}

.proposed-entries-section {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #e9ecef;
}

.proposed-entry-card {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
}

.entry-lines {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.debits, .credits {
  flex: 1;
  border: 1px solid #ced4da;
  padding: 10px;
  border-radius: 5px;
}

.debits h4, .credits h4 {
  margin-top: 0;
  color: #0056b3;
}

.debits ul, .credits ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.confirmation-buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>