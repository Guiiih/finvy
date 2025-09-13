export interface AccountsPayable {
  generatedAt?: string;
  summary: {
    totalToPay: number
    overdue: number
    overduePercentage: number
    suppliers: number
  }
  aging: {
    [key: string]: { value: number; percentage: number }
  }
  details: {
    supplier: string
    value: number
    dueDate: string
    status: string
  }[]
}

export interface AccountsReceivable {
  generatedAt?: string;
  summary: {
    totalToReceive: number
    overdue: number
    overduePercentage: number
    clients: number
  }
  aging: {
    [key: string]: { value: number; percentage: number }
  }
  details: {
    client: string
    value: number
    dueDate: string
    status: string
  }[]
}

export interface BalanceSheet {
  generatedAt?: string;
  summary: {
    totalAssets: number
    shareholdersEquity: number
    indicators: {
      currentLiquidity: number
      indebtedness: number
      roe: number
    }
    composition: {
      currentAssets: number
      nonCurrentAssets: number
      currentLiabilities: number
      nonCurrentLiabilities: number
      equity: number
    }
  }
  detailed: {
    assets: {
      current: { account: string; value: number }[]
      nonCurrent: { account: string; value: number }[]
    }
    liabilitiesAndEquity: {
      current: { account: string; value: number }[]
      nonCurrent: { account: string; value: number }[]
      equity: { account: string; value: number }[]
    }
  }
}

export interface CashFlow {
  generatedAt?: string;
  summary: {
    operational: number
    investment: number
    financing: number
    netCashFlow: number
  }
  details: {
    operational: { name: string; value: number }[]
    investment: { name: string; value: number }[]
    financing: { name: string; value: number }[]
  }
  evolution: {
    labels: string[]
    inflows: number[]
    outflows: number[]
    net: number[]
  }
}

export interface IncomeStatement {
  generatedAt?: string;
  summary: {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    margin: number
  }
  revenueDetails: { name: string; value: number; percentage: number }[]
  expenseDetails: { name: string; value: number; percentage: number }[]
}

export interface InventoryReport {
  generatedAt?: string;
  placeholder?: unknown
}

export interface TrialBalance {
  generatedAt?: string;
  summary: {
    totalDebits: number
    totalCredits: number
    difference: number
  }
  accounts: {
    code: string
    name: string
    type: string
    debit: number | null
    credit: number | null
    balance: number
  }[]
}

export interface ReportConfig {
  reportId: string;
  includeGraphics: boolean;
  includeComparisons: boolean;
  detailLevel: 'summary' | 'detailed' | 'full';
  format: 'pdf' | 'excel' | 'csv';
  orientation: 'portrait' | 'landscape';
  includeWatermark: boolean;
  customTitle: string;
  customFooter: string;
}

export interface ReportSchedule {
  reportId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  time: string;
  recipients: string[];
  includeAttachment: boolean;
  autoGenerate: boolean;
}

export interface CustomReport {
  name: string;
  description: string;
  accounts: string[];
  dateRange: 'custom' | string;
  startDate: Date;
  endDate: Date;
  groupBy: 'account' | 'category' | 'date' | 'month';
  includeSubaccounts: boolean;
  showZeroBalances: boolean;
}
