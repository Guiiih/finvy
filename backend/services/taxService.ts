import { getSupabaseClient } from '../utils/supabaseClient.js';
import { TaxRegime } from '../types/index.js'

interface TaxCalculationParams {
  total_gross?: number
  icms_rate?: number
  ipi_rate?: number
  pis_rate?: number
  cofins_rate?: number
  irrf_rate?: number
  csll_rate?: number
  inss_rate?: number
  mva_rate?: number
  transaction_type?: 'sale' | 'purchase'
  total_net?: number | null
  tax_regime?: TaxRegime | null
  ncm?: string | null
  uf_origin?: string | null
  uf_destination?: string | null
  organization_id: string
  token: string
}

interface TaxCalculationResult {
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

export async function calculateTaxes(params: TaxCalculationParams): Promise<TaxCalculationResult> {
  const {
    total_gross,
    icms_rate: initial_icms_rate,
    ipi_rate: initial_ipi_rate,
    pis_rate: initial_pis_rate,
    cofins_rate: initial_cofins_rate,
    irrf_rate: initial_irrf_rate,
    csll_rate: initial_csll_rate,
    inss_rate: initial_inss_rate,
    mva_rate: initial_mva_rate,
    transaction_type,
    total_net,
    tax_regime,
    ncm,
    uf_origin,
    uf_destination,
    organization_id,
    token,
  } = params

  const supabase = getSupabaseClient(token);

  let icms_rate = initial_icms_rate || 0
  let ipi_rate = initial_ipi_rate || 0
  let pis_rate = initial_pis_rate || 0
  let cofins_rate = initial_cofins_rate || 0
  let irrf_rate = initial_irrf_rate || 0
  let csll_rate = initial_csll_rate || 0
  let inss_rate = initial_inss_rate || 0
  let mva_rate = initial_mva_rate || 0

  if (uf_origin && uf_destination) {
    const { data: rule } = await supabase
      .from('tax_rules')
      .select('rate')
      .eq('organization_id', organization_id)
      .eq('uf_origin', uf_origin)
      .eq('uf_destination', uf_destination)
      .eq('tax_type', 'ICMS')
      .single();
    if (rule) {
      icms_rate = rule.rate * 100;
    }
  }

  // Simulação de alíquota de IPI baseada no NCM
  if (ncm === '33049910') { // Exemplo: NCM para cremes de beleza
    ipi_rate = 18; // Alíquota de 18% para este NCM
  }

  // Aplicar alíquotas baseadas no regime tributário, se fornecido
  if (tax_regime) {
    switch (tax_regime) {
      case TaxRegime.SimplesNacional:
        // Exemplo de alíquotas para Simples Nacional (simplificado)
        icms_rate = 0; // Geralmente isento ou pago no DAS
        ipi_rate = 0; // Geralmente isento ou pago no DAS
        pis_rate = 0.0038; // Exemplo
        cofins_rate = 0.0016; // Exemplo
        irrf_rate = 0; // Exemplo
        csll_rate = 0; // Exemplo
        inss_rate = 0; // Exemplo
        mva_rate = 0; // Exemplo
        break;
      case TaxRegime.LucroPresumido:
        // Exemplo de alíquotas para Lucro Presumido (simplificado)
        pis_rate = 0.0065;
        cofins_rate = 0.03;
        // Outras alíquotas podem ser as passadas ou padrão
        break;
      case TaxRegime.LucroReal:
        // Exemplo de alíquotas para Lucro Real (simplificado)
        pis_rate = 0.0165;
        cofins_rate = 0.076;
        // Outras alíquotas podem ser as passadas ou padrão
        break;
      default:
        // Usa as alíquotas passadas nos parâmetros
        break;
    }
  }

  let calculated_icms_value = 0
  let calculated_ipi_value = 0
  let calculated_pis_value = 0
  let calculated_cofins_value = 0
  let calculated_irrf_value = 0
  let calculated_csll_value = 0
  let calculated_inss_value = 0
  let calculated_icms_st_value = 0
  let base_for_icms_and_pis_cofins = total_gross || 0
  let final_total_net = total_net || 0

  // Only calculate taxes for sales (manufacturer scenario)
  if (transaction_type === 'sale') {
    // 1. Calculate IPI
    if (total_gross !== undefined && ipi_rate !== undefined) {
      calculated_ipi_value = total_gross * (ipi_rate / 100)
      base_for_icms_and_pis_cofins = (total_gross || 0) + calculated_ipi_value // Price with IPI
    }

    // 2. Calculate ICMS Próprio (using price with IPI as base)
    if (base_for_icms_and_pis_cofins !== undefined && icms_rate !== undefined) {
      calculated_icms_value = base_for_icms_and_pis_cofins * (icms_rate / 100)
    }

    // 3. Calculate PIS and COFINS (using initial total_gross as base for monofasico)
    if (total_gross !== undefined && pis_rate !== undefined) {
      calculated_pis_value = total_gross * (pis_rate / 100)
    }
    if (total_gross !== undefined && cofins_rate !== undefined) {
      calculated_cofins_value = total_gross * (cofins_rate / 100)
    }

    // 4. Calculate IRRF, CSLL, INSS (Retenções)
    if (total_gross !== undefined && irrf_rate !== undefined) {
      calculated_irrf_value = total_gross * (irrf_rate / 100)
    }
    if (total_gross !== undefined && csll_rate !== undefined) {
      calculated_csll_value = total_gross * (csll_rate / 100)
    }
    if (total_gross !== undefined && inss_rate !== undefined) {
      calculated_inss_value = total_gross * (inss_rate / 100)
    }

    // 5. Calculate ICMS-ST
    if (
      base_for_icms_and_pis_cofins !== undefined &&
      mva_rate !== undefined &&
      icms_rate !== undefined
    ) {
      const base_icms_st = base_for_icms_and_pis_cofins * (1 + mva_rate / 100)
      const icms_st_total = base_icms_st * (icms_rate / 100)
      calculated_icms_st_value = icms_st_total - calculated_icms_value
    }

    // Recalculate final_total_net for sales based on gross + calculated taxes
    final_total_net = total_gross || 0
    final_total_net += calculated_ipi_value
    final_total_net += calculated_icms_st_value
  } else if (transaction_type === 'purchase') {
    // For purchases, total_net is usually provided and includes taxes
    // The tax values are stored for reference, but don't alter final_total_net calculation here
    // This assumes total_net already reflects the final cost including taxes for purchases
    if (total_gross !== undefined && ipi_rate !== undefined) {
      calculated_ipi_value = total_gross * (ipi_rate / 100)
    }
    if (total_gross !== undefined && icms_rate !== undefined) {
      calculated_icms_value = total_gross * (icms_rate / 100)
    }
    if (total_gross !== undefined && pis_rate !== undefined) {
      calculated_pis_value = total_gross * (pis_rate / 100)
    }
    if (total_gross !== undefined && cofins_rate !== undefined) {
      calculated_cofins_value = total_gross * (cofins_rate / 100)
    }
    if (total_gross !== undefined && irrf_rate !== undefined) {
      calculated_irrf_value = total_gross * (irrf_rate / 100)
    }
    if (total_gross !== undefined && csll_rate !== undefined) {
      calculated_csll_value = total_gross * (csll_rate / 100)
    }
    if (total_gross !== undefined && inss_rate !== undefined) {
      calculated_inss_value = total_gross * (inss_rate / 100)
    }
    if (total_gross !== undefined && mva_rate !== undefined && icms_rate !== undefined) {
      const base_icms_st = total_gross * (1 + mva_rate / 100)
      const icms_st_total = base_icms_st * (icms_rate / 100)
      calculated_icms_st_value = icms_st_total - calculated_icms_value
    }
  }

  return {
    calculated_icms_value,
    calculated_ipi_value,
    calculated_pis_value,
    calculated_cofins_value,
    calculated_irrf_value,
    calculated_csll_value,
    calculated_inss_value,
    calculated_icms_st_value,
    final_total_net,
  }
}
