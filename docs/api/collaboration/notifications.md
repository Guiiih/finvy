# Notificações

Este endpoint gerencia as notificações dos usuários, informando sobre eventos relevantes como novos compartilhamentos ou atualizações importantes.

## Objeto Notificação

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único da notificação (UUID). |
| `user_id` | `string` | O ID do usuário que recebeu a notificação. |
| `message` | `string` | O conteúdo da notificação. |
| `is_read` | `boolean` | Indica se a notificação já foi lida. |
| `created_at` | `string` | A data e hora em que a notificação foi criada. |

---

## Listar Notificações

Retorna todas as notificações do usuário autenticado.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/notifications</span>
</div>

### Resposta

Retorna um array de objetos de Notificação.

---

## Marcar Notificação como Lida

Marca uma notificação específica como lida.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/notifications/{id}/mark-as-read</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID da notificação a ser marcada como lida. |

### Resposta

`204 No Content` em caso de sucesso.