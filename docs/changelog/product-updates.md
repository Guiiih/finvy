# Atualizações do Produto

Bem-vindo ao Changelog do Finvy! Aqui você encontrará as últimas atualizações, melhorias e novos recursos da plataforma.

---

## Agosto de 2025 - Cálculo de Impostos e Importação de NF-e

Esta atualização introduz funcionalidades avançadas para cálculo de impostos e importação de Notas Fiscais Eletrônicas (NF-e), aprimorando a gestão fiscal e contábil.

### Novas Funcionalidades

*   **Cálculo de Impostos:**
    *   Adicionada lógica para cálculo de impostos (ICMS, IPI, PIS, COFINS, IRRF, CSLL, INSS) em lançamentos contábeis, permitindo a entrada de alíquotas e valores.
    *   Integração com o fluxo de lançamentos para aplicação automática dos impostos.
*   **Importação de NF-e:**
    *   Implementado um componente para importação de arquivos XML de NF-e, extraindo dados relevantes para a criação de lançamentos.
    *   Extração de dados do emitente, destinatário, totais e itens da NF-e.
    *   Sugestão de lançamentos contábeis completos com base nos dados da NF-e, incluindo impostos e movimentação de estoque.
*   **Refatoração de Componentes:**
    *   Atualização de diversos componentes do frontend (`ImpostoComponent`, `JournalEntryFormModal`, `JournalEntryLinesForm`, `JournalEntryProductForm`, etc.) para suportar as novas funcionalidades de impostos e produtos.
    *   Refatoração do modal de lançamento contábil com interface em abas para "Básico", "Partidas", "Produtos" e "Impostos".

---

## Agosto de 2025 - Histórico de Lançamentos e Ajustes de UI

Esta atualização introduz a funcionalidade de histórico para lançamentos contábeis e aprimora a interface do usuário para uma melhor experiência visual e usabilidade.

### Novas Funcionalidades

*   **Histórico de Lançamentos:**
    *   Agora é possível visualizar um histórico detalhado de todas as alterações feitas em um lançamento contábil, incluindo criação, mudanças de status e edições.
    *   Cada entrada no histórico registra o tipo de ação, detalhes relevantes e o usuário responsável pela alteração.

### Melhorias na Interface do Usuário

*   **Tabela de Lançamentos (JournalEntryView):**
    *   **Layout de Colunas Otimizado:** As larguras das colunas "Data", "Referência", "Descrição", "Valor", "Status" e "Ações" foram ajustadas para melhor aproveitamento do espaço e legibilidade.
    *   **Checkbox Integrado:** O checkbox de seleção de lançamentos foi movido para a mesma coluna da "Data", com espaçamento aprimorado para uma visualização mais limpa.
    *   **Skeleton Loader Aprimorado:** O skeleton loader foi redesenhado para refletir com precisão o layout e os tamanhos das colunas da tabela, proporcionando uma experiência de carregamento mais fluida.
    *   **Formato de Data Consistente:** A data agora é exibida no formato `YYYY/MM/DD` para maior clareza.
    *   **Estilo Visual do Status:** O status dos lançamentos agora utiliza um design de "tag" colorido, similar ao estilo dos tipos de conta, para uma identificação visual rápida e intuitiva.
*   **Modal de Visualização de Lançamento (JournalEntryViewModal):**
    *   Adicionado um botão "Excluir" no rodapé do modal, permitindo a exclusão direta do lançamento.
    *   A aba "Histórico" agora exibe os dados reais do histórico de alterações do lançamento.

---


## Agosto de 2025 - Análise e Cards de Resumo do Plano de Contas

Esta atualização aprimora a visualização e o entendimento da estrutura contábil, adicionando funcionalidades de análise avançada e cards de resumo para o Plano de Contas.

### Novas Funcionalidades

*   **Dashboard de Análise:** Um novo modal de análise avançada exibe métricas chave e placeholders para gráficos (requer integração futura de bibliotecas de gráficos Vue).
*   **Métricas do Plano de Contas:** Visualize o total de contas, contas ativas, contas com saldo e o número de níveis na estrutura do seu plano de contas.
*   **Análise Detalhada por Tipo:** Métricas específicas para cada categoria contábil (Ativo, Passivo, Patrimônio Líquido, Receita, Despesa), incluindo contagem de contas e saldo total.
*   **Insights do Sistema:** Análises automáticas e recomendações baseadas na estrutura do seu plano de contas.

---



## Agosto de 2025 - Ações em Lote para Lançamentos Contábeis

Esta atualização permite que os usuários realizem ações em massa (aprovar e excluir) em múltiplos lançamentos contábeis, otimizando a gestão e o fluxo de trabalho.

### Novas Funcionalidades

*   **Ações em Lote:**
    *   **Aprovar Lançamentos:** Altere o status de múltiplos lançamentos para `Lançado` (posted) de uma só vez.
    *   **Excluir Lançamentos:** Remova múltiplos lançamentos e suas linhas associadas simultaneamente.
    *   Interface de seleção de lançamentos com checkboxes individuais e opção `Selecionar Todos`.

