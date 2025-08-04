# Lançamentos Contábeis

No coração de qualquer sistema contábil está o conceito de **Lançamentos Contábeis**, que são o registro formal de todas as transações financeiras de uma entidade. O Finvy adere rigorosamente ao método das **Partidas Dobradas**, um princípio fundamental da contabilidade que garante que para cada débito, há um crédito correspondente de igual valor.

## O Princípio das Partidas Dobradas

Este princípio estabelece que cada transação afeta pelo menos duas contas, com um débito em uma conta e um crédito em outra (ou outras), de modo que o total dos débitos seja sempre igual ao total dos créditos. Isso garante o equilíbrio da equação contábil (Ativo = Passivo + Patrimônio Líquido).

**Exemplo:**

Quando uma empresa compra mercadorias a prazo:

*   **Débito:** Conta de Estoque (aumenta o ativo)
*   **Crédito:** Conta de Fornecedores (aumenta o passivo)

## Estrutura de um Lançamento no Finvy

No Finvy, um lançamento contábil é composto por duas partes principais:

1.  **Cabeçalho do Lançamento (`Journal Entry`):** Contém informações gerais sobre a transação:
    *   `entry_date`: A data em que a transação ocorreu.
    *   `description`: Uma breve descrição da transação.
    *   `id`: Um identificador único para o lançamento.

2.  **Linhas de Lançamento (`Entry Lines`):** São os detalhes do débito e crédito, vinculados ao cabeçalho do lançamento:
    *   `account_id`: A conta contábil afetada.
    *   `debit`: O valor debitado na conta (se aplicável).
    *   `credit`: O valor creditado na conta (se aplicável).
    *   Informações adicionais como `product_id`, `quantity`, e valores de impostos (`icms_value`, `ipi_value`, etc.) para transações mais complexas como vendas e compras.

## Como Funciona no Finvy

Ao registrar uma transação no Finvy, você cria um cabeçalho de lançamento e, em seguida, adiciona as linhas de débito e crédito. Para transações complexas como importação de NF-e ou vendas/compras de produtos, o sistema automatiza a criação de múltiplas linhas de lançamento, incluindo a segregação de impostos e a atualização do estoque, garantindo a conformidade com as partidas dobradas.

Por exemplo, ao importar uma NF-e de compra, o Finvy pode gerar automaticamente:

*   Um débito na conta de Estoque.
*   Um crédito na conta de Fornecedores.
*   Lançamentos adicionais para impostos como ICMS, IPI, PIS e COFINS, conforme o regime tributário da sua organização.

Essa automação reduz a chance de erros e acelera o processo de registro contábil.