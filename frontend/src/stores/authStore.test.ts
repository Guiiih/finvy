import { type Mock, vi, describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './authStore'
import { supabase } from '@/supabase'
import { api } from '@/services/api'
import { AuthApiError, type User, type Session } from '@supabase/supabase-js'

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      update: vi.fn(),
      eq: vi.fn(() => ({ single: vi.fn() })),
    })),
  },
}))

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize auth listener and set user/session', async () => {
    const store = useAuthStore()
    const mockSession = { access_token: 'token', user: { id: 'user-id', email: 'test@example.com' } }
    const mockProfile = { username: 'testuser', role: 'user', avatar_url: 'avatar.png' }

    ;(supabase.auth.getSession as Mock).mockResolvedValueOnce({ data: { session: mockSession }, error: null })
    ;(api.get as Mock).mockResolvedValueOnce(mockProfile)

    await store.initAuthListener()

    expect(store.user).toEqual(mockSession.user)
    expect(store.session).toEqual(mockSession)
    expect(store.isLoggedIn).toBe(true)
    expect(store.userRole).toBe(mockProfile.role)
    expect(store.username).toBe(mockProfile.username)
    expect(store.avatarUrl).toBe(mockProfile.avatar_url)
    expect(store.loading).toBe(false)
  })

  it('should handle auth listener initialization error', async () => {
    const store = useAuthStore()
    const authError = new Error('Auth init error')
    ;(supabase.auth.getSession as Mock).mockResolvedValueOnce({ data: { session: null }, error: authError })

    await store.initAuthListener()

    expect(store.user).toBeNull()
    expect(store.session).toBeNull()
    expect(store.isLoggedIn).toBe(false)
    expect(store.error).toBe('Auth init error')
    expect(store.loading).toBe(false)
  })

  it('should sign in a user successfully', async () => {
    const store = useAuthStore()
    const mockSession = { access_token: 'token', user: { id: 'user-id', email: 'test@example.com' } }
    const mockProfile = { username: 'testuser', role: 'user', avatar_url: 'avatar.png' }

    ;(supabase.auth.signInWithPassword as Mock).mockResolvedValueOnce({ data: mockSession, error: null })
    ;(api.get as Mock).mockResolvedValueOnce(mockProfile)

    const result = await store.signIn('test@example.com', 'password')

    expect(result).toBe(true)
    expect(store.user).toEqual(mockSession.user)
    expect(store.session).toEqual(mockSession)
    expect(store.isLoggedIn).toBe(true)
    expect(store.userRole).toBe(mockProfile.role)
    expect(store.username).toBe(mockProfile.username)
    expect(store.avatarUrl).toBe(mockProfile.avatar_url)
    expect(store.loading).toBe(false)
  })

  it('should handle sign in error', async () => {
    const store = useAuthStore()
    const authError = new AuthApiError('Invalid credentials', 400, 'AUTH_ERROR')
    ;(supabase.auth.signInWithPassword as Mock).mockResolvedValueOnce({ data: { user: null, session: null }, error: authError })

    const result = await store.signIn('test@example.com', 'wrongpass')

    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(store.session).toBeNull()
    expect(store.error).toBe('Invalid credentials')
    expect(store.loading).toBe(false)
  })

  it('should sign up a user successfully', async () => {
    const store = useAuthStore()
    const mockUser = { id: 'new-user-id', email: 'new@example.com' }
    ;(supabase.auth.signUp as Mock).mockResolvedValueOnce({ data: { user: mockUser, session: null }, error: null })

    const result = await store.signUp('new@example.com', 'newpass', 'New User')

    expect(result).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('should handle sign up error', async () => {
    const store = useAuthStore()
    const authError = new AuthApiError('User already exists', 409, 'AUTH_ERROR')
    ;(supabase.auth.signUp as Mock).mockResolvedValueOnce({ data: { user: null, session: null }, error: authError })

    const result = await store.signUp('existing@example.com', 'pass', 'Existing User')

    expect(result).toBe(false)
    expect(store.error).toBe('User already exists')
    expect(store.loading).toBe(false)
  })

  it('should sign out a user successfully', async () => {
    const store = useAuthStore()
    store.user = { id: 'user-id', email: 'test@example.com' } as User
    store.session = { access_token: 'token' } as Session
    store.userRole = 'user'
    store.username = 'testuser'

    ;(supabase.auth.signOut as Mock).mockResolvedValueOnce({ error: null })

    const result = await store.signOut()

    expect(result).toBe(true)
    expect(store.user).toBeNull()
    expect(store.session).toBeNull()
    expect(store.userRole).toBeNull()
    expect(store.username).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('should handle sign out error', async () => {
    const store = useAuthStore()
    const authError = new Error('Sign out error')
    ;(supabase.auth.signOut as Mock).mockResolvedValueOnce({ error: authError })

    const result = await store.signOut()

    expect(result).toBe(false)
    expect(store.error).toBe('Sign out error')
    expect(store.loading).toBe(false)
  })

  it('should reset password successfully', async () => {
    const store = useAuthStore()
    ;(supabase.auth.resetPasswordForEmail as Mock).mockResolvedValueOnce({ error: null })

    const result = await store.resetPassword('test@example.com')

    expect(result).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('should handle reset password error', async () => {
    const store = useAuthStore()
    const authError = new Error('Reset error')
    ;(supabase.auth.resetPasswordForEmail as Mock).mockResolvedValueOnce({ error: authError })

    const result = await store.resetPassword('test@example.com')

    expect(result).toBe(false)
    expect(store.error).toBe('Reset error')
    expect(store.loading).toBe(false)
  })

  it('should update password successfully', async () => {
    const store = useAuthStore()
    const mockUser = { id: 'user-id', email: 'test@example.com' }
    ;(supabase.auth.updateUser as Mock).mockResolvedValueOnce({ data: { user: mockUser }, error: null })

    const result = await store.updatePassword('new-password')

    expect(result).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.loading).toBe(false)
  })

  it('should handle update password error', async () => {
    const store = useAuthStore()
    const authError = new Error('Update error')
    ;(supabase.auth.updateUser as Mock).mockResolvedValueOnce({ data: { user: null }, error: authError })

    const result = await store.updatePassword('new-password')

    expect(result).toBe(false)
    expect(store.error).toBe('Update error')
    expect(store.loading).toBe(false)
  })

  it('should update user profile successfully', async () => {
    const store = useAuthStore()
    store.user = { id: 'user-id', email: 'test@example.com' } as User
    store.username = 'Old Name'
    const mockUser = { id: 'user-id', email: 'test@example.com', user_metadata: { first_name: 'New Name' } }
    ;(supabase.auth.updateUser as Mock).mockResolvedValueOnce({ data: { user: mockUser }, error: null })

    const result = await store.updateUserProfile('New Name')

    expect(result).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.username).toBe('New Name')
    expect(store.loading).toBe(false)
  })

  it('should handle update user profile error', async () => {
    const store = useAuthStore()
    const authError = new Error('Profile update error')
    ;(supabase.auth.updateUser as Mock).mockResolvedValueOnce({ data: { user: null }, error: authError })

    const result = await store.updateUserProfile('New Name')

    expect(result).toBe(false)
    expect(store.error).toBe('Profile update error')
    expect(store.loading).toBe(false)
  })

  it('should upload avatar successfully', async () => {
    const store = useAuthStore()
    store.user = { id: 'user-id' } as User
    const mockFile = new Blob([''], { type: 'image/png' })
    const mockPublicUrl = { publicUrl: 'http://example.com/avatar.png' }

    ;(supabase.storage.from as Mock).mockReturnValue({
      upload: vi.fn().mockResolvedValueOnce({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue(mockPublicUrl),
    })
    ;(supabase.from as Mock).mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      })),
    })
    ;(supabase.auth.updateUser as Mock).mockResolvedValueOnce({ data: { user: store.user }, error: null })

    const result = await store.uploadAvatar(mockFile)

    expect(result).toBe(true)
    expect(store.avatarUrl).toBe(mockPublicUrl.publicUrl)
    expect(store.loading).toBe(false)
  })

  it('should handle upload avatar error', async () => {
    const store = useAuthStore()
    store.user = { id: 'user-id' } as User
    const mockFile = new Blob([''], { type: 'image/png' })
    const uploadError = new Error('Upload failed')

    ;(supabase.storage.from as Mock).mockReturnValue({
      upload: vi.fn().mockResolvedValueOnce({ error: uploadError }),
    })

    const result = await store.uploadAvatar(mockFile)

    expect(result).toBe(false)
    expect(store.error).toBe('Upload failed')
    expect(store.loading).toBe(false)
  })

  it('should delete user account successfully', async () => {
    const store = useAuthStore()
    store.user = { id: 'user-id' } as User
    store.session = { access_token: 'token' } as Session
    store.userRole = 'user'
    store.username = 'testuser'

    ;(api.delete as Mock).mockResolvedValueOnce(null)
    ;(supabase.auth.signOut as Mock).mockResolvedValueOnce({ error: null })

    const result = await store.deleteUserAccount()

    expect(result).toBe(true)
    expect(store.user).toBeNull()
    expect(store.session).toBeNull()
    expect(store.userRole).toBeNull()
    expect(store.username).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('should handle delete user account error', async () => {
    const store = useAuthStore()
    const deleteError = new Error('Delete failed')
    ;(api.delete as Mock).mockRejectedValueOnce(deleteError)

    const result = await store.deleteUserAccount()

    expect(result).toBe(false)
    expect(store.error).toBe('Delete failed')
    expect(store.loading).toBe(false)
  })
})