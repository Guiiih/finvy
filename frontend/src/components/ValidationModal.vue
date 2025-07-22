<template>
  <Dialog
    :visible="visible"
    modal
    header="Validar Solução de Exercício"
    :style="{ width: '50vw' }"
    @update:visible="(value) => emit('update:visible', value)"
    @hide="emit('close')"
  >
    <div class="p-fluid">
      <div class="p-field">
        <label for="exerciseText">Enunciado do Exercício</label>
        <Textarea
          id="exerciseText"
          v-model="exerciseText"
          rows="5"
          cols="30"
          placeholder="Cole o enunciado do exercício aqui..."
        />
      </div>
      <div class="p-field">
        <label for="userSolution">Sua Solução</label>
        <Textarea
          id="userSolution"
          v-model="userSolution"
          rows="5"
          cols="30"
          placeholder="Cole sua solução aqui..."
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        class="p-button-text"
        @click="emit('close')"
      />
      <Button
        label="Validar"
        icon="pi pi-check"
        autofocus
        @click="submitValidation"
        :loading="loading"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const props = defineProps({
  visible: Boolean,
});

const emit = defineEmits(['close', 'submit', 'update:visible']);

const exerciseText = ref('');
const userSolution = ref('');
const loading = ref(false);

const submitValidation = () => {
  if (!exerciseText.value.trim() || !userSolution.value.trim()) {
    alert('Por favor, preencha o enunciado do exercício e sua solução.');
    return;
  }
  loading.value = true;
  emit('submit', { exercise: exerciseText.value, userSolution: userSolution.value });
  // Resetar campos após submissão (ou após o modal fechar)
  exerciseText.value = '';
  userSolution.value = '';
};
</script>

<style scoped>
.p-fluid .p-field {
  margin-bottom: 1rem;
}
</style>
