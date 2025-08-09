import { api } from './api';
import type { TaxRule } from '@/types';

export const getTaxRules = () => api.get<TaxRule[]>('/tax-rules');

export const createTaxRule = (rule: Omit<TaxRule, 'id'>) => api.post<TaxRule, Omit<TaxRule, 'id'>>('/tax-rules', rule);

export const updateTaxRule = (id: string, rule: Partial<TaxRule>) => api.put<TaxRule, Partial<TaxRule>>(`/tax-rules?id=${id}`, rule);

export const deleteTaxRule = (id: string) => api.delete(`/tax-rules?id=${id}`);
