# Regras de Impostos (Tax Rules)

Este endpoint permite gerenciar as regras de impostos personalizadas para sua organização, que são utilizadas no cálculo de impostos para transações.

## Obter Todas as Regras de Impostos

`GET /tax-rules`

### Resposta (JSON)

Retorna um array de objetos `TaxRule`.

```json
[
  {
    "id": "uuid-da-regra-1",
    "uf_origin": "SP",
    "uf_destination": "RJ",
    "ncm_pattern": "33049910",
    "tax_type": "ICMS",
    "rate": 0.12,
    "description": "ICMS para SP para RJ, NCM 33049910",
    "start_date": "2023-01-01",
    "end_date": null,
    "organization_id": "uuid-da-organizacao"
  }
]
```

## Criar uma Nova Regra de Imposto

`POST /tax-rules`

### Corpo da Requisição (JSON)

| Campo             | Tipo     | Obrigatório | Descrição                                                              |
| :---------------- | :------- | :---------- | :--------------------------------------------------------------------- |
| `uf_origin`       | `string` | Sim         | UF de origem da regra (código do estado, ex: `"SP"`).                |
| `uf_destination`  | `string` | Sim         | UF de destino da regra (código do estado, ex: `"RJ"`).               |
| `ncm_pattern`     | `string` | Não         | Padrão NCM para a regra (8 dígitos).                                   |
| `tax_type`        | `string` | Sim         | Tipo de imposto (ex: `"ICMS"`, `"IPI"`, `"PIS"`, `"COFINS"`).      |
| `rate`            | `number` | Sim         | Alíquota do imposto (valor decimal, ex: `0.12` para 12%).              |
| `description`     | `string` | Não         | Descrição da regra.                                                    |
| `start_date`      | `string` | Não         | Data de início de validade da regra (formato YYYY-MM-DD).              |
| `end_date`        | `string` | Não         | Data de fim de validade da regra (formato YYYY-MM-DD).                 |

### Resposta (JSON)

Retorna o objeto `TaxRule` criado.

## Atualizar uma Regra de Imposto Existente

`PUT /tax-rules?id={id}`

### Parâmetros da URL

| Parâmetro | Tipo     | Obrigatório | Descrição                               |
| :-------- | :------- | :---------- | :-------------------------------------- |
| `id`      | `string` | Sim         | O ID da regra de imposto a ser atualizada. |

### Corpo da Requisição (JSON)

Os mesmos campos do `POST`, mas todos são opcionais, pois você só precisa enviar os campos que deseja atualizar.

### Resposta (JSON)

Retorna o objeto `TaxRule` atualizado.

## Deletar uma Regra de Imposto

`DELETE /tax-rules?id={id}`

### Parâmetros da URL

| Parâmetro | Tipo     | Obrigatório | Descrição                               |
| :-------- | :------- | :---------- | :-------------------------------------- |
| `id`      | `string` | Sim         | O ID da regra de imposto a ser deletada. |

### Resposta

`204 No Content` se a regra for deletada com sucesso.

## Códigos de Status HTTP

*   `200 OK`: Requisição bem-sucedida (GET, PUT).
*   `201 Created`: Regra criada com sucesso (POST).
*   `204 No Content`: Regra deletada com sucesso (DELETE).
*   `400 Bad Request`: Dados da requisição inválidos.
*   `401 Unauthorized`: Autenticação necessária.
*   `403 Forbidden`: Permissão negada.
*   `404 Not Found`: Regra não encontrada.
*   `500 Internal Server Error`: Erro interno do servidor.
