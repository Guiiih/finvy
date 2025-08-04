# 2025-08-04 - Grande Atualização de Funcionalidades e Refatoração

Esta atualização traz melhorias significativas na gestão de estoque, lançamentos contábeis e na estrutura do projeto, além de aprimoramentos na documentação.

## Novas Funcionalidades e Melhorias

*   **Gestão de Estoque Aprimorada:**
    *   Implementação de cálculo de Custo da Mercadoria Vendida (CMV) baseado em métodos de custeio (Custo Médio Ponderado, PEPS e UEPS).
    *   Registro detalhado de lotes de inventário para compras e vendas.
    *   Novos campos para produtos: SKU, Categoria, Marca, Estoque Mínimo e Unidade.
*   **Lançamentos Contábeis:**
    *   Refatoração do modal de lançamento contábil com interface em abas para "Básico", "Partidas", "Produtos" e "Impostos".
    *   Integração aprimorada de transações de produtos e impostos diretamente no fluxo de lançamento.
    *   Remoção da lógica de importação de NF-e e simulação de impostos diretamente do modal de lançamento (agora tratadas em outros fluxos).
*   **Estrutura do Projeto:**
    *   Consolidação e reorganização das migrações do Supabase para melhor clareza e manutenção.
    *   Adição de novas tabelas no Supabase para `tax_regime_history`, `notifications` e `user_presence`.
    *   Atualização das políticas de RLS e índices no Supabase.

## Documentação

*   **Atualização Abrangente:** Documentação atualizada para refletir as novas funcionalidades de gestão de estoque e a nova interface de lançamentos contábeis.
*   **Estrutura Aprimorada:** Adição de novos documentos e diagramas (Mermaid) para explicar a arquitetura do sistema, fluxos de operações diárias, configuração inicial, relatórios e interação do usuário.
*   **Dependências:** Atualização das dependências da documentação para suporte a diagramas Mermaid.

## Outras Alterações

*   Remoção de arquivos de imagem desnecessários.
