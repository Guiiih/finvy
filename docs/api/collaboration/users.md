# Busca de Usuários

Este endpoint permite buscar usuários registrados no sistema com base em um termo de pesquisa, útil para funcionalidades como compartilhamento ou menções.

## Objeto Usuário Encontrado

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único do usuário (UUID). |
| `username` | `string` | O nome de usuário. |
| `email` | `string` | O endereço de e-mail do usuário. |
| `handle` | `string` | O identificador único do usuário (ex: `@nome_usuario`). |
| `avatar_url` | `string` | A URL para a imagem de avatar do usuário. |

---

## Buscar Usuários

Retorna uma lista de usuários que correspondem a um termo de pesquisa.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/users</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `query` | `string` | **Obrigatório.** O termo de pesquisa (pode ser parte do nome de usuário, email ou handle). |

### Resposta

Retorna um array de objetos de Usuário Encontrado.

```json
[
  {
    "id": "u1v2w3x4-y5z6-7890-1234-567890abcdef",
    "username": "João Silva",
    "email": "joao.silva@example.com",
    "handle": "@joaosilva",
    "avatar_url": "https://example.com/avatars/joao.png"
  }
]
```