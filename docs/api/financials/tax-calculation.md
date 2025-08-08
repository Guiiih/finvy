# Cálculo de Impostos Fiscais

Este endpoint permite simular o cálculo de impostos fiscais com base em dados de uma operação.

## `POST /api/calculate-fiscal-taxes`

Calcula os impostos (ICMS, IPI, PIS, COFINS, IRRF, CSLL, INSS) para uma dada operação fiscal.

### Request Body

```json
{
  "operationType": "Compra" | "Venda",
  "productServiceType": "Produto" | "Serviço",
  "ufOrigin": "SP",
  "ufDestination": "MG",
  "cfop": "5101",
  "totalAmount": 1000.00,
  "freight": 50.00,
  "insurance": 10.00,
  "discount": 20.00,
  "icmsSt": false,
  "ipiIncides": true,
  "industrialOperation": false
}
```

**Propriedades:**

*   `operationType` (string, obrigatório): Tipo da operação fiscal (`"Compra"` ou `"Venda"`).
*   `productServiceType` (string, obrigatório): Indica se a operação é de `"Produto"` ou `"Serviço"`.
*   `ufOrigin` (string, obrigatório): UF de origem da operação (ex: `"SP"`).
*   `ufDestination` (string, obrigatório): UF de destino da operação (ex: `"MG"`).
*   `cfop` (string, obrigatório): Código Fiscal de Operações e Prestações (ex: `"5101"`).
*   `totalAmount` (number, obrigatório): Valor total da operação.
*   `freight` (number, opcional): Valor do frete. Padrão: `0`.
*   `insurance` (number, opcional): Valor do seguro. Padrão: `0`.
*   `discount` (number, opcional): Valor do desconto. Padrão: `0`.
*   `icmsSt` (boolean, obrigatório): Indica se há incidência de ICMS-ST.
*   `ipiIncides` (boolean, obrigatório): Indica se há incidência de IPI.
*   `industrialOperation` (boolean, obrigatório): Indica se é uma operação industrial.

### Response

```json
{
  "calculatedTaxes": {
    "icms": {
      "rate": 18,
      "amount": 180.00
    },
    "ipi": {
      "rate": 10,
      "amount": 100.00
    },
    "pis": {
      "rate": 0.65,
      "amount": 6.50
    },
    "cofins": {
      "rate": 3,
      "amount": 30.00
    },
    "irrf": {
      "rate": 1.5,
      "amount": 15.00
    },
    "csll": {
      "rate": 1,
      "amount": 10.00
    },
    "inss": {
      "rate": 11,
      "amount": 110.00
    }
  }
}
```

**Propriedades:**

*   `calculatedTaxes` (object): Objeto contendo os impostos calculados. Cada imposto (ex: `icms`, `ipi`) possui as propriedades `rate` (alíquota em porcentagem) e `amount` (valor calculado).

### Erros

*   `400 Bad Request`: Dados de entrada inválidos.
*   `500 Internal Server Error`: Erro interno do servidor ao processar o cálculo.
