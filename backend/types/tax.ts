export interface TaxItem {
  rate: number;
  amount: number;
}

export interface TaxData {
  icms?: TaxItem;
  ipi?: TaxItem;
  pis?: TaxItem;
  cofins?: TaxItem;
  irrf?: TaxItem;
  csll?: TaxItem;
  inss?: TaxItem;
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