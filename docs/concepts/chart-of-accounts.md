# Plano de Contas

O **Plano de Contas** é a espinha dorsal de qualquer sistema contábil. Ele é uma lista padronizada de todas as contas contábeis utilizadas por uma entidade para registrar suas transações financeiras. No Finvy, o Plano de Contas é personalizável e hierárquico, permitindo uma organização flexível e detalhada das informações financeiras.

## Estrutura do Plano de Contas

Um plano de contas é geralmente organizado em grupos principais, que refletem os elementos das demonstrações financeiras:

*   **Ativo:** Bens e direitos da empresa (ex: Caixa, Bancos, Estoques, Contas a Receber).
*   **Passivo:** Obrigações da empresa com terceiros (ex: Fornecedores, Empréstimos a Pagar, Salários a Pagar).
*   **Patrimônio Líquido:** Capital próprio da empresa (ex: Capital Social, Lucros Acumulados).
*   **Receitas:** Ganhos obtidos pela empresa (ex: Receita de Vendas, Receita de Serviços).
*   **Despesas:** Gastos incorridos para gerar receita (ex: Despesas com Salários, Aluguel, Água, Luz).

Cada uma dessas categorias é subdividida em contas mais específicas, formando uma estrutura hierárquica. Por exemplo, dentro de "Ativo", pode haver "Ativo Circulante", e dentro deste, "Caixa" e "Bancos".

## Contas no Finvy

No Finvy, cada conta possui os seguintes atributos:

*   `name`: O nome da conta (ex: "Caixa", "Receita de Vendas").
*   `type`: A classificação principal da conta (`Asset`, `Liability`, `Equity`, `Revenue`, `Expense`).
*   `code`: Um código numérico ou alfanumérico que identifica a conta e sua posição na hierarquia (ex: `1.1.01.001` para Caixa).
*   `parent_account_id`: Permite a criação de uma estrutura de contas aninhadas, onde uma conta pode ser "filha" de outra. Isso é fundamental para a organização e para a geração de relatórios consolidados.

## Importância do Plano de Contas

Um plano de contas bem estruturado é essencial para:

*   **Organização:** Classificar e registrar transações de forma consistente.
*   **Análise:** Facilitar a análise financeira, permitindo agrupar e comparar dados.
*   **Relatórios:** Gerar demonstrações financeiras precisas e úteis (Balanço Patrimonial, DRE, etc.).
*   **Controle:** Monitorar o desempenho financeiro e identificar áreas que precisam de atenção.

O Finvy permite que você personalize seu plano de contas para se adequar às necessidades específicas da sua organização, garantindo que seus registros contábeis sejam relevantes e informativos.