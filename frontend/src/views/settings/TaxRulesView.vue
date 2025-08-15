<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import TaxRuleFormModal from '@/components/TaxRuleFormModal.vue'

const displayModal = ref(false)

import { useTaxRuleStore } from '@/stores/taxRuleStore'
import type { TaxRule } from '@/types'

const store = useTaxRuleStore()

onMounted(() => {
  store.fetchTaxRules()
})

const editingRule = ref<TaxRule | null>(null)

const openNewRuleModal = () => {
  editingRule.value = null
  displayModal.value = true
}

const openEditRuleModal = (rule: TaxRule) => {
  editingRule.value = { ...rule }
  displayModal.value = true
}

const deleteRule = (id: string) => {
  if (confirm('Tem certeza que deseja excluir esta regra?')) {
    store.deleteTaxRule(id)
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Regras de Impostos</h2>
      <Button label="Nova Regra" icon="pi pi-plus" @click="openNewRuleModal" />
    </div>

    <DataTable :value="store.rules" :loading="store.loading" responsiveLayout="scroll">
      <Column field="uf_origin" header="UF Origem"></Column>
      <Column field="uf_destination" header="UF Destino"></Column>
      <Column field="ncm_pattern" header="NCM"></Column>
      <Column field="tax_type" header="Imposto"></Column>
      <Column field="rate" header="Alíquota">
        <template #body="slotProps"> {{ (slotProps.data.rate * 100).toFixed(2) }}% </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-success mr-2"
            @click="openEditRuleModal(slotProps.data)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-rounded p-button-danger"
            @click="deleteRule(slotProps.data.id)"
          />
        </template>
      </Column>
    </DataTable>

    <TaxRuleFormModal
      :visible="displayModal"
      :editing-rule="editingRule"
      @update:visible="displayModal = $event"
      @submit-success="store.fetchTaxRules()"
    />
  </div>
</template>
