interface TaxCalculationParams {
  total_gross?: number;
  icms_rate?: number;
  ipi_rate?: number;
  pis_rate?: number;
  cofins_rate?: number;
  mva_rate?: number;
  transaction_type?: "sale" | "purchase";
  total_net?: number | null; // For purchases, total_net might be provided
}

interface TaxCalculationResult {
  calculated_icms_value: number;
  calculated_ipi_value: number;
  calculated_pis_value: number;
  calculated_cofins_value: number;
  calculated_icms_st_value: number;
  final_total_net: number;
}

export function calculateTaxes(
  params: TaxCalculationParams,
): TaxCalculationResult {
  const {
    total_gross,
    icms_rate,
    ipi_rate,
    pis_rate,
    cofins_rate,
    mva_rate,
    transaction_type,
    total_net,
  } = params;

  let calculated_icms_value = 0;
  let calculated_ipi_value = 0;
  let calculated_pis_value = 0;
  let calculated_cofins_value = 0;
  let calculated_icms_st_value = 0;
  let base_for_icms_and_pis_cofins = total_gross || 0;
  let final_total_net = total_net || 0; // Use the provided total_net for purchase/default

  // Only calculate taxes for sales (manufacturer scenario)
  if (transaction_type === "sale") {
    // 1. Calculate IPI
    if (total_gross !== undefined && ipi_rate !== undefined) {
      calculated_ipi_value = total_gross * (ipi_rate / 100);
      base_for_icms_and_pis_cofins = (total_gross || 0) + calculated_ipi_value; // Price with IPI
    }

    // 2. Calculate ICMS Próprio (using price with IPI as base)
    if (base_for_icms_and_pis_cofins !== undefined && icms_rate !== undefined) {
      calculated_icms_value = base_for_icms_and_pis_cofins * (icms_rate / 100);
    }

    // 3. Calculate PIS and COFINS (using initial total_gross as base for monofasico)
    if (total_gross !== undefined && pis_rate !== undefined) {
      calculated_pis_value = total_gross * (pis_rate / 100);
    }
    if (total_gross !== undefined && cofins_rate !== undefined) {
      calculated_cofins_value = total_gross * (cofins_rate / 100);
    }

    // 4. Calculate ICMS-ST
    if (
      base_for_icms_and_pis_cofins !== undefined &&
      mva_rate !== undefined &&
      icms_rate !== undefined
    ) {
      const base_icms_st = base_for_icms_and_pis_cofins * (1 + mva_rate / 100);
      const icms_st_total = base_icms_st * (icms_rate / 100);
      calculated_icms_st_value = icms_st_total - calculated_icms_value;
    }

    // Recalculate final_total_net for sales based on gross + calculated taxes
    final_total_net = total_gross || 0;
    final_total_net += calculated_ipi_value;
    final_total_net += calculated_icms_st_value;
  } else if (transaction_type === "purchase") {
    // For purchases, total_net is usually provided and includes taxes
    // The tax values are stored for reference, but don't alter final_total_net calculation here
    // This assumes total_net already reflects the final cost including taxes for purchases
    if (total_gross !== undefined && ipi_rate !== undefined) {
      calculated_ipi_value = total_gross * (ipi_rate / 100);
    }
    if (total_gross !== undefined && icms_rate !== undefined) {
      calculated_icms_value = total_gross * (icms_rate / 100);
    }
    if (total_gross !== undefined && pis_rate !== undefined) {
      calculated_pis_value = total_gross * (pis_rate / 100);
    }
    if (total_gross !== undefined && cofins_rate !== undefined) {
      calculated_cofins_value = total_gross * (cofins_rate / 100);
    }
    if (
      total_gross !== undefined &&
      mva_rate !== undefined &&
      icms_rate !== undefined
    ) {
      const base_icms_st = total_gross * (1 + mva_rate / 100);
      const icms_st_total = base_icms_st * (icms_rate / 100);
      calculated_icms_st_value = icms_st_total - calculated_icms_value;
    }
  }

  return {
    calculated_icms_value,
    calculated_ipi_value,
    calculated_pis_value,
    calculated_cofins_value,
    calculated_icms_st_value,
    final_total_net,
  };
}
