# Produtos e Estoque

Este endpoint é responsável pelo gerenciamento do cadastro de produtos e seus respectivos saldos de estoque e custos.

## Objeto Produto

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do produto (UUID). |
| `name` | `string` | O nome do produto. |
| `description` | `string` | Opcional. Uma descrição para o produto. |
| `unit_cost` | `number` | O custo médio ponderado atual do produto. Este valor é atualizado automaticamente pelas transações de compra. |
| `current_stock` | `number` | A quantidade atual de itens em estoque. |
| `organization_id` | `string` | O ID da organização à qual o produto pertence. |
| `accounting_period_id` | `string` | O ID do período contábil ao qual o produto pertence. |

---

## Listar Produtos

Retorna uma lista paginada de todos os produtos para a organização e período contábil ativos.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/products</span>
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
      "id": "p1q2r3s4-t5u6-7890-1234-567890abcdef",
      "name": "Produto Exemplo A",
      "description": "Componente eletrônico principal",
      "unit_cost": 55.75,
      "current_stock": 150
    }
  ],
  "count": 1
}
```

---

## Criar um Produto

Cria um novo produto com seu saldo de estoque e custo inicial.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/products</span>
</div>

### Corpo da Requisição

```json
{
  "name": "Produto Exemplo B",
  "description": "Componente secundário",
  "unit_cost": 10.00,
  "current_stock": 500
}
```

### Resposta

Retorna o objeto do produto recém-criado.

---

## Atualizar um Produto

Atualiza os detalhes de um produto existente. Note que `unit_cost` e `current_stock` não devem ser atualizados diretamente por este método, pois são controlados pelas transações de compra e venda.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/products/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do produto a ser atualizado. |

### Corpo da Requisição

```json
{
  "name": "Produto Exemplo B (Revisado)",
  "description": "Componente secundário - versão 2.0"
}
```

### Resposta

Retorna o objeto do produto atualizado.

---

## Deletar um Produto

Exclui um produto do cadastro.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/products/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do produto a ser deletado. |

### Resposta

`204 No Content` em caso de sucesso.