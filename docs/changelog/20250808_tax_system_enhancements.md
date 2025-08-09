# Atualizações do Sistema de Impostos - Agosto de 2025

Esta atualização traz melhorias significativas para o sistema de cálculo de impostos do Finvy, incluindo a integração da Nomenclatura Comum do Mercosul (NCM) e o gerenciamento de variações de impostos estaduais e municipais.

### Novas Funcionalidades

*   **Integração NCM (Nomenclatura Comum do Mercosul):**
    *   Adicionado o campo NCM ao cadastro de produtos, permitindo uma classificação fiscal mais precisa.
    *   A lógica de cálculo de impostos agora pode utilizar o NCM para determinar alíquotas específicas, como o IPI.
    *   O campo NCM foi integrado aos formulários de produto no frontend e na exibição da listagem de produtos.

*   **Gerenciamento de Variações de Impostos Estaduais/Municipais:**
    *   Introduzida uma nova tabela `tax_rules` no banco de dados para armazenar regras de impostos baseadas na UF de origem, UF de destino e NCM.
    *   Implementado um sistema completo de CRUD (Criar, Ler, Atualizar, Deletar) para as regras de impostos no backend.
    *   Uma nova seção "Regras de Impostos" foi adicionada às configurações do sistema, permitindo que os usuários configurem e gerenciem suas próprias regras de impostos.
    *   A função de cálculo de impostos (`calculateTaxes`) foi aprimorada para consultar e aplicar dinamicamente as alíquotas definidas nas `tax_rules` com base nos detalhes da transação (UF de origem/destino, NCM).
    *   Adicionadas colunas `uf_origin` e `uf_destination` à tabela `entry_lines` para registrar a origem e o destino das transações para fins fiscais.

### Melhorias Técnicas

*   **Refatoração do Serviço de Impostos:** O serviço de cálculo de impostos (`taxService.ts`) foi refatorado para ser assíncrono e para integrar a consulta às novas `tax_rules`.
*   **Atualizações de Esquemas e Tipagens:** Esquemas de validação (Zod) e tipagens (TypeScript) foram atualizados no backend e frontend para suportar os novos campos e funcionalidades.
*   **Migrações de Banco de Dados:** Novas migrações foram criadas para as alterações no esquema do banco de dados, incluindo a criação de funções auxiliares (`moddatetime`, `check_user_organization_access`) para garantir a integridade e segurança dos dados.
*   **Correções de Erros de Compilação e Linting:** Erros de tipagem e linting foram resolvidos no backend e frontend para garantir a estabilidade e qualidade do código.
