# Compartilhamento

Este endpoint permite compartilhar períodos contábeis específicos com outros usuários do Finvy, definindo permissões de leitura ou escrita. Apenas usuários com papel de `owner` ou `admin` na organização podem gerenciar compartilhamentos.

## Objeto Compartilhamento

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do registro de compartilhamento (UUID). |
| `accounting_period_id` | `string` | O ID do período contábil que está sendo compartilhado. |
| `shared_with_user_id` | `string` | O ID do usuário com quem o período foi compartilhado. |
| `permission_level` | `string` | O nível de permissão (`read` ou `write`). |
| `shared_by_user_id` | `string` | O ID do usuário que realizou o compartilhamento. |
| `profiles` | `object` | Um objeto com o `username` do usuário com quem o período foi compartilhado. |

---

## Listar Compartilhamentos de um Período

Retorna uma lista de todos os compartilhamentos para um período contábil específico.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/sharing</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `accounting_period_id` | `string` | **Obrigatório.** O ID do período contábil para listar os compartilhamentos. |

### Resposta

Retorna um array de objetos de Compartilhamento.

---

## Compartilhar um Período

Cria um novo compartilhamento de um período contábil com outro usuário.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/sharing</span>
</div>

### Corpo da Requisição

Você pode identificar o usuário a receber o compartilhamento pelo seu ID (`shared_with_user_id`) ou pelo seu handle/email (`shared_with_identifier`).

```json
{
  "accounting_period_id": "p1q2r3s4-t5u6-7890-1234-567890abcdef",
  "shared_with_identifier": "colega@email.com",
  "permission_level": "read"
}
```

### Resposta

Retorna o objeto de compartilhamento recém-criado.

---

## Remover um Compartilhamento

Revoga o acesso de um usuário a um período contábil compartilhado.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/sharing</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | **Obrigatório.** O ID do registro de compartilhamento a ser removido. |

### Resposta

`204 No Content` em caso de sucesso.