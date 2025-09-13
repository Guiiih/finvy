<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { AccountingPeriod } from '@/types'

const props = defineProps<{
  visible: boolean
  periodToDelete: AccountingPeriod | null
}>()

const emit = defineEmits(['update:visible', 'confirm-delete'])

const closeDialog = () => {
  emit('update:visible', false)
}

const confirmDelete = () => {
  emit('confirm-delete', props.periodToDelete?.id)
  closeDialog()
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="closeDialog"
    modal
    header="Confirmar Exclusão"
    :style="{ width: '30rem' }"
  >
    <div class="flex items-center gap-3">
      <span>
        Tem certeza que deseja excluir o período contábil
        <span class="font-bold">{{ periodToDelete?.fiscal_year }}</span>
        Esta ação não pode ser desfeita.
      </span>
    </div>
    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" text @click="closeDialog" />
      <Button label="Excluir" icon="pi pi-trash" severity="danger" @click="confirmDelete" />
    </template>
  </Dialog>
</template>
