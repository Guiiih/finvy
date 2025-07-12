import { useToast } from 'primevue/usetoast';

// Este é um truque para obter acesso ao serviço de toast fora dos componentes Vue.
// Ele depende do fato de que o App.vue irá registrar o serviço de toast.
let toast: ReturnType<typeof useToast>;

export function setToast(instance: ReturnType<typeof useToast>) {
  toast = instance;
}

export function showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life: number = 5000) {
  if (toast) {
    toast.add({ severity, summary, detail, life });
  } else {
    console.error('O serviço de Toast não foi inicializado. Adicione <Toast /> e chame setToast no App.vue');
  }
}
