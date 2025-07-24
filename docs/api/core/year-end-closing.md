# Encerramento do Exercício

Este endpoint é utilizado para executar o processo de encerramento do exercício fiscal. Ele apura o resultado do período, zerando as contas de receita e despesa e transferindo o resultado líquido (lucro ou prejuízo) para o patrimônio líquido.

**Nota:** Esta é uma operação crítica que afeta significativamente os saldos contábeis. Uma vez executada, não pode ser desfeita facilmente.

## Objeto de Resposta

| Atributo | Tipo | Descrição |
|---|---|---|
| `message` | `string` | Uma mensagem confirmando o sucesso da operação e o resultado apurado. |

---

## Executar o Encerramento

Inicia o processo de encerramento para um determinado período.

<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
  <span style="background-color: #1867C0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">POST</span>
  <span>/api/year-end-closing</span>
</div>

### Corpo da Requisição

```json
{
  "closingDate": "2025-12-31"
}
```

| Atributo | Tipo | Descrição |
|---|---|---|
| `closingDate` | `string` | **Obrigatório.** A data final do exercício que está sendo encerrado, no formato `YYYY-MM-DD`. |

### Lógica do Processo

1.  **Apuração do Resultado:** A API calcula o saldo de todas as contas de Receita e Despesa.
2.  **Zerar Contas de Resultado:** Lançamentos de contrapartida são gerados para zerar o saldo de cada conta de receita e despesa.
3.  **Transferência para o PL:** A diferença líquida (lucro ou prejuízo) é transferida para uma conta de "Lucros ou Prejuízos Acumulados" no Patrimônio Líquido.

### Resposta

```json
{
  "message": "Fechamento de exercício para 2025-12-31 realizado com sucesso. Lucro Líquido: R$ 1234.56"
}
```