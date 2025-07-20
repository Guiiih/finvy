<template>
  <div class="flex flex-col md:flex-row p-6 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
    <aside class="w-full md:w-1/4 lg:w-1/4 h-screen md:sticky md:top-6 md:mr-6 mb-6 md:mb-0">
      <div class="p-4 bg-gray-900 rounded-lg shadow-md text-gray-300">
        <h2 class="text-xl font-bold mb-4 text-white">Tópicos</h2>
        <nav class="relative">
          <div ref="outlineMarker" class="outline-marker"></div>
          <ul>
            <li class="mb-2">
              <a
                href="#introducao"
                @click.prevent="scrollToSection"
                :class="{ active: activeHash === '#introducao' }"
                class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
                >Introdução ao Finvy</a
              >
            </li>
            <li class="mb-2">
              <a
                href="#ambiente-desenvolvimento"
                @click.prevent="scrollToSection"
                :class="{ active: activeHash === '#ambiente-desenvolvimento' }"
                class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
                >Ambiente de Desenvolvimento</a
              >
              <ul class="ml-4 mt-1 border-l border-gray-700 pl-3">
                <li class="mb-1">
                  <a
                    href="#requisitos-minimos"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#requisitos-minimos' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Requisitos Mínimos</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#terraform"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#terraform' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Terraform</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#aws-cli"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#aws-cli' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >AWS CLI</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#docker"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#docker' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Docker</a
                  >
                </li>
              </ul>
            </li>
            <li class="mb-2">
              <a
                href="#conceitos-fundamentais"
                @click.prevent="scrollToSection"
                :class="{ active: activeHash === '#conceitos-fundamentais' }"
                class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
                >Conceitos Fundamentais</a
              >
              <ul class="ml-4 mt-1 border-l border-gray-700 pl-3">
                <li class="mb-1">
                  <a
                    href="#periodos-contabeis"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#periodos-contabeis' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Períodos Contábeis</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#plano-de-contas"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#plano-de-contas' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Plano de Contas</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#lancamentos-contabeis"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#lancamentos-contabeis' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Lançamentos Contábeis (Partidas Dobradas)</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#controle-de-estoque"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#controle-de-estoque' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Controle de Estoque (Custo Médio)</a
                  >
                </li>
              </ul>
            </li>
            <li class="mb-2">
              <a
                href="#guia-de-uso"
                @click.prevent="scrollToSection"
                :class="{ active: activeHash === '#guia-de-uso' }"
                class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
                >Guia de Uso</a
              >
              <ul class="ml-4 mt-1 border-l border-gray-700 pl-3">
                <li class="mb-1">
                  <a
                    href="#criar-periodo"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#criar-periodo' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Criar e Gerenciar Períodos</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#registrar-transacao"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#registrar-transacao' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Registrar Transações</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#gerar-relatorios"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#gerar-relatorios' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Gerar e Exportar Relatórios</a
                  >
                </li>
                <li class="mb-1">
                  <a
                    href="#exportar-mensal"
                    @click.prevent="scrollToSection"
                    :class="{ active: activeHash === '#exportar-mensal' }"
                    class="outline-link block py-1 px-2 rounded hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white"
                    >Exportação Mensal Consolidada</a
                  >
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </aside>

    <main class="w-full md:w-3/4 lg:w-3/4 p-6 bg-white rounded-lg shadow-md">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Documentação do Projeto Finvy</h1>

      <!-- Introdução ao Finvy -->
      <section id="introducao" class="mb-10 scroll-mt-20">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Introdução ao Finvy</h2>
        <p class="text-gray-600 leading-relaxed mb-4">
          Bem-vindo à documentação do Finvy, uma ferramenta poderosa e intuitiva desenvolvida para
          simplificar a resolução de exercícios práticos de contabilidade. O Finvy foi criado para
          superar as limitações das planilhas tradicionais, que são propensas a erros de fórmula,
          carecem de integridade de dados e não são escaláveis. Oferecemos uma plataforma web
          robusta e segura para aplicar princípios contábeis fundamentais de forma automatizada e
          visual.
        </p>
        <p class="text-gray-600 leading-relaxed">
          Nosso objetivo é fornecer uma experiência automatizada, visual e segura para o controle de
          estoque por custo médio, o método das partidas dobradas e a apuração de resultados. Esta
          documentação irá guiá-lo através de todos os aspectos do Finvy, desde a configuração do
          ambiente de desenvolvimento até o uso avançado das funcionalidades e a integração via API.
        </p>
      </section>

      <!-- Ambiente de Desenvolvimento -->
      <section id="ambiente-desenvolvimento" class="mb-10 scroll-mt-20">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Ambiente de Desenvolvimento</h2>
        <p class="text-gray-600 leading-relaxed mb-4">
          Para contribuir com o desenvolvimento do Finvy ou para executar o projeto localmente, é
          necessário configurar o ambiente de desenvolvimento. Este projeto utiliza uma abordagem de
          Infraestrutura como Código (IaC) com Terraform e o AWS CLI para gerenciar recursos na
          nuvem da Amazon.
        </p>

        <h3
          id="requisitos-minimos"
          class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20"
        >
          Requisitos Mínimos
        </h3>
        <p class="text-gray-600 leading-relaxed mb-2">
          Certifique-se de ter as seguintes ferramentas instaladas em sua máquina:
        </p>
        <ul class="list-disc list-inside text-gray-600 mb-4">
          <li>
            <strong>Node.js:</strong> Versão 18 ou superior. Essencial para o frontend (Vue.js) e o
            backend (Vercel Serverless Functions).
          </li>
          <li><strong>npm:</strong> Versão 9 ou superior. Gerenciador de pacotes do Node.js.</li>
          <li>
            <strong>Docker Desktop:</strong> Necessário para rodar o ambiente de banco de dados
            localmente (Supabase Studio).
          </li>
          <li><strong>Conta AWS configurada:</strong> Para realizar deploys na nuvem da Amazon.</li>
          <li>
            <strong>Terraform CLI:</strong> Versão 1.0 ou superior. Para provisionar e gerenciar a
            infraestrutura.
          </li>
          <li>
            <strong>AWS CLI:</strong> Versão 2 ou superior. Para interagir com os serviços AWS via
            linha de comando.
          </li>
        </ul>
        <p class="text-gray-600 leading-relaxed">
          Você pode verificar as versões instaladas executando <code>node -v</code>,
          <code>npm -v</code>, <code>terraform -v</code> e <code>aws --version</code> no seu
          terminal.
        </p>

        <h3 id="terraform" class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20">
          Terraform
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          O Terraform é uma ferramenta de código aberto desenvolvida pela HashiCorp que permite
          definir, provisionar e gerenciar infraestrutura de forma declarativa. Ele utiliza uma
          linguagem de configuração chamada HashiCorp Configuration Language (HCL) para descrever o
          estado desejado da sua infraestrutura.
        </p>
        <p class="text-gray-600 leading-relaxed mb-4">
          Para instalar o Terraform, siga as instruções detalhadas no
          <a
            href="https://www.terraform.io/downloads"
            target="_blank"
            class="text-blue-600 hover:underline"
            >site oficial do Terraform</a
          >. Após a instalação, você pode verificar se está funcionando corretamente executando
          <code>terraform init</code> e <code>terraform plan</code> em um diretório com arquivos
          <code>.tf</code>.
        </p>
        <p class="text-gray-600 leading-relaxed">
          No Finvy, o Terraform é utilizado para gerenciar recursos como bancos de dados (Supabase),
          funções serverless e outros serviços de nuvem necessários para o funcionamento da
          aplicação.
        </p>

        <h3 id="aws-cli" class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20">
          AWS CLI
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          A Interface de Linha de Comando da AWS (AWS CLI) é uma ferramenta unificada para gerenciar
          seus serviços AWS. Com apenas uma ferramenta para baixar e configurar, você pode controlar
          vários serviços AWS a partir da linha de comando e automatizá-los por meio de scripts.
        </p>
        <p class="text-gray-600 leading-relaxed mb-4">
          Para instalar e configurar o AWS CLI, consulte o
          <a
            href="https://docs.aws.amazon.com/cli/latest/userguide/install-awscli.html"
            target="_blank"
            class="text-blue-600 hover:underline"
            >Guia do Usuário do AWS CLI</a
          >. Após a instalação, configure suas credenciais de acesso executando
          <code>aws configure</code> e fornecendo suas chaves de acesso e região padrão.
        </p>
        <p class="text-gray-600 leading-relaxed">
          O AWS CLI é utilizado no projeto para interagir com os serviços da Amazon, como o S3 para
          armazenamento de arquivos ou o Lambda para funções serverless, caso sejam implementados no
          futuro.
        </p>

        <h3 id="docker" class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20">Docker</h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          Docker é uma plataforma de código aberto que permite automatizar a implantação, escala e
          gerenciamento de aplicações usando contêineres. Contêineres são unidades padronizadas de
          software que empacotam o código e todas as suas dependências, permitindo que a aplicação
          seja executada de forma rápida e confiável em qualquer ambiente.
        </p>
        <p class="text-gray-600 leading-relaxed">
          No contexto do Finvy, o Docker Desktop é essencial para rodar o ambiente de
          desenvolvimento local do Supabase, que inclui o banco de dados PostgreSQL, autenticação e
          outras ferramentas necessárias para o backend. Certifique-se de que o Docker Desktop
          esteja em execução antes de iniciar o ambiente Supabase local.
        </p>
      </section>

      <!-- Conceitos Fundamentais -->
      <section id="conceitos-fundamentais" class="mb-10 scroll-mt-20">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Conceitos Fundamentais</h2>
        <p class="text-gray-600 leading-relaxed mb-4">
          Para utilizar o Finvy de forma eficaz, é importante compreender alguns conceitos contábeis
          e de gestão que são a base da aplicação.
        </p>

        <h3 id="periodos-contabeis" class="text-xl font-medium text-gray-800 mb-3 scroll-mt-20">
          Períodos Contábeis
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          No Finvy, a gestão de períodos contábeis permite organizar suas transações em intervalos
          de tempo definidos, como meses, trimestres ou anos fiscais. Cada transação registrada na
          plataforma é associada a um período contábil específico, garantindo a integridade e a
          segregação dos dados.
        </p>
        <p class="text-gray-600 leading-relaxed mb-4">
          Você pode criar múltiplos períodos contábeis e alternar entre eles para focar em
          diferentes exercícios ou para comparar o desempenho financeiro em distintos intervalos.
          Por exemplo, você pode ter um período para "Mês 1", outro para "Mês 2", e um período
          consolidado para "Ano Fiscal 2024".
        </p>
        <p class="text-gray-600 leading-relaxed">
          <strong>Importante:</strong> Ao registrar uma transação, ela será automaticamente
          vinculada ao período contábil que estiver definido como "ativo" no momento do registro.
          Para relatórios consolidados de um ano fiscal, por exemplo, é recomendável manter o
          período anual ativo e, ao gerar relatórios, utilizar os filtros de data para visualizar
          meses ou trimestres específicos dentro desse ano.
        </p>

        <h3 id="plano-de-contas" class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20">
          Plano de Contas
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          O Plano de Contas é a estrutura organizada de todas as contas contábeis utilizadas para
          registrar as operações financeiras de uma entidade. Ele é a espinha dorsal da
          contabilidade no Finvy, classificando as contas em categorias principais:
        </p>
        <ul class="list-disc list-inside text-gray-600 mb-4">
          <li>
            <strong>Ativo:</strong> Bens e direitos da empresa (ex: Caixa, Bancos, Estoques, Contas
            a Receber).
          </li>
          <li>
            <strong>Passivo:</strong> Obrigações da empresa com terceiros (ex: Fornecedores, Contas
            a Pagar, Empréstimos).
          </li>
          <li>
            <strong>Patrimônio Líquido:</strong> Capital próprio da empresa (ex: Capital Social,
            Lucros Acumulados).
          </li>
          <li>
            <strong>Receitas:</strong> Ganhos obtidos pela empresa (ex: Receita de Vendas, Receita
            de Serviços).
          </li>
          <li>
            <strong>Despesas:</strong> Gastos incorridos para gerar receita (ex: Salários, Aluguel,
            Custo da Mercadoria Vendida).
          </li>
        </ul>
        <p class="text-gray-600 leading-relaxed">
          O Finvy já vem com um plano de contas padrão pré-configurado, que serve como base para a
          maioria dos exercícios contábeis. No entanto, você tem a flexibilidade de personalizar
          esse plano, adicionando, editando ou removendo contas conforme as necessidades específicas
          dos seus exercícios ou da sua empresa.
        </p>

        <h3
          id="lancamentos-contabeis"
          class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20"
        >
          Lançamentos Contábeis (Partidas Dobradas)
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          Todos os eventos financeiros no Finvy são registrados rigorosamente utilizando o método
          das Partidas Dobradas, um princípio fundamental da contabilidade. Este método estabelece
          que para cada débito em uma ou mais contas, deve haver um crédito de valor total igual em
          uma ou mais outras contas. Isso garante que o balanço contábil seja sempre mantido e que a
          equação contábil (Ativo = Passivo + Patrimônio Líquido) permaneça em equilíbrio.
        </p>
        <p class="text-gray-600 leading-relaxed">
          Ao registrar um lançamento no Finvy, você especificará as contas envolvidas, os valores de
          débito e crédito, uma descrição detalhada da transação e a data. O sistema assegura que o
          total de débitos seja sempre igual ao total de créditos, prevenindo erros e garantindo a
          precisão dos seus registros financeiros.
        </p>

        <h3
          id="controle-de-estoque"
          class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20"
        >
          Controle de Estoque (Custo Médio)
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          O Finvy implementa o controle de estoque utilizando o método do Custo Médio Ponderado
          (CMP). Este método é amplamente utilizado e consiste em recalcular o custo unitário médio
          de um item em estoque a cada nova aquisição.
        </p>
        <p class="text-gray-600 leading-relaxed mb-4">
          Quando você realiza uma compra, o custo total da compra é somado ao valor total do estoque
          existente, e a quantidade comprada é somada à quantidade existente. O novo custo médio é
          então obtido dividindo o novo valor total pelo novo total de unidades.
        </p>
        <p class="text-gray-600 leading-relaxed">
          Nas vendas, o Custo da Mercadoria Vendida (CMV) é calculado utilizando o custo médio
          ponderado mais recente. Isso garante que o valor do estoque e o CMV reflitam uma média dos
          custos de aquisição ao longo do tempo, suavizando as flutuações de preço e proporcionando
          uma avaliação mais estável do seu inventário.
        </p>
      </section>

      <!-- Guia de Uso -->
      <section id="guia-de-uso" class="mb-10 scroll-mt-20">
        <h2 class="text-2xl font-semibold text-gray-700 mb-4">Guia de Uso</h2>
        <p class="text-gray-600 leading-relaxed mb-4">
          Esta seção oferece um guia prático sobre como utilizar as principais funcionalidades do
          Finvy para gerenciar seus exercícios contábeis.
        </p>

        <h3 id="criar-periodo" class="text-xl font-medium text-gray-800 mb-3 scroll-mt-20">
          Criar e Gerenciar Períodos Contábeis
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          Para começar a organizar seus exercícios, o primeiro passo é criar um período contábil.
        </p>
        <ol class="list-decimal list-inside text-gray-600 mb-4 pl-4">
          <li>Navegue até a seção <strong>"Períodos Contábeis"</strong> no menu lateral.</li>
          <li>
            No formulário de criação, preencha o <strong>Nome do Período</strong> (ex: "Mês 1 -
            Exercício 2024", "Ano Fiscal Completo 2024").
          </li>
          <li>
            Selecione a <strong>Data de Início</strong> e a <strong>Data de Fim</strong> para o
            período.
          </li>
          <li>Clique no botão <strong>"Criar Período"</strong>.</li>
          <li>
            Após a criação, você verá o novo período na lista. Para ativá-lo, clique no botão
            <strong>"Definir como Ativo"</strong> ao lado do período desejado. Apenas um período
            pode estar ativo por vez.
          </li>
        </ol>
        <p class="text-gray-600 leading-relaxed">
          Gerenciar múltiplos períodos permite que você trabalhe em diferentes exercícios ou partes
          de um exercício de forma isolada, facilitando a organização e a análise.
        </p>

        <h3
          id="registrar-transacao"
          class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20"
        >
          Registrar Transações (Lançamentos Contábeis)
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          O registro de transações é fundamental para manter seus livros contábeis atualizados.
        </p>
        <ol class="list-decimal list-inside text-gray-600 mb-4 pl-4">
          <li>Acesse a seção <strong>"Lançamentos Contábeis"</strong> no menu lateral.</li>
          <li>Clique em <strong>"Novo Lançamento"</strong> para abrir o formulário.</li>
          <li>
            Preencha a <strong>Data do Lançamento</strong> e uma <strong>Descrição</strong> clara da
            transação.
          </li>
          <li>
            Adicione as linhas de débito e crédito:
            <ul class="list-disc list-inside ml-6 text-gray-600">
              <li>Selecione a <strong>Conta</strong> afetada.</li>
              <li>
                Indique se é um <strong>Débito</strong> ou <strong>Crédito</strong> e insira o
                <strong>Valor</strong> correspondente.
              </li>
              <li>
                Para transações envolvendo produtos (compras/vendas), selecione o
                <strong>Produto</strong>, a <strong>Quantidade</strong> e o
                <strong>Custo Unitário</strong> (para compras) ou
                <strong>Preço de Venda</strong> (para vendas).
              </li>
              <li>O sistema calculará automaticamente os impostos e o impacto no estoque.</li>
            </ul>
          </li>
          <li>
            Certifique-se de que o total de débitos seja igual ao total de créditos antes de
            <strong>Salvar</strong> o lançamento.
          </li>
        </ol>
        <p class="text-gray-600 leading-relaxed">
          Todos os lançamentos são automaticamente associados ao período contábil ativo no momento
          do registro.
        </p>

        <h3 id="gerar-relatorios" class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20">
          Gerar e Exportar Relatórios Financeiros
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          O Finvy oferece uma variedade de relatórios para análise financeira:
        </p>
        <ul class="list-disc list-inside text-gray-600 mb-4 pl-4">
          <li>
            <strong>Demonstrativo de Resultado do Exercício (DRE):</strong> Apresenta o resultado
            líquido da empresa em um período.
          </li>
          <li>
            <strong>Balanço Patrimonial:</strong> Demonstra a posição financeira da empresa em um
            determinado momento.
          </li>
          <li>
            <strong>Balancete de Verificação:</strong> Lista todas as contas com seus saldos
            devedores e credores, verificando o equilíbrio.
          </li>
          <li><strong>Razão Detalhado:</strong> Exibe o movimento detalhado de cada conta.</li>
        </ul>
        <p class="text-gray-600 leading-relaxed mb-4">Para gerar um relatório:</p>
        <ol class="list-decimal list-inside text-gray-600 mb-4 pl-4">
          <li>Vá para a seção <strong>"Relatórios"</strong>.</li>
          <li>Selecione o <strong>Tipo de Relatório</strong> desejado.</li>
          <li>
            Defina a <strong>Data Inicial</strong> e <strong>Data Final</strong> para o período de
            análise.
          </li>
          <li>Escolha o <strong>Formato de Exportação</strong> (CSV, XLSX, PDF).</li>
          <li>Clique no botão <strong>"Exportar [Nome do Relatório]"</strong>.</li>
        </ol>

        <h3 id="exportar-mensal" class="text-xl font-medium text-gray-800 mb-3 mt-6 scroll-mt-20">
          Exportação Mensal Consolidada
        </h3>
        <p class="text-gray-600 leading-relaxed mb-4">
          Uma funcionalidade poderosa do Finvy é a capacidade de exportar relatórios agrupados por
          mês em um único arquivo, ideal para análises comparativas ao longo de um ano fiscal.
        </p>
        <ol class="list-decimal list-inside text-gray-600 mb-4 pl-4">
          <li>
            Na seção <strong>"Relatórios"</strong>, selecione o <strong>Tipo de Relatório</strong>.
          </li>
          <li>
            Defina um <strong>intervalo de datas</strong> que abranja todos os meses que você deseja
            incluir na exportação (ex: 01/01/YYYY a 31/12/YYYY para um ano completo).
          </li>
          <li>
            No campo <strong>"Agrupar por"</strong>, selecione a opção <strong>"Mês"</strong>.
          </li>
          <li>Escolha o <strong>Formato de Exportação</strong> (XLSX, CSV, PDF).</li>
          <li>Clique em <strong>"Exportar [Nome do Relatório]"</strong>.</li>
        </ol>
        <p class="text-gray-600 leading-relaxed">
          Ao exportar para <strong>XLSX</strong>, o arquivo gerado terá uma aba separada para cada
          mês dentro do intervalo selecionado, contendo o relatório correspondente. Para
          <strong>CSV</strong> e <strong>PDF</strong>, os relatórios de cada mês serão concatenados
          no mesmo arquivo, com cabeçalhos claros indicando o início de cada novo mês.
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const activeHash = ref('')
const outlineMarker = ref<HTMLElement | null>(null)
const observer = ref<IntersectionObserver | null>(null)

// Função para rolagem suave
const scrollToSection = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLAnchorElement
  const id = target.getAttribute('href')
  if (id) {
    const element = document.querySelector(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

// Lógica do marcador de destaque
const updateOutlineMarker = () => {
  if (outlineMarker.value) {
    const activeLink = document.querySelector(
      `.outline-link[href="${activeHash.value}"]`,
    ) as HTMLElement
    if (activeLink) {
      outlineMarker.value.style.top = `${activeLink.offsetTop}px`
      outlineMarker.value.style.height = `${activeLink.offsetHeight}px`
      outlineMarker.value.style.opacity = '1'
    } else if (activeHash.value === '') {
      outlineMarker.value.style.opacity = '0'
    }
  }
}

// Lógica do Scrollspy com Intersection Observer
onMounted(() => {
  const options = {
    rootMargin: '0px 0px -80% 0px',
    threshold: 0,
  }

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeHash.value = `#${entry.target.id}`
      }
    })
  }, options)

  document.querySelectorAll('section[id], h3[id]').forEach((section) => {
    observer.value?.observe(section)
  })

  if (window.location.hash) {
    activeHash.value = window.location.hash
  } else {
    const firstSection = document.querySelector('section[id], h3[id]')
    if (firstSection) {
      activeHash.value = `#${firstSection.id}`
    }
  }
})

onUnmounted(() => {
  observer.value?.disconnect()
})

watch(activeHash, () => {
  nextTick(() => {
    updateOutlineMarker()
  })
})
</script>

<style>
html {
  scroll-behavior: smooth;
}

.scroll-mt-20 {
  scroll-margin-top: 80px;
}

.outline-marker {
  position: absolute;
  left: -4px;
  width: 3px;
  background-color: #3b82f6; /* Azul */
  border-radius: 2px;
  transition:
    top 0.2s ease-in-out,
    height 0.2s ease-in-out,
    opacity 0.2s ease-in-out;
  opacity: 0;
}

.outline-link.active {
  color: #ffffff;
  background-color: #1f2937;
}
</style>

<style scoped>
/* Estilos específicos para este componente */
</style>
