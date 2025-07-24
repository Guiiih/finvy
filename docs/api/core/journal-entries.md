# Lançamentos Contábeis

Este endpoint gerencia os cabeçalhos dos lançamentos contábeis (partidas dobradas). Cada lançamento de diário é um registro que contém uma data, uma descrição e está associado a múltiplas linhas de lançamento (débitos e créditos), que devem ser criadas usando o endpoint de [Linhas de Lançamento](./entry-lines.md).

## Objeto Lançamento Contábil

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do lançamento (UUID). |
| `entry_date` | `string` | A data do lançamento no formato `YYYY-MM-DD`. |
| `description` | `string` | Uma descrição para o lançamento (ex: "Venda de mercadorias"). |
| `organization_id` | `string` | O ID da organização à qual o lançamento pertence. |
| `accounting_period_id` | `string` | O ID do período contábil ao qual o lançamento pertence. |

---

## Listar Lançamentos

Retorna uma lista paginada de todos os lançamentos contábeis para a organização e período contábil ativos.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/journal-entries</span>
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
      "id": "f1g2h3i4-j5k6-7890-1234-567890abcdef",
      "entry_date": "2025-07-24",
      "description": "Pagamento de salários"
    }
  ],
  "count": 1
}
```

---

## Criar um Lançamento

Cria o cabeçalho de um novo lançamento contábil. As linhas de débito e crédito devem ser adicionadas separadamente.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/journal-entries</span>
</div>

### Corpo da Requisição

```json
{
  "entry_date": "2025-07-25",
  "description": "Compra de matéria-prima"
}
```

### Resposta

Retorna o objeto do lançamento recém-criado.

---

## Atualizar um Lançamento

Atualiza a data ou a descrição de um lançamento existente.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/journal-entries/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do lançamento a ser atualizado. |

### Corpo da Requisição

```json
{
  "description": "Compra de matéria-prima a prazo"
}
```

### Resposta

Retorna o objeto do lançamento atualizado.

---

## Deletar um Lançamento

Exclui um lançamento contábil e **todas as suas linhas de lançamento associadas**.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/journal-entries/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do lançamento a ser deletado. |

### Resposta

`204 No Content` em caso de sucesso.