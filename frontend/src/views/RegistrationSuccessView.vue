<template>
  <div class="success-page-container">
    <div class="success-content">
      <div class="checkmark-icon">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00E676"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-check-circle"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-8.87"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h1 class="success-title">Cadastro concluído</h1>
      <p class="success-subtitle">
        Agora você faz parte da plataforma do Finvy. Tenha uma ótima experiência.
      </p>
      <button @click="goToLogin" class="success-button">Voltar ao login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.success-page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  background-color: #1a1a1a; /* Fundo escuro conforme a imagem */
  color: white; /* Cor do texto padrão */
  text-align: center;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  max-width: 500px; /* Largura máxima para o conteúdo */
}

.checkmark-icon {
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #00e676; /* Borda verde arredondada */
  border-radius: 50%; /* Faz um círculo */
  margin-bottom: 30px;
}

.checkmark-icon svg {
  width: 60px; /* Tamanho do SVG interno */
  height: 60px;
  stroke: #00e676; /* Cor da linha do checkmark */
}

.success-title {
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 15px;
  color: white; /* Cor do título */
}

.success-subtitle {
  font-size: 1.1em;
  color: #a0a0a0; /* Cor do subtítulo */
  margin-bottom: 40px;
  line-height: 1.5;
}

.success-button {
  padding: 15px 30px;
  background-color: #00e676; /* Verde vibrante */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.success-button:hover {
  background-color: #00c853; /* Verde um pouco mais escuro no hover */
}
</style>
