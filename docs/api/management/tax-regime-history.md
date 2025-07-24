# Histórico de Regimes Tributários

Este endpoint gerencia o histórico de regimes tributários de uma organização. Ele é crucial para garantir que os cálculos de impostos sejam aplicados corretamente com base no regime vigente na data de cada transação.

Normalmente, você não precisará interagir com este endpoint diretamente, pois ele é gerenciado automaticamente através do endpoint de [Períodos Contábeis](./accounting-periods.md). No entanto, ele está disponível para consultas e ajustes finos.

## Objeto Histórico de Regime Tributário

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do registro de histórico (UUID). |
| `organization_id` | `string` | O ID da organização. |
| `regime` | `string` | O regime tributário (`simples_nacional`, `lucro_presumido`, `lucro_real`). |
| `start_date` | `string` | A data de início de vigência do regime no formato `YYYY-MM-DD`. |
| `end_date` | `string` | A data de fim de vigência do regime no formato `YYYY-MM-DD`. |

---

## Listar Histórico de Regimes

Retorna o histórico completo de regimes tributários para a organização ativa do usuário.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/tax-regime-history</span>
</div>

### Resposta

Retorna um array de objetos de Histórico de Regime Tributário.

---

## Criar um Registro de Histórico

Cria um novo registro de vigência para um regime tributário. A API valida para garantir que não haja sobreposição de datas com registros existentes.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/tax-regime-history</span>
</div>

### Corpo da Requisição

```json
{
  "regime": "lucro_real",
  "start_date": "2027-01-01",
  "end_date": "2027-12-31"
}
```

### Resposta

Retorna o objeto de histórico recém-criado.

---

## Atualizar um Registro de Histórico

Atualiza um registro de histórico existente.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/tax-regime-history/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do registro de histórico a ser atualizado. |

### Corpo da Requisição

```json
{
  "end_date": "2028-12-31"
}
```

### Resposta

Retorna o objeto de histórico atualizado.

---

## Deletar um Registro de Histórico

Exclui um registro de histórico de regime tributário.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/tax-regime-history/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID do registro de histórico a ser deletado. |

### Resposta

`204 No Content` em caso de sucesso.