export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Account {
  id: string
  name: string
  type: AccountType
  parent_account_id?: string | null
  user_id?: string
  code: string
  organization_id?: string
  accounting_period_id?: string
  is_protected?: boolean
  balance?: number // Adicionado para refletir o saldo da conta
  is_active?: boolean // Adicionado para indicar se a conta está ativa
}

export interface Product {
  id: string
  name: string
  sku?: string
  category?: string
  brand?: string
  minimum_stock?: number
  description?: string
  unit?: string
  icms_rate?: number
  user_id?: string
  organization_id?: string
  accounting_period_id?: string
  quantity_in_stock?: number // Adicionado para refletir a nova coluna
}

export type EntryType = 'debit' | 'credit'

export interface EntryLine {
  id?: string
  account_id: string
  type: EntryType
  amount: number
  product_id?: string
  quantity?: number
  unit_cost?: number
  icms_rate?: number
  total_gross?: number
  icms_value?: number
  total_net?: number
  debit?: number
  credit?: number
  organization_id?: string
  accounting_period_id?: string
}

export interface JournalEntry {
  id: string
  entry_date: string
  description: string
  reference: string
  status?: 'draft' | 'posted' | 'reviewed'
  lines: EntryLine[]
  user_id?: string
  organization_id?: string
  accounting_period_id?: string
}

export interface JournalEntryPayload extends Omit<JournalEntry, 'id' | 'lines' | 'user_id'> {
  organization_id?: string
  accounting_period_id?: string
  reference: string
}

export interface StockMovement {
  id: string
  journalEntryId?: string
  date: string
  type: 'purchase' | 'sale' | 'in' | 'out'
  productId: string
  quantity: number
  unit_cost: number
  totalValue: number
}

export interface ProductBalance {
  product_id: string
  productName: string
  quantity: number
  unit_cost: number
  totalValue: number
}

export interface LedgerAccount {
  account_id: string
  accountName: string
  type: AccountType
  debitEntries: number[]
  creditEntries: number[]
  totalDebits: number
  totalCredits: number
  debits: number
  credits: number
  finalBalance: number
}

export interface FinancialTransaction {
  id: string
  description: string
  amount: number
  due_date: string
  paid_date?: string | null
  received_date?: string | null
  is_paid?: boolean
  is_received?: boolean
  created_at: string
}

export interface AccountingPeriod {
  id: string
  organization_id: string
  name: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  regime?: TaxRegime | null // Adicionado o regime tributário
  costing_method: 'average' | 'fifo' | 'lifo' // Adicionado o método de custeio
}

export interface Organization {
  id: string
  name: string
  cnpj?: string | null
  razao_social?: string | null
  uf?: string | null
  municipio?: string | null
  created_at?: string // Tornar opcional
  is_personal?: boolean // Added is_personal property
  is_shared?: boolean // Indicates if this organization is accessed via a shared period
  shared_from_user_name?: string // Name of the user who shared the period
}

export type TaxRegime = 'simples_nacional' | 'lucro_presumido' | 'lucro_real'

export interface TaxRegimeHistory {
  id: string
  organization_id: string
  regime: TaxRegime
  start_date: string
  end_date: string
  created_at?: string
  updated_at?: string
}

export type UserRoleInOrganization = 'owner' | 'admin' | 'member' | 'guest'

export interface UserOrganizationRole {
  id: string
  user_id: string
  organization_id: string
  role: UserRoleInOrganization
  created_at: string
  updated_at: string
  profiles?: {
    // Nested profile data from Supabase join
    username: string
    email: string
    avatar_url?: string // Add avatar_url as optional
  }
}

export interface User {
  id: string
  email: string
  username?: string
  handle?: string
}

export type SharedPermissionLevel = 'read' | 'write'

export interface SharedAccountingPeriod {
  id: string
  accounting_period_id: string
  shared_with_user_id: string
  permission_level: SharedPermissionLevel
  shared_by_user_id?: string
  created_at: string
  updated_at: string
  profiles?: {
    // Nested profile data for the shared_with_user
    username: string
    email: string
  }
}

export interface NFeExtractedData {
  nfe_id: string
  emission_date: string
  type: 'entrada' | 'saida'
  cnpj_emit: string
  razao_social_emit: string
  uf_emit: string
  municipio_emit: string
  cnpj_dest: string
  razao_social_dest: string
  uf_dest: string
  municipio_dest: string
  total_products: number
  total_nfe: number
  total_icms: number
  total_ipi: number
  total_pis: number
  total_cofins: number
  organization_tax_regime: TaxRegime | null
  items: Array<{
    description: string
    ncm: string
    quantity: number
    unit_value: number
    total_value: number
    icms_value: number
    ipi_value: number
    pis_value: number
    cofins_value: number
  }>
}

export interface TaxSimulationResult {
  baseCalculoICMS: number
  aliquotaICMSInterestadual: number
  valorICMS: number
  valorICMSST?: number
  baseCalculoPISCOFINS: number
  valorPIS: number
  valorCOFINS: number
  calculationDetails: string[]
}
