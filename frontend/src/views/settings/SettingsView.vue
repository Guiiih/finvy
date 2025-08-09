<template>
  <div class="text-foreground">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl mb-3">Configurações da Conta</h1>
        <p class="text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
      </div>

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
            <span class="hidden sm:inline">{{ tab.name }}</span>
            <span class="sm:hidden">{{ tab.shortName || tab.name }}</span>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProfileSettings from './components/ProfileSettings.vue'
import SecuritySettings from './components/SecuritySettings.vue'
import PreferenceSettings from './components/PreferenceSettings.vue'
import OrganizationSettings from './components/OrganizationSettings.vue'
import TaxRulesView from './TaxRulesView.vue'

const activeTab = ref('perfil')
const tabs = [
  { id: 'perfil', name: 'Perfil' },
  { id: 'seguranca', name: 'Segurança' },
  { id: 'preferencias', name: 'Preferências' },
  { id: 'organizacoes', name: 'Organizações', shortName: 'Orgs' },
  { id: 'tax-rules', name: 'Regras de Impostos', shortName: 'Impostos' },
]
</script>
