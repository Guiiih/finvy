# Contas (Plano de Contas)

O endpoint de Contas é usado para gerenciar o plano de contas de uma organização. Ele permite criar, listar, atualizar e deletar contas contábeis.

## Objeto Conta

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único da conta (UUID). |
| `name` | `string` | O nome da conta (ex: "Caixa", "Receita de Vendas"). |
| `type` | `string` | O tipo da conta (ex: `Asset`, `Liability`, `Equity`, `Revenue`, `Expense`). |
| `code` | `string` | O código contábil da conta (ex: "1.1.01.001"). |
| `parent_account_id` | `string` | O ID da conta pai, para contas aninhadas. `null` para contas de nível superior. |
| `organization_id` | `string` | O ID da organização à qual a conta pertence. |
| `accounting_period_id` | `string` | O ID do período contábil ao qual a conta pertence. |

---

## Listar Contas

Retorna uma lista paginada de todas as contas para a organização e período contábil ativos.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/accounts</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `page` | `integer` | Opcional. O número da página a ser retornada (padrão: 1). |
| `limit` | `integer` | Opcional. O número máximo de itens por página (padrão: 10). |

### Resposta

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Caixa",
      "type": "Asset",
      "code": "1.1.01.001",
      "parent_account_id": null
    }
  ],
  "count": 1
}
```

---

## Criar uma Conta

Cria uma nova conta contábil.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/accounts</span>
</div>

### Corpo da Requisição

```json
{
  "name": "Banco Conta Movimento",
  "type": "Asset",
  "code": "1.1.01.002",
  "parent_account_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

### Resposta

Retorna o objeto da conta recém-criada.

---

## Atualizar uma Conta

Atualiza os detalhes de uma conta existente.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/accounts/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID da conta a ser atualizada. |

### Corpo da Requisição

```json
{
  "name": "Banco Principal"
}
```

### Resposta

Retorna o objeto da conta atualizada.

---

## Deletar uma Conta

Exclui uma conta contábil.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/accounts/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID da conta a ser deletada. |

### Resposta

`204 No Content` em caso de sucesso.