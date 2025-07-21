
import { describe, it, expect } from 'vitest';
import { calculateTaxes } from '../services/taxService';

describe('calculateTaxes', () => {
  // Testes para transações de VENDA
  it('should calculate taxes correctly for a SALE transaction with all taxes', () => {
    const params = {
      total_gross: 1000,
      icms_rate: 18,
      ipi_rate: 10,
      pis_rate: 1.65,
      cofins_rate: 7.6,
      mva_rate: 30,
      transaction_type: 'sale',
    };

    const result = calculateTaxes(params);

    // Expected calculations:
    // IPI: 1000 * (10/100) = 100
    // Base for ICMS/PIS/COFINS: 1000 + 100 = 1100
    // ICMS: 1100 * (18/100) = 198
    // PIS: 1000 * (1.65/100) = 16.5
    // COFINS: 1000 * (7.6/100) = 76
    // Base ICMS-ST: 1100 * (1 + 30/100) = 1100 * 1.3 = 1430
    // ICMS-ST Total: 1430 * (18/100) = 257.4
    // ICMS-ST Value: 257.4 - 198 = 59.4
    // Final Total Net: 1000 (gross) + 100 (IPI) + 59.4 (ICMS-ST) = 1159.4

    expect(result.calculated_ipi_value).toBeCloseTo(100);
    expect(result.calculated_icms_value).toBeCloseTo(198);
    expect(result.calculated_pis_value).toBeCloseTo(16.5);
    expect(result.calculated_cofins_value).toBeCloseTo(76);
    expect(result.calculated_icms_st_value).toBeCloseTo(59.4);
    expect(result.final_total_net).toBeCloseTo(1159.4);
  });

  it('should calculate taxes correctly for a SALE transaction with only ICMS and IPI', () => {
    const params = {
      total_gross: 500,
      icms_rate: 12,
      ipi_rate: 5,
      transaction_type: 'sale',
    };

    const result = calculateTaxes(params);

    // Expected calculations:
    // IPI: 500 * (5/100) = 25
    // Base for ICMS: 500 + 25 = 525
    // ICMS: 525 * (12/100) = 63
    // Final Total Net: 500 (gross) + 25 (IPI) = 525

    expect(result.calculated_ipi_value).toBeCloseTo(25);
    expect(result.calculated_icms_value).toBeCloseTo(63);
    expect(result.calculated_pis_value).toBeCloseTo(0);
    expect(result.calculated_cofins_value).toBeCloseTo(0);
    expect(result.calculated_icms_st_value).toBeCloseTo(0);
    expect(result.final_total_net).toBeCloseTo(525);
  });

  it('should calculate taxes correctly for a SALE transaction with only ICMS-ST', () => {
    const params = {
      total_gross: 2000,
      icms_rate: 17,
      mva_rate: 50,
      transaction_type: 'sale',
    };

    const result = calculateTaxes(params);

    // Expected calculations:
    // Base for ICMS: 2000
    // ICMS: 2000 * (17/100) = 340
    // Base ICMS-ST: 2000 * (1 + 50/100) = 2000 * 1.5 = 3000
    // ICMS-ST Total: 3000 * (17/100) = 510
    // ICMS-ST Value: 510 - 340 = 170
    // Final Total Net: 2000 (gross) + 170 (ICMS-ST) = 2170

    expect(result.calculated_ipi_value).toBeCloseTo(0);
    expect(result.calculated_icms_value).toBeCloseTo(340);
    expect(result.calculated_pis_value).toBeCloseTo(0);
    expect(result.calculated_cofins_value).toBeCloseTo(0);
    expect(result.calculated_icms_st_value).toBeCloseTo(170);
    expect(result.final_total_net).toBeCloseTo(2170);
  });

  it('should return zero for all calculated taxes if total_gross is undefined for SALE', () => {
    const params = {
      icms_rate: 18,
      ipi_rate: 10,
      pis_rate: 1.65,
      cofins_rate: 7.6,
      mva_rate: 30,
      transaction_type: 'sale',
    };

    const result = calculateTaxes(params);

    expect(result.calculated_ipi_value).toBeCloseTo(0);
    expect(result.calculated_icms_value).toBeCloseTo(0);
    expect(result.calculated_pis_value).toBeCloseTo(0);
    expect(result.calculated_cofins_value).toBeCloseTo(0);
    expect(result.calculated_icms_st_value).toBeCloseTo(0);
    expect(result.final_total_net).toBeCloseTo(0);
  });

  // Testes para transações de COMPRA
  it('should calculate taxes correctly for a PURCHASE transaction with all taxes and provided total_net', () => {
    const params = {
      total_gross: 1000,
      icms_rate: 18,
      ipi_rate: 10,
      pis_rate: 1.65,
      cofins_rate: 7.6,
      mva_rate: 30,
      transaction_type: 'purchase',
      total_net: 1200, // Assuming this is the final cost including taxes
    };

    const result = calculateTaxes(params);

    // For purchases, taxes are calculated for reference, but final_total_net is usually provided
    // IPI: 1000 * (10/100) = 100
    // ICMS: 1000 * (18/100) = 180
    // PIS: 1000 * (1.65/100) = 16.5
    // COFINS: 1000 * (7.6/100) = 76
    // Base ICMS-ST: 1000 * (1 + 30/100) = 1300
    // ICMS-ST Total: 1300 * (18/100) = 234
    // ICMS-ST Value: 234 - 180 = 54

    expect(result.calculated_ipi_value).toBeCloseTo(100);
    expect(result.calculated_icms_value).toBeCloseTo(180);
    expect(result.calculated_pis_value).toBeCloseTo(16.5);
    expect(result.calculated_cofins_value).toBeCloseTo(76);
    expect(result.calculated_icms_st_value).toBeCloseTo(54);
    expect(result.final_total_net).toBeCloseTo(1200); // Should remain the provided total_net
  });

  it('should calculate taxes correctly for a PURCHASE transaction with only ICMS and IPI', () => {
    const params = {
      total_gross: 500,
      icms_rate: 12,
      ipi_rate: 5,
      transaction_type: 'purchase',
      total_net: 550,
    };

    const result = calculateTaxes(params);

    // IPI: 500 * (5/100) = 25
    // ICMS: 500 * (12/100) = 60

    expect(result.calculated_ipi_value).toBeCloseTo(25);
    expect(result.calculated_icms_value).toBeCloseTo(60);
    expect(result.calculated_pis_value).toBeCloseTo(0);
    expect(result.calculated_cofins_value).toBeCloseTo(0);
    expect(result.calculated_icms_st_value).toBeCloseTo(0);
    expect(result.final_total_net).toBeCloseTo(550);
  });

  it('should handle total_net being null or undefined for PURCHASE', () => {
    const params = {
      total_gross: 100,
      transaction_type: 'purchase',
      total_net: null,
    };
    const result = calculateTaxes(params);
    expect(result.final_total_net).toBeCloseTo(0);

    const params2 = {
      total_gross: 100,
      transaction_type: 'purchase',
      // total_net is undefined
    };
    const result2 = calculateTaxes(params2);
    expect(result2.final_total_net).toBeCloseTo(0);
  });

  it('should return zero for all calculated taxes if total_gross is undefined for PURCHASE', () => {
    const params = {
      icms_rate: 18,
      ipi_rate: 10,
      pis_rate: 1.65,
      cofins_rate: 7.6,
      mva_rate: 30,
      transaction_type: 'purchase',
      total_net: 1200,
    };

    const result = calculateTaxes(params);

    expect(result.calculated_ipi_value).toBeCloseTo(0);
    expect(result.calculated_icms_value).toBeCloseTo(0);
    expect(result.calculated_pis_value).toBeCloseTo(0);
    expect(result.calculated_cofins_value).toBeCloseTo(0);
    expect(result.calculated_icms_st_value).toBeCloseTo(0);
    expect(result.final_total_net).toBeCloseTo(1200);
  });

  it('should return zero for all calculated taxes if no relevant parameters are provided', () => {
    const params = {};
    const result = calculateTaxes(params);

    expect(result.calculated_ipi_value).toBeCloseTo(0);
    expect(result.calculated_icms_value).toBeCloseTo(0);
    expect(result.calculated_pis_value).toBeCloseTo(0);
    expect(result.calculated_cofins_value).toBeCloseTo(0);
    expect(result.calculated_icms_st_value).toBeCloseTo(0);
    expect(result.final_total_net).toBeCloseTo(0);
  });
});
