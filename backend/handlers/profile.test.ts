import { describe, it, expect, vi, beforeEach } from 'vitest';
import profileHandler from './profile';
import * as supabaseClient from '../utils/supabaseClient';
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  query?: Record<string, unknown>;
  body?: unknown;
}

interface MockResponse extends Partial<VercelResponse> {
  status: vi.Mock;
  json: vi.Mock;
  send?: vi.Mock;
  setHeader?: vi.Mock;
  end?: vi.Mock;
}

vi.mock('../utils/supabaseClient', async (importOriginal) => {
  const actual = await importOriginal<typeof supabaseClient>();

  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockAuthAdmin = {
    deleteUser: vi.fn(),
  };

  return {
    ...actual,
    getSupabaseClient: vi.fn(() => ({
      from: mockFrom,
    })),
    getSupabaseAdmin: vi.fn(() => ({
      auth: mockAuthAdmin,
    })),
    handleErrorResponse: vi.fn((res: MockResponse, status: number, message: string) => {
      res.status(status).json({ error: message });
    }),
    mockFrom, mockSelect, mockEq, mockSingle, mockAuthAdmin
  };
});

describe('profileHandler', () => {
  let req: MockRequest;
  let res: MockResponse;
  const user_id = 'test-user-id';
  const token = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    supabaseClient.mockFrom.mockReturnValue({
      select: supabaseClient.mockSelect,
    });
    supabaseClient.mockSelect.mockReturnValue({ eq: supabaseClient.mockEq });
    supabaseClient.mockEq.mockReturnValue({ single: supabaseClient.mockSingle });
  });

  it('should return user profile for GET requests', async () => {
    req = { method: 'GET' };
    const mockProfile = { username: 'testuser', role: 'user', avatar_url: 'http://example.com/avatar.png' };
    supabaseClient.mockSingle.mockResolvedValueOnce({ data: mockProfile, error: null });

    await profileHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockProfile);
    expect(supabaseClient.mockEq).toHaveBeenCalledWith('id', user_id);
  });

  it('should return 404 if profile not found for GET', async () => {
    req = { method: 'GET' };
    supabaseClient.mockSingle.mockResolvedValueOnce({ data: null, error: null });

    await profileHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 404, 'Perfil do usuário não encontrado.');
  });

  it('should handle database errors for GET requests', async () => {
    req = { method: 'GET' };
    const dbError = new Error('DB fetch error');
    supabaseClient.mockSingle.mockResolvedValueOnce({ data: null, error: dbError });

    await profileHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 500, 'DB fetch error');
  });

  it('should delete user for DELETE requests', async () => {
    req = { method: 'DELETE' };
    supabaseClient.mockAuthAdmin.deleteUser.mockResolvedValueOnce({ error: null });

    await profileHandler(req, res, user_id, token);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Usuário excluído com sucesso.' });
    expect(supabaseClient.mockAuthAdmin.deleteUser).toHaveBeenCalledWith(user_id);
  });

  it('should handle errors during user deletion', async () => {
    req = { method: 'DELETE' };
    const deleteError = new Error('Deletion failed');
    supabaseClient.mockAuthAdmin.deleteUser.mockResolvedValueOnce({ error: deleteError });

    await profileHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Deletion failed');
  });

  it('should return 405 for unsupported methods', async () => {
    req = { method: 'POST' };
    await profileHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'DELETE']);
    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 405, 'Method POST Not Allowed');
  });
});