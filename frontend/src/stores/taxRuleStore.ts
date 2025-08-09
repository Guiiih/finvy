import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TaxRule } from '@/types';
import * as taxRuleApi from '@/services/taxRuleApiService';

export const useTaxRuleStore = defineStore('taxRules', () => {
  const rules = ref<TaxRule[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchTaxRules() {
    loading.value = true;
    error.value = null;
    try {
      rules.value = await taxRuleApi.getTaxRules();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tax rules.';
    } finally {
      loading.value = false;
    }
  }

  async function addTaxRule(rule: Omit<TaxRule, 'id'>) {
    loading.value = true;
    error.value = null;
    try {
      const newRule = await taxRuleApi.createTaxRule(rule);
      rules.value.push(newRule);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to add tax rule.';
      throw err;
    }
    finally {
      loading.value = false;
    }
  }

  async function updateTaxRule(id: string, updates: Partial<TaxRule>) {
    loading.value = true;
    error.value = null;
    try {
      const updatedRule = await taxRuleApi.updateTaxRule(id, updates);
      const index = rules.value.findIndex(r => r.id === id);
      if (index !== -1) {
        rules.value[index] = updatedRule;
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update tax rule.';
      throw err;
    }
    finally {
      loading.value = false;
    }
  }

  async function deleteTaxRule(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await taxRuleApi.deleteTaxRule(id);
      rules.value = rules.value.filter(r => r.id !== id);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tax rule.';
      throw err;
    }
    finally {
      loading.value = false;
    }
  }

  return { rules, loading, error, fetchTaxRules, addTaxRule, updateTaxRule, deleteTaxRule };
});
