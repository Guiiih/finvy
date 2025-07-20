import type { AccountType } from '@/types'

export const accountTypeTranslations: Record<AccountType, string> = {
  asset: 'Ativo',
  liability: 'Passivo',
  equity: 'Patrimônio Líquido',
  revenue: 'Receita',
  expense: 'Despesa',
}
