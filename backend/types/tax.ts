export enum OperationType {
  VendaMercadorias = 'venda_mercadorias',
  VendaServicos = 'venda_servicos',
  CompraMateriaPrima = 'compra_materia_prima',
  CompraServicos = 'compra_servicos',
  Outros = 'outros',
}

export interface TaxData {
  calculated_icms_value: number
  calculated_ipi_value: number
  calculated_pis_value: number
  calculated_cofins_value: number
  calculated_irrf_value: number
  calculated_csll_value: number
  calculated_inss_value: number
  calculated_icms_st_value: number
  final_total_net: number
}

export interface FiscalOperationData {
  operationType: OperationType | null
  productServiceType: 'Produto' | 'Serviço' | null
  ufOrigin: string | null
  ufDestination: string | null
  cfop: string | null
  totalAmount: number
  freight: number
  insurance: number
  discount: number
  icmsSt: boolean
  ipiIncides: boolean
  industrialOperation: boolean
  transactionDate: string // Adicionado
  taxData?: TaxData
}

export interface TaxRule {
  id: string
  organization_id: string
  tax_type: 'ICMS' | 'IPI' | 'PIS' | 'COFINS'
  operation_type?: OperationType
  uf_origin?: string
  uf_destination?: string
  ncm_code?: string
  rate: number
  created_at?: string
  updated_at?: string
}

export enum TaxRegime {
  SimplesNacional = 'simples_nacional',
  LucroPresumido = 'lucro_presumido',
  LucroReal = 'lucro_real',
}
