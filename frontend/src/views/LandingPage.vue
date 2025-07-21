<template>
  <div class="bg-zinc-900 text-white font-sans">
    <!-- HEADER -->
    <header class="fixed top-0 left-1/2 -translate-x-1/2 w-full z-[900] px-6 py-4 flex items-center justify-between bg-zinc-900/70">
      <div class="flex items-center">
        <img src="@/assets/FinvyLogo.svg" alt="Finvy Logo" class="h-10 w-10 mr-2" />
      </div>
      <nav class="hidden md:flex items-center space-x-6">
        <a href="#" class="hover:text-gray-300 transition-colors">Início</a>
        <a href="#" class="hover:text-gray-300 transition-colors">Funcionalidades</a>
        <a href="#" class="hover:text-gray-300 transition-colors">Contato</a>
      </nav>
      <div class="flex items-center space-x-4">
        <a href="#" class="text-white hover:text-gray-300 transition-colors">Login</a>
      </div>
    </header>

    <!-- SEÇÃO PRINCIPAL -->
    <main class="relative text-center pt-28 pb-20 min-h-screen flex flex-col justify-center items-center overflow-hidden">
      <video ref="videoElement" autoplay loop playsinline class="absolute inset-0 w-full h-full object-cover z-0">
        <source src="" type="video/mp4" />
        Seu navegador não suporta a tag de vídeo.
      </video>
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-transparent z-10"></div>
      <div class="relative z-20 container mx-auto px-6">
        <p class="text-gray-400 text-sm mb-4">BOAS-VINDAS A Finvy 👋</p>
        <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
          Otimize e automatize
        </h1>
        <p class="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Com o Finvy você pode focar no que realmente importa, sem se
          preocupar em gastar tempo e esforço para realizar tarefas manuais e
          repetitivas.
        </p>
      </div>
    </main>

    <!-- BOTÃO FIXO NO CANTO INFERIOR DIREITO -->
    <PButton
      :icon="isMuted ? 'pi pi-volume-off' : 'pi pi-volume-up'"
      @click="toggleMute"
      class="fixed bottom-12 z-50"
    />

    <!-- SEÇÃO DE ÍCONES -->
    <section class="container mx-auto px-6 py-20 min-h-screen flex items-center justify-center">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="flex flex-col items-center text-center md:text-left md:items-start">
          <i class="pi pi-calculator w-12 h-12 text-white mb-4"></i>
          <h3 class="text-2xl font-bold mb-2">Gestão de Lançamentos e Impostos</h3>
          <p class="text-gray-400 max-w-sm">
            Automatize o cálculo de custo médio ponderado e a aplicação de alíquotas de impostos (ex: ICMS) sobre compras e vendas, com segregação de valores para apuração.
          </p>
        </div>
        <div class="flex flex-col items-center text-center md:text-left md:items-start">
          <i class="pi pi-box w-12 h-12 text-white mb-4"></i>
          <h3 class="text-2xl font-bold mb-2">Controle de Estoque</h3>
          <p class="text-gray-400 max-w-sm">
            Mantenha um controle preciso do seu estoque, com cálculo de custo médio ponderado para movimentações de entrada e saída.
          </p>
        </div>
        <div class="flex flex-col items-center text-center md:text-left md:items-start">
          <i class="pi pi-chart-bar w-12 h-12 text-white mb-4"></i>
          <h3 class="text-2xl font-bold mb-2">Relatórios Financeiros Abrangentes</h3>
          <p class="text-gray-400 max-w-sm">
            Gere Balanço Patrimonial, DRE, DFC, Ficha de Controle de Estoque e relatórios personalizáveis para uma visão completa da sua saúde financeira.
          </p>
        </div>
        <div class="flex flex-col items-center text-center md:text-left md:items-start">
          <i class="pi pi-wallet w-12 h-12 text-white mb-4"></i>
          <h3 class="text-2xl font-bold mb-2">Gestão de Contas e Produtos</h3>
          <p class="text-gray-400 max-w-sm">
            Organize suas contas e produtos de forma eficiente, facilitando o registro de transações e a análise de desempenho.
          </p>
        </div>
      </div>
    </section>

    <!-- RODAPÉ -->
    <footer class="bg-zinc-900/70 border-t border-zinc-800 pt-16 pb-8">
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
          <div class="flex flex-col items-end">
            <div class="flex space-x-4 mt-4 md:mt-0">
              <a href="#" class="hover:text-white">
                <i class="pi pi-facebook w-6 h-6"></i>
              </a>
              <a href="#" class="hover:text-white">
                <i class="pi pi-twitter w-6 h-6"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const videoElement = ref<HTMLVideoElement | null>(null);
const isMuted = ref(false);

onMounted(() => {
  if (videoElement.value) {
    videoElement.value.volume = 0.3;
    isMuted.value = videoElement.value.muted;
  }
});

const toggleMute = () => {
  if (videoElement.value) {
    videoElement.value.muted = !videoElement.value.muted;
    isMuted.value = videoElement.value.muted;
  }
};
</script>

<style scoped>
.font-sans {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
}
</style>
