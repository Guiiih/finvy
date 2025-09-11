<template>
  <div class="flex flex-col h-[80vh] rounded-2xl">
    <!-- Custom Header for Chatbot Page -->
    <header class="flex items-center justify-between p-4 bg-surface-100 rounded-t-2xl">
      <router-link to="/">
        <span class="material-symbols-outlined">arrow_back</span>
      </router-link>
      <div class="flex items-center space-x-2">
        <img :src="logoSrc" alt="Finvy Logo" class="h-10 w-10" />
        <span class="text-sm font-semibold">Assistente</span>
      </div>
    </header>

    <div class="flex flex-col h-full max-h-[69vh] bg-surface-50 rounded-2xl">
      <!-- Chat Messages -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto max-h-[70vh] border border-surface-200 rounded-2xl p-4"
      >
        <div v-for="(message, index) in chatbotStore.messages" :key="index" class="mb-4">
          <div :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
            <div
              :class="[
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow',
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-surface-0 text-surface-800',
              ]"
            >
              <p v-if="!message.isSolution" class="text-sm">{{ message.content }}</p>
              <div v-if="message.isSolution">
                <strong>Solução Proposta:</strong>
                <pre class="mt-2 text-sm bg-surface-100 text-surface-700 p-2 rounded">{{
                  message.content
                }}</pre>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
          class="flex justify-start mb-4"
        >
          <div class="bg-surface-0 text-surface-800 rounded-lg border shadow px-4 py-2">
            <div class="flex items-center space-x-1">
              <span class="block w-2 h-2 bg-surface-400 rounded-full animate-pulse"></span>
              <span class="block w-2 h-2 bg-surface-400 rounded-full animate-pulse delay-75"></span>
              <span
                class="block w-2 h-2 bg-surface-400 rounded-full animate-pulse delay-150"
              ></span>
            </div>
          </div>
        </div>

        <div
          v-if="chatbotStore.clarifyingQuestions.length > 0"
          class="p-4 my-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800"
        >
          <h3 class="text-lg font-semibold">Preciso de mais informações:</h3>
          <ul class="list-disc list-inside mt-2">
            <li v-for="(question, qIdx) in chatbotStore.clarifyingQuestions" :key="qIdx">
              {{ question }}
            </li>
          </ul>
          <p class="mt-2 text-sm">
            Por favor, responda às perguntas acima para que eu possa continuar.
          </p>
        </div>

        <div
          v-if="chatbotStore.proposedEntries.length > 0"
          class="p-4 my-4 bg-blue-50 border-l-4 border-blue-400"
        >
          <h3 class="text-lg font-semibold text-blue-800">Proposta de Lançamentos:</h3>
          <div
            v-for="(entry, idx) in chatbotStore.proposedEntries"
            :key="idx"
            class="p-3 mt-2 bg-surface-0 rounded-lg shadow"
          >
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
            <button
              type="button"
              @click="handleConfirmEntries"
              :disabled="isConfirming"
              class="px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition"
            >
              Confirmar
            </button>
            <button
              type="button"
              @click="handleCancelEntries"
              :disabled="isConfirming"
              class="px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 transition"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div
          v-if="
            chatbotStore.currentIntent === 'awaiting_confirmation_for_existing_journal_entry' &&
            chatbotStore.foundJournalEntry
          "
          class="p-4 my-4 bg-green-50 border-l-4 border-green-400"
        >
          <h3 class="text-lg font-semibold text-green-800">Lançamento Encontrado:</h3>
          <div class="p-3 mt-2 bg-surface-0 rounded-lg shadow">
            <p><strong>ID:</strong> {{ chatbotStore.foundJournalEntry.id }}</p>
            <p><strong>Data:</strong> {{ chatbotStore.foundJournalEntry.entry_date }}</p>
            <p><strong>Descrição:</strong> {{ chatbotStore.foundJournalEntry.description }}</p>
          </div>
          <div class="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              @click="handleConfirmFoundJournalEntry"
              class="px-4 py-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition"
            >
              Sim, é este!
            </button>
            <button
              type="button"
              @click="handleCancelFoundJournalEntry"
              class="px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600 transition"
            >
              Não, buscar outro
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Input -->

      <div
        class="flex flex-col bg-surface-100 rounded-2xl px-4 py-2 mx-4 my-4 shadow-inner border border-surface-200"
      >
        <textarea
          ref="textareaRef"
          v-model="newMessage"
          @keyup.enter="handleEnter"
          @input="adjustTextareaHeight"
          :placeholder="inputPlaceholder"
          :disabled="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
          rows="1"
          class="bg-transparent border-none text-sm placeholder-zinc-400 focus:outline-none resize-none"
        ></textarea>

        <div class="flex justify-between items-center mt-3 space-x-2">
          <button
            type="button"
            @click="fileInput?.click()"
            :disabled="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
            class="flex justify-center items-center rounded-full text-zinc-400 hover:text-white transition h-4 w-4"
            title="Anexar Arquivo"
          >
            <i class="material-icons" style="font-size: 15px !important">attach_file</i>
          </button>
          <input type="file" @change="handleFileUpload" ref="fileInput" style="display: none" />
          <button
            type="button"
            @click="sendMessage"
            :disabled="chatbotStore.isLoading || isSolving || isConfirming || isUploading"
            class="flex justify-center items-center rounded-full bg-surface-200 text-surface-500 hover:text-surface-700 transition h-7 w-7"
            title="Enviar Mensagem"
          >
            <i class="material-icons" style="font-size: 19px !important">arrow_upward</i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useChatbotStore } from '@/stores/chatbotStore'