---

---

## Agosto de 2025 - Filtros Avançados para Lançamentos

Esta atualização expande as opções de filtragem para lançamentos contábeis, permitindo buscas mais precisas e eficientes.

### Novas Funcionalidades

*   **Filtros Avançados:**
    *   Adicionadas opções de filtro por: data (inicial/final), valor (mínimo/máximo - **observação: este filtro ainda não está totalmente implementado no backend**), criador, lançamentos **com movimentação de produto**, **com impostos calculados**, e **por contas contábeis específicas**.

---

## Agosto de 2025 - Funcionalidade de Duplicar Lançamentos

Esta atualização introduz a capacidade de duplicar lançamentos contábeis existentes, agilizando o processo de criação de lançamentos semelhantes.

### Novas Funcionalidades

*   **Duplicar Lançamento:**
    *   Agora é possível criar uma cópia de um lançamento contábil existente com um novo ID, referência (`-COPY`), descrição (`[CÓPIA]`), data atual e status inicial de `Rascunho`.

---

## Agosto de 2025 - Rastreabilidade e Auditoria de Lançamentos

Esta atualização aprimora a rastreabilidade e a capacidade de auditoria dos lançamentos contábeis, registrando informações detalhadas sobre quem criou e quando o lançamento foi modificado pela última vez.

### Novas Funcionalidades

*   **Informações do Criador:**
    *   Cada lançamento contábil agora registra o nome, e-mail e username do usuário que o criou, facilitando a identificação da origem das transações.
*   **Timestamp de Última Atualização (`updated_at`):**
    *   Um novo campo `updated_at` foi adicionado aos lançamentos contábeis, que é automaticamente atualizado sempre que o lançamento é modificado. Isso permite um rastreamento preciso do histórico de alterações.

---

## Agosto de 2025 - Gestão de Status de Lançamentos

Esta atualização adiciona a capacidade de gerenciar o status dos lançamentos contábeis, proporcionando maior controle e organização.

### Novas Funcionalidades

*   **Status de Lançamento:**
    *   Os lançamentos agora podem ter os seguintes status: `Rascunho` (draft), `Lançado` (posted) e `Revisado` (reviewed).
    *   É possível definir o status ao criar ou editar um lançamento.

---

## Agosto de 2025 - Filtro por Status e Melhorias na Tabela de Lançamentos

Esta atualização introduz a capacidade de filtrar lançamentos por status e aprimora o layout visual da tabela de lançamentos para uma melhor experiência do usuário.

### Novas Funcionalidades

*   **Filtro por Status:**
    *   Adicionado um filtro na tabela de lançamentos que permite aos usuários visualizar lançamentos por status (Todos, Rascunho, Lançado, Revisado).

### Melhorias na Interface do Usuário

*   **Layout da Tabela de Lançamentos:**
    *   As colunas da tabela foram reorganizadas e redimensionadas para otimizar a legibilidade e o uso do espaço.
    *   O checkbox de seleção de lançamentos foi integrado à coluna de data, com espaçamento ajustado.
    *   O skeleton loader da tabela foi atualizado para refletir o novo layout, proporcionando uma transição visual mais suave durante o carregamento.

---

## Agosto de 2025 - Otimizações e Correções Internas

Esta atualização foca em otimizações de código, refatorações e correções de bugs para melhorar a estabilidade e a performance geral da aplicação.

### Melhorias Técnicas

*   **Refatoração de Código:** Diversos componentes e serviços foram refatorados para melhorar a legibilidade, manutenção e eficiência.
*   **Otimização de Dependências:** Removidas dependências não utilizadas e otimizadas as existentes para reduzir o tamanho do bundle e melhorar o tempo de carregamento.
*   **Correções de Build:** Resolvidos erros de build e tipagem para garantir um processo de desenvolvimento mais robusto.

---

## Agosto de 2025 - Atualizações de Infraestrutura e Ferramentas de Desenvolvimento

Esta atualização foca em melhorias na infraestrutura do projeto e nas ferramentas de desenvolvimento, visando maior robustez, qualidade de código e eficiência.

### Melhorias Técnicas

*   **Configuração de Linting e Formatação:**
    *   Atualização das configurações do ESLint para TypeScript, incluindo regras mais rigorosas para garantir a qualidade do código e a consistência de tipagem.
    *   Integração aprimorada com Prettier para formatação automática do código.
*   **Otimização de Build:**
    *   Inclusão de novas dependências como Rollup e LightningCSS para otimização do processo de build do frontend, resultando em pacotes menores e carregamento mais rápido.

---

## Agosto de 2025 - Geração Automática de Referência

Esta atualização introduz a geração automática de referências para lançamentos contábeis, simplificando o processo de registro e garantindo a unicidade das referências.

### Novas Funcionalidades

