# Importação de NF-e

A funcionalidade de **Importação de NF-e** no Finvy automatiza a entrada de dados de suas Notas Fiscais Eletrônicas (NF-e), transformando o processo de registro contábil de compras e vendas de horas em minutos. Ao invés de digitar manualmente cada item e valor, você pode simplesmente fazer o upload do arquivo XML da NF-e.

## Como Funciona a Importação

1.  **Acesse a Seção de Importação de NF-e:** Navegue até a área de lançamentos ou uma seção dedicada à importação de documentos.
2.  **Faça o Upload do Arquivo XML:** Selecione o arquivo XML da NF-e que você deseja importar do seu computador.
3.  **Processamento Automático:** O Finvy irá:
    *   **Extrair Dados:** Ler e extrair automaticamente todas as informações relevantes da NF-e, como dados do emitente e destinatário (CNPJ, Razão Social, UF, Município), valores totais (produtos, NF-e, ICMS, IPI, PIS, COFINS) e detalhes de cada item (descrição, quantidade, valor unitário).
    *   **Identificar Tipo de Transação:** Determinar se é uma nota de entrada (compra) ou saída (venda).
    *   **Aplicar Regime Tributário:** Com base na data de emissão da NF-e e no histórico de regimes tributários da sua organização, o Finvy aplicará as alíquotas de impostos corretas.
    *   **Sugerir Lançamentos:** O sistema irá gerar uma sugestão de lançamentos contábeis completos, incluindo as partidas dobradas para o valor da nota, impostos e movimentação de estoque (se aplicável).
4.  **Revisão e Confirmação:** Você terá a oportunidade de revisar os dados extraídos e os lançamentos sugeridos. Isso permite que você faça quaisquer ajustes necessários antes de confirmar a criação dos lançamentos no seu sistema.
5.  **Criação de Lançamentos e Atualização de Estoque:** Após a sua confirmação, o Finvy criará automaticamente os lançamentos contábeis correspondentes e **gerenciará o estoque e o Custo da Mercadoria Vendida (CMV) com base no método de custeio (Custo Médio Ponderado, PEPS ou UEPS) configurado para o período contábil.**

## Benefícios

*   **Redução de Erros:** Minimiza erros de digitação e garante a precisão dos dados.
*   **Economia de Tempo:** Automatiza um processo que, de outra forma, seria manual e demorado.
*   **Conformidade Fiscal:** Ajuda a garantir que os impostos sejam registrados corretamente de acordo com o regime tributário vigente.
*   **Atualização Automática de Estoque:** Mantém seu controle de estoque sempre atualizado com as movimentações de compra e venda.

Esta funcionalidade é uma ferramenta poderosa para otimizar a gestão contábil e financeira da sua organização.
