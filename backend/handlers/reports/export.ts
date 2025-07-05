import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleErrorResponse } from "../../utils/supabaseClient.js";
import { generateReports, calculateTrialBalance, calculateDreData, calculateBalanceSheetData, calculateLedgerDetails } from "../../services/reportService.js";
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

interface TrialBalanceData {
  account_id: string;
  accountName: string;
  type: string;
  totalDebits: number;
  totalCredits: number;
  finalBalance: number;
}

interface DreData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface BalanceSheetData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

interface LedgerDetailsEntry {
  journalEntryId: string;
  entryDate: string;
  description: string;
  debit: number;
  credit: number;
}

interface LedgerDetailsData {
  [accountId: string]: LedgerDetailsEntry[];
}

// Helper function to convert data to CSV
function convertToCsv(data: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData, reportType: string): string {
  let headers: string[] = [];
  let rows: (string | number | boolean)[][] = [];

  if (reportType === 'trialBalance') {
    headers = ["Account ID", "Account Name", "Type", "Total Debits", "Total Credits", "Final Balance"];
    rows = (data as TrialBalanceData[]).map(row => [
      row.account_id, row.accountName, row.type, row.totalDebits, row.totalCredits, row.finalBalance
    ]);
  } else if (reportType === 'dre') {
    headers = ["Total Revenue", "Total Expenses", "Net Income"];
    const dreData = data as DreData;
    rows = [[dreData.totalRevenue, dreData.totalExpenses, dreData.netIncome]];
  } else if (reportType === 'balanceSheet') {
    headers = ["Total Assets", "Total Liabilities", "Total Equity", "Is Balanced"];
    const balanceSheetData = data as BalanceSheetData;
    rows = [[balanceSheetData.totalAssets, balanceSheetData.totalLiabilities, balanceSheetData.totalEquity, balanceSheetData.isBalanced]];
  } else if (reportType === 'ledgerDetails') {
    headers = ["Journal Entry ID", "Entry Date", "Description", "Debit", "Credit"];
    const flattenedData: LedgerDetailsEntry[] = [];
    const ledgerData = data as LedgerDetailsData;
    for (const accountId in ledgerData) {
      ledgerData[accountId].forEach((entry: LedgerDetailsEntry) => {
        flattenedData.push(entry);
      });
    }
    rows = flattenedData.map((row: LedgerDetailsEntry) => [
      row.journalEntryId, row.entryDate, row.description, row.debit || 0, row.credit || 0
    ]);
  }

  const escapeCell = (cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`;
  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map(row => row.map(escapeCell).join('\n')).join('\n');

  return `${headerRow}\n${dataRows}`;
}

// Helper function to convert data to XLSX
async function convertToXlsx(data: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData, reportType: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType);

  let headers: string[] = [];
  let rows: (string | number | boolean)[][] = [];

  if (reportType === 'trialBalance') {
    headers = ["Account ID", "Account Name", "Type", "Total Debits", "Total Credits", "Final Balance"];
    rows = (data as TrialBalanceData[]).map(row => [
      row.account_id, row.accountName, row.type, row.totalDebits, row.totalCredits, row.finalBalance
    ]);
  } else if (reportType === 'dre') {
    headers = ["Total Revenue", "Total Expenses", "Net Income"];
    const dreData = data as DreData;
    rows = [[dreData.totalRevenue, dreData.totalExpenses, dreData.netIncome]];
  } else if (reportType === 'balanceSheet') {
    headers = ["Total Assets", "Total Liabilities", "Total Equity", "Is Balanced"];
    const balanceSheetData = data as BalanceSheetData;
    rows = [[balanceSheetData.totalAssets, balanceSheetData.totalLiabilities, balanceSheetData.totalEquity, balanceSheetData.isBalanced]];
  } else if (reportType === 'ledgerDetails') {
    headers = ["Journal Entry ID", "Entry Date", "Description", "Debit", "Credit"];
    const flattenedData: LedgerDetailsEntry[] = [];
    const ledgerData = data as LedgerDetailsData;
    for (const accountId in ledgerData) {
      ledgerData[accountId].forEach((entry: LedgerDetailsEntry) => {
        flattenedData.push(entry);
      });
    }
    rows = flattenedData.map((row: LedgerDetailsEntry) => [
      row.journalEntryId, row.entryDate, row.description, row.debit || 0, row.credit || 0
    ]);
  }

  worksheet.addRow(headers);
  rows.forEach(row => {
    worksheet.addRow(row);
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

// Helper function to convert data to PDF
async function convertToPdf(data: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData, reportType: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    doc.fontSize(16).text(`Relatório: ${reportType.toUpperCase()}`, { align: 'center' });
    doc.moveDown();

    let headers: string[] = [];
    let rows: (string | number | boolean)[][] = [];

    if (reportType === 'trialBalance') {
      headers = ["Account ID", "Account Name", "Type", "Total Debits", "Total Credits", "Final Balance"];
      rows = (data as TrialBalanceData[]).map(row => [
      row.account_id, row.accountName, row.type, row.totalDebits, row.totalCredits, row.finalBalance
    ]);
    } else if (reportType === 'dre') {
      headers = ["Total Revenue", "Total Expenses", "Net Income"];
      const dreData = data as DreData;
      rows = [[dreData.totalRevenue, dreData.totalExpenses, dreData.netIncome]];
    } else if (reportType === 'balanceSheet') {
      headers = ["Total Assets", "Total Liabilities", "Total Equity", "Is Balanced"];
      const balanceSheetData = data as BalanceSheetData;
      rows = [[balanceSheetData.totalAssets, balanceSheetData.totalLiabilities, balanceSheetData.totalEquity, balanceSheetData.isBalanced]];
    } else if (reportType === 'ledgerDetails') {
      headers = ["Journal Entry ID", "Entry Date", "Description", "Debit", "Credit"];
      const flattenedData: LedgerDetailsEntry[] = [];
      const ledgerData = data as LedgerDetailsData;
      for (const accountId in ledgerData) {
        ledgerData[accountId].forEach((entry: LedgerDetailsEntry) => {
          flattenedData.push(entry);
        });
      }
      rows = flattenedData.map((row: LedgerDetailsEntry) => [
        row.journalEntryId, row.entryDate, row.description, row.debit || 0, row.credit || 0
      ]);
    }

    // Basic table drawing for PDF
    const tableTop = doc.y;
    let currentY = tableTop;

    // Draw headers
    doc.font('Helvetica-Bold').fontSize(10);
    headers.forEach((header, i) => {
      doc.text(header, 50 + (i * 100), currentY, { width: 90, align: 'left' });
    });
    doc.moveDown();
    currentY = doc.y;

    // Draw rows
    doc.font('Helvetica').fontSize(9);
    rows.forEach(row => {
      row.forEach((cell, i) => {
        doc.text(String(cell), 50 + (i * 100), currentY, { width: 90, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;
    });

    doc.end();
  });
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

  const { reportType, startDate, endDate, format } = req.body; // Added format

  if (!reportType || !format) {
    return handleErrorResponse(res, 400, "Tipo de relatório e formato são obrigatórios.");
  }

  try {
    const { accounts, journalEntries } = await generateReports(user_id, token, startDate, endDate);

    let reportData: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData;
    let filename = "report";
    let contentType = "";
    let fileBuffer: Buffer | string;

    switch (reportType) {
      case 'trialBalance':
        reportData = calculateTrialBalance(accounts, journalEntries);
        filename = "balancete_de_verificacao";
        break;
      case 'dre':
        reportData = calculateDreData(accounts, journalEntries);
        filename = "demonstrativo_de_resultado";
        break;
      case 'balanceSheet':
        reportData = calculateBalanceSheetData(accounts, journalEntries);
        filename = "balanco_patrimonial";
        break;
      case 'ledgerDetails':
        reportData = calculateLedgerDetails(accounts, journalEntries);
        filename = "razao_detalhado";
        break;
      default:
        return handleErrorResponse(res, 400, "Tipo de relatório inválido.");
    }

    if (format === 'xlsx') {
      fileBuffer = await convertToXlsx(reportData, reportType);
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename += ".xlsx";
    } else if (format === 'csv') {
      fileBuffer = convertToCsv(reportData, reportType);
      contentType = "text/csv";
      filename += ".csv";
    } else if (format === 'pdf') {
      fileBuffer = await convertToPdf(reportData, reportType);
      contentType = "application/pdf";
      filename += ".pdf";
    } else {
      return handleErrorResponse(res, 400, "Formato de exportação inválido.");
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(fileBuffer);

  } catch (error: unknown) {
    console.error("Erro ao exportar relatório:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`);
  }
}