*   **Geração Automática de Referência:**
    *   Ao criar um novo lançamento, é possível definir um prefixo para a referência (ex: "NF", "REC"). O sistema gerará automaticamente um número sequencial para completar a referência (ex: "NF001", "REC002").
    *   A referência gerada é única por organização e período contábil.

---

## Agosto de 2025 - Melhorias na Gestão de Lançamentos e UI

Esta atualização foca em aprimorar a rastreabilidade dos lançamentos contábeis e a experiência do usuário na visualização e gestão desses registros.

### Novas Funcionalidades

*   **Histórico de Lançamentos:**
    *   Agora é possível visualizar um histórico detalhado de todas as alterações feitas em um lançamento contábil, incluindo criação, mudanças de status e edições.
    *   Cada entrada no histórico registra o tipo de ação, detalhes relevantes e o usuário responsável pela alteração.

### Melhorias na Interface do Usuário

*   **Tabela de Lançamentos (JournalEntryView):**
    *   **Layout de Colunas Otimizado:** As larguras das colunas "Data", "Referência", "Descrição", "Valor", "Status" e "Ações" foram ajustadas para melhor aproveitamento do espaço e legibilidade.
    *   **Checkbox Integrado:** O checkbox de seleção de lançamentos foi movido para a mesma coluna da "Data", com espaçamento aprimorado para uma visualização mais limpa.
    *   **Skeleton Loader Aprimorado:** O skeleton loader foi redesenhado para refletir com precisão o layout e os tamanhos das colunas da tabela, proporcionando uma experiência de carregamento mais fluida.
    *   **Formato de Data Consistente:** A data agora é exibida no formato `YYYY/MM/DD` para maior clareza.
    *   **Estilo Visual do Status:** O status dos lançamentos agora utiliza um design de "tag" colorido, similar ao estilo dos tipos de conta, para uma identificação visual rápida e intuitiva.
*   **Modal de Visualização de Lançamento (JournalEntryViewModal):**
    *   Adicionado um botão "Excluir" no rodapé do modal, permitindo a exclusão direta do lançamento.
    *   A aba "Histórico" agora exibe os dados reais do histórico de alterações do lançamento.

---

## Julho de 2025 - Lançamento Inicial

Estamos entusiasmados em anunciar o lançamento inicial do Finvy, sua nova plataforma completa para gestão financeira e contábil! Esta versão inaugural traz um conjunto robusto de funcionalidades projetadas para simplificar suas operações e fornecer insights valiosos.

### Novas Funcionalidades

*   **Gestão de Lançamentos Contábeis:**
    *   Registro detalhado de receitas e despesas.
    *   Suporte completo ao princípio das Partidas Dobradas.
    *   Criação, visualização, edição e exclusão de lançamentos e suas linhas.

*   **Gestão de Contas e Produtos:**
    *   **Plano de Contas Personalizável:** Crie e organize suas contas contábeis de acordo com suas necessidades.
    *   **Cadastro de Produtos:** Gerencie seu portfólio de produtos com detalhes de custo e estoque.
    *   **Controle de Estoque:** Cálculo automatizado de Custo Médio Ponderado para movimentações de entrada e saída.

*   **Gestão de Organizações e Períodos Contábeis:**
    *   Crie e gerencie múltiplas organizações.
    *   Defina e organize períodos contábeis (exercícios fiscais).

*   **Importação de NF-e:**
    *   Automatize a entrada de dados financeiros e de estoque diretamente de arquivos XML de Notas Fiscais Eletrônicas.
    *   Extração inteligente de dados do emitente, destinatário, totais e itens.

*   **Contas a Pagar e a Receber:**
    *   Controle total sobre suas obrigações e direitos financeiros.
    *   Registro e acompanhamento de pagamentos e recebimentos.

*   **Relatórios Financeiros Abrangentes:**
    *   Geração de Balanço Patrimonial, Demonstração de Resultado do Exercício (DRE), Demonstração de Fluxo de Caixa (DFC).
    *   Balancete de Verificação e Ficha de Controle de Estoque.
    *   Relatórios personalizáveis por período.

*   **Recursos de IA e Automação:**
    *   **Chatbot Contábil:** Assistente de IA para responder a perguntas sobre contabilidade e dados da sua organização.
    *   **Processador de Documentos:** Extração de texto de PDFs e imagens.
    *   **Resolvedor de Exercícios:** Ajuda a resolver exercícios de contabilidade com sugestões de lançamentos.
    *   **Validador de Lançamentos:** Valida a lógica de lançamentos contábeis descritos em texto.

*   **Colaboração e Segurança:**
    *   **Compartilhamento de Períodos:** Compartilhe períodos contábeis com outros usuários com diferentes níveis de permissão.
    *   **Notificações:** Mantenha-se informado sobre eventos importantes.
    *   **Gestão de Perfil:** Atualize suas informações e gerencie sua conta.
    *   **Busca de Usuários:** Encontre outros usuários na plataforma.

Estamos comprometidos em continuar aprimorando o Finvy com novas funcionalidades e melhorias. Fique atento às próximas atualizações!