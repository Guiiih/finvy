import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { AuthApiError } from '@supabase/supabase-js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isLoggedIn = computed(() => !!user.value);
  const token = computed(() => session.value?.access_token || null);

  async function initAuthListener() {
    loading.value = true;
    error.value = null;
    try {
      console.log('DEBUG AUTH: (initAuthListener) Chamando supabase.auth.getSession()');
      const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();
      
      console.log('DEBUG AUTH: (initAuthListener) Retorno de getSession - session:', initialSession, 'error:', initialSessionError);

      if (initialSessionError) {
        console.error('DEBUG AUTH: Erro ao obter sessão inicial:', initialSessionError);
        throw initialSessionError;
      }

      session.value = initialSession;
      user.value = initialSession?.user || null;
      console.log('DEBUG AUTH: (initAuthListener) Estado inicial da store - user:', user.value?.id, 'isLoggedIn:', !!user.value);

      // Listener para mudanças de estado de autenticação em tempo real
      supabase.auth.onAuthStateChange((event, newSession) => {
        console.log('DEBUG AUTH: (onAuthStateChange) Evento:', event, 'Nova sessão:', newSession);
        session.value = newSession;
        user.value = newSession?.user || null;
        console.log('DEBUG AUTH: (onAuthStateChange) Estado atual da store - user:', user.value?.id, 'isLoggedIn:', !!user.value);
      });
    } catch (err: unknown) {
      console.error('DEBUG AUTH: (initAuthListener) Erro (capturado):', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao inicializar o listener de autenticação.';
      } else {
        error.value = 'Falha ao inicializar o listener de autenticação.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function signIn(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      console.log('DEBUG AUTH: (signIn) Tentando fazer login para:', email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('DEBUG AUTH: (signIn) Retorno do login - data:', data, 'error:', authError);

      if (authError) throw authError;
      user.value = data.user;
      session.value = data.session;
      console.log('DEBUG AUTH: (signIn) Login bem-sucedido - user:', user.value?.id, 'session:', session.value);
      return true;
    } catch (err: unknown) {
      console.error('DEBUG AUTH: (signIn) Erro no login (capturado):', err);
      if (err instanceof AuthApiError) {
        error.value = err.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Falha no login.';
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signUp(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      console.log('DEBUG AUTH: (signUp) Tentando registrar para:', email);
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      console.log('DEBUG AUTH: (signUp) Retorno do registro - data:', data, 'error:', authError);

      if (authError) throw authError;
      user.value = data.user;
      session.value = data.session;
      console.log('DEBUG AUTH: (signUp) Registro bem-sucedido - user:', user.value?.id, 'session:', session.value);
      return true;
    } catch (err: unknown) {
      console.error('DEBUG AUTH: (signUp) Erro no registro (capturado):', err);
      if (err instanceof AuthApiError) {
        error.value = err.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Falha no registro.';
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    error.value = null;
    try {
      console.log('DEBUG AUTH: (signOut) Tentando fazer logout.');
      const { error: authError } = await supabase.auth.signOut();
      console.log('DEBUG AUTH: (signOut) Retorno do logout - error:', authError);

      if (authError) throw authError;
      user.value = null;
      session.value = null;
      console.log('DEBUG AUTH: (signOut) Logout bem-sucedido. user e session são null.');
      return true;
    } catch (err: unknown) {
      console.error('DEBUG AUTH: (signOut) Erro no logout (capturado):', err);
      if (err instanceof Error) {
        error.value = err.message || 'Falha ao fazer logout.';
      } else {
        error.value = 'Falha ao fazer logout.';
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    session,
    loading,
    error,
    isLoggedIn,
    token,
    initAuthListener,
    signIn,
    signUp,
    signOut,
  };
});