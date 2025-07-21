import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTaxSettings } from '../services/taxSettingService';

// Mocking a Supabase client with chainable methods
const mockQueryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  single: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('Tax Setting Service', () => {
  const mockOrgId = 'org-123';
  const mockToken = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.eq.mockReturnThis();
    mockQueryBuilder.order.mockReturnThis();
    mockQueryBuilder.limit.mockReturnThis();
    mockQueryBuilder.single.mockReset();

    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  });

  it('should return the latest tax settings', async () => {
    const mockTaxSettings = {
      id: '1',
      organization_id: mockOrgId,
      effective_date: '2025-01-01',
      tax_rate: 0.15,
    };
    mockQueryBuilder.single.mockResolvedValue({ data: mockTaxSettings, error: null });

    const result = await getTaxSettings(mockOrgId, mockToken);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('tax_settings');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
    expect(mockQueryBuilder.order).toHaveBeenCalledWith('effective_date', { ascending: false });
    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockTaxSettings);
  });

  it('should return null if no tax settings are found (PGRST116 error)', async () => {
    const mockError = { code: 'PGRST116', message: 'No rows found' };
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: mockError });

    const result = await getTaxSettings(mockOrgId, mockToken);

    expect(result).toBeNull();
  });

  it('should throw an error if Supabase returns an unexpected error', async () => {
    const mockError = { code: 'OTHER_ERROR', message: 'Something went wrong' };
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: mockError });

    await expect(getTaxSettings(mockOrgId, mockToken)).rejects.toThrow('Something went wrong');
  });
});
