# Contas a Pagar e a Receber

Este endpoint gerencia as transações financeiras de contas a pagar e a receber, que não se originam diretamente de uma nota fiscal de compra ou venda (ex: salários, aluguel, etc.).

## Objeto Transação Financeira

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único da transação (UUID). |
| `description` | `string` | A descrição da transação (ex: "Aluguel do escritório"). |
| `amount` | `number` | O valor da transação. |
| `due_date` | `string` | A data de vencimento no formato `YYYY-MM-DD`. |
| `is_paid` | `boolean` | Para contas a pagar, indica se a conta foi paga. |
| `paid_date` | `string` | A data em que a conta foi paga. `null` se não foi paga. |
| `is_received` | `boolean` | Para contas a receber, indica se o valor foi recebido. |
| `received_date` | `string` | A data em que o valor foi recebido. `null` se não foi recebido. |

---

## Listar Transações

Retorna uma lista de contas a pagar ou a receber.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/financial-transactions</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `type` | `string` | **Obrigatório.** O tipo de transação a ser listada. Valores possíveis: `payable` (a pagar), `receivable` (a receber). |

### Resposta

Retorna um array de objetos de Transação Financeira.

---

## Criar uma Transação

Cria uma nova conta a pagar ou a receber.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/financial-transactions</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `type` | `string` | **Obrigatório.** O tipo de transação a ser criada. Valores possíveis: `payable`, `receivable`. |

### Corpo da Requisição

```json
{
  "description": "Pagamento de fornecedor de serviço",
  "amount": 500.00,
  "due_date": "2025-08-15"
}
```

### Resposta

Retorna o objeto da transação recém-criada.