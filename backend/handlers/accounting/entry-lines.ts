import logger from '../../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from '../../utils/supabaseClient.js'
import { createEntryLineSchema } from '../../utils/schemas.js'
import { calculateTaxes } from '../../services/taxService.js'
import { formatSupabaseError } from '../../utils/errorUtils.js'
import { getTaxSettings } from '../../services/taxSettingService.js'
import { EntryLine } from '../../types/index.js'
import { inferOperationType } from '../../services/operationTypeInferenceService.js'
import { OperationType } from '../../types/tax.js'

/**
 * @swagger
 * /entry-lines:
 *   get:
 *     summary: Retorna as linhas de um lançamento de diário.
 *     description: Retorna todas as linhas de lançamento associadas a um `journal_entry_id` específico ou todas as linhas do usuário se nenhum ID for fornecido.
 *     tags:
 *       - Entry Lines
 *     parameters:
 *       - in: query
 *         name: journal_entry_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: O ID do lançamento de diário para filtrar as linhas.
 *     responses:
 *       200:
 *         description: Uma lista de linhas de lançamento.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   journal_entry_id:
 *                     type: string
 *                     format: uuid
 *                   account_id:
 *                     type: string
 *                     format: uuid
 *                   debit:
 *                     type: number
 *                     format: float
 *                   credit:
 *                     type: number
 *                     format: float
 *                   product_id:
 *                     type: string
 *                     format: uuid
 *                   quantity:
 *                     type: integer
 *                   unit_cost:
 *                     type: number
 *                     format: float
 *                   total_gross:
 *                      type: number
 *                      format: float
 *                   icms_value:
 *                      type: number
 *                      format: float
 *                   ipi_value:
 *                      type: number
 *                      format: float
 *                   pis_value:
 *                      type: number
 *                      format: float
 *                   cofins_value:
 *                      type: number
 *                      format: float
 *                   icms_st_value:
 *                      type: number
 *                      format: float
 *                   total_net:
 *                      type: number
 *                      format: float
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 *   post:
 *     summary: Cria uma ou mais linhas de lançamento.
 *     description: Cria novas linhas de lançamento para um lançamento de diário existente, tratando a lógica de impostos e estoque para vendas e compras.
 *     tags:
 *       - Entry Lines
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - journal_entry_id
 *               - account_id
 *             properties:
 *               journal_entry_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID do lançamento de diário ao qual a linha pertence.
 *               account_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da conta principal (e.g., Clientes para venda, Fornecedores para compra).
 *               debit:
 *                 type: number
 *                 description: Valor do débito. Pelo menos um entre débito e crédito deve ser fornecido.
 *               credit:
 *                 type: number
 *                 description: Valor do crédito. Pelo menos um entre débito e crédito deve ser fornecido.
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID do produto (opcional, para transações de estoque).
 *               quantity:
 *                 type: integer
 *                 description: Quantidade do produto (opcional).
 *               unit_cost:
 *                 type: number
 *                 description: Custo unitário do produto (opcional).
 *               total_gross:
 *                 type: number
 *                 description: Valor total bruto da transação (base para impostos).
 *               total_net:
 *                 type: number
 *                 description: Valor líquido total da nota (usado em compras). Se não fornecido em vendas, é calculado.
 *               transaction_type:
 *                 type: string
 *                 enum: [sale, purchase]
 *                 description: Tipo de transação para determinar a lógica contábil.
 *     responses:
 *       201:
 *         description: Linhas de lançamento criadas com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   journal_entry_id:
 *                     type: string
 *                     format: uuid
 *                   account_id:
 *                     type: string
 *                     format: uuid
 *                   debit:
 *                     type: number
 *                     format: float
 *                   credit:
 *                     type: number
 *                     format: float
 *       400:
 *         description: Requisição inválida.
 *       401:
 *         description: Não autorizado.
 *       403:
 *         description: Permissão negada para adicionar linhas a este lançamento.
 *       500:
 *         description: Erro interno do servidor, possivelmente por falta de contas contábeis.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
  if (!userOrgAndPeriod) {
    return handleErrorResponse(
      res,
      403,
      'Organização ou período contábil não encontrado para o usuário.',
    )
  }
  const { organization_id, active_accounting_period_id } = userOrgAndPeriod

  try {
    if (req.method === 'GET') {
      const { journal_entry_id } = req.query

      if (journal_entry_id) {
        const userSupabase = getSupabaseClient(token)
        const { data, error: dbError } = await userSupabase
          .from('entry_lines')
          .select(
            'id, journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, ipi_value, pis_value, cofins_value, icms_st_value, total_net, organization_id, accounting_period_id',
          )
          .eq('journal_entry_id', journal_entry_id as string)
          .eq('organization_id', organization_id)
          .eq('accounting_period_id', active_accounting_period_id)

        if (dbError) throw dbError
        return res.status(200).json(data)
      } else {
        // This branch should ideally not be used if RLS is properly set up to filter by organization and period
        // However, for completeness, we'll add the filters here as well.
        const userSupabase = getSupabaseClient(token)
        const { data, error: dbError } = await userSupabase
          .from('entry_lines')
          .select(
            'id, journal_entry_id, account_id, debit, credit, product_id, quantity, unit_cost, total_gross, icms_value, ipi_value, pis_value, cofins_value, icms_st_value, total_net, journal_entry_id(user_id), organization_id, accounting_period_id',
          )
          .eq('journal_entry_id.user_id', user_id)
          .eq('organization_id', organization_id)
          .eq('accounting_period_id', active_accounting_period_id)

        if (dbError) throw dbError
        return res.status(200).json(data)
      }
    }

    if (req.method === 'POST') {
      const parsedBody = createEntryLineSchema.safeParse(req.body)
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }
      const {
        journal_entry_id,
        account_id, // This will be the main account (e.g., Clients or Suppliers)
        type, // Adicionado
        amount, // Adicionado
        product_id,
        quantity,
        unit_cost,
        total_gross,
        total_net, // total_net from input
        // Novas alíquotas de impostos do frontend
        icms_rate,
        pis_rate,
        cofins_rate,
        irrf_rate,
        csll_rate,
        inss_rate,
      } = parsedBody.data

      // Infer the operation type
      const inferredOperationType = await inferOperationType(journal_entry_id, token)

      const saleTypes = [OperationType.VendaMercadorias, OperationType.VendaServicos]
      const purchaseTypes = [OperationType.CompraMateriaPrima, OperationType.CompraServicos]

      const debit = type === 'debit' ? amount : null // Derivado
      const credit = type === 'credit' ? amount : null // Derivado

      let calculated_icms_value = 0
      let calculated_ipi_value = 0
      let calculated_pis_value = 0
      let calculated_cofins_value = 0
      let calculated_icms_st_value = 0
      let final_total_net = total_net || amount || 0 // Use amount if total_gross is not provided

      // Declare effective rates at a higher scope and initialize to 0
      let effective_icms_rate = 0
      let effective_ipi_rate = 0
      let effective_pis_rate = 0
      let effective_cofins_rate = 0
      let effective_mva_rate = 0

      const shouldCalculateTaxes = total_gross !== undefined && total_gross !== null;

      if (shouldCalculateTaxes) {
        // Usar as alíquotas do frontend se fornecidas, caso contrário, buscar as configurações
        effective_icms_rate = icms_rate ?? 0 // Assign, don't redeclare
        effective_ipi_rate = 0 // IPI não está no taxData do frontend, mas pode vir do produto ou ser calculado
        effective_pis_rate = pis_rate ?? 0
        effective_cofins_rate = cofins_rate ?? 0
        effective_mva_rate = 0 // MVA não está no taxData do frontend

        // Obter a data do lançamento para usar nas configurações de impostos
        const { data: journalEntryData, error: journalEntryError } = await getSupabaseClient(token)
          .from('journal_entries')
          .select('entry_date')
          .eq('id', journal_entry_id)
          .single()

        if (journalEntryError || !journalEntryData) {
          return handleErrorResponse(res, 500, 'Não foi possível obter a data do lançamento.')
        }
        const entry_date = journalEntryData.entry_date

        // Check if any of the tax rates are undefined or null, indicating they were not provided in the request body.
        // If they are all explicitly 0, we don't need to fetch tax settings.
        const shouldFetchTaxSettings =
          icms_rate === undefined ||
          icms_rate === null ||
          pis_rate === undefined ||
          pis_rate === null ||
          cofins_rate === undefined ||
          cofins_rate === null ||
          irrf_rate === undefined ||
          irrf_rate === null ||
          csll_rate === undefined ||
          csll_rate === null ||
          inss_rate === undefined ||
          inss_rate === null;

        if (shouldFetchTaxSettings) {
          const taxSettings = await getTaxSettings(organization_id, token, entry_date)
          if (!taxSettings) {
            return handleErrorResponse(
              res,
              500,
              'Configurações de impostos não encontradas para a organização.',
            )
          }
          // Only update effective rates if they were not provided in the request body
          effective_icms_rate = icms_rate ?? taxSettings.icms_rate;
          effective_ipi_rate = taxSettings.ipi_rate; // IPI is always from settings if not provided
          effective_pis_rate = pis_rate ?? taxSettings.pis_rate;
          effective_cofins_rate = cofins_rate ?? taxSettings.cofins_rate;
          effective_mva_rate = taxSettings.mva_rate; // MVA is always from settings if not provided
        } else {
          // If all rates were explicitly provided (even if 0), use them directly
          effective_icms_rate = icms_rate ?? 0;
          effective_ipi_rate = 0; // Assume 0 if not fetched from settings
          effective_pis_rate = pis_rate ?? 0;
          effective_cofins_rate = cofins_rate ?? 0;
          effective_mva_rate = 0; // Assume 0 if not fetched from settings
        }

        if (
          inferredOperationType &&
          (saleTypes.includes(inferredOperationType) || purchaseTypes.includes(inferredOperationType))
        ) {
          const taxResults = await calculateTaxes({
            total_gross,
            icms_rate: effective_icms_rate,
            ipi_rate: effective_ipi_rate,
            pis_rate: effective_pis_rate,
            cofins_rate: effective_cofins_rate,
            mva_rate: effective_mva_rate,
            operation_type: inferredOperationType,
            total_net,
            organization_id,
            accounting_period_id: active_accounting_period_id,
            token,
          })

          calculated_icms_value = taxResults.calculated_icms_value
          calculated_ipi_value = taxResults.calculated_ipi_value
          calculated_pis_value = taxResults.calculated_pis_value
          calculated_cofins_value = taxResults.calculated_cofins_value
          calculated_icms_st_value = taxResults.calculated_icms_st_value
          final_total_net = taxResults.final_total_net
        }
      }

      const { data: journalEntry } = await getSupabaseClient(token)
        .from('journal_entries')
        .select('id')
        .eq('id', journal_entry_id)

        .eq('organization_id', organization_id)
        .eq('accounting_period_id', active_accounting_period_id)
        .single()

      if (!journalEntry) {
        return handleErrorResponse(
          res,
          403,
          'Você não tem permissão para adicionar linhas a este lançamento diário ou ele não existe.',
        )
      }

      const entryLinesToInsert: EntryLine[] = []

      if (inferredOperationType && saleTypes.includes(inferredOperationType)) {
        // Fetch required account IDs for sales
        const { data: accounts, error: accountsError } = await getSupabaseClient(token)
          .from('accounts')
          .select('id, name')
          .eq('organization_id', organization_id)
          .eq('accounting_period_id', active_accounting_period_id)
          .in('name', [
            'Receita de Vendas',
            'IPI a Recolher',
            'ICMS a Recolher',
            'ICMS-ST a Recolher',
            'PIS a Recolher',
            'COFINS a Recolher',
            'Custo da Mercadoria Vendida',
            'Estoque de Produtos Acabados',
            'PIS sobre Faturamento', // Expense account for PIS
            'COFINS sobre Faturamento', // Expense account for COFINS
            'IRRF a Recolher', // Adicionado
            'CSLL a Recolher', // Adicionado
            'INSS a Recolher', // Adicionado
          ])

        if (accountsError) throw accountsError

        const accountMap = new Map(accounts.map((acc) => [acc.name, acc.id]))

        const revenueAccount = accountMap.get('Receita de Vendas')
        const ipiPayableAccount = accountMap.get('IPI a Recolher')
        const icmsPayableAccount = accountMap.get('ICMS a Recolher')
        const icmsStPayableAccount = accountMap.get('ICMS-ST a Recolher')
        const pisPayableAccount = accountMap.get('PIS a Recolher')
        const cofinsPayableAccount = accountMap.get('COFINS a Recolher')
        const cmvAccount = accountMap.get('Custo da Mercadoria Vendida')
        const finishedGoodsStockAccount = accountMap.get('Estoque de Produtos Acabados')
        const pisExpenseAccount = accountMap.get('PIS sobre Faturamento')
        const cofinsExpenseAccount = accountMap.get('COFINS sobre Faturamento')
        const irrfPayableAccount = accountMap.get('IRRF a Recolher') // Adicionado
        const csllPayableAccount = accountMap.get('CSLL a Recolher') // Adicionado
        const inssPayableAccount = accountMap.get('INSS a Recolher') // Adicionado

        if (
          !revenueAccount ||
          !ipiPayableAccount ||
          !icmsPayableAccount ||
          !icmsStPayableAccount ||
          !pisPayableAccount ||
          !cofinsPayableAccount ||
          !cmvAccount ||
          !finishedGoodsStockAccount ||
          !pisExpenseAccount ||
          !cofinsExpenseAccount ||
          !irrfPayableAccount ||
          !csllPayableAccount ||
          !inssPayableAccount
        ) {
          return handleErrorResponse(
            res,
            500,
            'Contas contábeis essenciais para vendas não encontradas. Verifique se todas as contas necessárias existem.',
          )
        }
        // Main transaction line (Debit Clients/Cash, Credit Revenue + Taxes)
        entryLinesToInsert.push({
          journal_entry_id,
          account_id,
          debit: final_total_net,
          credit: null,
          product_id,
          quantity,
          unit_cost,
          total_gross,
          icms_value: calculated_icms_value,
          ipi_value: calculated_ipi_value,
          pis_value: calculated_pis_value,
          cofins_value: calculated_cofins_value,
          icms_st_value: calculated_icms_st_value,
          icms_rate: effective_icms_rate, // Adicionado
          pis_rate: effective_pis_rate, // Adicionado
          cofins_rate: effective_cofins_rate, // Adicionado
          irrf_rate: irrf_rate, // Adicionado
          csll_rate: csll_rate, // Adicionado
          inss_rate: inss_rate, // Adicionado
          total_net: final_total_net,
          organization_id,
          accounting_period_id: active_accounting_period_id,
        })

        // Credit Revenue
        entryLinesToInsert.push({
          journal_entry_id,
          account_id: revenueAccount,
          
          debit: null,
          credit: total_gross,
          organization_id,
          accounting_period_id: active_accounting_period_id,
        })

        // IPI Entry (Credit IPI a Recolher)
        if (calculated_ipi_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: ipiPayableAccount,
            
            debit: null,
            credit: calculated_ipi_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // ICMS Próprio Entry (Debit Revenue, Credit ICMS a Recolher)
        if (calculated_icms_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: revenueAccount, // Debit Revenue
              debit: calculated_icms_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: icmsPayableAccount, // Credit ICMS a Recolher
            
            debit: null,
            credit: calculated_icms_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // ICMS-ST Entry (Credit ICMS-ST a Recolher)
        if (calculated_icms_st_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: icmsStPayableAccount,
            
            debit: null,
            credit: calculated_icms_st_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // PIS Entry (Debit PIS sobre Faturamento, Credit PIS a Recolher)
        if (calculated_pis_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: pisExpenseAccount,
              debit: calculated_pis_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: pisPayableAccount,
            
            debit: null,
            credit: calculated_pis_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // COFINS Entry (Debit COFINS sobre Faturamento, Credit COFINS a Recolher)
        if (calculated_cofins_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cofinsExpenseAccount,
              debit: calculated_cofins_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cofinsPayableAccount,
            
            debit: null,
            credit: calculated_cofins_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // IRRF Entry (Debit IRRF sobre Faturamento, Credit IRRF a Recolher) - Adicionado
        if (irrf_rate && irrf_rate > 0) {
          const irrf_value = (total_gross || 0) * (irrf_rate / 100)
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: accountMap.get('IRRF sobre Faturamento'), // Assumindo que existe
              debit: irrf_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: irrfPayableAccount,
            
            debit: null,
            credit: irrf_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // CSLL Entry (Debit CSLL sobre Faturamento, Credit CSLL a Recolher) - Adicionado
        if (csll_rate && csll_rate > 0) {
          const csll_value = (total_gross || 0) * (csll_rate / 100)
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: accountMap.get('CSLL sobre Faturamento'), // Assumindo que existe
              debit: csll_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: csllPayableAccount,
            
            debit: null,
            credit: csll_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // INSS Entry (Debit INSS sobre Faturamento, Credit INSS a Recolher) - Adicionado
        if (inss_rate && inss_rate > 0) {
          const inss_value = (total_gross || 0) * (inss_rate / 100)
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: accountMap.get('INSS sobre Faturamento'), // Assumindo que existe
              debit: inss_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: inssPayableAccount,
            
            debit: null,
            credit: inss_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // CMV Entry (Debit Custo da Mercadoria Vendida, Credit Estoque de Produtos Acabados)
        if (product_id && quantity && unit_cost) {
          const cmv_value = quantity * unit_cost
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cmvAccount,
              debit: cmv_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: finishedGoodsStockAccount,
            
            debit: null,
            credit: cmv_value,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }
      } else if (inferredOperationType && purchaseTypes.includes(inferredOperationType)) {
        // Fetch required account IDs for purchases
        const { data: accounts, error: accountsError } = await getSupabaseClient(token)
          .from('accounts')
          .select('id, name')
          .eq('organization_id', organization_id)
          .eq('accounting_period_id', active_accounting_period_id)
          .in('name', [
            'Estoque de Mercadorias', // For retailer purchases
            'Fornecedores', // For retailer purchases
            'ICMS a Recuperar', // Adicionado
            'IPI a Recuperar', // Adicionado
            'PIS a Recuperar', // Adicionado
            'COFINS a Recuperar', // Adicionado
          ])

        if (accountsError) throw accountsError

        const accountMap = new Map(accounts.map((acc) => [acc.name, acc.id]))

        const merchandiseStockAccount = accountMap.get('Estoque de Mercadorias')
        const suppliersAccount = accountMap.get('Fornecedores')
        const icmsRecoverableAccount = accountMap.get('ICMS a Recuperar') // Adicionado
        const ipiRecoverableAccount = accountMap.get('IPI a Recuperar') // Adicionado
        const pisRecoverableAccount = accountMap.get('PIS a Recuperar') // Adicionado
        const cofinsRecoverableAccount = accountMap.get('COFINS a Recuperar') // Adicionado

        if (
          !merchandiseStockAccount ||
          !suppliersAccount ||
          !icmsRecoverableAccount ||
          !ipiRecoverableAccount ||
          !pisRecoverableAccount ||
          !cofinsRecoverableAccount
        ) {
          return handleErrorResponse(
            res,
            500,
            'Contas contábeis essenciais para compras não encontradas. Verifique se todas as contas necessárias existem.',
          )
        }

        // Retailer Purchase Scenario
        // Debit Estoque de Mercadorias, Credit Fornecedores
        entryLinesToInsert.push({
          journal_entry_id,
          account_id: merchandiseStockAccount,
          debit: final_total_net, // Total value of the invoice (already includes IPI and ICMS-ST if applicable)
          credit: null,
          product_id,
          quantity,
          unit_cost,
          total_gross,
          icms_value: calculated_icms_value, // Still store calculated values for reference
          ipi_value: calculated_ipi_value,
          pis_value: calculated_pis_value,
          cofins_value: calculated_cofins_value,
          icms_st_value: calculated_icms_st_value,
          icms_rate: effective_icms_rate, // Adicionado
          pis_rate: effective_pis_rate, // Adicionado
          cofins_rate: effective_cofins_rate, // Adicionado
          irrf_rate: irrf_rate, // Adicionado
          csll_rate: csll_rate, // Adicionado
          inss_rate: inss_rate, // Adicionado
          total_net: final_total_net,
          organization_id,
          accounting_period_id: active_accounting_period_id,
        })
        entryLinesToInsert.push({
          journal_entry_id,
          account_id: suppliersAccount,
          
          debit: null,
          credit: final_total_net,
          organization_id,
          accounting_period_id: active_accounting_period_id,
        })

        // ICMS a Recuperar (Debit)
        if (calculated_icms_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: icmsRecoverableAccount,
              debit: calculated_icms_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // IPI a Recuperar (Debit)
        if (calculated_ipi_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: ipiRecoverableAccount,
              debit: calculated_ipi_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // PIS a Recuperar (Debit)
        if (calculated_pis_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: pisRecoverableAccount,
              debit: calculated_pis_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }

        // COFINS a Recuperar (Debit)
        if (calculated_cofins_value > 0) {
          entryLinesToInsert.push({
            journal_entry_id,
            account_id: cofinsRecoverableAccount,
              debit: calculated_cofins_value,
            credit: null,
            organization_id,
            accounting_period_id: active_accounting_period_id,
          })
        }
      } else {
        // Default or other types, for now, just insert the main line
        entryLinesToInsert.push({
          journal_entry_id,
          account_id,
          
          debit: debit,
          credit: credit,
          product_id,
          quantity,
          unit_cost,
          total_gross,
          icms_value: calculated_icms_value,
          ipi_value: calculated_ipi_value,
          pis_value: calculated_pis_value,
          cofins_value: calculated_cofins_value,
          icms_st_value: calculated_icms_st_value,
          icms_rate: effective_icms_rate, // Adicionado
          pis_rate: effective_pis_rate, // Adicionado
          cofins_rate: effective_cofins_rate, // Adicionado
          irrf_rate: irrf_rate, // Adicionado
          csll_rate: csll_rate, // Adicionado
          inss_rate: inss_rate, // Adicionado
          total_net: final_total_net,
          organization_id,
          accounting_period_id: active_accounting_period_id,
        })
      }

      const { data: newLines, error: insertError } = await getSupabaseClient(token)
        .from('entry_lines')
        .insert(entryLinesToInsert)
        .select()

      if (insertError) throw insertError

      return res.status(201).json(newLines)
    }

    if (req.method === 'DELETE') {
      const { journal_entry_id } = req.query

      if (!journal_entry_id) {
        return handleErrorResponse(res, 400, 'O ID do lançamento de diário é obrigatório.')
      }

      const userSupabase = getSupabaseClient(token)
      const { error: dbError } = await userSupabase
        .from('entry_lines')
        .delete()
        .eq('journal_entry_id', journal_entry_id as string)
        .eq('organization_id', organization_id)
        .eq('accounting_period_id', active_accounting_period_id)

      if (dbError) {
        logger.error({ dbError }, 'Erro ao deletar linhas de lançamento:')
        throw dbError
      }

      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API de linhas de lançamento:')
    const message = formatSupabaseError(error)
    return handleErrorResponse(res, 500, message)
  }
}
