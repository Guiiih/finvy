export interface TaxData {
  calculated_icms_value: number;
  calculated_ipi_value: number;
  calculated_pis_value: number;
  calculated_cofins_value: number;
  calculated_irrf_value: number;
  calculated_csll_value: number;
  calculated_inss_value: number;
  calculated_icms_st_value: number;
  final_total_net: number;
}

export interface FiscalOperationData {
  operationType: 'Compra' | 'Venda' | null;
  productServiceType: 'Produto' | 'Serviço' | null;
  ufOrigin: string | null;
  ufDestination: string | null;
  cfop: string | null;
  totalAmount: number;
  freight: number;
  insurance: number;
  discount: number;
  icmsSt: boolean;
  ipiIncides: boolean;
  industrialOperation: boolean;
  taxData?: TaxData;
}