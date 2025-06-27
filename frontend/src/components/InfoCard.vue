<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: number;
  currency?: string; 
  isPositive?: boolean | null; 
}>();

const valueClass = computed(() => {
  if (props.isPositive === true) {
    return 'positive-value';
  } else if (props.isPositive === false) {
    return 'negative-value';
  }
  return 'neutral-value';
});

const formattedValue = computed(() => {
  const absValue = Math.abs(props.value);
  const sign = props.value < 0 ? '-' : '';
  const currencySymbol = props.currency || ''; 
  return `${sign}${currencySymbol} ${absValue.toFixed(2)}`;
});
</script>

<template>
  <div class="info-card">
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-value" :class="valueClass">
      {{ formattedValue }}
    </p>
  </div>
</template>

<style scoped>
.info-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.card-title {
  font-size: 1.1em;
  color: #555;
  margin-top: 0;
  margin-bottom: 10px;
  text-transform: uppercase;
  font-weight: bold;
}

.card-value {
  font-size: 1.8em;
  font-weight: bold;
  margin: 0;
}

.neutral-value {
  color: #333;
}

.positive-value {
  color: #28a745; 
}

.negative-value {
  color: #dc3545; 
}
</style>