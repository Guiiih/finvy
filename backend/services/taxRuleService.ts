import { getSupabaseClient } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';
import { TaxRule } from '../types/index.js';
import { PostgrestError } from '@supabase/supabase-js';

async function getTaxRules(organization_id: string, token: string): Promise<TaxRule[]> {
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase
    .from('tax_rules')
    .select('*')
    .eq('organization_id', organization_id);

  if (error) {
    const typedError = error as PostgrestError;
    logger.error({ err: typedError }, 'Error fetching tax rules:');
    throw new Error(typedError.message);
  }

  return data as TaxRule[];
}

async function createTaxRule(rule: Omit<TaxRule, 'id' | 'organization_id'>, organization_id: string, token: string): Promise<TaxRule> {
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase
    .from('tax_rules')
    .insert([{ ...rule, organization_id }])
    .select();

  if (error) {
    const typedError = error as PostgrestError;
    logger.error({ err: typedError }, 'Error creating tax rule:');
    throw new Error(typedError.message);
  }

  return data[0] as TaxRule;
}

async function updateTaxRule(id: string, updates: Partial<TaxRule>, organization_id: string, token: string): Promise<TaxRule> {
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase
    .from('tax_rules')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organization_id)
    .select();

  if (error) {
    const typedError = error as PostgrestError;
    logger.error({ err: typedError }, 'Error updating tax rule:');
    throw new Error(typedError.message);
  }

  return data[0] as TaxRule;
}

async function deleteTaxRule(id: string, organization_id: string, token: string): Promise<void> {
  const supabase = getSupabaseClient(token);
  const { error } = await supabase
    .from('tax_rules')
    .delete()
    .eq('id', id)
    .eq('organization_id', organization_id);

  if (error) {
    const typedError = error as PostgrestError;
    logger.error({ err: typedError }, 'Error deleting tax rule:');
    throw new Error(typedError.message);
  }
}

export {
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
};
