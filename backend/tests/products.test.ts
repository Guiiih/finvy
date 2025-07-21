import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../handlers/products';
import { getSupabaseClient, handleErrorResponse, getUserOrganizationAndPeriod } from '../utils/supabaseClient';

// Mock dependencies
vi.mock('../utils/supabaseClient');
vi.mock('../utils/errorUtils');
vi.mock('../utils/schemas');

describe('Products API Handler', () => {
  let mockReq: any;
  let mockRes: any;
  const mockUserId = 'test-user-id';
  const mockToken = 'test-token';
  const mockOrgId = 'org-123';
  const mockPeriodId = 'period-456';

  beforeEach(() => {
    mockReq = { headers: {}, body: {}, method: '', url: '', query: {} };
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

  it('should delete a product on DELETE request', async () => {
    mockReq.method = 'DELETE';
    mockReq.url = '/products/prod-to-delete';

    const deleteMock = {
        delete: vi.fn().mockReturnThis(), // Return this for chaining
        eq: vi.fn()
            .mockReturnThis()
            .mockReturnThis()
            .mockResolvedValue({ count: 1, error: null }),
    };

    const fromMock = vi.fn().mockReturnValue(deleteMock);
    (getSupabaseClient as vi.Mock).mockReturnValue({ from: fromMock });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.end).toHaveBeenCalled();
  });
});