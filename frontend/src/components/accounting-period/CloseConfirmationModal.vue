<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import type { AccountingPeriod } from '@/types'

const props = defineProps<{
  visible: boolean
  type: 'period' | 'year'
  periodToClose?: AccountingPeriod | null
  yearToClose?: { year: number } | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirmClose'): void
}>()

const dialogHeader = computed(() => {
  if (props.type === 'period') {
    return 'Fechar Período'
  } else if (props.type === 'year') {
    return `Fechar Ano Fiscal ${props.yearToClose?.year}`
  }
  return 'Confirmação'
})

const confirmationMessage = computed(() => {
  if (props.type === 'period' && props.periodToClose) {
    return `Deseja fechar o período de ${formatMonthYear(props.periodToClose.start_date)}? Esta ação não poderá ser desfeita.`
  } else if (props.type === 'year' && props.yearToClose) {
    return `Esta ação irá fechar todos os períodos abertos do ano ${props.yearToClose.year} e não poderá ser desfeita. Certifique-se de que todos os lançamentos estão corretos.`
  }
  return 'Tem certeza que deseja realizar esta ação?'
})

const confirmButtonLabel = computed(() => {
  if (props.type === 'period') {
    return 'Fechar Período'
  } else if (props.type === 'year') {
    return 'Fechar Ano'
  }
  return 'Confirmar'
})

const formatMonthYear = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()
}

const confirmAndClose = () => {
  emit('confirmClose')
  emit('update:visible', false)
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
    :header="dialogHeader"
    :style="{ width: '450px' }"
    :draggable="false"
  >
    <p>{{ confirmationMessage }}</p>
    <div class="flex justify-end space-x-2 pt-4">
      <Button
        label="Cancelar"
        text
        @click="closeModal"
        class="text-gray-800"
        size="small"
      />
      <Button
        @click="confirmAndClose"
        :label="confirmButtonLabel"
        severity="danger"
        size="small"
      />
    </div>
  </Dialog>
</template>
