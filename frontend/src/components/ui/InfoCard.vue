<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number
  currency?: string
  isPositive?: boolean | null
}>()

const valueClass = computed(() => {
  if (props.isPositive === true) {
    return 'positive-value'
  }
  if (props.isPositive === false) {
    return 'negative-value'
  }

  if (props.value < 0) {
    return 'negative-value'
  }
  if (props.value > 0) {
    return 'positive-value'
  }

  return 'neutral-value'
})

const formattedValue = computed(() => {
  const absValue = Math.abs(props.value)
  const sign = props.value < 0 ? '-' : ''
  const currencySymbol = props.currency || ''
  return `${sign}${currencySymbol} ${absValue.toFixed(2)}`
})
</script>

<template>
  <div
    class="bg-surface-0 rounded-lg shadow-lg p-5 text-center flex flex-col justify-center items-center min-h-[120px]"
  >
    <h3 class="text-lg text-surface-600 uppercase font-bold mb-2 card-title">{{ title }}</h3>
    <p class="text-3xl font-bold m-0 card-value" :class="valueClass">
      {{ formattedValue }}
    </p>
  </div>
</template>
