<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useJournalEntryStore } from '@/stores/journalEntryStore'
import { useConfirm } from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'

const props = defineProps<{
  visible: boolean
  selectedEntries: string[]
}>()

const emit = defineEmits(['update:visible', 'bulkActionSuccess'])

const toast = useToast()
const confirm = useConfirm()
const journalEntryStore = useJournalEntryStore()
const loading = ref(false)

const closeDialog = () => {
  emit('update:visible', false)
}

const handleBulkAction = async (action: 'delete' | 'approve') => {
  if (props.selectedEntries.length === 0) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Selecione pelo menos um lançamento para aplicar a ação.',
      life: 3000,
    })
    return
  }

  confirm.require({
    group: 'templating',
    message: `Tem certeza que deseja ${action === 'delete' ? 'excluir' : 'aprovar'} ${
      props.selectedEntries.length
    } lançamento(s) selecionado(s)?`,
    header: 'Confirmação de Ação em Lote',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: action === 'delete' ? 'p-button-danger' : 'p-button-success',
    accept: async () => {
      console.log(`Confirmado ação: ${action} para IDs:`, props.selectedEntries)
      loading.value = true
      try {
        if (action === 'delete') {
          console.log('Chamando deleteMultipleEntries...')
          await journalEntryStore.deleteMultipleEntries(props.selectedEntries)
          console.log('deleteMultipleEntries concluído.')
          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `${props.selectedEntries.length} lançamento(s) excluído(s) com sucesso!`,
            life: 3000,
          })
        } else if (action === 'approve') {
          console.log('Chamando updateMultipleEntriesStatus...')
          await journalEntryStore.updateMultipleEntriesStatus(props.selectedEntries, 'posted')
          console.log('updateMultipleEntriesStatus concluído.')
          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `${props.selectedEntries.length} lançamento(s) aprovado(s) com sucesso!`,
            life: 3000,
          })
        }
        emit('bulkActionSuccess')
        closeDialog()
      } catch (error: unknown) {
        console.error(`Erro ao realizar ação em lote (${action}):`, error)
        const message = error instanceof Error ? error.message : `Ocorreu um erro ao ${action === 'delete' ? 'excluir' : 'aprovar'} os lançamentos.`
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: message,
          life: 3000,
        })
      } finally {
        loading.value = false
        console.log('Loading resetado.')
      }
    },
    reject: () => {
      toast.add({
        severity: 'info',
        summary: 'Cancelado',
        detail: 'Ação em lote cancelada.',
        life: 3000,
      })
    },
  })
}

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      loading.value = false // Reset loading state when dialog closes
    }
  },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :style="{ width: '400px' }"
    header="Ações em Lote"
    :closable="!loading"
  >
    <ConfirmDialog group="templating"></ConfirmDialog>
    <div class="p-fluid">
      <p class="mb-4 text-surface-600">
        Aplicar ações aos {{ selectedEntries.length }} lançamento(s) selecionado(s).
      </p>

      <div class="flex flex-col gap-3">
        <div
          class="p-3 border border-surface-200 rounded-lg cursor-pointer hover:bg-surface-50 transition duration-200 ease-in-out"
          @click="handleBulkAction('approve')"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-check-circle text-emerald-500 text-xl"></i>
            <div>
              <div class="font-medium text-surface-800">Aprovar Lançamentos</div>
              <div class="text-sm text-surface-500">Alterar status para "Lançado"</div>
            </div>
          </div>
        </div>

        <hr class="border-t border-surface-200 my-2" />

        <div
          class="p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition duration-200 ease-in-out"
          @click="handleBulkAction('delete')"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-trash text-red-500 text-xl"></i>
            <div>
              <div class="font-medium text-red-800">Excluir Lançamentos</div>
              <div class="text-sm text-red-500">Esta ação não pode ser desfeita</div>
            </div>
          </div>
        </div>

      </div>

      <div class="p-message p-message-warn mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
        <div class="p-message-wrapper flex items-center gap-2">
          <span class="p-message-icon pi pi-exclamation-triangle text-yellow-600 text-lg"></span>
          <div class="p-message-text text-yellow-800">
            <span class="font-bold">Atenção:</span> As ações serão aplicadas a todos os
            {{ selectedEntries.length }} lançamentos selecionados. Certifique-se de que esta é a
            ação desejada.
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="closeDialog"
          class="p-button-text"
          :disabled="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* Adicione estilos específicos se necessário */
</style>
