import logger from '../../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse } from '../../utils/supabaseClient.js'
import {
  generateReports,
  calculateTrialBalance,
  calculateDreData,
  calculateBalanceSheetData,
  calculateLedgerDetails,
} from '../../services/reportService.js'
import { exportReportSchema } from '../../utils/schemas.js'
import type { Account, JournalEntry } from '../../types/index.js'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

interface TrialBalanceData {
  account_id: string
  accountName: string
  type: string
  totalDebits: number
  totalCredits: number
  finalBalance: number
}

interface DreData {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
}

interface BalanceSheetData {
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  isBalanced: boolean
}

interface LedgerDetailsEntry {
  journalEntryId: string
  entryDate: string
  description: string
  debit: number
  credit: number
}

interface LedgerDetailsData {
  [accountId: string]: LedgerDetailsEntry[]
}

function convertToCsv(
  data: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData,
  reportType: string,
): string {
  let headers: string[] = []
  let rows: (string | number | boolean)[][] = []

  if (reportType === 'trialBalance') {
    headers = [
      'Account ID',
      'Account Name',
      'Type',
      'Total Debits',
      'Total Credits',
      'Final Balance',
    ]
    rows = (data as TrialBalanceData[]).map((row) => [
      row.account_id,
      row.accountName,
      row.type,
      row.totalDebits,
      row.totalCredits,
      row.finalBalance,
    ])
  } else if (reportType === 'dre') {
    headers = ['Total Revenue', 'Total Expenses', 'Net Income']
    const dreData = data as DreData
    rows = [[dreData.totalRevenue, dreData.totalExpenses, dreData.netIncome]]
  } else if (reportType === 'balanceSheet') {
    headers = ['Total Assets', 'Total Liabilities', 'Total Equity', 'Is Balanced']
    const balanceSheetData = data as BalanceSheetData
    rows = [
      [
        balanceSheetData.totalAssets,
        balanceSheetData.totalLiabilities,
        balanceSheetData.totalEquity,
        balanceSheetData.isBalanced,
      ],
    ]
  } else if (reportType === 'ledgerDetails') {
    headers = ['Journal Entry ID', 'Entry Date', 'Description', 'Debit', 'Credit']
    const flattenedData: LedgerDetailsEntry[] = []
    const ledgerData = data as LedgerDetailsData
    for (const accountId in ledgerData) {
      ledgerData[accountId].forEach((entry: LedgerDetailsEntry) => {
        flattenedData.push(entry)
      })
    }
    rows = flattenedData.map((row: LedgerDetailsEntry) => [
      row.journalEntryId,
      row.entryDate,
      row.description,
      row.debit || 0,
      row.credit || 0,
    ])
  }

  const escapeCell = (cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`
  const headerRow = headers.map(escapeCell).join(',')
  const dataRows = rows.map((row) => row.map(escapeCell).join('\n')).join('\n')

  return `${headerRow}\n${dataRows}`
}

async function convertToXlsx(
  data: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData,
  reportType: string,
  res: VercelResponse,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(reportType)

  let headers: string[] = []
  let rows: (string | number | boolean)[][] = []

  if (reportType === 'trialBalance') {
    headers = [
      'Account ID',
      'Account Name',
      'Type',
      'Total Debits',
      'Total Credits',
      'Final Balance',
    ]
    rows = (data as TrialBalanceData[]).map((row) => [
      row.account_id,
      row.accountName,
      row.type,
      row.totalDebits,
      row.totalCredits,
      row.finalBalance,
    ])
  } else if (reportType === 'dre') {
    headers = ['Total Revenue', 'Total Expenses', 'Net Income']
    const dreData = data as DreData
    rows = [[dreData.totalRevenue, dreData.totalExpenses, dreData.netIncome]]
  } else if (reportType === 'balanceSheet') {
    headers = ['Total Assets', 'Total Liabilities', 'Total Equity', 'Is Balanced']
    const balanceSheetData = data as BalanceSheetData
    rows = [
      [
        balanceSheetData.totalAssets,
        balanceSheetData.totalLiabilities,
        balanceSheetData.totalEquity,
        balanceSheetData.isBalanced,
      ],
    ]
  } else if (reportType === 'ledgerDetails') {
    headers = ['Journal Entry ID', 'Entry Date', 'Description', 'Debit', 'Credit']
    const flattenedData: LedgerDetailsEntry[] = []
    const ledgerData = data as LedgerDetailsData
    for (const accountId in ledgerData) {
      ledgerData[accountId].forEach((entry: LedgerDetailsEntry) => {
        flattenedData.push(entry)
      })
    }
    rows = flattenedData.map((row: LedgerDetailsEntry) => [
      row.journalEntryId,
      row.entryDate,
      row.description,
      row.debit || 0,
      row.credit || 0,
    ])
  }

  worksheet.addRow(headers)
  rows.forEach((row) => {
    worksheet.addRow(row)
  })

  await workbook.xlsx.write(res)
}

async function convertToPdf(
  data: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData,
  reportType: string,
  res: VercelResponse,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    doc.pipe(res)

    doc.on('end', () => {
      resolve()
    })
    doc.on('error', reject)

    doc.fontSize(16).text(`Relatório: ${reportType.toUpperCase()}`, { align: 'center' })
    doc.moveDown()

    let headers: string[] = []
    let rows: (string | number | boolean)[][] = []

    if (reportType === 'trialBalance') {
      headers = [
        'Account ID',
        'Account Name',
        'Type',
        'Total Debits',
        'Total Credits',
        'Final Balance',
      ]
      rows = (data as TrialBalanceData[]).map((row) => [
        row.account_id,
        row.accountName,
        row.type,
        row.totalDebits,
        row.totalCredits,
        row.finalBalance,
      ])
    } else if (reportType === 'dre') {
      headers = ['Total Revenue', 'Total Expenses', 'Net Income']
      const dreData = data as DreData
      rows = [[dreData.totalRevenue, dreData.totalExpenses, dreData.netIncome]]
    } else if (reportType === 'balanceSheet') {
      headers = ['Total Assets', 'Total Liabilities', 'Total Equity', 'Is Balanced']
      const balanceSheetData = data as BalanceSheetData
      rows = [
        [
          balanceSheetData.totalAssets,
          balanceSheetData.totalLiabilities,
          balanceSheetData.totalEquity,
          balanceSheetData.isBalanced,
        ],
      ]
    } else if (reportType === 'ledgerDetails') {
      headers = ['Journal Entry ID', 'Entry Date', 'Description', 'Debit', 'Credit']
      const flattenedData: LedgerDetailsEntry[] = []
      const ledgerData = data as LedgerDetailsData
      for (const accountId in ledgerData) {
        ledgerData[accountId].forEach((entry: LedgerDetailsEntry) => {
          flattenedData.push(entry)
        })
      }
      rows = flattenedData.map((row: LedgerDetailsEntry) => [
        row.journalEntryId,
        row.entryDate,
        row.description,
        row.debit || 0,
        row.credit || 0,
      ])
    }

    const tableTop = doc.y
    let currentY = tableTop

    doc.font('Helvetica-Bold').fontSize(10)
    headers.forEach((header, i) => {
      doc.text(header, 50 + i * 100, currentY, { width: 90, align: 'left' })
    })
    doc.moveDown()
    currentY = doc.y

    doc.font('Helvetica').fontSize(9)
    rows.forEach((row) => {
      row.forEach((cell, i) => {
        doc.text(String(cell), 50 + i * 100, currentY, {
          width: 90,
          align: 'left',
        })
      })
      doc.moveDown()
      currentY = doc.y
    })

    doc.end()
  })
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  }

  const parsedBody = exportReportSchema.safeParse(req.body)
  if (!parsedBody.success) {
    return handleErrorResponse(
      res,
      400,
      parsedBody.error.errors.map((err) => err.message).join(', '),
    )
  }
  const { reportType, startDate, endDate, format } = parsedBody.data

  try {
    const { accounts, journalEntries } = (await generateReports(
      user_id,
      token,
      startDate,
      endDate,
    )) as { accounts: { data: Account[]; count: number }; journalEntries: JournalEntry[] }

    let reportData: TrialBalanceData[] | DreData | BalanceSheetData | LedgerDetailsData
    let filename = 'report'
    let contentType = ''

    // Considerar jobs em segundo plano para exports muito grandes para evitar timeouts
    // em ambientes serverless como o Vercel. O usuário seria notificado quando o relatório estivesse pronto.

    switch (reportType) {
      case 'trialBalance':
        reportData = calculateTrialBalance(accounts.data, journalEntries)
        filename = 'balancete_de_verificacao'
        break
      case 'dre':
        reportData = calculateDreData(accounts.data, journalEntries)
        filename = 'demonstrativo_de_resultado'
        break
      case 'balanceSheet':
        reportData = calculateBalanceSheetData(accounts.data, journalEntries)
        filename = 'balanco_patrimonial'
        break
      case 'ledgerDetails':
        reportData = calculateLedgerDetails(accounts.data, journalEntries)
        filename = 'razao_detalhado'
        break
      default:
        return handleErrorResponse(res, 400, 'Tipo de relatório inválido.')
    }

    if (format === 'xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename += '.xlsx'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      await convertToXlsx(reportData, reportType, res)
    } else if (format === 'csv') {
      const fileBuffer = convertToCsv(reportData, reportType)
      contentType = 'text/csv'
      filename += '.csv'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.status(200).send(fileBuffer)
    } else if (format === 'pdf') {
      contentType = 'application/pdf'
      filename += '.pdf'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      await convertToPdf(reportData, reportType, res)
    } else {
      return handleErrorResponse(res, 400, 'Formato de exportação inválido.')
    }
  } catch (error: unknown) {
    logger.error({ error }, 'Erro ao exportar relatório:')
    const message = error instanceof Error ? error.message : 'Erro interno do servidor.'
    handleErrorResponse(res, 500, `Erro no servidor: ${message}`)
  }
}
