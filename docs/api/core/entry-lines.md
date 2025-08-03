# Linhas de Lançamento

Este endpoint gerencia as linhas individuais (débitos e créditos) que compõem um [Lançamento Contábil](./journal-entries.md). É aqui que a lógica de impostos e movimentação de estoque é tratada para transações de compra e venda.

## Objeto Linha de Lançamento

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único da linha (UUID). |
| `journal_entry_id` | `string` | O ID do lançamento contábil ao qual a linha pertence. |
| `account_id` | `string` | O ID da conta contábil sendo debitada ou creditada. |
| `debit` | `number` | O valor do débito. `null` se for um crédito. |
| `credit` | `number` | O valor do crédito. `null` se for um débito. |
| `product_id` | `string` | Opcional. O ID do produto associado à transação. |
| `quantity` | `integer` | Opcional. A quantidade do produto. |
| `total_gross` | `number` | O valor bruto total da transação, base para impostos. |
| `icms_value` | `number` | O valor calculado de ICMS. |
| `ipi_value` | `number` | O valor calculado de IPI. |
| `pis_value` | `number` | O valor calculado de PIS. |
| `cofins_value` | `number` | O valor calculado de COFINS. |
| `icms_st_value` | `number` | O valor calculado de ICMS-ST. |
| `total_net` | `number` | O valor líquido final da transação. |

---

## Listar Linhas de um Lançamento

Retorna todas as linhas de lançamento para um `journal_entry_id` específico.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/entry-lines</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `journal_entry_id` | `string` | **Obrigatório.** O ID do lançamento contábil para filtrar as linhas. |

### Resposta

Retorna um array de objetos de Linha de Lançamento.

---

## Criar Linhas de Lançamento (Venda/Compra)

Cria um conjunto de linhas de lançamento para uma transação de venda ou compra. A API abstrai a complexidade dos múltiplos débitos e créditos necessários, gerando-os automaticamente com base no tipo de transação.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/entry-lines</span>
</div>

### Corpo da Requisição

O corpo da requisição varia ligeiramente entre venda e compra, mas a estrutura principal é a seguinte:

```json
{
  "journal_entry_id": "f1g2h3i4-j5k6-7890-1234-567890abcdef",
  "account_id": "c1d2e3f4-g5h6-7890-1234-567890abcdef", // ID da conta de Clientes (venda) ou Fornecedores (compra)
  "transaction_type": "sale", // ou "purchase"
  "total_gross": 1000.00, // Valor bruto dos produtos/serviços
  "product_id": "p1q2r3s4-t5u6-7890-1234-567890abcdef", // Opcional
  "quantity": 10, // Opcional
  "unit_cost": 50.00 // Opcional, custo do produto no momento da venda
}
```

### Resposta

`201 Created` com um array contendo todas as linhas de lançamento que foram criadas pela transação.
