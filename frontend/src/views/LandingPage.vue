<template>
  <div class="bg-gray-900 text-white font-sans">
    <header class="container mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold">
        Finvy
      </div>
      <nav class="hidden md:flex items-center space-x-6">
        <a href="#features" class="hover:text-gray-300 transition-colors">Funcionalidades</a>
        <a href="#differentiators" class="hover:text-gray-300 transition-colors">Diferenciais</a>
        <a href="#contact" class="hover:text-gray-300 transition-colors">Contato</a>
        <a href="#" class="hover:text-gray-300 transition-colors">Entrar</a>
      </nav>
      <a href="#" class="bg-white text-gray-900 font-bold py-2 px-5 rounded-lg transition-transform hover:scale-105">
        Criar conta grátis
      </a>
    </header>

    <main class="container mx-auto px-6 text-center pt-24 pb-20">
      <a href="#" class="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
        Ver demonstração
      </a>
      <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
        Otimize & automatize sua gestão financeira.
      </h1>
      <p class="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
        Com o Finvy você pode focar no que realmente importa, sem se preocupar em gastar tempo e esforço para realizar tarefas manuais e repetitivas.
      </p>
      <div class="flex justify-center gap-4 flex-wrap">
        <a href="#" class="bg-white text-gray-900 font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 text-lg inline-flex items-center">
          Criar conta e testar grátis <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>
        <a href="#" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-transform hover:scale-105 text-lg">
          Saiba mais
        </a>
      </div>
    </main>
    
    <section class="container mx-auto px-6 pb-20">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
                <p class="text-4xl font-bold text-white">+1.200</p>
                <p class="text-gray-400">Empresas Satisfeitas</p>
            </div>
            <div>
                <p class="text-4xl font-bold text-white">+250.000</p>
                <p class="text-gray-400">Lançamentos Processados</p>
            </div>
            <div>
                <p class="text-4xl font-bold text-white">+40.000</p>
                <p class="text-gray-400">Relatórios Gerados</p>
            </div>
            <div>
                <p class="text-4xl font-bold text-white">+8.760</p>
                <p class="text-gray-400">Horas de Trabalho Otimizadas</p>
            </div>
        </div>
        <div class="text-center mt-8 text-gray-500">
            <span class="inline-block w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
            Atualizado em tempo real
        </div>
    </section>

    <section id="features" class="py-20 bg-gray-800/50">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold mb-2">Uma plataforma, todas as ferramentas</h2>
          <p class="text-gray-300 max-w-2xl mx-auto">Organizamos a complexidade da gestão contábil em uma interface poderosa e intuitiva.</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div class="md:col-span-2 bg-gray-900 p-8 rounded-lg border border-gray-700 flex flex-col justify-between transform hover:-translate-y-1 transition-transform">
            <div>
              <h3 class="text-2xl font-bold mb-2">Importação de NF-e sem esforço</h3>
              <p class="text-gray-400 mb-4">Automatize a entrada de dados financeiros e de estoque. Arraste, solte e veja a mágica acontecer, eliminando a digitação manual.</p>
            </div>
            <div class="bg-gray-800 rounded-md p-4 mt-4 border border-gray-600 flex items-center justify-center h-48">
                <p class="text-gray-500 text-lg">[Visual de Importação de NF-e]</p>
            </div>
          </div>

          <div class="bg-gray-900 p-8 rounded-lg border border-gray-700 transform hover:-translate-y-1 transition-transform">
            <h3 class="text-xl font-bold mb-2">Simulador de Impostos</h3>
            <p class="text-gray-400">Calcule e simule alíquotas de impostos (ICMS, PIS/COFINS) sobre compras e vendas com precisão.</p>
            <div class="bg-gray-800 rounded-md p-4 mt-4 border border-gray-600 text-center h-32 flex items-center justify-center">
                <p class="text-gray-500 text-lg">[Visual de Simulação de Impostos]</p>
            </div>
          </div>

          <div class="bg-gray-900 p-8 rounded-lg border border-gray-700 transform hover:-translate-y-1 transition-transform">
            <h3 class="text-xl font-bold mb-2">Controle de Estoque</h3>
            <p class="text-gray-400">Custo Médio Ponderado calculado automaticamente a cada movimentação.</p>
            <div class="bg-gray-800 rounded-md p-4 mt-4 border border-gray-600 text-center h-32 flex items-center justify-center">
                <p class="text-gray-500 text-lg">[Visual de Controle de Estoque]</p>
            </div>
          </div>

          <div class="md:col-span-3 bg-gray-900 p-8 rounded-lg border border-gray-700 transform hover:-translate-y-1 transition-transform">
            <h3 class="text-xl font-bold mb-2">Relatórios Abrangentes</h3>
            <p class="text-gray-400">Gere Balanço Patrimonial, DRE, DFC, Balancetes e Fichas de Estoque com um clique para decisões mais inteligentes.</p>
            <div class="bg-gray-800 rounded-md p-4 mt-4 border border-gray-600 text-center h-32 flex items-center justify-center">
                <p class="text-gray-500 text-lg">[Visual de Relatórios]</p>
            </div>
          </div>

        </div>
      </div>
    </section>
    
    <section id="differentiators" class="py-20 bg-gray-800/50">
      <div class="container mx-auto px-6 text-center">
        <h2 class="text-4xl font-bold mb-4">Feito para Contadores, por Contadores.</h2>
        <p class="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
          Oferecemos recursos essenciais para otimizar sua gestão, permitindo que você se concentre no que realmente importa.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-gray-900 p-8 rounded-lg border border-gray-700 transform hover:-translate-y-1 transition-transform">
            <h3 class="text-xl font-bold mb-2">Automação Inteligente</h3>
            <p class="text-gray-400">Reduza erros e economize tempo com importação de NF-e e cálculos automáticos.</p>
          </div>
          <div class="bg-gray-900 p-8 rounded-lg border border-gray-700 transform hover:-translate-y-1 transition-transform">
            <h3 class="text-xl font-bold mb-2">Precisão e Confiabilidade</h3>
            <p class="text-gray-400">Supere as limitações das planilhas com uma plataforma que garante a integridade dos dados e a aplicação correta de princípios contábeis.</p>
          </div>
          <div class="bg-gray-900 p-8 rounded-lg border border-gray-700 transform hover:-translate-y-1 transition-transform">
            <h3 class="text-xl font-bold mb-2">Conformidade Fiscal Simplificada</h3>
            <p class="text-gray-400">Ferramentas para simulação e segregação de impostos para manter sua empresa em dia.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 text-center">
      <div class="container mx-auto px-6">
        <h2 class="text-4xl font-bold mb-4">Pronto para transformar sua gestão?</h2>
        <p class="text-lg text-gray-300 mb-8">Junte-se a milhares de estudantes e empresas que já estão otimizando suas finanças.</p>
        <a href="#" class="bg-white text-gray-900 font-bold py-4 px-10 rounded-lg transition-transform hover:scale-105 text-xl">
            Comece a Otimizar Suas Finanças Hoje!
        </a>
      </div>
    </section>

    <footer id="contact" class="bg-gray-900/70 border-t border-gray-800 pt-16 pb-8">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="col-span-2 md:col-span-1 mb-8 md:mb-0">
            <h3 class="text-2xl font-bold mb-2">Finvy</h3>
            <p class="text-gray-400">Inteligência Financeira ao Seu Alcance.</p>
          </div>
          <div>
            <h4 class="font-bold mb-4">Produto</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#features" class="hover:text-white">Funcionalidades</a></li>
              <li><a href="#" class="hover:text-white">Segurança</a></li>
              <li><a href="#" class="hover:text-white">Preços</a></li>
              <li><a href="#" class="hover:text-white">Enterprise</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4">Recursos</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white">Blog</a></li>
              <li><a href="#" class="hover:text-white">Documentação</a></li>
              <li><a href="#" class="hover:text-white">Tutoriais</a></li>
              <li><a href="#" class="hover:text-white">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4">Empresa</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white">Sobre Nós</a></li>
              <li><a href="#" class="hover:text-white">Contato</a></li>
              <li><a href="#" class="hover:text-white">Carreiras</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-gray-500">
          <p>&copy; 2025 - Finvy. Todos os direitos reservados.</p>
          <div class="flex space-x-4 mt-4 md:mt-0">
            <a href="#" class="hover:text-white">Termos</a>
            <a href="#" class="hover:text-white">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Para uma landing page estática como esta, a lógica de script não é necessária.
// O script setup está aqui para conformidade com as melhores práticas do Vue 3 e pode
// ser usado posteriormente para adicionar interatividade, se necessário.
</script>

<style scoped>
/* Para uma aparência mais profissional, é recomendado usar uma fonte personalizada.
   Você pode importar a fonte no seu arquivo principal de CSS ou no index.html.
   Exemplo de importação no CSS: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
*/
.font-sans {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}
</style>