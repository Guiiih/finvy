# Períodos Contábeis

Este endpoint gerencia os períodos contábeis (exercícios fiscais) dentro de uma organização. Cada período tem uma data de início e fim, e todos os lançamentos contábeis estão vinculados a um período específico.

## Objeto Período Contábil

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do período contábil (UUID). |
| `name` | `string` | O nome do período (ex: "Exercício 2025"). |
| `start_date` | `string` | A data de início do período no formato `YYYY-MM-DD`. |
| `end_date` | `string` | A data de fim do período no formato `YYYY-MM-DD`. |
| `organization_id` | `string` | O ID da organização à qual o período pertence. |
| `regime` | `string` | O regime tributário associado a este período (`simples_nacional`, `lucro_presumido`, `lucro_real`). |

---

## Listar Períodos Contábeis

Retorna uma lista de todos os períodos contábeis para a organização ativa do usuário.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/accounting-periods</span>
</div>

### Resposta

Retorna um array de objetos de Período Contábil, ordenados pela data de início (mais recentes primeiro).

---

## Criar um Período Contábil

Cria um novo período contábil para a organização ativa. A API valida para garantir que não haja sobreposição de datas com períodos existentes.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/accounting-periods</span>
</div>

### Corpo da Requisição

```json
{
  "name": "Exercício 2026",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "regime": "lucro_presumido"
}
```

### Resposta

Retorna um objeto contendo o período contábil e o registro de histórico do regime tributário criados.

---

## Atualizar um Período Contábil

Atualiza os detalhes de um período contábil existente.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/accounting-periods/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do período a ser atualizado. |

### Corpo da Requisição

```json
{
  "name": "Exercício Fiscal 2026"
}
```

### Resposta

Retorna o objeto do período contábil atualizado.

---

## Deletar um Período Contábil

Exclui um período contábil. Esta ação também removerá o registro de regime tributário associado.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/accounting-periods/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do período a ser deletado. |

### Resposta

`204 No Content` em caso de sucesso.