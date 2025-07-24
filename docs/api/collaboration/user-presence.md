# Presença de Usuário

Este endpoint gerencia e exibe o status online dos usuários dentro de um período contábil específico, permitindo saber quem está trabalhando no mesmo contexto em tempo real.

## Objeto Usuário Online

| Atributo | Tipo | Descrição |
|---|---|---|
| `user_id` | `string` | O ID do usuário que está online. |
| `username` | `string` | O nome de usuário. |
| `avatar_url` | `string` | A URL para o avatar do usuário. |

---

## Listar Usuários Online

Retorna uma lista de usuários que estão atualmente ativos em um período contábil específico.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/user-presence</span>
</div>

### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `organizationId` | `string` | **Obrigatório.** O ID da organização. |
| `activeAccountingPeriodId` | `string` | **Obrigatório.** O ID do período contábil. |

### Resposta

Retorna um array de objetos de Usuário Online.

---

## Atualizar Presença

Atualiza o status de presença do usuário, informando ao sistema que ele está ativo em um determinado período contábil. Este endpoint deve ser chamado periodicamente pelo frontend enquanto o usuário estiver ativo.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/user-presence</span>
</div>

### Corpo da Requisição

```json
{
  "organizationId": "o1p2q3r4-s5t6-7890-1234-567890abcdef",
  "activeAccountingPeriodId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

### Resposta

`200 OK` com uma mensagem de sucesso.