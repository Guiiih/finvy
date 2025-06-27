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
      const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();
      if (initialSessionError) throw initialSessionError;


      session.value = initialSession;
      user.value = initialSession?.user || null;


      supabase.auth.onAuthStateChange((event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user || null;
        console.log('Auth event:', event, 'New session:', newSession);
      });
    } catch (err: unknown) {
      console.error('Erro ao inicializar listener de auth:', err);
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      user.value = data.user;
      session.value = data.session;
      console.log('Login bem-sucedido:', data);
      return true;
    } catch (err: unknown) {
      console.error('Erro no login:', err);
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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      console.log('Registro bem-sucedido. Verifique seu email para confirmar:', data);
      return true;
    } catch (err: unknown) {
      console.error('Erro no registro:', err);
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
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      user.value = null;
      session.value = null;
      console.log('Logout bem-sucedido.');
      return true;
    } catch (err: unknown) {
      console.error('Erro no logout:', err);
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Falha no logout.';
      }
      return false;
    } finally {
      loading.value = false;
    }
  }


  async function resetPassword(email: string) {
    loading.value = true;
    error.value = null;
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (authError) throw authError;
      console.log('Link de redefinição de senha enviado para o email.');
      return true;
    } catch (err: unknown) {
      console.error('Erro ao resetar senha:', err);
      if (err instanceof AuthApiError) {
        error.value = err.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Falha ao solicitar redefinição de senha.';
      }
      return false;
    } finally {
      loading.value = false;
    }
  }


  async function updatePassword(newPassword: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (authError) throw authError;
      user.value = data.user;
      console.log('Senha atualizada com sucesso.');
      return true;
    } catch (err: unknown) {
      console.error('Erro ao atualizar senha:', err);
      if (err instanceof AuthApiError) {
        error.value = err.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Falha ao atualizar senha.';
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
    resetPassword,
    updatePassword
  };
});