import { confirmJournalEntryApiService } from '@/services/confirmJournalEntryApiService'
import { documentProcessorApiService } from '@/services/documentProcessorApiService'
import { useThemeStore } from '@/stores/themeStore'
import FinvyLogo from '@/assets/FinvyLogo.svg'
import FinvyLogoBlack from '@/assets/FinvyLogoBlack.svg'

const chatbotStore = useChatbotStore()
const newMessage = ref('')
const isSolving = ref(false)
const isConfirming = ref(false)
const isUploading = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const themeStore = useThemeStore()
const logoSrc = computed(() => {
  return themeStore.theme === 'dark' ? FinvyLogo : FinvyLogoBlack
})

const adjustTextareaHeight = () => {
  // Força recompile
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

watch(newMessage, () => {
  nextTick(() => {
    adjustTextareaHeight()
  })
})

const inputPlaceholder = computed(() => {
  switch (chatbotStore.currentIntent) {
    case 'awaiting_exercise_text':
      return 'Por favor, cole o texto do exercício aqui...'
    case 'awaiting_existing_journal_entry_description':
      return 'Por favor, digite a descrição do lançamento que você quer validar...'
    case 'awaiting_clarification':
      return 'Responda às perguntas de esclarecimento...'
    default:
      return 'Envie sua mensagem...'
  }
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  scrollToBottom()
})

watch(
  () => chatbotStore.messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

const sendMessage = async () => {
  if (!newMessage.value.trim() && chatbotStore.proposedEntries.length === 0) return

  const text = newMessage.value
  newMessage.value = ''
  await chatbotStore.sendMessage(text)
}

const handleEnter = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    isUploading.value = true
    try {
      const response = await documentProcessorApiService.uploadDocument(file)
      newMessage.value = response.extractedText
      await chatbotStore.sendMessage(response.extractedText)
    } catch (error) {
      console.error(error)
      chatbotStore.setError('Falha ao processar o arquivo.')
    } finally {
      isUploading.value = false
      target.value = ''
    }
  }
}

const handleConfirmEntries = async () => {
  isConfirming.value = true
  try {
    await confirmJournalEntryApiService.confirmEntries(chatbotStore.proposedEntries)
    chatbotStore.addModelMessage('Lançamentos confirmados com sucesso!')
    chatbotStore.proposedEntries = []
  } catch (error) {
    console.error(error)
    chatbotStore.setError('Erro ao confirmar os lançamentos.')
  } finally {
    isConfirming.value = false
  }
}

const handleCancelEntries = () => {
  chatbotStore.proposedEntries = []
  chatbotStore.addModelMessage('Proposta de lançamento cancelada.')
}

const handleConfirmFoundJournalEntry = async () => {
  if (chatbotStore.foundJournalEntry) {
    // Aqui você enviaria o lançamento encontrado para validação
    // Por enquanto, apenas adiciona uma mensagem de confirmação
    chatbotStore.addModelMessage(
      `Confirmado! Lançamento ${chatbotStore.foundJournalEntry.id} será validado.`,
    )
    // Limpa o lançamento encontrado e reseta a intenção
    chatbotStore.setFoundJournalEntry(null)
    chatbotStore.currentIntent = 'general_question' // Ou uma nova intenção para o processo de validação
  }
}

const handleCancelFoundJournalEntry = () => {
  chatbotStore.addModelMessage('Busca de lançamento cancelada. Por favor, tente outra descrição.')
  chatbotStore.setFoundJournalEntry(null)
  chatbotStore.currentIntent = 'awaiting_existing_journal_entry_description' // Volta para o estado de aguardar descrição
}
</script>
