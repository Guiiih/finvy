<script setup lang="ts" generic="T extends Record<string, any>">

// CORREÇÃO: A interface agora é genérica e a chave é restrita a strings de T.
export interface TableHeader<T> {
  label: string;
  key: Extract<keyof T, string> | 'actions'; // Garante que a chave é uma string
}

// O componente agora usa a interface genérica para a prop 'headers'.
const props = defineProps<{
  headers: TableHeader<T>[];
  items: T[];
}>();  

const emit = defineEmits<{
  (e: 'edit', item: T): void;
  (e: 'delete', item: T): void;
}>();

// Não são necessárias mais alterações no resto do script
const handleEdit = (item: T) => {
  emit('edit', item);
};

const handleDelete = (item: T) => {
  emit('delete', item);
};
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full bg-white border border-gray-200">
      <thead>
        <tr class="bg-gray-100">
          <th
            v-for="header in headers"
            :key="header.key"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-for="(item, index) in items" :key="index">
          <td
            v-for="header in headers"
            :key="header.key"
            class="px-6 py-4 whitespace-nowrap"
          >
            <slot :name="`cell(${String(header.key)})`" :item="item" :value="item[header.key]">
              <span v-if="header.key !== 'actions'">
                {{ item[header.key] }}
              </span>
              <div v-else class="flex space-x-2">
                <button @click="handleEdit(item)" class="text-blue-500 hover:text-blue-700">
                  Editar
                </button>
                <button @click="handleDelete(item)" class="text-red-500 hover:text-red-700">
                  Excluir
                </button>
              </div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>