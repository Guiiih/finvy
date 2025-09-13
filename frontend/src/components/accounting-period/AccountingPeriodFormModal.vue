<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore'
import { useToast } from 'primevue/usetoast'
import type { AccountingPeriod, TaxRegime } from '@/types'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

// Props and Emits
const props = defineProps<{
  visible: boolean
  initialPeriod?: AccountingPeriod | null // Optional: for editing existing period
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submitSuccess'): void
}>()

const accountingPeriodStore = useAccountingPeriodStore()
const toast = useToast()

const isEditing = ref(false)
const periodForm = ref<Partial<AccountingPeriod>>({
  fiscal_year: new Date().getFullYear(),
  regime: null,
  annex: null,
})

const regimeOptions = ref([
  { label: 'Simples Nacional', value: 'simples_nacional' },
  { label: 'Lucro Presumido', value: 'lucro_presumido' },
  { label: 'Lucro Real', value: 'lucro_real' },
])

const annexOptions = ref([
  { label: 'Anexo I - Comércio', value: 'annex_i' },
  { label: 'Anexo II - Indústria', value: 'annex_ii' },
  { label: 'Anexo III - Serviços', value: 'annex_iii' },
  { label: 'Anexo IV - Serviços', value: 'annex_iv' },
  { label: 'Anexo V - Serviços', value: 'annex_v' },
])

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.initialPeriod) {
        isEditing.value = true
        periodForm.value = { ...props.initialPeriod }
      } else {
        isEditing.value = false
        periodForm.value = {
          fiscal_year: new Date().getFullYear(),
          regime: null,
          annex: null,
        }
      }
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => periodForm.value.fiscal_year,
  (newYear) => {
    if (newYear) {
      periodForm.value.start_date = `${newYear}-01-01`
      periodForm.value.end_date = `${newYear}-12-31`
    } else {
      periodForm.value.start_date = undefined
      periodForm.value.end_date = undefined
    }
  },
  { immediate: true },
)

watch(
  () => periodForm.value.regime,
  (newRegime) => {
    if (newRegime !== 'simples_nacional') {
      periodForm.value.annex = null
    }
  },
)

const handleSubmit = async () => {
  if (!periodForm.value.fiscal_year || !periodForm.value.regime || !periodForm.value.start_date || !periodForm.value.end_date) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha todos os campos obrigatórios.',
      life: 3000,
    })
    return
  }

  if (periodForm.value.regime === 'simples_nacional' && !periodForm.value.annex) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Selecione o anexo do Simples Nacional.',
      life: 3000,
    })
    return
  }

  try {
    if (isEditing.value && periodForm.value.id) {
      await accountingPeriodStore.updateAccountingPeriod(periodForm.value.id, {
        fiscal_year: periodForm.value.fiscal_year,
        start_date: periodForm.value.start_date,
        end_date: periodForm.value.end_date,
        regime: periodForm.value.regime || undefined,
        annex: periodForm.value.annex || undefined,
      })
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Ano fiscal atualizado com sucesso!',
        life: 3000,
      })
    } else {
      const newAccountingPeriod = await accountingPeriodStore.addAccountingPeriod({
        fiscal_year: periodForm.value.fiscal_year,
        start_date: periodForm.value.start_date as string,
        end_date: periodForm.value.end_date as string,
        regime: periodForm.value.regime as TaxRegime,
        annex: periodForm.value.annex as string,
        is_active: true,
      })

      if (newAccountingPeriod) {
        await accountingPeriodStore.setActivePeriod(newAccountingPeriod.id)
      }

      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Ano fiscal criado e ativado com sucesso!',
        life: 3000,
      })
    }

    emit('submitSuccess')
    closeModal()
  } catch (err: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err instanceof Error ? err.message : 'Falha ao salvar ano fiscal.',
      life: 3000,
    })
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
    :style="{ width: '450px' }"
    class="p-fluid"
    :draggable="false"
  >
    <template #header>
      <div class="flex flex-col gap-1">
        <h3 class="text-xl font-bold text-gray-900">
          {{ isEditing ? `Editar Ano Fiscal: ${periodForm.fiscal_year}` : 'Criar Novo Ano Fiscal' }}
        </h3>
        <p class="text-sm text-gray-500">
          {{ isEditing ? 'Ajuste as configurações do seu ano fiscal.' : 'Configure um novo ano fiscal' }}
        </p>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-6 pt-4">
      <div class="flex flex-col gap-2">
        <label for="fiscalYear" class="text-sm font-medium text-gray-800">Ano Fiscal</label>
        <InputNumber
          id="fiscalYear"
          v-model="periodForm.fiscal_year"
          mode="decimal"
          :useGrouping="false"
          required
          size="small"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="regime" class="text-sm font-medium text-gray-800">Regime Tributário</label>
        <Dropdown
          id="regime"
          v-model="periodForm.regime"
          :options="regimeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecione um regime"
          required
          size="small"
        />
      </div>

      <div v-if="periodForm.regime === 'simples_nacional'" class="flex flex-col gap-2">
        <label for="annex" class="text-sm font-medium text-gray-800"
          >Anexo do Simples Nacional</label
        >
        <Dropdown
          id="annex"
          v-model="periodForm.annex"
          :options="annexOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecione um anexo"
          required
          size="small"
        />
      </div>

      <div class="flex justify-end space-x-2">
        <Button
          label="Cancelar"
          text
          @click="closeModal"
          class="text-gray-800"
          size="small"
        />
        <Button
          :loading="accountingPeriodStore.loading"
          type="submit"
          :label="isEditing ? 'Atualizar Período' : 'Criar Ano Fiscal'"
          class="!bg-gray-900 !text-white"
          size="small"
        />
      </div>
    </form>
  </Dialog>
</template>
