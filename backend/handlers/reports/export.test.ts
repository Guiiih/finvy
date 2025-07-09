import { describe, it, expect, vi, beforeEach } from "vitest";
import exportReportsHandler from "./export";
import * as supabaseClient from "../../utils/supabaseClient";
import * as reportService from "../../services/reportService";
import * as schemas from "../../utils/schemas";
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  body?: Record<string, unknown>;
}

interface MockResponse extends Partial<VercelResponse> {
  status: vi.Mock;
  json: vi.Mock;
  send: vi.Mock;
  setHeader: vi.Mock;
  end?: vi.Mock;
}

vi.mock("../../utils/supabaseClient", async (importOriginal) => {
  const actual = await importOriginal<typeof supabaseClient>();
  return {
    ...actual,
    handleErrorResponse: vi.fn(
      (res: MockResponse, status: number, message: string) => {
        res.status(status).json({ error: message });
      },
    ),
  };
});

vi.mock("../../services/reportService", () => ({
  generateReports: vi.fn(),
  calculateTrialBalance: vi.fn(),
  calculateDreData: vi.fn(),
  calculateBalanceSheetData: vi.fn(),
  calculateLedgerDetails: vi.fn(),
}));

vi.mock("../../utils/schemas", () => ({
  exportReportSchema: {
    safeParse: vi.fn((data: { reportType: string; format: string }) => {
      if (data.reportType && data.format) {
        return { success: true, data };
      }
      return {
        success: false,
        error: { errors: [{ message: "Invalid data" }] },
      };
    }),
  },
}));

vi.mock("exceljs", () => ({
  default: class {
    Workbook = class {
      addWorksheet = vi.fn(() => ({}));
      xlsx = {
        writeBuffer: vi.fn(() => Promise.resolve(Buffer.from("mock xlsx"))),
      };
    };
  },
}));

vi.mock("pdfkit", () => ({
  default: class {
    on = vi.fn((event, callback) => {
      if (event === "end") callback();
    });
    fontSize = vi.fn().mockReturnThis();
    text = vi.fn().mockReturnThis();
    moveDown = vi.fn().mockReturnThis();
    font = vi.fn().mockReturnThis();
    end = vi.fn();
  },
}));

describe("exportReportsHandler", () => {
  let req: MockRequest;
  let res: MockResponse;
  const user_id = "test-user-id";
  const token = "test-token";

  beforeEach(() => {
    vi.clearAllMocks();
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn(),
    };
  });

  it("should return 405 for non-POST methods", async () => {
    req = { method: "GET" };
    await exportReportsHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["POST"]);
    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      405,
      "Method GET Not Allowed",
    );
  });

  it("should return 400 for invalid request body", async () => {
    req = { method: "POST", body: { reportType: "invalid" } };
    vi.mocked(schemas.exportReportSchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { errors: [{ message: "Invalid data" }] },
    });

    await exportReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Invalid data",
    );
  });

  it("should export trial balance as XLSX", async () => {
    req = {
      method: "POST",
      body: {
        reportType: "trialBalance",
        format: "xlsx",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
    };
    const mockAccounts = [{ id: "acc1" }];
    const mockJournalEntries = [{ id: "je1" }];
    const mockTrialBalance = [{ account_id: "acc1", accountName: "Cash" }];

    vi.mocked(reportService.generateReports).mockResolvedValueOnce({
      accounts: mockAccounts,
      journalEntries: mockJournalEntries,
    });
    vi.mocked(reportService.calculateTrialBalance).mockReturnValueOnce(
      mockTrialBalance,
    );

    await exportReportsHandler(req, res, user_id, token);

    expect(reportService.generateReports).toHaveBeenCalledWith(
      user_id,
      token,
      "2024-01-01",
      "2024-12-31",
    );
    expect(reportService.calculateTrialBalance).toHaveBeenCalledWith(
      mockAccounts,
      mockJournalEntries,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="balancete_de_verificacao.xlsx"',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("should export DRE as CSV", async () => {
    req = {
      method: "POST",
      body: {
        reportType: "dre",
        format: "csv",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
    };
    const mockAccounts = [{ id: "acc1" }];
    const mockJournalEntries = [{ id: "je1" }];
    const mockDreData = {
      totalRevenue: 1000,
      totalExpenses: 500,
      netIncome: 500,
    };

    vi.mocked(reportService.generateReports).mockResolvedValueOnce({
      accounts: mockAccounts,
      journalEntries: mockJournalEntries,
    });
    vi.mocked(reportService.calculateDreData).mockReturnValueOnce(mockDreData);

    await exportReportsHandler(req, res, user_id, token);

    expect(reportService.generateReports).toHaveBeenCalledWith(
      user_id,
      token,
      "2024-01-01",
      "2024-12-31",
    );
    expect(reportService.calculateDreData).toHaveBeenCalledWith(
      mockAccounts,
      mockJournalEntries,
    );
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="demonstrativo_de_resultado.csv"',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(String));
  });

  it("should export Balance Sheet as PDF", async () => {
    req = {
      method: "POST",
      body: {
        reportType: "balanceSheet",
        format: "pdf",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      },
    };
    const mockAccounts = [{ id: "acc1" }];
    const mockJournalEntries = [{ id: "je1" }];
    const mockBalanceSheetData = {
      totalAssets: 1000,
      totalLiabilities: 500,
      totalEquity: 500,
      isBalanced: true,
    };

    vi.mocked(reportService.generateReports).mockResolvedValueOnce({
      accounts: mockAccounts,
      journalEntries: mockJournalEntries,
    });
    vi.mocked(reportService.calculateBalanceSheetData).mockReturnValueOnce(
      mockBalanceSheetData,
    );

    await exportReportsHandler(req, res, user_id, token);

    expect(reportService.generateReports).toHaveBeenCalledWith(
      user_id,
      token,
      "2024-01-01",
      "2024-12-31",
    );
    expect(reportService.calculateBalanceSheetData).toHaveBeenCalledWith(
      mockAccounts,
      mockJournalEntries,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="balanco_patrimonial.pdf"',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("should handle invalid report type", async () => {
    req = {
      method: "POST",
      body: { reportType: "invalidType", format: "xlsx" },
    };
    vi.mocked(schemas.exportReportSchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { errors: [{ message: "Tipo de relatório inválido." }] },
    });

    await exportReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Tipo de relatório inválido.",
    );
  });

  it("should handle invalid format", async () => {
    req = {
      method: "POST",
      body: { reportType: "trialBalance", format: "invalidFormat" },
    };
    vi.mocked(schemas.exportReportSchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { errors: [{ message: "Formato de exportação inválido." }] },
    });

    await exportReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Formato de exportação inválido.",
    );
  });

  it("should handle errors during report generation", async () => {
    req = {
      method: "POST",
      body: { reportType: "trialBalance", format: "xlsx" },
    };
    const serviceError = new Error("Report generation failed");
    vi.mocked(reportService.generateReports).mockRejectedValueOnce(
      serviceError,
    );

    await exportReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Report generation failed",
    );
  });

  it("should handle unexpected errors during export", async () => {
    req = {
      method: "POST",
      body: { reportType: "trialBalance", format: "xlsx" },
    };
    vi.mocked(reportService.generateReports).mockImplementationOnce(() => {
      throw new Error("Unexpected error during report generation");
    });

    await exportReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Unexpected error during report generation",
    );
  });
});
