# Membros e Papéis

Este endpoint gerencia os membros de uma organização e seus respectivos papéis (permissões). Apenas usuários com papel de `owner` ou `admin` podem adicionar, editar ou remover outros membros.

## Objeto Membro

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do registro de papel (UUID). |
| `user_id` | `string` | O ID do usuário que é membro. |
| `role` | `string` | O papel do usuário na organização (`owner`, `admin`, `member`, `guest`). |
| `profiles` | `object` | Um objeto com informações do perfil do usuário (`username`, `email`, `avatar_url`). |

---

## Listar Membros de uma Organização

Retorna uma lista de todos os usuários que são membros de uma organização específica.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/user-organization-roles</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `organization_id` | `string` | **Obrigatório.** O ID da organização cujos membros você deseja listar. |

### Resposta

Retorna um array de objetos de Membro.

---

## Adicionar um Membro

Adiciona um novo usuário a uma organização com um papel específico.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/user-organization-roles</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `organization_id` | `string` | **Obrigatório.** O ID da organização onde o membro será adicionado. |

### Corpo da Requisição

```json
{
  "user_id": "u1v2w3x4-y5z6-7890-1234-567890abcdef",
  "role": "member"
}
```

### Resposta

`201 Created` com uma mensagem de sucesso.

---

## Atualizar o Papel de um Membro

Altera o papel de um membro existente em uma organização.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/user-organization-roles</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `organization_id` | `string` | **Obrigatório.** O ID da organização. |
| `member_id` | `string` | **Obrigatório.** O ID do registro de papel (`user_organization_roles.id`) a ser atualizado. |

### Corpo da Requisição

```json
{
  "role": "admin"
}
```

### Resposta

Retorna o objeto de Membro atualizado.

---

## Remover um Membro

Remove um usuário de uma organização.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/user-organization-roles</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `organization_id` | `string` | **Obrigatório.** O ID da organização. |
| `member_id` | `string` | **Obrigatório.** O ID do registro de papel (`user_organization_roles.id`) a ser removido. |

### Resposta

`204 No Content` em caso de sucesso.