import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateTrialBalance,
  calculateLedgerDetails,
  calculateDreData,
  calculateBalanceSheetData,
  calculateDfcData,
  generateReports,
} from '../services/reportService';
import { getSupabaseClient, getUserOrganizationAndPeriod } from '../utils/supabaseClient';
import { getAccounts } from './accountService';
import logger from '../utils/logger';

// Mocks
vi.mock('../utils/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
  getUserOrganizationAndPeriod: vi.fn(),
}));
vi.mock('./accountService', () => ({
  getAccounts: vi.fn(),
}));
vi.mock('../utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ReportService', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => {
      const chainable = {
        select: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        gte: vi.fn(() => chainable),
        lte: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        then: vi.fn((resolve) => resolve({ data: [], error: null })), // Default resolver
      };

      chainable.select.mockImplementation(() => chainable);
      chainable.eq.mockImplementation(() => chainable);
      chainable.gte.mockImplementation(() => chainable);
      chainable.lte.mockImplementation(() => chainable);
      chainable.order.mockImplementation(() => chainable);

      return chainable;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabaseClient as vi.Mock).mockReturnValue(mockSupabaseClient);
  });

  // Mock Data
  const mockAccounts = [
    { id: 'acc1', name: 'Cash', type: 'asset' },
    { id: 'acc2', name: 'Bank Account', type: 'asset' },
    { id: 'acc3', name: 'Accounts Receivable', type: 'asset' },
    { id: 'acc4', name: 'Equipment', type: 'asset' },
    { id: 'acc5', name: 'Accounts Payable', type: 'liability' },
    { id: 'acc6', name: 'Loans', type: 'liability' },
    { id: 'acc7', name: 'Equity', type: 'equity' },
    { id: 'acc8', name: 'Sales Revenue', type: 'revenue' },    { id: 'acc9', name: 'Rent Expense', type: 'expense' },
    { id: 'acc10', name: 'Salaries Expense', type: 'expense' },
  ];

  const mockJournalEntries = [
    {
      id: 'je1',
      entry_date: '2025-01-01',
      description: 'Initial Investment',
      lines: [
        { account_id: 'acc1', debit: 10000, credit: 0 },
        { account_id: 'acc7', debit: 0, credit: 10000 },
      ],
    },
    {
      id: 'je2',
      entry_date: '2025-01-05',
      description: 'Sales',
      lines: [
        { account_id: 'acc1', debit: 5000, credit: 0 },
        { account_id: 'acc8', debit: 0, credit: 5000 },
      ],
    },
    {
      id: 'je3',
      entry_date: '2025-01-10',
      description: 'Pay Rent',
      lines: [
        { account_id: 'acc9', debit: 800, credit: 0 },
        { account_id: 'acc1', debit: 0, credit: 800 },
      ],
    },
    {
      id: 'je4',
      entry_date: '2025-01-15',
      description: 'Purchase Equipment',
      lines: [
        { account_id: 'acc4', debit: 2000, credit: 0 },
        { account_id: 'acc1', debit: 0, credit: 2000 },
      ],
    },
    {
      id: 'je5',
      entry_date: '2025-01-20',
      description: 'Receive Loan',
      lines: [
        { account_id: 'acc1', debit: 3000, credit: 0 },
        { account_id: 'acc6', debit: 0, credit: 3000 },
      ],
    },
  ];

  // This is the raw data format expected by getJournalEntries before transformation
  const mockRawJournalEntries = mockJournalEntries.map(entry => ({
    ...entry,
    entry_lines: entry.lines.map(line => ({
      account_id: line.account_id,
      debit: line.debit === 0 ? null : line.debit,
      credit: line.credit === 0 ? null : line.credit,
      product_id: null, quantity: null, unit_cost: null, total_gross: null,
      icms_value: null, ipi_value: null, pis_value: null, cofins_value: null,
      mva_rate: null, icms_st_value: null, total_net: null, transaction_type: null,
    })),
  }));

  // Testes para calculateTrialBalance
  it('should calculate trial balance correctly', () => {
    const trialBalance = calculateTrialBalance(mockAccounts, mockJournalEntries);

    const cashAccount = trialBalance.find((acc) => acc.accountName === 'Cash');
    expect(cashAccount?.finalBalance).toBeCloseTo(10000 + 5000 - 800 - 2000 + 3000); // 15200

    const salesRevenue = trialBalance.find((acc) => acc.accountName === 'Sales Revenue');
    expect(salesRevenue?.finalBalance).toBeCloseTo(5000);

    const rentExpense = trialBalance.find((acc) => acc.accountName === 'Rent Expense');
    expect(rentExpense?.finalBalance).toBeCloseTo(800);

    const equity = trialBalance.find((acc) => acc.accountName === 'Equity');
    expect(equity?.finalBalance).toBeCloseTo(10000);

    const equipment = trialBalance.find((acc) => acc.accountName === 'Equipment');
    expect(equipment?.finalBalance).toBeCloseTo(2000);

    const loans = trialBalance.find((acc) => acc.accountName === 'Loans');
    expect(loans?.finalBalance).toBeCloseTo(3000);
  });

  // Testes para calculateLedgerDetails
  it('should calculate ledger details correctly', () => {
    const ledgerDetails = calculateLedgerDetails(mockAccounts, mockJournalEntries);

    expect(ledgerDetails['acc1']).toHaveLength(5); // Cash account
    expect(ledgerDetails['acc1'][0].description).toBe('Initial Investment');
    expect(ledgerDetails['acc1'][0].debit).toBe(10000);

    expect(ledgerDetails['acc8']).toHaveLength(1); // Sales Revenue
    expect(ledgerDetails['acc8'][0].description).toBe('Sales');
    expect(ledgerDetails['acc8'][0].credit).toBe(5000);
  });

  // Testes para calculateDreData
  it('should calculate DRE data correctly', () => {
    const dreData = calculateDreData(mockAccounts, mockJournalEntries);

    // Sales Revenue: 5000
    // Rent Expense: 800
    // Net Income: 5000 - 800 = 4200
    expect(dreData.totalRevenue).toBeCloseTo(5000);
    expect(dreData.totalExpenses).toBeCloseTo(800);
    expect(dreData.netIncome).toBeCloseTo(4200);
  });

  // Testes para calculateBalanceSheetData
  it('should calculate Balance Sheet data correctly', () => {
    const bsData = calculateBalanceSheetData(mockAccounts, mockJournalEntries);

    // Assets: Cash (15200) + Accounts Receivable (0) + Equipment (2000) = 17200
    // Liabilities: Accounts Payable (0) + Loans (3000) = 3000
    // Equity: Equity (10000) + Net Income (4200 from DRE) = 14200
    // Total Liabilities + Equity = 3000 + 14200 = 17200

    expect(bsData.totalAssets).toBeCloseTo(17200);
    expect(bsData.totalLiabilities).toBeCloseTo(3000);
    expect(bsData.totalEquity).toBeCloseTo(14200); // Equity from initial investment + Net Income
    expect(bsData.isBalanced).toBe(true);
  });

  // Testes para calculateDfcData
  it('should calculate DFC data correctly', () => {
    const dfcData = calculateDfcData(mockAccounts, mockJournalEntries);

    // Operating Activities: Sales (5000 inflow) - Rent (800 outflow) = 4200
    // Investing Activities: Equipment (2000 outflow) = -2000
    // Financing Activities: Loan (3000 inflow) + Equity (10000 inflow) = 13000
    // Net Cash Flow: 4200 - 2000 + 13000 = 15200

    expect(dfcData.operatingActivities).toBeCloseTo(4200);
    expect(dfcData.investingActivities).toBeCloseTo(-2000);
    expect(dfcData.financingActivities).toBeCloseTo(13000);
    expect(dfcData.netCashFlow).toBeCloseTo(15200);
  });

  // Testes para generateReports
  it('should generate all reports correctly', async () => {
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({
      organization_id: 'org1',
      active_accounting_period_id: 'period1',
    });
    (getAccounts as vi.Mock).mockResolvedValueOnce({ data: mockAccounts });

    // Mock for getJournalEntries internal call
    mockSupabaseClient.from.mockImplementation((tableName) => {
      const chainable = {
        select: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        gte: vi.fn(() => chainable),
        lte: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        then: vi.fn(),
      };

      chainable.select.mockImplementation(() => chainable);
      chainable.eq.mockImplementation(() => chainable);
      chainable.gte.mockImplementation(() => chainable);
      chainable.lte.mockImplementation(() => chainable);
      chainable.order.mockImplementation(() => chainable);

      if (tableName === 'journal_entries') {
        chainable.then.mockImplementationOnce((resolve) => resolve({ data: mockRawJournalEntries, error: null }));
      } else if (tableName === 'products') {
        chainable.then.mockImplementationOnce((resolve) => resolve({ data: [
          { id: 'p1', name: 'Product A', current_stock: 100 },
        ], error: null }));
      } else {
        chainable.then.mockImplementationOnce((resolve) => resolve({ data: [], error: null }));
      }
      return chainable;
    });

    const reports = await generateReports('user1', 'token1');

    expect(getUserOrganizationAndPeriod).toHaveBeenCalledWith('user1', 'token1');
    expect(getAccounts).toHaveBeenCalledWith('org1', 'period1', 'token1');
    expect(reports.trialBalanceData).toBeDefined();
    expect(reports.dreData).toBeDefined();
    expect(reports.balanceSheetData).toBeDefined();
    expect(reports.dfcData).toBeDefined();
    expect(reports.ledgerDetails).toBeDefined();
    expect(reports.stockBalances).toBeDefined();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error if organization and period are not found', async () => {
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce(null);

    await expect(generateReports('user1', 'token1')).rejects.toThrow(
      'Organization and period not found for the user.'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should throw an error if accounts are not found', async () => {
    (getUserOrganizationAndPeriod as vi.Mock).mockResolvedValueOnce({
      organization_id: 'org1',
      active_accounting_period_id: 'period1',
    });
    (getAccounts as vi.Mock).mockResolvedValueOnce(null); // Return null directly

    // Mock internal Supabase calls to return empty data to allow the error to be thrown by generateReports
    mockSupabaseClient.from.mockImplementation(() => {
      const chainable = {
        select: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        gte: vi.fn(() => chainable),
        lte: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        then: vi.fn((resolve) => resolve({ data: [], error: null })), // Always return empty data
      };

      chainable.select.mockImplementation(() => chainable);
      chainable.eq.mockImplementation(() => chainable);
      chainable.gte.mockImplementation(() => chainable);
      chainable.lte.mockImplementation(() => chainable);
      chainable.order.mockImplementation(() => chainable);

      return chainable;
    });

    await expect(generateReports('user1', 'token1')).rejects.toThrow(
      'No accounts found for the given organization and period.'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});