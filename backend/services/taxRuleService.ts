import { getSupabaseClient } from '../utils/supabaseClient.js';
import logger from '../utils/logger.js';
import { TaxRule } from '../types/index.js';

async function getTaxRules(organization_id: string, token: string): Promise<TaxRule[]> {
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase
    .from('tax_rules')
    .select('*')
    .eq('organization_id', organization_id);

  if (error) {
    logger.error('Error fetching tax rules:', error);
    throw new Error('Could not fetch tax rules.');
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
    logger.error('Error creating tax rule:', error);
    throw new Error('Could not create tax rule.');
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
    logger.error('Error updating tax rule:', error);
    throw new Error('Could not update tax rule.');
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
    logger.error('Error deleting tax rule:', error);
    throw new Error('Could not delete tax rule.');
  }
}

export {
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
};
