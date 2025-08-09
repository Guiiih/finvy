<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

import { useTaxRuleStore } from '@/stores/taxRuleStore';
import type { TaxRule } from '@/types';
import { Form, Field, ErrorMessage } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';

const store = useTaxRuleStore();
const toast = useToast();

const props = defineProps<{
  visible: boolean;
  editingRule: TaxRule | null;
}>();

const emit = defineEmits(['update:visible', 'submitSuccess']);

const displayModal = ref(props.visible);

watch(() => props.visible, (value) => {
  displayModal.value = value;
});

watch(displayModal, (value) => {
  emit('update:visible', value);
});

const schema = toTypedSchema(
  z.object({
    uf_origin: z.string().length(2),
    uf_destination: z.string().length(2),
    ncm_pattern: z.string().optional(),
    tax_type: z.string(),
    rate: z.number(),
  })
);

async function handleSubmit(values: Partial<TaxRule>, { resetForm }: { resetForm: () => void }) {
  try {
    if (props.editingRule) {
      await store.updateTaxRule(props.editingRule.id, values);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Regra atualizada com sucesso!', life: 3000 });
    } else {
      await store.addTaxRule(values as Omit<TaxRule, 'id'>);
      toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Regra criada com sucesso!', life: 3000 });
    }
    resetForm();
    emit('submitSuccess');
    displayModal.value = false;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ocorreu um erro.';
    toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 3000 });
  }
}

</script>

<template>
  <Dialog v-model:visible="displayModal" modal :header="editingRule ? 'Editar Regra' : 'Nova Regra'" :style="{ width: '50vw' }">
    <div class="p-4">
      <Form @submit="handleSubmit" :validation-schema="schema" :initial-values="editingRule || {}">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label>UF Origem</label>
            <Field name="uf_origin" type="text" class="p-inputtext p-component w-full" />
            <ErrorMessage name="uf_origin" class="text-red-500" />
          </div>
          <div>
            <label>UF Destino</label>
            <Field name="uf_destination" type="text" class="p-inputtext p-component w-full" />
            <ErrorMessage name="uf_destination" class="text-red-500" />
          </div>
          <div>
            <label>NCM</label>
            <Field name="ncm_pattern" type="text" class="p-inputtext p-component w-full" />
            <ErrorMessage name="ncm_pattern" class="text-red-500" />
          </div>
          <div>
            <label>Imposto</label>
            <Field name="tax_type" type="text" class="p-inputtext p-component w-full" />
            <ErrorMessage name="tax_type" class="text-red-500" />
          </div>
          <div>
            <label>Alíquota</label>
            <Field name="rate" type="number" step="0.0001" class="p-inputtext p-component w-full" />
            <ErrorMessage name="rate" class="text-red-500" />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <Button type="button" label="Cancelar" severity="secondary" @click="displayModal = false"></Button>
          <Button type="submit" label="Salvar"></Button>
        </div>
      </Form>
    </div>
  </Dialog>
</template>
