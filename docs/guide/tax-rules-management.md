# Gerenciamento de Regras de Impostos

O Finvy permite que você defina regras de impostos personalizadas para sua organização, garantindo que os cálculos fiscais sejam precisos e reflitam a legislação aplicável às suas operações. Essas regras são especialmente úteis para lidar com variações de impostos entre diferentes estados (UF de origem e destino) e para produtos específicos (NCM).

## Acessando as Regras de Impostos

1.  Navegue até **Configurações** no menu principal.
2.  Clique na aba **Regras de Impostos**.

## Entendendo as Regras de Impostos

Cada regra de imposto é definida por:

*   **UF Origem:** O estado de onde a transação se origina (ex: SP).
*   **UF Destino:** O estado para onde a transação se destina (ex: RJ).
*   **NCM (Opcional):** A Nomenclatura Comum do Mercosul do produto. Se preenchido, a regra se aplica apenas a produtos com esse NCM. Se vazio, a regra se aplica a todos os produtos entre as UFs especificadas.
*   **Imposto:** O tipo de imposto ao qual a regra se refere (ex: ICMS, IPI, PIS, COFINS).
*   **Alíquota:** O percentual do imposto a ser aplicado (ex: 0.12 para 12%).

## Adicionar uma Nova Regra de Imposto

1.  Na tela de Regras de Impostos, clique no botão **Nova Regra**.
2.  Preencha os campos:
    *   **UF Origem:** O estado de origem da transação.
    *   **UF Destino:** O estado de destino da transação.
    *   **NCM (Opcional):** O código NCM do produto, se a regra for específica para ele.
    *   **Imposto:** Selecione o tipo de imposto.
    *   **Alíquota:** Insira a alíquota em formato decimal (ex: 0.18 para 18%).
3.  Clique em **Salvar**.

## Editar uma Regra de Imposto Existente

1.  Na tabela de Regras de Impostos, clique no ícone de **lápis** (Editar) ao lado da regra que deseja modificar.
2.  Faça as alterações necessárias nos campos.
3.  Clique em **Salvar**.

## Excluir uma Regra de Imposto

1.  Na tabela de Regras de Impostos, clique no ícone de **lixeira** (Excluir) ao lado da regra que deseja remover.
2.  Confirme a exclusão quando solicitado.

## Como as Regras de Impostos Afetam os Cálculos

Ao realizar lançamentos contábeis que envolvem produtos e transações entre diferentes UFs, o Finvy consultará as regras de impostos cadastradas. Se uma regra específica for encontrada para a UF de origem, UF de destino e NCM (se aplicável), a alíquota definida nessa regra será utilizada no cálculo do imposto. Isso garante que o sistema aplique as alíquotas corretas de acordo com as suas configurações personalizadas.
