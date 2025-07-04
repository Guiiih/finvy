import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse } from "../../utils/supabaseClient.js";
import { generateReports, calculateTrialBalance, calculateDreData, calculateBalanceSheetData, calculateLedgerDetails } from "../../services/reportService.js";
import { Account, JournalEntry } from "../../../frontend/src/types/index.js";

// Helper function to convert data to CSV
function convertToCsv(data: any[], reportType: string): string {
  if (!data || data.length === 0) {
    return "No data to export.";
  }

  let headers: string[] = [];
  let rows: string[] = [];

  if (reportType === 'trialBalance') {
    headers = ["Account ID", "Account Name", "Type", "Total Debits", "Total Credits", "Final Balance"];
    rows = data.map(row => 
      `"${row.account_id}","${row.accountName}","${row.type}",${row.totalDebits},${row.totalCredits},${row.finalBalance}`
    );
  } else if (reportType === 'dre') {
    headers = ["Total Revenue", "Total Expenses", "Net Income"];
    rows = [`${data[0].totalRevenue},${data[0].totalExpenses},${data[0].netIncome}`];
  } else if (reportType === 'balanceSheet') {
    headers = ["Total Assets", "Total Liabilities", "Total Equity", "Is Balanced"];
    rows = [`${data[0].totalAssets},${data[0].totalLiabilities},${data[0].totalEquity},${data[0].isBalanced}`];
  } else if (reportType === 'ledgerDetails') {
    headers = ["Journal Entry ID", "Entry Date", "Description", "Debit", "Credit"];
    // Flatten ledgerDetails which is an object with accountId keys
    const flattenedData: any[] = [];
    for (const accountId in data[0]) { // data[0] is the ledgerDetails object
      data[0][accountId].forEach((entry: any) => {
        flattenedData.push(entry);
      });
    }
    rows = flattenedData.map(row => 
      `"${row.journalEntryId}","${row.entryDate}","${row.description}",${row.debit || 0},${row.credit || 0}`
    );
  }

  return [headers.join(","), ...rows].join("\n");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`);
  }

  const { reportType, startDate, endDate } = req.body;

  if (!reportType) {
    return handleErrorResponse(res, 400, "Tipo de relatório é obrigatório.");
  }

  try {
    const { accounts, journalEntries } = await generateReports(user_id, token, startDate, endDate);

    let reportData: any[] = [];
    let filename = "report.csv";

    switch (reportType) {
      case 'trialBalance':
        reportData = [calculateTrialBalance(accounts, journalEntries)];
        filename = "balancete_de_verificacao.csv";
        break;
      case 'dre':
        reportData = [calculateDreData(accounts, journalEntries)];
        filename = "demonstrativo_de_resultado.csv";
        break;
      case 'balanceSheet':
        reportData = [calculateBalanceSheetData(accounts, journalEntries)];
        filename = "balanco_patrimonial.csv";
        break;
      case 'ledgerDetails':
        reportData = [calculateLedgerDetails(accounts, journalEntries)];
        filename = "razao_detalhado.csv";
        break;
      default:
        return handleErrorResponse(res, 400, "Tipo de relatório inválido.");
    }

    const csv = convertToCsv(reportData, reportType);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);

  } catch (error: unknown) {
    console.error("Erro ao exportar relatório:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`);
  }
}