import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../handlers/accounts';
import { getUserOrganizationAndPeriod, handleErrorResponse } from '../utils/supabaseClient';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../services/accountService';
import * as schemas from '../utils/schemas'; // Import schemas as a whole

// Mocks
vi.mock('../utils/supabaseClient', () => ({
  getUserOrganizationAndPeriod: vi.fn(),
  handleErrorResponse: vi.fn(),
}));
vi.mock('../services/accountService', () => ({
  getAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));
vi.mock('../utils/schemas', () => ({
  createAccountSchema: {
    safeParse: vi.fn(),
  },
  updateAccountSchema: {
    safeParse: vi.fn(),
  },
  uuidSchema: {
    safeParse: vi.fn(),
  },
}));

describe('Accounts Handler', () => {
  const mockReq: any = {};
  const mockRes: any = {
    status: vi.fn(() => mockRes),
    json: vi.fn(() => mockRes),
    send: vi.fn(() => mockRes),
    setHeader: vi.fn(() => mockRes),
  };
  const mockUserId = 'test-user-id';
  const mockToken = 'test-token';
  const mockOrgId = 'org-123';
  const mockPeriodId = 'period-456';

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue({
      organization_id: mockOrgId,
      active_accounting_period_id: mockPeriodId,
    });
    (handleErrorResponse as vi.Mock).mockImplementation((res, status, message) => {
      return res.status(status).json({ error: message });
    });

    // Reset Zod mocks for each test
    (schemas.createAccountSchema.safeParse as vi.Mock).mockImplementation((data) => ({
      success: true,
      data: data,
    }));
    (schemas.updateAccountSchema.safeParse as vi.Mock).mockImplementation((data) => ({
      success: true,
      data: data,
    }));
    (schemas.uuidSchema.safeParse as vi.Mock).mockImplementation((id) => ({
      success: true,
      data: id,
    }));
  });

  // Test for GET /accounts
  it('should return accounts on GET request', async () => {
    mockReq.method = 'GET';
    mockReq.query = { page: '1', limit: '10' };
    const mockAccounts = [{ id: 'acc1', name: 'Cash' }];
    (getAccounts as vi.Mock).mockResolvedValue({ data: mockAccounts, count: 1 });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(getAccounts).toHaveBeenCalledWith(mockOrgId, mockPeriodId, mockToken, 1, 10);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockAccounts, count: 1 });
  });

  it('should handle missing organization or period on GET', async () => {
    mockReq.method = 'GET';
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValue(null);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 403, 'Organização ou período contábil não encontrado para o usuário.');
  });

  it('should handle error from getAccounts on GET', async () => {
    mockReq.method = 'GET';
    mockReq.query = { page: '1', limit: '10' };
    const mockError = new Error('DB Error');
    (getAccounts as vi.Mock).mockRejectedValue(mockError);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 500, expect.any(String));
  });

  // Test for POST /accounts
  it('should create an account on POST request', async () => {
    mockReq.method = 'POST';
    mockReq.body = { name: 'New Account', type: 'asset' };
    const createdAccount = { id: 'new-acc-id', ...mockReq.body };
    (createAccount as vi.Mock).mockResolvedValue(createdAccount);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(schemas.createAccountSchema.safeParse).toHaveBeenCalledWith(mockReq.body);
    expect(createAccount).toHaveBeenCalledWith(mockReq.body, mockOrgId, mockPeriodId, mockToken);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(createdAccount);
  });

  it('should handle invalid body on POST', async () => {
    mockReq.method = 'POST';
    mockReq.body = { name: '' }; // Invalid data
    (schemas.createAccountSchema.safeParse as vi.Mock).mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Name is required' }] },
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Name is required');
  });

  it('should handle missing account type on POST', async () => {
    mockReq.method = 'POST';
    mockReq.body = { name: 'New Account' }; // Missing type
    (schemas.createAccountSchema.safeParse as vi.Mock).mockReturnValue({
      success: true,
      data: { name: 'New Account' }, // No type in parsed data
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Tipo de conta inválido.');
  });

  it('should handle error from createAccount on POST', async () => {
    mockReq.method = 'POST';
    mockReq.body = { name: 'New Account', type: 'asset' };
    const mockError = new Error('DB Error');
    (createAccount as vi.Mock).mockRejectedValue(mockError);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 500, expect.any(String));
  });

  // Test for PUT /accounts/{id}
  it('should update an account on PUT request', async () => {
    mockReq.method = 'PUT';
    mockReq.url = '/accounts/some-account-id';
    mockReq.body = { name: 'Updated Name' };
    const updatedAccount = { id: 'some-account-id', ...mockReq.body };
    (updateAccount as vi.Mock).mockResolvedValue(updatedAccount);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(schemas.updateAccountSchema.safeParse).toHaveBeenCalledWith(mockReq.body);
    expect(updateAccount).toHaveBeenCalledWith('some-account-id', mockReq.body, mockOrgId, mockPeriodId, mockToken);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(updatedAccount);
  });

  it('should handle invalid body on PUT', async () => {
    mockReq.method = 'PUT';
    mockReq.url = '/accounts/some-account-id';
    mockReq.body = { name: '' }; // Invalid data
    (schemas.updateAccountSchema.safeParse as vi.Mock).mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Name cannot be empty' }] },
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Name cannot be empty');
  });

  it('should handle no update data on PUT', async () => {
    mockReq.method = 'PUT';
    mockReq.url = '/accounts/some-account-id';
    mockReq.body = {}; // No update data
    (schemas.updateAccountSchema.safeParse as vi.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Nenhum campo para atualizar fornecido.');
  });

  it('should handle account not found on PUT', async () => {
    mockReq.method = 'PUT';
    mockReq.url = '/accounts/non-existent-id';
    mockReq.body = { name: 'Updated Name' };
    (updateAccount as vi.Mock).mockResolvedValue(null);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 404, 'Conta não encontrada ou você não tem permissão para atualizar esta conta.');
  });

  it('should handle error from updateAccount on PUT', async () => {
    mockReq.method = 'PUT';
    mockReq.url = '/accounts/some-account-id';
    mockReq.body = { name: 'Updated Name' };
    const mockError = new Error('DB Error');
    (updateAccount as vi.Mock).mockRejectedValue(mockError);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 500, expect.any(String));
  });

  // Test for DELETE /accounts/{id}
  it('should delete an account on DELETE request', async () => {
    mockReq.method = 'DELETE';
    mockReq.url = '/accounts/some-account-id';
    (deleteAccount as vi.Mock).mockResolvedValue(true);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(schemas.uuidSchema.safeParse).toHaveBeenCalledWith('some-account-id');
    expect(deleteAccount).toHaveBeenCalledWith('some-account-id', mockOrgId, mockPeriodId, mockToken);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalledWith('');
  });

  it('should handle invalid ID on DELETE', async () => {
    mockReq.method = 'DELETE';
    mockReq.url = '/accounts/invalid-id';
    (schemas.uuidSchema.safeParse as vi.Mock).mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Invalid UUID' }] },
    });

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 400, 'Invalid UUID');
  });

  it('should handle account not found on DELETE', async () => {
    mockReq.method = 'DELETE';
    mockReq.url = '/accounts/non-existent-id';
    (deleteAccount as vi.Mock).mockResolvedValue(false);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 404, 'Conta não encontrada ou você não tem permissão para deletar esta conta.');
  });

  it('should handle error from deleteAccount on DELETE', async () => {
    mockReq.method = 'DELETE';
    mockReq.url = '/accounts/some-account-id';
    const mockError = new Error('DB Error');
    (deleteAccount as vi.Mock).mockRejectedValue(mockError);

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 500, expect.any(String));
  });

  // Test for unsupported HTTP method
  it('should return 405 for unsupported HTTP method', async () => {
    mockReq.method = 'PATCH';

    await handler(mockReq, mockRes, mockUserId, mockToken);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    expect(handleErrorResponse).toHaveBeenCalledWith(mockRes, 405, 'Method PATCH Not Allowed');
  });
});
