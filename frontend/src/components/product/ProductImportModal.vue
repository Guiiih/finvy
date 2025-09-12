<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

// --- EMITS ---
const emit = defineEmits(['start-import'])
const visible = defineModel<boolean>('visible')

// --- METHODS ---
const handleStartImport = () => {
  emit('start-import')
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Importar Produtos"
    :modal="true"
    class="w-full max-w-2xl"
  >
    <div class="space-y-6 p-4">
      <div class="space-y-4">
        <div class="border-2 border-dashed border-surface-300 rounded-lg p-8 text-center">
          <i class="pi pi-upload text-surface-400 text-5xl mx-auto mb-4"></i>
          <div class="space-y-2">
            <p class="font-medium">Arraste e solte seu arquivo aqui</p>
            <p class="text-sm text-surface-500">ou clique para selecionar</p>
            <Button label="Escolher Arquivo" severity="secondary" class="mt-2" />
          </div>
        </div>

        <div class="text-sm text-surface-500">
          <p class="mb-2">Formatos aceitos: .xlsx, .xls, .csv</p>
          <p>Tamanho máximo: 10MB</p>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="font-medium">Configurações de Importação</h4>

        <div class="space-y-3">
          <div class="flex items-center space-x-2">
            <Checkbox inputId="updateExisting" :binary="true" :modelValue="true" />
            <label for="updateExisting">Atualizar produtos existentes (baseado no SKU)</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="skipErrors" :binary="true" :modelValue="true" />
            <label for="skipErrors">Pular linhas com erro e continuar importação</label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox inputId="validateStock" :binary="true" :modelValue="false" />
            <label for="validateStock">Validar níveis de estoque mínimo/máximo</label>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-file text-blue-600"></i>
          <span class="font-medium text-blue-900">Modelo de Planilha</span>
        </div>
        <p class="text-sm text-blue-800 mb-3">
          Baixe o modelo oficial para garantir que sua importação seja processada corretamente.
        </p>
        <Button label="Baixar Modelo" severity="secondary">
          <i class="pi pi-download mr-2"></i>
          Baixar Modelo
        </Button>
      </div>

      <div class="space-y-2">
        <label>Mapeamento de Colunas</label>
        <p class="text-sm text-surface-500">
          As seguintes colunas são obrigatórias: Nome, Categoria, Marca, Custo Unitário, Preço de
          Venda
        </p>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="visible = false" />
      <Button label="Iniciar Importação" @click="handleStartImport">
        <i class="pi pi-upload mr-2"></i>
        Iniciar Importação
      </Button>
    </template>
  </Dialog>
</template>
