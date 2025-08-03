# Controle de Estoque e Produtos

O Finvy oferece um sistema integrado para gerenciar seus produtos e controlar o estoque, garantindo que você tenha uma visão precisa dos seus ativos e custos. O cálculo do Custo Médio Ponderado é automatizado, simplificando a gestão contábil.

## Cadastro de Produtos

Cada item que sua organização compra, vende ou utiliza deve ser cadastrado como um produto no Finvy. As informações essenciais incluem:

*   **Nome:** Identificação do produto.
*   **Descrição:** Detalhes adicionais sobre o produto.
*   **Estoque Atual:** A quantidade disponível do produto em seu estoque.

## Gerenciar Produtos

1.  **Acesse a Seção de Produtos:** Navegue até "Produtos" no menu principal.
2.  **Visualizar Produtos:** Veja a lista de todos os seus produtos, com seus detalhes e estoque atual.
3.  **Adicionar Novo Produto:**
    *   Clique em "Adicionar Produto".
    *   Preencha o nome e a descrição. O estoque inicial é zero.
4.  **Editar Produto:**
    *   Selecione o produto que deseja editar.
    *   Você pode alterar o nome e a descrição. O estoque é atualizado por meio de transações.
5.  **Excluir Produto:**
    *   Selecione o produto e clique em "Excluir".
    *   **Atenção:** Produtos com movimentações de estoque ou lançamentos associados não podem ser excluídos diretamente.

## Métodos de Custeio de Estoque (Custo Médio Ponderado, PEPS, UEPS)

O Finvy suporta diferentes métodos de custeio de estoque, permitindo que você escolha o mais adequado para cada período contábil da sua organização:

*   **Custo Médio Ponderado (CMP):** Recalcula o custo médio de cada item após cada nova compra.
*   **PEPS (Primeiro a Entrar, Primeiro a Sair - FIFO):** Assume que os primeiros itens comprados são os primeiros a serem vendidos.
*   **UEPS (Último a Entrar, Primeiro a Sair - LIFO):** Assume que os últimos itens comprados são os primeiros a serem vendidos.

O método de custeio é configurado por [Período Contábil](./accounting-periods.md).

### Como Funciona:

*   **Compras:** Ao registrar uma compra de produtos, o Finvy atualiza automaticamente o estoque e registra o lote de inventário com seu custo unitário.
*   **Vendas:** Ao registrar uma venda, o Finvy calcula o Custo da Mercadoria Vendida (CMV) e debita o estoque com base no método de custeio selecionado para o período contábil ativo.

## Movimentações de Estoque

As movimentações de estoque são registradas automaticamente através dos lançamentos contábeis de compra e venda. Você pode visualizar o histórico de movimentações de cada produto para acompanhar as entradas e saídas.

## Alertas de Estoque Mínimo (Funcionalidade Futura)

O Finvy está em constante evolução. Futuramente, você poderá configurar alertas de estoque mínimo para ser notificado quando a quantidade de um produto atingir um nível crítico, ajudando a evitar a falta de produtos.
