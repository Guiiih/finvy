# Cálculo de Impostos Fiscais

Este endpoint permite calcular impostos fiscais para uma operação de compra ou venda, utilizando as configurações de impostos da organização.

## Endpoint

`POST /calculate-fiscal-taxes`

## Corpo da Requisição (JSON)

| Campo              | Tipo      | Obrigatório | Descrição                                                              | Exemplo                               |
| :----------------- | :-------- | :---------- | :--------------------------------------------------------------------- | :------------------------------------ |
| `operationType`    | `string`  | Sim         | Tipo de operação fiscal (`"Compra"` ou `"Venda"`).                   | `"Venda"`                             |
| `productServiceType` | `string`  | Sim         | Tipo de item da operação (`"Produto"` ou `"Serviço"`).               | `"Produto"`                           |
| `ufOrigin`         | `string`  | Sim         | UF de origem da operação (código do estado, ex: `"SP"`).             | `"SP"`                                |
| `ufDestination`    | `string`  | Sim         | UF de destino da operação (código do estado, ex: `"RJ"`).            | `"RJ"`                                |
| `cfop`             | `string`  | Sim         | Código Fiscal de Operações e Prestações (CFOP).                      | `"5102"`                              |
| `totalAmount`      | `number`  | Sim         | Valor total da operação (bruto).                                     | `1000.00`                             |
| `freight`          | `number`  | Não         | Valor do frete. Padrão: `0`.                                         | `50.00`                               |
| `insurance`        | `number`  | Não         | Valor do seguro. Padrão: `0`.                                        | `10.00`                               |
| `discount`         | `number`  | Não         | Valor do desconto. Padrão: `0`.                                      | `20.00`                               |
| `icmsSt`           | `boolean` | Sim         | Indica se incide ICMS-ST (Substituição Tributária).                  | `true`                                |
| `ipiIncides`       | `boolean` | Sim         | Indica se incide IPI.                                                | `true`                                |
| `industrialOperation` | `boolean` | Sim         | Indica se é uma operação industrial.                                 | `false`                               |

## Resposta (JSON)

Retorna um objeto `calculatedTaxes` com os valores dos impostos calculados.

```json
{
  "calculatedTaxes": {
    "calculated_icms_value": 180.00,
    "calculated_ipi_value": 100.00,
    "calculated_pis_value": 16.50,
    "calculated_cofins_value": 76.00,
    "calculated_irrf_value": 0.00,
    "calculated_csll_value": 0.00,
    "calculated_inss_value": 0.00,
    "calculated_icms_st_value": 0.00,
    "final_total_net": 1280.00
  }
}
```

## Códigos de Status HTTP

*   `200 OK`: Impostos calculados com sucesso.
*   `400 Bad Request`: Dados da requisição inválidos.
*   `401 Unauthorized`: Dados de autenticação incompletos.
*   `404 Not Found`: Configurações de impostos não encontradas para a organização.
*   `500 Internal Server Error`: Erro interno do servidor.
