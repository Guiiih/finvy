<template>
  <div class="bg-black text-white font-sans">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-md">
      <div class="container mx-auto px-6 py-6">
        <div class="flex justify-between items-center">
          <div class="text-xl font-bold tracking-wider">FINVY</div>
          <nav class="hidden md:flex items-center space-x-10 text-sm">
            <a href="#inicio" class="hover:text-gray-300">Início</a>
            <a href="#sobre" class="hover:text-gray-300">Sobre</a>
            <a href="#solucoes" class="hover:text-gray-300">Soluções</a>
          </nav>
          <div>
            <router-link
              to="/login"
              class="border border-gray-500 rounded-md px-5 py-2 text-sm hover:bg-gray-800"
            >
              Login
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main id="inicio" class="min-h-screen flex items-center justify-center">
      <div class="container mx-auto px-6 text-center">
        <p class="text-xs font-bold tracking-widest text-gray-400">BOAS-VINDAS A FINVY 👋</p>
        <h1 class="text-5xl md:text-6xl font-bold my-4">Otimize e automatize</h1>
        <p class="text-base text-gray-400 max-w-xl mx-auto">
          Com o Finvy você pode focar no que realmente importa, sem se preocupar em gastar tempo e
          esforço para realizar tarefas manuais e repetitivas.
        </p>
      </div>
    </main>

    <!-- Features Section -->
    <section id="solucoes" class="min-h-screen flex items-center">
      <div class="container mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-x-16 gap-y-12">
          <div class="text-left">
            <div class="w-8 h-8 mb-4 flex items-center justify-center rounded-md bg-gray-800">
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Lorem Ipsum</h3>
            <p class="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed maximus eleifend
              molestie. In luctus sapien sit amet interdum imperdiet. Integer.
            </p>
          </div>
          <div class="text-left">
            <div class="w-8 h-8 mb-4 flex items-center justify-center rounded-md bg-gray-800">
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Lorem Ipsum</h3>
            <p class="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed maximus eleifend
              molestie. In luctus sapien sit amet interdum imperdiet. Integer.
            </p>
          </div>
          <div class="text-left">
            <div class="w-8 h-8 mb-4 flex items-center justify-center rounded-md bg-gray-800">
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Lorem Ipsum</h3>
            <p class="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed maximus eleifend
              molestie. In luctus sapien sit amet interdum imperdiet. Integer.
            </p>
          </div>
          <div class="text-left">
            <div class="w-8 h-8 mb-4 flex items-center justify-center rounded-md bg-gray-800">
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                ></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Lorem Ipsum</h3>
            <p class="text-gray-400 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed maximus eleifend
              molestie. In luctus sapien sit amet interdum imperdiet. Integer.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer id="sobre" class="border-t border-gray-800 mt-16">
      <div class="container mx-auto px-6 py-10">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div class="md:col-span-4">
            <h3 class="text-xl font-bold tracking-wider">FINVY</h3>
            <p class="text-gray-400 text-xs mt-4">©2025 - Finvy.</p>
            <p class="text-gray-400 text-xs">Todos os direitos reservados.</p>
          </div>

          <div class="md:col-span-2 md:col-start-7">
            <h4 class="font-bold text-sm mb-4">About</h4>
            <ul class="space-y-2 text-gray-400 text-sm">
              <li><a href="#" class="hover:text-white">Profile</a></li>
              <li><a href="#" class="hover:text-white">Features</a></li>
              <li><a href="#" class="hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div class="md:col-span-2">
            <h4 class="font-bold text-sm mb-4">Help</h4>
            <ul class="space-y-2 text-gray-400 text-sm">
              <li><a href="#" class="hover:text-white">Support</a></li>
              <li><a href="#" class="hover:text-white">Login</a></li>
              <li><a href="#" class="hover:text-white">Guide</a></li>
              <li><a href="#" class="hover:text-white">Reports</a></li>
              <li><a href="#" class="hover:text-white">Q&A</a></li>
            </ul>
          </div>

          <div class="md:col-span-2 flex md:justify-end items-start">
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-white">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.585-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.585-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.585.07-4.85c.148-3.225 1.664-4.771 4.919-4.919C8.415 2.175 8.796 2.163 12 2.163zm0 1.802c-3.153 0-3.51.012-4.742.068-2.673.122-3.833 1.28-3.955 3.955-.056 1.232-.067 1.588-.067 4.742s.011 3.51.067 4.742c.122 2.673 1.282 3.833 3.955 3.955 1.232.056 1.588.067 4.742.067s3.51-.011 4.742-.067c2.673-.122 3.833-1.282 3.955-3.955.056-1.232.067-1.588.067-4.742s-.011-3.51-.067-4.742c-.122-2.673-1.282-3.833-3.955-3.955-1.232-.056-1.588-.067-4.742-.067zm0 4.688a5.338 5.338 0 100 10.676 5.338 5.338 0 000-10.676zm0 1.802a3.536 3.536 0 110 7.072 3.536 3.536 0 010-7.072zM16.95 6.525a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-white">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LandingPage',
})
</script>

<style>
html {
  scroll-behavior: smooth;
}
.bg-black {
  background-color: #0a0a0a;
}
</style>
