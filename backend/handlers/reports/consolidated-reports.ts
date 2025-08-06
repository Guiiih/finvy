import logger from '../../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from '../../utils/supabaseClient.js'
import { formatSupabaseError } from '../../utils/errorUtils.js'
import { exportReportSchema } from '../../utils/schemas.js'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

interface EntryLine {
  account_id: string
  debit: number
  credit: number
}

interface JournalEntry {
  id: string
  entry_date: string
  description: string
  entry_lines: EntryLine[]
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userSupabase = getSupabaseClient(token)
  const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)

  if (!userOrgAndPeriod) {
    return handleErrorResponse(
      res,
      403,
      'Organização ou período contábil não encontrado para o usuário.',
    )
  }

  const { organization_id, active_accounting_period_id } = userOrgAndPeriod

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  }

  const parsedQuery = exportReportSchema.safeParse(req.query)

  if (!parsedQuery.success) {
    return handleErrorResponse(
      res,
      400,
      parsedQuery.error.errors.map((err) => err.message).join(', '),
    )
  }

  const { reportType, startDate, endDate, format } = parsedQuery.data

  try {
    const { data: journalEntries, error: journalEntriesError } = await userSupabase
      .from('journal_entries')
      .select('id, entry_date, description, entry_lines(account_id, debit, credit)')
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)
      .gte('entry_date', startDate || '1900-01-01')
      .lte('entry_date', endDate || '2100-12-31')
      .order('entry_date', { ascending: true })

    if (journalEntriesError) throw journalEntriesError

    const { data: accounts, error: accountsError } = await userSupabase
      .from('accounts')
      .select('id, name')
      .eq('organization_id', organization_id)
      .eq('accounting_period_id', active_accounting_period_id)

    if (accountsError) throw accountsError

    const accountMap = new Map(accounts.map((acc) => [acc.id, acc.name]))

    const monthlyData: { [key: string]: JournalEntry[] } = {}
    journalEntries.forEach((entry: JournalEntry) => {
      const month = entry.entry_date.substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = []
      }
      monthlyData[month].push(entry)
    })

    const sortedMonths = Object.keys(monthlyData).sort()

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Finvy'
      workbook.lastModifiedBy = 'Finvy'
      workbook.created = new Date()
      workbook.modified = new Date()

      for (const month of sortedMonths) {
        const worksheet = workbook.addWorksheet(`Relatório ${month}`)
        worksheet.columns = [
          { header: 'Data', key: 'entry_date', width: 15 },
          { header: 'Descrição', key: 'description', width: 40 },
          { header: 'Conta', key: 'account_name', width: 30 },
          { header: 'Débito', key: 'debit', width: 15 },
          { header: 'Crédito', key: 'credit', width: 15 },
        ]

        monthlyData[month].forEach((entry) => {
          entry.entry_lines.forEach((line) => {
            worksheet.addRow({
              entry_date: entry.entry_date,
              description: entry.description,
              account_name: accountMap.get(line.account_id) || line.account_id,
              debit: line.debit,
              credit: line.credit,
            })
          })
        })
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio_consolidado_${reportType}.xlsx"`,
      )
      await workbook.xlsx.write(res)
      return
    } else if (format === 'csv') {
      let csvContent = ''
      for (const month of sortedMonths) {
        csvContent += `\n\n--- Relatório ${month} ---\n`
        csvContent += 'Data,Descrição,Conta,Débito,Crédito\n'
        monthlyData[month].forEach((entry) => {
          entry.entry_lines.forEach((line) => {
            csvContent += `"${entry.entry_date}","${entry.description}","${accountMap.get(line.account_id) || line.account_id}",${line.debit},${line.credit}\n`
          })
        })
      }
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio_consolidado_${reportType}.csv"`,
      )
      return res.status(200).send(csvContent)
    } else if (format === 'pdf') {
      const doc = new PDFDocument()
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="relatorio_consolidado_${reportType}.pdf"`,
      )
      doc.pipe(res)
      doc.fontSize(16).text(`Relatório Consolidado de ${reportType}`, { align: 'center' })
      doc.moveDown()

      for (const month of sortedMonths) {
        doc.fontSize(14).text(`--- Relatório ${month} ---`, { underline: true })
        doc.moveDown()
        doc
          .fontSize(10)
          .text(
            'Data        Descrição                                Conta                          Débito         Crédito',
          )
        doc.text(
          '-----------------------------------------------------------------------------------------------------',
        )
        monthlyData[month].forEach((entry) => {
          entry.entry_lines.forEach((line) => {
            const accountName = accountMap.get(line.account_id) || line.account_id
            doc
              .fontSize(8)
              .text(
                `${entry.entry_date.padEnd(12)}${entry.description.padEnd(40)}${accountName.padEnd(30)}${String(line.debit).padEnd(15)}${String(line.credit).padEnd(15)}`,
              )
          })
        })
        doc.moveDown()
      }
      doc.end()
      return
    } else {
      return handleErrorResponse(res, 400, 'Formato de exportação não suportado.')
    }
  } catch (error: unknown) {
    logger.error('Erro inesperado na API de exportação de relatórios consolidados:', error)
    const message = formatSupabaseError(error)
    return handleErrorResponse(res, 500, message)
  }
}
