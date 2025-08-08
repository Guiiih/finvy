# Lançamentos Contábeis

Os **Lançamentos Contábeis** são o coração do registro financeiro no Finvy. Cada transação que ocorre na sua organização é registrada como um lançamento, seguindo o princípio das Partidas Dobradas, onde cada débito corresponde a um crédito de igual valor.

## Tipos de Lançamentos

No Finvy, você pode realizar diferentes tipos de lançamentos:

*   **Lançamentos Manuais:** Para registrar transações diversas que não se encaixam em processos automatizados (ex: pagamento de aluguel, recebimento de juros).
*   **Lançamentos Automatizados:** Gerados automaticamente por funcionalidades como a importação de NF-e, vendas, compras e o fechamento de exercício.

## Criar um Lançamento Manual

1.  **Acesse a Seção de Lançamentos:** Navegue até "Lançamentos Contábeis" no menu principal.
2.  **Clique em "Novo Lançamento":**
    *   **Data:** Selecione a data em que a transação ocorreu.
    *   **Descrição:** Forneça uma descrição clara e concisa do lançamento (ex: "Pagamento de conta de luz - Julho").
3.  **Preencha os Detalhes do Lançamento:** O formulário de lançamento agora é organizado em abas para facilitar o preenchimento:
    *   **Aba "Básico":**
        *   **Data:** Selecione a data em que a transação ocorreu.
        *   **Descrição:** Forneça uma descrição clara e concisa do lançamento (ex: "Pagamento de conta de luz - Julho").
        *   **Prefixo da Referência:** Insira um prefixo para a referência do lançamento (ex: "NF", "REC", "FAT"). O sistema gerará automaticamente um número sequencial para completar a referência (ex: "NF001", "REC002").
        *   **Status:** Defina o status inicial do lançamento. As opções incluem: `Rascunho` (draft), `Lançado` (posted) e `Revisado` (reviewed).
    *   **Aba "Partidas":** Adicione as linhas de débito e crédito.
        *   **Conta:** Selecione a conta contábil afetada.
        *   **Tipo:** Escolha se é um débito ou crédito.
        *   **Valor:** Insira o valor da partida.
        *   **Importante:** O total dos débitos deve ser sempre igual ao total dos créditos para que o lançamento seja válido.
    *   **Aba "Produtos":** Se o lançamento envolver movimentação de estoque (compra ou venda de produtos), você pode associar produtos às linhas de lançamento. O sistema gerenciará automaticamente o estoque e o Custo da Mercadoria Vendida (CMV) com base no método de custeio configurado para o período contábil.
    *   **Aba "Impostos":** Para transações que envolvem impostos, você pode registrar as alíquotas e valores. O sistema auxiliará na segregação e apuração dos impostos.
4.  **Salvar Lançamento:** Após adicionar todas as linhas e garantir o equilíbrio, salve o lançamento.

## Visualizar e Gerenciar Lançamentos

Na seção de Lançamentos Contábeis, você pode:

*   **Filtrar e Pesquisar:** Encontre lançamentos por data, referência, descrição, contas envolvidas ou **status**.
*   **Filtros Avançados:** Utilize o botão "Filtros Avançados" para refinar sua busca por data (inicial/final), valor (mínimo/máximo - **observação: este filtro ainda não está totalmente implementado no backend**), criador, lançamentos **com movimentação de produto**, **com impostos calculados**, e **por contas contábeis específicas**.
*   **Visualizar Detalhes e Histórico:** Clique em qualquer linha da tabela para abrir o modal de visualização de lançamento. Este modal agora apresenta:
    *   **Abas Detalhadas:** Informações organizadas em abas para "Partidas Contábeis", "Movimentação de Produto", "Impostos Calculados" e a nova aba "Histórico".
    *   **Histórico de Alterações:** A aba "Histórico" permite acompanhar todas as alterações significativas feitas em um lançamento contábil, incluindo criação, mudanças de status e edições, com detalhes sobre o tipo de ação, data/hora e usuário responsável.
    *   **Botões de Ação:** Botões "Excluir", "Duplicar" e "Editar" para ações rápidas sobre o lançamento.
*   **Layout da Tabela Aprimorado:** A tabela de lançamentos foi otimizada para melhor legibilidade e usabilidade:
    *   **Colunas Ajustadas:** As larguras das colunas "Data", "Referência", "Descrição", "Valor", "Status" e "Ações" foram ajustadas para melhor aproveitamento do espaço.
    *   **Checkbox Integrado:** O checkbox de seleção de lançamentos foi movido para a mesma coluna da "Data", com espaçamento aprimorado para uma visualização mais limpa.
    *   **Skeleton Loader Aprimorado:** O skeleton loader foi redesenhado para refletir com precisão o layout e os tamanhos das colunas da tabela, proporcionando uma experiência de carregamento mais fluida.
    *   **Formato de Data Consistente:** A data agora é exibida no formato `YYYY/MM/DD` para maior clareza.
    *   **Estilo Visual do Status:** O status dos lançamentos agora utiliza um design de "tag" colorido, similar ao estilo dos tipos de conta, para uma identificação visual rápida e intuitiva.

## Histórico de Lançamentos

A nova aba "Histórico" no modal de visualização de lançamento permite que você acompanhe todas as alterações significativas feitas em um lançamento contábil. Cada entrada no histórico inclui:

*   **Tipo de Ação:** Indica se o lançamento foi criado, teve seu status alterado ou foi editado.
*   **Detalhes:** Informações específicas sobre a alteração (ex: status anterior e novo status).
*   **Data e Hora:** O momento exato em que a alteração ocorreu.
*   **Usuário/Sistema:** Quem realizou a alteração (um usuário específico ou o sistema).

## Rastreabilidade e Auditoria

Para garantir a integridade e a rastreabilidade dos dados, cada lançamento contábil agora registra:

*   **Informações do Criador:** Nome, e-mail e username do usuário que criou o lançamento.
*   **Data da Última Atualização (`updated_at`):** Um timestamp que é automaticamente atualizado sempre que o lançamento é modificado, permitindo um rastreamento preciso das alterações ao longo do tempo.



## Excluir Lançamentos

You pode excluir um lançamento contábil diretamente do modal de visualização ou através das ações em lote. Ao fazer isso, todas as linhas de débito e crédito associadas a ele também serão removidas. **Esta ação é irreversível.**