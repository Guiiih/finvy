<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaxRuleStore } from '@/stores/taxRuleStore'
import type { TaxRule } from '@/types'

// PrimeVue components
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import InputNumber from 'primevue/inputnumber'

const store = useTaxRuleStore()

// State
const searchTerm = ref('')
const showRuleModal = ref(false)
const taxForm = ref<Partial<TaxRule>>({})
const isEditMode = computed(() => taxForm.value.id != null)

// Fetch real data on mount
onMounted(() => {
  store.fetchTaxRules()
})

// Computed Properties
const filteredTaxRules = computed(() => {
  if (!store.rules) return []
  return store.rules.filter((rule) => {
    const term = searchTerm.value.toLowerCase()
    return (
      rule.tax_type?.toLowerCase().includes(term) ||
      rule.uf_origin?.toLowerCase().includes(term) ||
      rule.uf_destination?.toLowerCase().includes(term) ||
      rule.ncm_pattern?.toLowerCase().includes(term)
    )
  })
})

// Methods & Options
const openNewRuleModal = () => {
  taxForm.value = {
    tax_type: 'ICMS',
    rate: 0,
    uf_origin: 'SP',
    uf_destination: 'SP',
    ncm_pattern: '',
  }
  showRuleModal.value = true
}

const openEditRuleModal = (rule: TaxRule) => {
  taxForm.value = JSON.parse(JSON.stringify(rule))
  showRuleModal.value = true
}

const handleSubmit = () => {
  // This logic needs to be implemented based on store actions
  if (isEditMode.value) {
    // await store.updateTaxRule(taxForm.value)
  } else {
    // await store.createTaxRule(taxForm.value)
  }
  showRuleModal.value = false
}

const deleteRule = (id: string) => {
  if (confirm('Tem certeza que deseja excluir esta regra?')) {
    store.deleteTaxRule(id)
  }
}
</script>

<template>
  <main class="py-8">
    <div class="mb-8">
      <h1 class="text-xl font-bold mb-2">Gestão de Impostos</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Sistema inteligente para gestão tributária e cálculo automático de impostos nos lançamentos
        contábeis.
      </p>
    </div>

    <!-- Filters and Actions -->
    <div class="flex flex-col sm:flex-row gap-4 mb-4">
      <div class="relative flex-1">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Buscar por UF, NCM, Imposto..."
          class="w-full rounded-lg border border-surface-300 py-1 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-1 focus:ring-zinc-950 placeholder:text-sm"
        />
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 transform text-surface-400"
          style="font-size: 15px"
        ></i>
      </div>
      <Button label="Nova Regra" icon="pi pi-plus" @click="openNewRuleModal" size="small" />
    </div>

    <!-- Tax Rules Table -->
    <Card>
      <template #title><h2 class="text-base">Regras de Impostos</h2></template>
      <template #subtitle
        ><p class="text-xs">
          Configuração de alíquotas e regras tributárias por tipo de operação
        </p></template
      >
      <template #content>
        <DataTable
          :value="filteredTaxRules"
          :loading="store.loading"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="tax_type" header="Tipo de Imposto">
            <template #body="{ data }">
              <Tag :value="data.tax_type" />
            </template>
          </Column>
          <Column field="uf_origin" header="UF Origem" />
          <Column field="uf_destination" header="UF Destino" />
          <Column field="ncm_pattern" header="NCM">
            <template #body="{ data }">
              <code class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{
                data.ncm_pattern
              }}</code>
            </template>
          </Column>
          <Column field="rate" header="Alíquota">
            <template #body="{ data }">
              <span class="font-mono font-medium text-sm">{{ (data.rate * 100).toFixed(2) }}%</span>
            </template>
          </Column>
          <Column header="Ações">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  @click="openEditRuleModal(data)"
                  size="small"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  @click="deleteRule(data.id)"
                  size="small"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add/Edit Tax Rule Modal -->
    <Dialog
      :header="isEditMode ? 'Editar Regra de Imposto' : 'Nova Regra de Imposto'"
      v-model:visible="showRuleModal"
      modal
      class="sm:max-w-lg w-full"
    >
      <div class="space-y-4 p-fluid mt-4">
        <div>
          <label for="tax_type" class="text-sm font-semibold block mb-2">Tipo de Imposto</label>
          <InputText id="tax_type" v-model="taxForm.tax_type" size="small" />
        </div>
        <div>
          <label for="uf_origin" class="text-sm font-semibold block mb-2">UF Origem</label>
          <InputText id="uf_origin" v-model="taxForm.uf_origin" size="small" />
        </div>
        <div>
          <label for="uf_destination" class="text-sm font-semibold block mb-2">UF Destino</label>
          <InputText id="uf_destination" v-model="taxForm.uf_destination" size="small" />
        </div>
        <div>
          <label for="ncm_pattern" class="text-sm font-semibold block mb-2">Padrão NCM</label>
          <InputText id="ncm_pattern" v-model="taxForm.ncm_pattern" size="small" />
        </div>
        <div>
          <label for="rate" class="text-sm font-semibold block mb-2">Alíquota</label>
          <InputNumber
            id="rate"
            v-model="taxForm.rate"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="5"
            size="small"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="showRuleModal = false" size="small" />
        <Button
          :label="isEditMode ? 'Salvar Alterações' : 'Criar Regra'"
          @click="handleSubmit"
          size="small"
        />
      </template>
    </Dialog>
  </main>
</template>
