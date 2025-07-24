# Relatórios Financeiros

Os endpoints de relatórios permitem gerar e exportar as principais demonstrações financeiras e contábeis.

---

## Gerar Dados de Relatórios

Este endpoint gera os dados calculados para os principais relatórios (Balancete, DRE, Balanço Patrimonial) com base em um intervalo de datas.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/reports/generate</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `startDate` | `string` | Opcional. A data de início para o filtro dos dados, no formato `YYYY-MM-DD`. |
| `endDate` | `string` | Opcional. A data de fim para o filtro dos dados, no formato `YYYY-MM-DD`. |

### Resposta

Retorna um objeto contendo os dados calculados para cada relatório.

```json
{
  "trialBalance": [
    { "accountName": "Caixa", "totalDebits": 10000, "totalCredits": 5000, "finalBalance": 5000 },
    // ... outros saldos
  ],
  "dre": {
    "totalRevenue": 50000,
    "totalExpenses": 30000,
    "netIncome": 20000
  },
  "balanceSheet": {
    "totalAssets": 75000,
    "totalLiabilities": 25000,
    "totalEquity": 50000,
    "isBalanced": true
  }
}
```

---

## Exportar Relatórios

Este endpoint exporta um relatório específico para um arquivo (XLSX, CSV ou PDF).

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/reports/export</span>
</div>

### Corpo da Requisição

```json
{
  "reportType": "dre",
  "format": "pdf",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

| Atributo | Tipo | Descrição |
|---|---|---|
| `reportType` | `string` | **Obrigatório.** O tipo de relatório a ser exportado. Valores possíveis: `trialBalance`, `dre`, `balanceSheet`, `ledgerDetails`. |
| `format` | `string` | **Obrigatório.** O formato do arquivo. Valores possíveis: `xlsx`, `csv`, `pdf`. |
| `startDate` | `string` | Opcional. A data de início para o filtro dos dados. |
| `endDate` | `string` | Opcional. A data de fim para o filtro dos dados. |

### Resposta

A resposta será o próprio arquivo para download, com os cabeçalhos `Content-Type` e `Content-Disposition` apropriados.