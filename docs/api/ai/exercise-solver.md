# Resolvedor de Exercícios

Este endpoint utiliza IA para interpretar e propor uma solução para exercícios de contabilidade. Ele analisa o texto do problema e sugere os lançamentos contábeis necessários em formato de partidas dobradas.

---

## Resolver um Exercício

Envia o texto de um exercício contábil para ser resolvido.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/exercise-solver</span>
</div>

### Corpo da Requisição

```json
{
  "exercise": "A empresa XYZ comprou R$ 5.000,00 em mercadorias para revenda, pagando 50% à vista via transferência bancária e o restante a prazo."
}
```

| Atributo | Tipo | Descrição |
|---|---|---|
| `exercise` | `string` | **Obrigatório.** O texto completo do exercício a ser resolvido. |

### Resposta

`200 OK` com a solução proposta pela IA. A solução inclui uma explicação e uma estrutura de lançamentos que pode ser usada para confirmação.

```json
{
  "solution": {
    "explanation": "Para registrar esta transação, precisamos reconhecer o aumento no estoque, a saída de dinheiro do banco e a criação de uma obrigação com o fornecedor.",
    "proposedEntries": [
      {
        "date": "2025-07-24", // A data atual é usada como padrão
        "description": "Compra de mercadorias para revenda",
        "debits": [
          { "account": "Estoque de Mercadorias", "value": 5000.00 }
        ],
        "credits": [
          { "account": "Bancos Conta Movimento", "value": 2500.00 },
          { "account": "Fornecedores", "value": 2500.00 }
        ]
      }
    ]
  }
}
```