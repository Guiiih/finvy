import { describe, it, expect, vi, beforeEach } from 'vitest';
import yearEndClosingHandler from './year-end-closing';
import * as supabaseClient from '../utils/supabaseClient';
import * as schemas from '../utils/schemas';
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
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
  const mockLte = vi.fn();
  const mockSingle = vi.fn();

  return {
    ...actual,
    supabase: {
      from: mockFrom,
    },
    handleErrorResponse: vi.fn((res: MockResponse, status: number, message: string) => {
      res.status(status).json({ error: message });
    }),
    mockFrom, mockSelect, mockEq, mockLte, mockSingle
  };
});

vi.mock('../utils/schemas', () => ({
  yearEndClosingSchema: {
    safeParse: vi.fn((data: { closingDate: string }) => {
      if (data.closingDate && data.closingDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return { success: true, data };
      }
      return { success: false, error: { errors: [{ message: 'Invalid date' }] } };
    }),
  },
}));

describe('yearEndClosingHandler', () => {
  let req: MockRequest;
  let res: MockResponse;
  const user_id = 'test-user-id';

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
    supabaseClient.mockSelect.mockReturnValue({
      eq: supabaseClient.mockEq,
      lte: supabaseClient.mockLte,
    });
  });

  it('should return 405 for non-POST methods', async () => {
    req = { method: 'GET' };
    await yearEndClosingHandler(req, res, user_id);

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 405, 'Method GET Not Allowed');
  });

  it('should return 400 for invalid closingDate', async () => {
    req = { method: 'POST', body: { closingDate: 'invalid-date' } };
    await yearEndClosingHandler(req, res, user_id);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 400, 'Invalid date');
  });

  it('should process year-end closing successfully', async () => {
    req = { method: 'POST', body: { closingDate: '2024-12-31' } };
    const mockAccounts = [{ id: 'acc1', name: 'Cash', type: 'asset' }];
    const mockJournalEntries = [{ id: 'je1', entry_date: '2024-12-01', description: 'Test', entry_lines: [] }];

    supabaseClient.mockSelect.mockResolvedValueOnce({ data: mockAccounts, error: null });
    supabaseClient.mockLte.mockResolvedValueOnce({ data: mockJournalEntries, error: null });

    await yearEndClosingHandler(req, res, user_id);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Fechamento de exercício para 2024-12-31 realizado com sucesso.'),
    }));
  });

  it('should handle errors when fetching accounts', async () => {
    req = { method: 'POST', body: { closingDate: '2024-12-31' } };
    const dbError = new Error('Accounts fetch error');
    supabaseClient.mockSelect.mockResolvedValueOnce({ data: null, error: dbError });

    await yearEndClosingHandler(req, res, user_id);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Accounts fetch error');
  });

  it('should handle errors when fetching journal entries', async () => {
    req = { method: 'POST', body: { closingDate: '2024-12-31' } };
    const mockAccounts = [{ id: 'acc1', name: 'Cash', type: 'asset' }];
    const dbError = new Error('Journal entries fetch error');

    supabaseClient.mockSelect.mockResolvedValueOnce({ data: mockAccounts, error: null });
    supabaseClient.mockLte.mockResolvedValueOnce({ data: null, error: dbError });

    await yearEndClosingHandler(req, res, user_id);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Journal entries fetch error');
  });

  it('should handle unexpected errors', async () => {
    req = { method: 'POST', body: { closingDate: '2024-12-31' } };
    const unexpectedError = new Error('Something went wrong');
    vi.spyOn(schemas.yearEndClosingSchema, 'safeParse').mockImplementation(() => { throw unexpectedError; });

    await yearEndClosingHandler(req, res, user_id);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(res, 500, 'Something went wrong');
  });
});