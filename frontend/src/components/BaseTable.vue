<script setup lang="ts">
import { computed } from 'vue';

interface TableHeader {
  key: string;     
  label: string;    
  align?: 'left' | 'center' | 'right'; 
  sortable?: boolean; 
}

const props = defineProps<{
  headers: TableHeader[]; 
  items: any[];           
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
          <th v-for="header in headers" :key="header.key" :class="getHeaderAlignClass(header.align)">
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, itemIndex) in items" :key="itemIndex">
          <td v-for="header in headers" :key="header.key" :class="getCellAlignClass(header.align)">
            <slot :name="`cell(${header.key})`" :item="item" :value="item[header.key]">
              {{ item[header.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.base-table-container {
  width: 100%;
  overflow-x: auto; 
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 0.95em;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden; 
}

.base-table thead {
  background-color: #f0f0f0;
}

.base-table th {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  color: #333;
  font-weight: bold;
  text-transform: uppercase;
}

.base-table td {
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.base-table tbody tr:last-child td {
  border-bottom: none;
}

.base-table tbody tr:hover {
  background-color: #f5f5f5;
}

.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}

.empty-table-message {
  text-align: center;
  padding: 20px;
  color: #888;
  font-style: italic;
  background-color: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 8px;
  margin-top: 20px;
}
</style>