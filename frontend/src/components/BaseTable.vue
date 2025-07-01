<script setup lang="ts" generic="T extends Record<string, any>">

interface TableHeader {
  key: keyof T | 'actions'; // Permite 'actions' ou chaves de T
  label: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

// O componente agora espera um array do tipo genérico T
defineProps<{
  headers: TableHeader[];
  items: T[];
  emptyMessage?: string;
}>();

const getHeaderAlignClass = (align: TableHeader['align']) => {
  return align ? `text-${align}` : '';
};

const getCellAlignClass = (align: TableHeader['align']) => {
  return align ? `text-${align}` : '';
};
</script>

<template>
  <div class="base-table-container">
    <div v-if="!items || items.length === 0" class="empty-table-message">
      {{ emptyMessage || 'Nenhum dado para exibir.' }}
    </div>

    <table v-else class="base-table">
      <thead>
        <tr>
          <th v-for="header in headers" :key="String(header.key)" :class="getHeaderAlignClass(header.align)">
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, itemIndex) in items" :key="itemIndex">
          <td v-for="header in headers" :key="String(header.key)" :class="getCellAlignClass(header.align)">
            <slot :name="`cell(${String(header.key)})`" :item="item" :value="item[header.key]">
              {{ item[header.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Os seus estilos permanecem os mesmos */
.base-table-container {
  width: 100%;
  overflow-x: auto;
}
/* ... resto dos estilos */
</style>