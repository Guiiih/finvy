import { vi } from 'vitest';

vi.mock('./backend/utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null })),
        insert: vi.fn(() => ({ data: [], error: null })),
        update: vi.fn(() => ({ data: [], error: null })),
        delete: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
  })),
  supabase: {},
  anonSupabase: {},
  handleErrorResponse: vi.fn((res, status, message) => res.status(status).json({ error: message })),
}));