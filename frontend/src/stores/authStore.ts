import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { AuthApiError } from '@supabase/supabase-js'
import { api } from '@/services/api' // Importa o cliente da API

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const userRole = ref<string | null>(null) // NOVO: Adiciona a role do usuário

    const isLoggedIn = computed(() => !!user.value)
    const token = computed(() => session.value?.access_token || null)
    const isAdmin = computed(() => userRole.value === 'admin') // NOVO: Computed para verificar se é admin

    async function fetchUserProfile() {
      if (!user.value) {
        userRole.value = null;
        return;
      }
      try {
        const response = await api.get<{ username: string; role: string }>('/profile');
        userRole.value = response.role;
      } catch (err: unknown) {
        console.error('Erro ao buscar perfil do usuário:', err);
        userRole.value = null;
      }
    }

    async function initAuthListener() {
      loading.value = true
      error.value = null
      try {
        const {
          data: { session: initialSession },
          error: initialSessionError,
        } = await supabase.auth.getSession()
        if (initialSessionError) throw initialSessionError

        session.value = initialSession
        user.value = initialSession?.user || null

        if (user.value) {
          await fetchUserProfile(); // Busca a role após obter a sessão inicial
        }

        supabase.auth.onAuthStateChange(async (event, newSession) => {
          session.value = newSession
          user.value = newSession?.user || null
          if (user.value) {
            await fetchUserProfile(); // Busca a role em cada mudança de estado de autenticação
          } else {
            userRole.value = null; // Limpa a role se não houver usuário
          }
        })
      } catch (err: unknown) {
        console.error('Erro ao inicializar listener de auth:', err)
        if (err instanceof Error) {
          error.value = err.message || 'Falha ao inicializar o listener de autenticação.'
        } else {
          error.value = 'Falha ao inicializar o listener de autenticação.'
        }
      } finally {
        loading.value = false
      }
    }

    async function signIn(email: string, password: string) {
      loading.value = true
      error.value = null
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        user.value = data.user
        session.value = data.session
        await fetchUserProfile(); // Busca a role após o login bem-sucedido
        console.log('Login bem-sucedido:', data)
        return true
      } catch (err: unknown) {
        console.error('Erro no login:', err)
        if (err instanceof AuthApiError) {
          error.value = err.message
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha no login.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    async function signUp(email: string, password: string) {
      loading.value = true
      error.value = null
      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (authError) throw authError
        // Após o signup, o usuário pode não estar logado imediatamente ou a sessão pode não ter a role ainda.
        // A role será buscada no próximo initAuthListener ou signIn.
        console.log('Registro bem-sucedido. Verifique seu email para confirmar:', data)
        return true
      } catch (err: unknown) {
        console.error('Erro no registro:', err)
        if (err instanceof AuthApiError) {
          error.value = err.message
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha no registro.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    async function signOut() {
      loading.value = true
      error.value = null
      try {
        const { error: authError } = await supabase.auth.signOut()
        if (authError) throw authError
        user.value = null
        session.value = null
        userRole.value = null; // Limpa a role no logout
        console.log('Logout bem-sucedido.')
        return true
      } catch (err: unknown) {
        console.error('Erro no logout:', err)
        if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha no logout.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    async function resetPassword(email: string) {
      loading.value = true
      error.value = null
      try {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        })
        if (authError) throw authError
        console.log('Link de redefinição de senha enviado para o email.')
        return true
      } catch (err: unknown) {
        console.error('Erro ao resetar senha:', err)
        if (err instanceof AuthApiError) {
          error.value = err.message
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha ao solicitar redefinição de senha.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    async function updatePassword(newPassword: string) {
      loading.value = true
      error.value = null
      try {
        const { data, error: authError } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (authError) throw authError
        user.value = data.user
        // Não é necessário buscar a role aqui, pois a sessão não muda.
        console.log('Senha atualizada com sucesso.')
        return true
      } catch (err: unknown) {
        console.error('Erro ao atualizar senha:', err)
        if (err instanceof AuthApiError) {
          error.value = err.message
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha ao atualizar senha.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    return {
      user,
      session,
      loading,
      error,
      isLoggedIn,
      token,
      userRole, // NOVO: Retorna a role do usuário
      isAdmin, // NOVO: Retorna se o usuário é admin
      initAuthListener,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
    }
  },
  {
    persist: true,
  },
)