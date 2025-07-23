<template>
  <div id="app" class="font-sans antialiased text-gray-900 bg-white">
    <nav class="bg-white p-6">
      <div class="container mx-auto flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-xl flex items-center">
            <svg class="w-8 h-8 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0zM7 13a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd"></path>
            </svg>
            Monster kit
          </span>
        </div>
        <div class="hidden md:flex space-x-8 items-center">
          <a href="#" class="text-gray-600 hover:text-gray-900">Home</a>
          <div class="relative group">
            <button class="text-gray-600 hover:text-gray-900 flex items-center">
              Our Products
              <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div class="absolute hidden group-hover:block bg-white shadow-lg rounded-md mt-2 w-48 py-2 z-10">
              <a href="#" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Product A</a>
              <a href="#" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Product B</a>
            </div>
          </div>
          <a href="#" class="text-gray-600 hover:text-gray-900">Resources</a>
          <a href="#" class="text-gray-600 hover:text-gray-900">Contacts</a>
        </div>
        <div class="hidden md:flex space-x-4">
          <button class="text-gray-600 hover:text-gray-900 px-4 py-2 rounded">Sign Up</button>
          <button class="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition duration-300">Log In</button>
        </div>
        <div class="md:hidden">
          <button @click="toggleMenu" class="text-gray-600 focus:outline-none">
            <svg
              class="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      <div v-if="isMobileMenuOpen" class="md:hidden bg-white mt-4 space-y-2 p-4 border-t border-gray-200">
        <a href="#" class="block text-gray-600 hover:text-gray-900 py-2">Home</a>
        <div class="relative">
          <button @click="toggleProductMenu" class="block w-full text-left text-gray-600 hover:text-gray-900 py-2 flex justify-between items-center">
            Our Products
            <svg class="ml-1 w-4 h-4 transform transition-transform" :class="{'rotate-180': isProductMenuOpen}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          <div v-if="isProductMenuOpen" class="bg-gray-50 rounded-md mt-1 w-full py-1">
            <a href="#" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Product A</a>
            <a href="#" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">Product B</a>
          </div>
        </div>
        <a href="#" class="block text-gray-600 hover:text-gray-900 py-2">Resources</a>
        <a href="#" class="block text-gray-600 hover:text-gray-900 py-2">Contacts</a>
        <hr class="my-2 border-gray-200" />
        <button class="block w-full text-left text-gray-600 hover:text-gray-900 py-2">Sign Up</button>
        <button class="block w-full text-left bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition duration-300">Log In</button>
      </div>
    </nav>

    <section class="bg-white py-16 md:py-20 lg:py-24">
      <div class="container mx-auto flex flex-col md:flex-row items-center justify-between px-6 lg:px-8">
        <div class="md:w-1/2 text-center md:text-left mb-12 md:mb-0 lg:pr-12">
          <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Create effective <br />
            hero blocks with <br />
            our template
          </h1>
          <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto md:mx-0">
            Our hero block template makes it easy to create effective hero blocks for your website with just a few clicks.
          </p>
          <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-16 justify-center md:justify-start">
            <button class="bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition duration-300 flex items-center justify-center">
              Get Started
              <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </button>
            <button class="bg-gray-200 text-gray-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-300 transition duration-300">
              Learn more
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <p class="text-5xl font-extrabold text-gray-900">250K+</p>
              <p class="text-lg text-gray-600">Subscribers</p>
            </div>
            <div>
              <p class="text-5xl font-extrabold text-gray-900">32K+</p>
              <p class="text-lg text-gray-600">Active Users</p>
            </div>
            <div>
              <p class="text-5xl font-extrabold text-gray-900">900K+</p>
              <p class="text-lg text-gray-600">Downloads</p>
            </div>
          </div>
        </div>

        <div class="md:w-1/2 flex justify-center md:justify-end relative mt-12 md:mt-0">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500 via-green-400 to-purple-600 opacity-75 rounded-3xl transform rotate-3 scale-105"></div>
          <div class="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div class="flex items-center bg-gray-100 p-3 border-b border-gray-200">
              <div class="flex space-x-1.5">
                <span class="w-3 h-3 bg-red-500 rounded-full"></span>
                <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
              <div class="flex-grow text-center text-sm text-gray-500">
                <span class="ml-4">&lt; &gt;</span>
              </div>
            </div>
            <div class="p-8 text-gray-700 h-64 flex items-center justify-center">
              <p class="text-xl text-gray-400">Your content goes here</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-black text-white py-20 px-6">
      <div class="container mx-auto">
        <h2 class="text-4xl md:text-5xl font-extrabold text-center mb-16">Funcionalidades e Vantagens</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div class="bg-gray-900 rounded-xl p-6 flex flex-col justify-between md:col-span-2">
            <div>
              <h3 class="text-2xl font-bold mb-3">Geração de commits sem esforço</h3>
              <p class="text-gray-400 mb-6">
                Use IA para analisar alterações no código e gerar mensagens de commit perfeitas e automáticas
              </p>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-sm font-mono leading-relaxed">
              <p class="text-green-400 mb-2">Selecione os arquivos:</p>
              <p class="text-gray-300">src/pages/home/index.ts</p>
              <p class="text-gray-300">src/styles/home/_index.scss: <span>!important</span></p>
              <p class="text-gray-300">src/styles/home/styles.ts</p>
              <p class="text-green-400 mt-4 mb-2">Deseja confirmar este commit?</p>
              <p><span class="text-green-400">●</span> Sim <span class="text-red-400">●</span> Não</p>
            </div>
          </div>

          <div class="bg-gray-900 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 class="text-2xl font-bold mb-3">Personalização e padrão de mensagens</h3>
              <p class="text-gray-400 mb-6">
                Ajuste o padrão das mensagens de commit conforme suas necessidades e gostos pessoais
              </p>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-sm">
              <div class="mb-3">
                <label for="menu" class="block text-gray-400 text-xs mb-1">Menu</label>
                <select id="menu" class="w-full bg-gray-700 text-white rounded px-3 py-2">
                  <option>Log In</option>
                  <option>Sign Up</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="block text-gray-400 text-xs mb-1">Confirmar commit</label>
                <p class="text-gray-300 text-xs">Ative para pular a etapa de confirmação do commit de envio dos. </p>
                <div class="flex items-center mt-2">
                  <input type="checkbox" id="confirmCommit" class="form-checkbox text-indigo-500 rounded border-gray-600 bg-gray-700 focus:ring-indigo-500">
                  <label for="confirmCommit" class="ml-2 text-gray-300 text-sm">Confirmar commit</label>
                </div>
              </div>
              <div>
                <label class="block text-gray-400 text-xs mb-1">Pronto</label>
                <p class="text-gray-300 text-xs">Ative essa opção para enviar (git push) suas mensagens de commit</p>
                <div class="flex items-center mt-2">
                  <input type="radio" name="readyOption" id="readyYes" class="form-radio text-indigo-500 border-gray-600 bg-gray-700 focus:ring-indigo-500">
                  <label for="readyYes" class="ml-2 text-gray-300 text-sm">Em breve</label>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-900 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 class="text-2xl font-bold mb-3">Insights & estatísticas</h3>
              <p class="text-gray-400 mb-6">
                Receba insights sobre a qualidade do código, produtividade da equipe, históricos e muito mais
              </p>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-sm">
              <div class="flex justify-around text-center mb-4">
                <div>
                  <p class="text-2xl font-bold text-gray-200">187</p>
                  <p class="text-gray-400 text-sm">Commits</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-200">23,375</p>
                  <p class="text-gray-400 text-sm">Detalhes de commits (Mês)</p>
                </div>
              </div>
              <div class="h-24 bg-gray-700 rounded-md flex items-end justify-around p-2">
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 40%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 70%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 50%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 80%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 60%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 90%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 75%;"></div>
                <div class="w-4 bg-indigo-500 rounded-t-sm" style="height: 55%;"></div>
              </div>
              <p class="text-gray-500 text-xs mt-2">Commits</p>
            </div>
          </div>

          <div class="bg-gray-900 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 class="text-2xl font-bold mb-3">Histórico</h3>
              <p class="text-gray-400 mb-6">
                Registro completo dos commits e projetos permitindo buscas eficientes e visão geral do desenvolvimento
              </p>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-sm leading-relaxed">
              <div class="flex items-center mb-2">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <p class="text-gray-300">Commit</p>
              </div>
              <div class="flex items-center mb-2">
                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <p class="text-gray-300">viewbox/local-api-client: Update `api-client` dependency from `1.99.3` to `1.99.5`</p>
              </div>
              <div class="flex items-center mb-2">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <p class="text-gray-300">history/data: Update `data` nomenclature to exclude development environments</p>
              </div>
              <div class="flex items-center mb-2">
                <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <p class="text-gray-300">history/backend/api: Find `api` when `api` is null in `api`</p>
              </div>
              <div class="flex items-center">
                <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <p class="text-gray-300">history/frontend/client: Add `getStatistics` and `getLogs` to the client</p>
              </div>
            </div>
          </div>

          <div class="bg-gray-900 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 class="text-2xl font-bold mb-3">Alertas de segurança</h3>
            <p class="text-gray-400 mb-6">
              Receba alertas sobre vulnerabilidades de segurança, dados sensíveis vazados e possíveis melhorias
            </p>
            <div class="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg class="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-8-3zm0 10.99l-4.5-4.5L6 9l6 6 6-6-1.5-1.5-4.5 4.5V7h-2v5.99z"/>
              </svg>
            </div>
            <p class="text-xl font-semibold text-gray-500">EM BREVE</p>
          </div>

        </div>
      </div>
    </section>

    <footer class="bg-zinc-900 text-white pt-16 pb-8">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="col-span-2 md:col-span-1 mb-8 md:mb-0">
            <h3 class="text-2xl font-bold mb-2">FINVY</h3>
            <p class="text-gray-400">&copy;2025 - Finvy.</p>
            <p class="text-gray-400">Todos os direitos reservados.</p>
          </div>
          <div>
            <h4 class="font-bold mb-4">Recursos</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white">Gestão Financeira</a></li>
              <li><a href="#" class="hover:text-white">Contabilidade</a></li>
              <li><a href="#" class="hover:text-white">Relatórios</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4">Suporte</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white">FAQ</a></li>
              <li><a href="#" class="hover:text-white">Contato</a></li>
              <li><a href="#" class="hover:text-white">Termos de Uso</a></li>
              <li><a href="#" class="hover:text-white">Política de Privacidade</a></li>
            </ul>
          </div>
          <div class="flex flex-col items-start md:items-end">
            <div class="flex space-x-4 mt-4 md:mt-0">
              <a href="#" class="hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V22H12c5.523 0 10-4.477 10-10z" clip-rule="evenodd" />
                </svg>
                </a>
              <a href="#" class="hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.2 10.5a8.7 8.7 0 0113.8-9.4c.5-1.5 1.7-2.7 3.2-3.2A8.7 8.7 0 0123.8 0a8.7 8.7 0 01-.2 10.5c-.5 1.5-1.7 2.7-3.2 3.2a8.7 8.7 0 01-13.8 9.4A8.7 8.7 0 01.2 10.5zM10.5 17c-3 0-5.5-2.5-5.5-5.5s2.5-5.5 5.5-5.5 5.5 2.5 5.5 5.5-2.5 5.5-5.5 5.5zM12 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
                </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isMobileMenuOpen: false,
      isProductMenuOpen: false,
    };
  },
  methods: {
    toggleMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
      if (!this.isMobileMenuOpen) {
        this.isProductMenuOpen = false;
      }
    },
    toggleProductMenu() {
      this.isProductMenuOpen = !this.isProductMenuOpen;
    },
  },
};
</script>