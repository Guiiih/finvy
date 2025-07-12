import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import { supabase } from '@/supabase';
import { api } from '@/services/api';
import { useJournalEntryStore } from './journalEntryStore';

// Mock Supabase
vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ publicUrl: 'mock-avatar-url' })),
      })),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

// Mock API client
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock JournalEntryStore
const mockUnsubscribeFromRealtime = vi.fn();
vi.mock('./journalEntryStore', () => ({
  useJournalEntryStore: vi.fn(() => ({
    unsubscribeFromRealtime: mockUnsubscribeFromRealtime,
  })),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Reset store state manually if needed, or re-create store
  });

  it('should initialize with default values', () => {
    const authStore = useAuthStore();
    expect(authStore.user).toBeNull();
    expect(authStore.session).toBeNull();
    expect(authStore.loading).toBe(false);
    expect(authStore.error).toBeNull();
    expect(authStore.isLoggedIn).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.isAdmin).toBe(false);
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const authStore = useAuthStore();
      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockSession = { access_token: 'mock-token' };
      const mockProfile = { username: 'testuser', role: 'user', avatar_url: 'avatar.jpg', organization_id: 'org-id', active_accounting_period_id: 'period-id' };

      (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      (api.get as vi.Mock).mockResolvedValueOnce(mockProfile);

      const result = await authStore.signIn('test@example.com', 'password123');

      expect(result).toBe(true);
      expect(authStore.user).toEqual(mockUser);
      expect(authStore.session).toEqual(mockSession);
      expect(authStore.isLoggedIn).toBe(true);
      expect(authStore.token).toBe('mock-token');
      expect(authStore.username).toBe('testuser');
      expect(authStore.userRole).toBe('user');
      expect(authStore.loading).toBe(false);
      expect(authStore.error).toBeNull();
      expect(api.get).toHaveBeenCalledWith('/profile');
    });

    it('should handle sign in failure', async () => {
      const authStore = useAuthStore();
      const mockError = { message: 'Invalid credentials' };

      (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await authStore.signIn('test@example.com', 'wrongpassword');

      expect(result).toBe(false);
      expect(authStore.user).toBeNull();
      expect(authStore.session).toBeNull();
      expect(authStore.isLoggedIn).toBe(false);
      expect(authStore.token).toBeNull();
      expect(authStore.loading).toBe(false);
      expect(authStore.error).toBe('Falha no login.'); // Adjusted assertion
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should sign out a user successfully', async () => {
      const authStore = useAuthStore();
      // Set initial state to logged in
      authStore.user = { id: 'user-id', email: 'test@example.com' } as any;
      authStore.session = { access_token: 'mock-token' } as any;
      authStore.username = 'testuser';
      authStore.userRole = 'user';

      (supabase.auth.signOut as vi.Mock).mockResolvedValueOnce({ error: null });

      const result = await authStore.signOut();

      expect(result).toBe(true);
      expect(authStore.user).toBeNull();
      expect(authStore.session).toBeNull();
      expect(authStore.isLoggedIn).toBe(false);
      expect(authStore.token).toBeNull();
      expect(authStore.username).toBeNull();
      expect(authStore.userRole).toBeNull();
      expect(authStore.loading).toBe(false);
      expect(authStore.error).toBeNull();
      expect(mockUnsubscribeFromRealtime).toHaveBeenCalled(); // Adjusted assertion
    });

    it('should handle sign out failure', async () => {
      const authStore = useAuthStore();
      // Set initial state to logged in
      authStore.user = { id: 'user-id', email: 'test@example.com' } as any;
      authStore.session = { access_token: 'mock-token' } as any;
      const mockError = { message: 'Logout failed' };

      (supabase.auth.signOut as vi.Mock).mockResolvedValueOnce({ error: mockError });

      const result = await authStore.signOut();

      expect(result).toBe(false);
      expect(authStore.user).not.toBeNull(); // Should not clear state on failure
      expect(authStore.session).not.toBeNull();
      expect(authStore.loading).toBe(false);
      expect(authStore.error).toBe('Falha no logout.'); // Adjusted assertion
    });
  });
});