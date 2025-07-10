<template>
  <div class="accounting-period-selector">
    <Dropdown
      v-model="selectedPeriodId"
      :options="accountingPeriods"
      optionLabel="name"
      optionValue="id"
      placeholder="Selecione um Período Contábil"
      class="w-full md:w-14rem"
      @change="handlePeriodChange"
    />
    <Button
      label="Novo Período"
      icon="pi pi-plus"
      class="p-button-sm ml-2"
      @click="showNewPeriodDialog = true"
    />

    <Dialog
      v-model:visible="showNewPeriodDialog"
      header="Novo Período Contábil"
      :modal="true"
      class="p-fluid"
    >
      <div class="field">
        <label for="periodName">Nome</label>
        <InputText
          id="periodName"
          v-model="newPeriod.name"
          required="true"
          autofocus
          :class="{'p-invalid': submitted && !newPeriod.name}"
        />
        <small class="p-error" v-if="submitted && !newPeriod.name"
          >Nome é obrigatório.</small
        >
      </div>
      <div class="field">
        <label for="startDate">Data de Início</label>
        <Calendar
          id="startDate"
          v-model="newPeriod.start_date"
          dateFormat="yy-mm-dd"
          :class="{'p-invalid': submitted && !newPeriod.start_date}"
        />
        <small class="p-error" v-if="submitted && !newPeriod.start_date"
          >Data de início é obrigatória.</small
        >
      </div>
      <div class="field">
        <label for="endDate">Data de Fim</label>
        <Calendar
          id="endDate"
          v-model="newPeriod.end_date"
          dateFormat="yy-mm-dd"
          :class="{'p-invalid': submitted && !newPeriod.end_date}"
        />
        <small class="p-error" v-if="submitted && !newPeriod.end_date"
          >Data de fim é obrigatória.</small
        >
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-text"
          @click="hideNewPeriodDialog"
        />
        <Button
          label="Salvar"
          icon="pi pi-check"
          class="p-button-text"
          @click="saveNewPeriod"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAccountingPeriodStore } from '@/stores/accountingPeriodStore';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import { useToast } from 'primevue/usetoast';
import type { AccountingPeriod } from '@/types';

interface NewAccountingPeriodForm {
  name: string;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
}

const accountingPeriodStore = useAccountingPeriodStore();
const { accountingPeriods, activeAccountingPeriod, loading, error } = storeToRefs(accountingPeriodStore);
const toast = useToast();

const selectedPeriodId = ref<string | null>(null);
const showNewPeriodDialog = ref(false);
const newPeriod = ref<NewAccountingPeriodForm>({
  name: '',
  start_date: null,
  end_date: null,
  is_active: false,
});
const submitted = ref(false);

onMounted(async () => {
  await accountingPeriodStore.fetchAccountingPeriods();
  if (activeAccountingPeriod.value) {
    selectedPeriodId.value = activeAccountingPeriod.value.id;
  }
});

watch(activeAccountingPeriod, (newVal) => {
  if (newVal) {
    selectedPeriodId.value = newVal.id;
  }
});

async function handlePeriodChange() {
  if (selectedPeriodId.value) {
    await accountingPeriodStore.setActivePeriod(selectedPeriodId.value);
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Período contábil ativo alterado.',
      life: 3000,
    });
  }
}

function hideNewPeriodDialog() {
  showNewPeriodDialog.value = false;
  submitted.value = false;
  newPeriod.value = {
    name: '',
    start_date: null,
    end_date: null,
    is_active: false,
  };
}

async function saveNewPeriod() {
  submitted.value = true;
  if (newPeriod.value.name && newPeriod.value.start_date && newPeriod.value.end_date) {
    if (!accountingPeriodStore.activeAccountingPeriod?.organization_id) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível determinar a organização do usuário.',
        life: 3000,
      });
      return;
    }

    try {
      // Convert dates to YYYY-MM-DD string format
      const startDate = newPeriod.value.start_date instanceof Date ? newPeriod.value.start_date.toISOString().split('T')[0] : newPeriod.value.start_date as string;
      const endDate = newPeriod.value.end_date instanceof Date ? newPeriod.value.end_date.toISOString().split('T')[0] : newPeriod.value.end_date as string;

      await accountingPeriodStore.addAccountingPeriod({
        ...newPeriod.value,
        start_date: startDate,
        end_date: endDate,
        is_active: true, // Novo período sempre se torna ativo
        organization_id: accountingPeriodStore.activeAccountingPeriod.organization_id,
      });
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Período contábil criado e ativado com sucesso!',
        life: 3000,
      });
      hideNewPeriodDialog();
    } catch (err: any) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: err.message || 'Falha ao criar período contábil.',
        life: 3000,
      });
    }
  }
}
</script>

<style scoped>
.accounting-period-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>