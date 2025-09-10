<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :style="{ width: '50vw' }"
    :breakpoints="{ '1199px': '50vw', '575px': '80vw' }"
    @update:visible="handleVisibilityChange"
  >
    <template #header>
      <div class="flex flex-col items-start">
        <h2 class="text-lg font-semibold text-surface-700">Configurações da Conta</h2>
        <p class="text-xs text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>
    </template>
    <div class="text-foreground">
      <div class="max-w-4xl mx-auto">
        <!-- Tabs Navigation -->
        <div class="w-full">
          <div class="flex flex-wrap gap-4 sm:gap-8 mb-8 sm:mb-12">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-2 px-1 py-3 bg-transparent border-b-2 -mb-px',
                'whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
              ]"
            >
              <span class="hidden sm:inline text-sm">{{ tab.name }}</span>
              <span class="sm:hidden text-sm">{{ tab.shortName || tab.name }}</span>
            </button>
          </div>

          <!-- Tabs Content -->
          <div class="w-full">
            <div v-if="activeTab === 'perfil'">
              <ProfileSettings />
            </div>
            <div v-if="activeTab === 'seguranca'">
              <SecuritySettings />
            </div>
            <div v-if="activeTab === 'preferencias'">
              <PreferenceSettings />
            </div>
            <div v-if="activeTab === 'organizacoes'">
              <OrganizationSettings />
            </div>
            <div v-if="activeTab === 'tax-rules'">
              <TaxRulesView />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'

// Imports from SettingsView.vue
import ProfileSettings from '@/views/settings/components/ProfileSettings.vue'
import SecuritySettings from '@/views/settings/components/SecuritySettings.vue'
import PreferenceSettings from '@/views/settings/components/PreferenceSettings.vue'
import OrganizationSettings from '@/views/settings/components/OrganizationSettings.vue'
import TaxRulesView from '@/views/settings/components/TaxRulesView.vue'

const props = defineProps<{
  visible: boolean
  header?: string
}>()

const emit = defineEmits(['update:visible'])

const isVisible = ref(props.visible)

watch(
  () => props.visible,
  (newVal) => {
    isVisible.value = newVal
  },
)

const handleVisibilityChange = (value: boolean) => {
  isVisible.value = value
  emit('update:visible', value)
}

// From SettingsView.vue
const activeTab = ref('perfil')
const tabs = [
  { id: 'perfil', name: 'Perfil' },
  { id: 'seguranca', name: 'Segurança' },
  { id: 'preferencias', name: 'Preferências' },
  { id: 'organizacoes', name: 'Organizações', shortName: 'Orgs' },
  { id: 'tax-rules', name: 'Regras de Impostos', shortName: 'Impostos' },
]
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
