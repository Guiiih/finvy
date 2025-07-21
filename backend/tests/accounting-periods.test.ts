import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../handlers/accounting-periods';
import { getSupabaseClient, handleErrorResponse, getUserOrganizationAndPeriod } from '../utils/supabaseClient';

// Mock dependencies
vi.mock('../utils/supabaseClient');
vi.mock('../utils/errorUtils');
vi.mock('../utils/schemas');

describe('Accounting Periods Handler', () => {
  let mockReq: any;
  let mockRes: any;
  const mockUserId = 'test-user-id';
  const mockToken = 'test-token';
  const mockOrgId = 'org-123';
  const mockPeriodId = 'period-456';

  beforeEach(() => {
    mockReq = { headers: {}, body: {}, method: '', url: '' };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };
    vi.clearAllMocks();

    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue({
      organization_id: mockOrgId,
      active_accounting_period_id: mockPeriodId,
    });
    (handleErrorResponse as vi.Mock).mockImplementation((res, status, message) => {
        res.status(status).json({ error: message });
    });
  });

  it('should delete an accounting period and its tax history on DELETE', async () => {
    mockReq.method = 'DELETE';
    mockReq.url = '/accounting-periods/period-to-delete';
    const mockPeriodToDelete = { start_date: '2025-01-01', end_date: '2025-12-31' };

    const selectPeriodMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPeriodToDelete, error: null }),
    };

    const deleteTaxHistoryMock = {
        delete: vi.fn().mockReturnThis(), // Return this for chaining
        eq: vi.fn().mockReturnThis().mockReturnThis().mockResolvedValue({ count: 1, error: null }),
    };

    const deletePeriodMock = {
        delete: vi.fn().mockReturnThis(), // Return this for chaining
        eq: vi.fn().mockReturnThis().mockResolvedValue({ count: 1, error: null }),
    };

    const fromMock = vi.fn()
      .mockImplementationOnce(() => selectPeriodMock)      // First call for select
      .mockImplementationOnce(() => deleteTaxHistoryMock) // Second call for tax history delete
      .mockImplementationOnce(() => deletePeriodMock);     // Third call for period delete

    (getSupabaseClient as vi.Mock).mockReturnValue({ from: fromMock });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(mockRes.status).toHaveBeenCalledWith(204);
  });
});
