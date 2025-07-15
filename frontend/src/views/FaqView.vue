<template>
  <div class="p-4 sm:p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-8 text-center">Perguntas Frequentes (FAQ)</h1>

    <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-3">
          Como faço para criar um novo período contábil?
        </h2>
        <p class="text-gray-600 leading-relaxed">
          Vá para a seção "Períodos Contábeis" no menu lateral, preencha o nome, data de início e
          data de fim do período e clique em "Criar Período". Você pode definir um período como
          ativo a qualquer momento, o que fará com que todas as novas transações sejam associadas a
          ele.
        </p>
      </div>

      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-3">Posso exportar relatórios por mês?</h2>
        <p class="text-gray-600 leading-relaxed">
          Sim, na seção de "Relatórios", selecione o tipo de relatório desejado (Balancete, DRE,
          Balanço Patrimonial, Razão Detalhado), defina o intervalo de datas que abranja os meses
          que você quer incluir e escolha a opção "Mês" no campo "Agrupar por". Ao exportar, o
          arquivo XLSX gerado terá uma aba para cada mês, enquanto os arquivos CSV e PDF terão
          seções claramente delimitadas por mês.
        </p>
      </div>

      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-3">
          Onde posso encontrar tutoriais sobre o uso do Finvy?
        </h2>
        <p class="text-gray-600 leading-relaxed">
          A seção de tutoriais e guias detalhados está em constante desenvolvimento. Fique atento às
          atualizações na Central de Ajuda para novos conteúdos que irão guiá-lo no uso de todas as
          funcionalidades do Finvy.
        </p>
      </div>

      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-700 mb-3">
          Como o controle de estoque por custo médio funciona?
        </h2>
        <p class="text-gray-600 leading-relaxed">
          O Finvy utiliza o método do Custo Médio Ponderado para o controle de estoque. Isso
          significa que, a cada nova compra de um produto, o custo unitário médio de todas as
          unidades em estoque é recalculado. Nas vendas, o custo da mercadoria vendida é baseado
          nesse custo médio atual, garantindo uma avaliação precisa do seu estoque.
        </p>
      </div>

      <div>
        <h2 class="text-xl font-semibold text-gray-700 mb-3">
          O que são partidas dobradas e como o Finvy as aplica?
        </h2>
        <p class="text-gray-600 leading-relaxed">
          O método das partidas dobradas é um princípio fundamental da contabilidade onde cada
          transação financeira afeta pelo menos duas contas, com um débito em uma conta e um crédito
          de valor igual em outra. O Finvy aplica esse método automaticamente ao registrar seus
          lançamentos, garantindo que o balanço contábil seja sempre mantido e que seus registros
          sejam precisos e consistentes.
        </p>
      </div>
    </div>
  </div>
</template>