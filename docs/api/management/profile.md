# Perfil do Usuário

Este endpoint permite que o usuário autenticado gerencie suas próprias informações de perfil.

## Objeto Perfil

| Atributo | Tipo | Descrição |
|---|---|---|
| `username` | `string` | O nome de usuário. |
| `handle` | `string` | O identificador único do usuário (usado para compartilhamento). |
| `avatar_url` | `string` | A URL para a imagem de avatar do usuário. |
| `role` | `string` | O papel global do usuário no sistema. |
| `organization_id` | `string` | O ID da organização atualmente ativa para o usuário. |
| `active_accounting_period_id` | `string` | O ID do período contábil atualmente ativo. |

---

## Obter Perfil

Retorna o perfil do usuário atualmente autenticado.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/profile</span>
</div>

### Resposta

Retorna o objeto de Perfil do usuário.

---

## Atualizar Perfil

Atualiza as informações do perfil do usuário.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/profile</span>
</div>

### Corpo da Requisição

Você pode enviar qualquer um dos campos do objeto Perfil para atualização.

```json
{
  "username": "Novo Nome de Usuário",
  "active_accounting_period_id": "p1q2r3s4-t5u6-7890-1234-567890abcdef"
}
```

### Resposta

Retorna o objeto de Perfil atualizado.

---

## Deletar Conta de Usuário

Exclui permanentemente a conta do usuário e **todos os seus dados associados** do sistema, incluindo o registro de autenticação. Esta é uma ação destrutiva e irreversível.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/profile</span>
</div>

### Resposta

`200 OK` com uma mensagem de sucesso.

```json
{
  "message": "Usuário excluído com sucesso."
}
```