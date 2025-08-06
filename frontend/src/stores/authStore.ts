import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { AuthApiError } from '@supabase/supabase-js'
import { api } from '@/services/api'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const userRole = ref<string | null>(null)
    const username = ref<string | null>(null)
    const avatarUrl = ref<string | null>(null)
    const handle = ref<string | null>(null)
    const userOrganizationId = ref<string | null>(null)
    const userActiveAccountingPeriodId = ref<string | null>(null)
    const profileLoaded = ref(false)

    const isLoggedIn = computed(() => !!user.value)
    const token = computed(() => session.value?.access_token || null)
    const isAdmin = computed(() => userRole.value === 'admin')

    async function fetchUserProfile() {
      if (!user.value) {
        userRole.value = null
        username.value = null
        avatarUrl.value = null
        handle.value = null
        userOrganizationId.value = null
        userActiveAccountingPeriodId.value = null
        profileLoaded.value = false
        return
      }
      try {
        const response = await api.get<{
          username: string
          role: string
          avatar_url: string
          organization_id: string
          active_accounting_period_id: string
          handle: string
        }>('/profile')
        userRole.value = response.role
        username.value = response.username
        avatarUrl.value = response.avatar_url
        handle.value = response.handle
        userOrganizationId.value = response.organization_id
        userActiveAccountingPeriodId.value = response.active_accounting_period_id
        profileLoaded.value = true
        console.log('fetchUserProfile: avatarUrl', avatarUrl.value)
      } catch (err: unknown) {
        console.error('Erro ao buscar perfil do usuário:', err)
        userRole.value = null
        username.value = null
        avatarUrl.value = null
        handle.value = null
        userOrganizationId.value = null
        userActiveAccountingPeriodId.value = null
        profileLoaded.value = false
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
          await fetchUserProfile()
        }

        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          session.value = newSession
          user.value = newSession?.user || null
          if (user.value) {
            await fetchUserProfile()
          } else {
            userRole.value = null
            username.value = null
            avatarUrl.value = null
            userOrganizationId.value = null
            userActiveAccountingPeriodId.value = null
            profileLoaded.value = false
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
        await fetchUserProfile()
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

    async function signUp(email: string, password: string, firstName: string) {
      loading.value = true
      error.value = null
      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
            },
          },
        })
        if (authError) throw authError
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
        userRole.value = null
        username.value = null
        avatarUrl.value = null
        userOrganizationId.value = null
        userActiveAccountingPeriodId.value = null
        profileLoaded.value = false

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

    async function updateUserProfile(fullName: string, handleValue: string) {
      loading.value = true
      error.value = null
      try {
        const payload: { username?: string; handle?: string } = {}
        if (fullName !== username.value) {
          payload.username = fullName
        }
        if (handleValue !== handle.value) {
          payload.handle = handleValue
        }

        if (Object.keys(payload).length === 0) {
          console.log('Nenhuma alteração no perfil para salvar.')
          loading.value = false
          return true
        }

        const response = await api.put('/profile', payload)

        // Atualiza o nome de usuário e handle localmente
        if (payload.username) {
          username.value = payload.username
        }
        if (payload.handle) {
          handle.value = payload.handle
        }

        console.log('Perfil atualizado com sucesso.', response)
        return true
      } catch (err: unknown) {
        console.error('Erro ao atualizar perfil:', err)
        if (err instanceof AuthApiError) {
          error.value = err.message
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha ao atualizar perfil.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    async function uploadAvatar(file: Blob) {
      loading.value = true
      error.value = null
      if (!user.value) {
        error.value = 'Usuário não autenticado.'
        loading.value = false
        return false
      }

      const fileExt = 'png' // Forçamos PNG para a imagem cortada
      const fileName = `${user.value.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: 'image/png' })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

        if (!publicUrlData) throw new Error('Não foi possível obter a URL pública do avatar.')

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq('id', user.value.id)

        if (updateError) throw updateError

        // Atualiza o user_metadata para que o avatar_url seja acessível via user.user_metadata
        const { data: updatedUser, error: updateUserError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrlData.publicUrl },
        })

        if (updateUserError) throw updateUserError

        user.value = updatedUser.user

        console.log('Avatar atualizado com sucesso.')
        return true
      } catch (err: unknown) {
        console.error('Erro ao fazer upload do avatar:', err)
        if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha ao fazer upload do avatar.'
        }
        return false
      } finally {
        loading.value = false
      }
    }

    async function deleteUserAccount() {
      loading.value = true
      error.value = null
      try {
        // A lógica de exclusão real será no backend
        // Aqui, apenas chamamos o endpoint da API
        await api.delete('/profile')
        // Força o logout no cliente para limpar o token localmente
        await supabase.auth.signOut()
        user.value = null
        session.value = null
        userRole.value = null
        username.value = null
        avatarUrl.value = null
        userOrganizationId.value = null
        userActiveAccountingPeriodId.value = null
        console.log('Conta de usuário excluída com sucesso.')
        return true
      } catch (err: unknown) {
        console.error('Erro ao excluir conta:', err)
        if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Falha ao excluir conta.'
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
      userRole,
      isAdmin,
      username,
      avatarUrl,
      handle,
      userOrganizationId,
      userActiveAccountingPeriodId,
      profileLoaded,
      initAuthListener,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      updateUserProfile,
      deleteUserAccount,
      uploadAvatar,
    }
  },
  {
    persist: true,
  },
)
