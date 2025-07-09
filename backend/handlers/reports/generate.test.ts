import { describe, it, expect, vi, beforeEach } from "vitest";
import generateReportsHandler from "./generate";
import * as supabaseClient from "../../utils/supabaseClient";
import * as reportService from "../../services/reportService";
import * as schemas from "../../utils/schemas";
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface MockRequest extends Partial<VercelRequest> {
  method: string;
  query?: Record<string, unknown>;
}

interface MockResponse extends Partial<VercelResponse> {
  status: vi.Mock;
  json: vi.Mock;
  send?: vi.Mock;
  setHeader?: vi.Mock;
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
}));

vi.mock("../../utils/schemas", () => ({
  reportQuerySchema: {
    safeParse: vi.fn((data: { startDate?: string; endDate?: string }) => {
      if (data.startDate || data.endDate) {
        return { success: true, data };
      }
      return { success: true, data: {} }; // Simulate success for empty query
    }),
  },
}));

describe("generateReportsHandler", () => {
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
      end: vi.fn(),
    };
  });

  it("should generate reports successfully with start and end dates", async () => {
    req = {
      method: "GET",
      query: { startDate: "2024-01-01", endDate: "2024-12-31" },
    };
    const mockReports = { accounts: [], journalEntries: [] };
    vi.mocked(reportService.generateReports).mockResolvedValueOnce(mockReports);

    await generateReportsHandler(req, res, user_id, token);

    expect(schemas.reportQuerySchema.safeParse).toHaveBeenCalledWith(req.query);
    expect(reportService.generateReports).toHaveBeenCalledWith(
      user_id,
      token,
      "2024-01-01",
      "2024-12-31",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockReports);
  });

  it("should generate reports successfully without dates", async () => {
    req = { method: "GET", query: {} };
    const mockReports = { accounts: [], journalEntries: [] };
    vi.mocked(reportService.generateReports).mockResolvedValueOnce(mockReports);

    await generateReportsHandler(req, res, user_id, token);

    expect(schemas.reportQuerySchema.safeParse).toHaveBeenCalledWith(req.query);
    expect(reportService.generateReports).toHaveBeenCalledWith(
      user_id,
      token,
      undefined,
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockReports);
  });

  it("should return 400 for invalid query parameters", async () => {
    req = { method: "GET", query: { startDate: "invalid-date" } };
    vi.mocked(schemas.reportQuerySchema.safeParse).mockReturnValueOnce({
      success: false,
      error: { errors: [{ message: "Invalid date format" }] },
    });

    await generateReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Invalid date format",
    );
  });

  it("should handle errors during report generation", async () => {
    req = { method: "GET", query: {} };
    const serviceError = new Error("Report generation failed");
    vi.mocked(reportService.generateReports).mockRejectedValueOnce(
      serviceError,
    );

    await generateReportsHandler(req, res, user_id, token);

    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      500,
      "Report generation failed",
    );
  });

  it("should return 405 for unsupported methods", async () => {
    req = { method: "POST" };
    await generateReportsHandler(req, res, user_id, token);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["GET"]);
    expect(supabaseClient.handleErrorResponse).toHaveBeenCalledWith(
      res,
      405,
      "Method POST Not Allowed",
    );
  });
});
