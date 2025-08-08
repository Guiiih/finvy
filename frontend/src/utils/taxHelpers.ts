import type { TaxData } from "@/types";

export const TAX_SECTIONS = {
  sales: {
    title: "Impostos sobre Vendas",
    taxes: [
      { key: "icms", label: "ICMS (%)", placeholder: "Alíquota ICMS" },
      { key: "ipi", label: "IPI (%)", placeholder: "Alíquota IPI" },
    ],
  },
  federal: {
    title: "Contribuições Federais",
    taxes: [
      { key: "pis", label: "PIS (%)", placeholder: "Alíquota PIS" },
      { key: "cofins", label: "COFINS (%)", placeholder: "Alíquota COFINS" },
    ],
  },
  retention: {
    title: "Retenções",
    taxes: [
      { key: "irrf", label: "IRRF (%)", placeholder: "Alíquota IRRF" },
      { key: "csll", label: "CSLL (%)", placeholder: "Alíquota CSLL" },
      { key: "inss", label: "INSS (%)", placeholder: "Alíquota INSS" },
    ],
  },
};

export const calculateTaxes = (totalAmount: number, taxData: TaxData): TaxData => {
  const calculated: TaxData = {};

  Object.values(TAX_SECTIONS).forEach(section => {
    section.taxes.forEach(tax => {
      const rate = taxData[tax.key as keyof TaxData]?.rate;
      calculated[tax.key as keyof TaxData] = {
        rate: (typeof rate === "number" && !isNaN(rate)) ? rate : 0,
        amount: (typeof rate === "number" && !isNaN(rate)) ? (totalAmount * rate) / 100 : 0,
      };
    });
  });

  return calculated;
};

export const getTotalTaxAmount = (calculatedTaxes: TaxData): number => {
  let total = 0;
  Object.values(calculatedTaxes).forEach(taxItem => {
    if (taxItem && typeof taxItem.amount === "number") {
      total += taxItem.amount;
    }
  });
  return total;
};
