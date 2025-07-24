# Validador de Lançamentos

Este endpoint utiliza IA para validar a lógica de um lançamento contábil descrito em texto. Ele analisa a descrição e sugere as contas de débito e crédito apropriadas, ajudando a prevenir erros.

---

## Validar um Lançamento

Envia a descrição de um lançamento para ser validada pela IA.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/journal-entry-validator</span>
</div>

### Corpo da Requisição

```json
{
  "journalEntryDescription": "Pagamento de salários do mês de julho."
}
```

| Atributo | Tipo | Descrição |
|---|---|---|
| `journalEntryDescription` | `string` | **Obrigatório.** A descrição do lançamento que o usuário pretende fazer. |

### Resposta

`200 OK` com o resultado da validação, incluindo as contas sugeridas.

```json
{
  "validationResult": {
    "isValid": true,
    "suggestedDebitAccount": "Despesas com Salários",
    "suggestedCreditAccount": "Salários a Pagar",
    "explanation": "Para registrar o pagamento de salários, você deve debitar a conta de despesa correspondente e creditar uma conta de passivo (Salários a Pagar) ou diretamente o Caixa/Banco se o pagamento for imediato."
  }
}
```