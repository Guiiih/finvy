# Organizações

O endpoint de Organizações é central para o Finvy, pois gerencia os espaços de trabalho onde todos os dados contábeis residem. Um usuário pode ser proprietário de várias organizações ou membro de organizações compartilhadas por outros.

## Objeto Organização

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID único da organização (UUID). |
| `name` | `string` | O nome da organização (ex: "Minha Empresa LTDA"). |
| `cnpj` | `string` | Opcional. O CNPJ da organização. |
| `razao_social` | `string` | Opcional. A razão social da organização. |
| `uf` | `string` | Opcional. A unidade federativa (estado) da organização. |
| `municipio` | `string` | Opcional. O município da organização. |
| `is_personal` | `boolean` | `true` se for a organização pessoal padrão do usuário. `false` caso contrário. |
| `is_shared` | `boolean` | `true` se a organização foi compartilhada com o usuário atual por outro. |
| `shared_from_user_name` | `string` | O nome do usuário que compartilhou a organização. `null` se não for compartilhada. |

---

## Listar Organizações Acessíveis

Retorna uma lista de todas as organizações que o usuário atual pode acessar, incluindo as próprias e as compartilhadas.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">GET</span>
  <span>/api/organizations</span>
</div>

### Resposta

Retorna um array de objetos de Organização.

---

## Criar uma Organização

Cria uma nova organização e automaticamente atribui o usuário atual como `owner` (proprietário). Um período contábil padrão também é criado para a nova organização.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/organizations</span>
</div>

### Corpo da Requisição

```json
{
  "name": "Nova Consultoria XYZ",
  "cnpj": "12.345.678/0001-99"
}
```

### Resposta

Retorna um objeto contendo a organização e o período contábil criados.

---

## Atualizar uma Organização

Atualiza os detalhes de uma organização. Apenas usuários com papel de `owner` ou `admin` podem realizar esta ação.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #f0ad4e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PUT</span>
  <span>/api/organizations/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID da organização a ser atualizada. |

### Corpo da Requisição

```json
{
  "name": "Consultoria XYZ (Atualizado)",
  "uf": "SP"
}
```

### Resposta

Retorna o objeto da organização atualizada.

---

## Deletar uma Organização

Exclui permanentemente uma organização e **todos os seus dados associados** (períodos contábeis, lançamentos, contas, etc.). Esta ação não pode ser desfeita.

- Apenas usuários com papel de `owner` ou `admin` podem deletar uma organização.
- Não é possível deletar uma organização pessoal (`is_personal: true`).

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #d9534f; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">DELETE</span>
  <span>/api/organizations/{id}</span>
</div>

### Parâmetros de URL

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `id` | `string` | O ID da organização a ser deletada. |

### Resposta

`204 No Content` em caso de sucesso.