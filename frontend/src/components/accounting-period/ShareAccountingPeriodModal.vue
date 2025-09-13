<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSharingStore } from '@/stores/sharingStore'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { api } from '@/services/api'
import type {
  AccountingPeriod,
  User,
  SharedPermissionLevel,
  SharedAccountingPeriod,
} from '@/types'

const props = defineProps<{
  visible: boolean
  sharingPeriod: AccountingPeriod | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'shareSuccess'): void
}>()

const sharingStore = useSharingStore()
const toast = useToast()

const userSearchQuery = ref('')
const searchResults = ref<User[]>([])
const sharingUser = ref<User | null>(null)
const sharingPermissionLevel = ref<SharedPermissionLevel>('read')
const sharedUsers = ref<SharedAccountingPeriod[]>([])
const emailsToInvite = ref<string>('')

const permissionLevels = ref([
  { label: 'Viewer', value: 'read' },
  { label: 'Editor', value: 'write' },
  { label: 'Admin', value: 'admin' },
])

const shareableLink = computed(() => {
  if (props.sharingPeriod) {
    return `https://app.finvy.com/shared/periods/${props.sharingPeriod.id}`
  }
  return ''
})

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && props.sharingPeriod) {
      await fetchSharedUsers(props.sharingPeriod.id)
    } else {
      // Reset state when modal closes
      userSearchQuery.value = ''
      searchResults.value = []
      sharingUser.value = null
      sharingPermissionLevel.value = 'read'
      sharedUsers.value = []
      emailsToInvite.value = ''
    }
  },
)

const copyToClipboard = (text: string) => {
  if (!navigator.clipboard) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      toast.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Link copiado para a área de transferência.',
        life: 3000,
      })
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar o link.',
        life: 3000,
      })
    }
    document.body.removeChild(textArea)
    return
  }
  navigator.clipboard.writeText(text).then(
    () => {
      toast.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: 'Link copiado para a área de transferência.',
        life: 3000,
      })
    },
    () => {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar o link.',
        life: 3000,
      })
    },
  )
}

const sendInvites = () => {
  const emails = emailsToInvite.value.split(',').map(email => email.trim()).filter(email => email.length > 0)
  if (!emails || emails.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Insira um ou mais emails para convidar.',
      life: 3000,
    })
    return
  }
  // TODO: A implementação do backend para enviar convites é necessária.
  toast.add({
    severity: 'info',
    summary: 'Não implementado',
    detail: 'O envio de convites ainda não foi implementado.',
    life: 3000,
  })
  console.log(
    'Convidando emails:',
    emails,
    'com permissão:',
    sharingPermissionLevel.value,
  )
}

const updatePermission = (shared: SharedAccountingPeriod) => {
  // TODO: A implementação do backend para atualizar as permissões é necessária.
  toast.add({
    severity: 'info',
    summary: 'Não implementado',
    detail: 'A atualização de permissões ainda não foi implementada.',
    life: 3000,
  })
  console.log('Atualizando permissão para:', shared.id, 'para:', shared.permission_level)
}

async function fetchSharedUsers(periodId: string) {
  try {
    // Assuming you'll add a GET endpoint to /sharing to list shared users for a period
    // For now, this is a placeholder. You'll need to implement this backend endpoint.
    const data = await api.get<SharedAccountingPeriod[]>(
      `/sharing?accounting_period_id=${periodId}`,
    )
    sharedUsers.value = data
  } catch (err) {
    console.error('Erro ao buscar usuários compartilhados:', err)
    sharedUsers.value = []
  }
}

async function unsharePeriod(sharingId: string) {
  if (confirm('Tem certeza que deseja remover este compartilhamento?')) {
    try {
      await sharingStore.unshareAccountingPeriod(sharingId)
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Compartilhamento removido com sucesso!',
        life: 3000,
      })
      if (props.sharingPeriod) {
        await fetchSharedUsers(props.sharingPeriod.id) // Refresh shared users list
      }
    } catch (err: unknown) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err instanceof Error ? err.message : 'Falha ao remover compartilhamento.',
        life: 3000,
      })
    }
  }
}

const closeModal = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="closeModal"
    modal
    header="Compartilhar Período Fiscal"
    :style="{ width: '600px' }"
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    @hide="closeModal"
    :draggable="false"
  >
    <div class="space-y-6">
      <!-- Seção de Convite -->
      <div>
        <p class="text-sm text-gray-600 mb-2">
          Convide pessoas por e-mail para colaborar neste período fiscal.
        </p>
        <div class="flex flex-col sm:flex-row items-stretch gap-2">
          <InputText
            v-model="emailsToInvite"
            placeholder="Um ou mais emails, separados por vírgula"
            class="flex-grow"
            size="small"
          />
          <div class="flex items-stretch gap-2">
            <Select
              v-model="sharingPermissionLevel"
              :options="permissionLevels"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              size="small"
            />
            <Button @click="sendInvites" icon="pi pi-send" size="small" />
          </div>
        </div>
      </div>

      <!-- Divisor -->
      <div class="border-t border-gray-200"></div>

      <!-- Lista de Membros -->
      <div>
        <h3 class="text-lg font-medium text-gray-900">Pessoas com Acesso</h3>
        <div v-if="sharedUsers.length > 0" class="mt-4 space-y-3 max-h-60 overflow-y-auto">
          <div
            v-for="shared in sharedUsers"
            :key="shared.id"
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <div class="flex items-center gap-3 mb-2 sm:mb-0">
              <img
                :src="`https://ui-avatars.com/api/?name=${shared.profiles?.username || shared.profiles?.email}&background=random&color=fff`"
                alt="avatar"
                class="w-10 h-10 rounded-full"
              />
              <div>
                <p class="font-semibold text-gray-900">{{ shared.profiles?.username }}</p>
                <p class="text-sm text-gray-500">{{ shared.profiles?.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center">
              <Select
                v-model="shared.permission_level"
                :options="permissionLevels"
                optionLabel="label"
                optionValue="value"
                @change="updatePermission(shared)"
                class="w-32"
              />
              <Button
                @click="unsharePeriod(shared.id)"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                aria-label="Remover Acesso"
              />
            </div>
          </div>
        </div>
        <div v-else class="mt-4 text-center text-gray-500 py-4">
          <p>Ninguém foi convidado para este período ainda.</p>
        </div>
      </div>

      <!-- Divisor -->
      <div class="border-t border-gray-200"></div>

      <!-- Compartilhamento de Link -->
      <div>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Compartilhamento por Link</h3>
          <!-- Opcional: Adicionar um toggle para ativar/desativar o link público -->
          <!-- <InputSwitch v-model="publicLinkEnabled" /> -->
        </div>
        <p class="text-sm text-gray-600 mt-1">
          Qualquer pessoa com o link poderá visualizar (somente leitura).
        </p>
        <div class="mt-3 flex items-stretch">
          <input
            type="text"
            :value="shareableLink"
            readonly
            class="flex-grow p-2 border border-gray-300 rounded-l-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            @click="copyToClipboard(shareableLink)"
            icon="pi pi-copy"
            label="Copiar"
            severity="secondary"
            class="rounded-l-none"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
