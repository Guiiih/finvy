export const TAX_SECTIONS = {
  sales: {
    title: 'Impostos sobre Vendas',
    taxes: [
      { key: 'icms', label: 'ICMS (%)', placeholder: 'Alíquota ICMS' },
      { key: 'ipi', label: 'IPI (%)', placeholder: 'Alíquota IPI' },
    ],
  },
  federal: {
    title: 'Contribuições Federais',
    taxes: [
      { key: 'pis', label: 'PIS (%)', placeholder: 'Alíquota PIS' },
      { key: 'cofins', label: 'COFINS (%)', placeholder: 'Alíquota COFINS' },
    ],
  },
  retention: {
    title: 'Retenções',
    taxes: [
      { key: 'irrf', label: 'IRRF (%)', placeholder: 'Alíquota IRRF' },
      { key: 'csll', label: 'CSLL (%)', placeholder: 'Alíquota CSLL' },
      { key: 'inss', label: 'INSS (%)', placeholder: 'Alíquota INSS' },
    ],
  },
}
