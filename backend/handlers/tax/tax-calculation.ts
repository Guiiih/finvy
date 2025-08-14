import type { AuthenticatedRequest } from '../../types/index.js'
import type { VercelResponse } from '@vercel/node'
import { handleErrorResponse, getSupabaseClient } from '../../utils/supabaseClient.js'
import { calculateTaxes } from '../../services/taxService.js'
import { getTaxSettings, getTaxRegimeHistory } from '../../services/taxSettingService.js'
import { z } from 'zod'

import { OperationType } from '../../types/tax.js';

const fiscalOperationSchema = z.object({
  operationType: z.nativeEnum(OperationType).nullable(),
  productServiceType: z.enum(['Produto', 'Serviço']).nullable(),
  ufOrigin: z.string().nullable(),
  ufDestination: z.string().nullable(),
  cfop: z.string().nullable(),
  totalAmount: z.number().min(0),
  freight: z.number().min(0),
  insurance: z.number().min(0),
  discount: z.number().min(0),
  icmsSt: z.boolean(),
  ipiIncides: z.boolean(),
  industrialOperation: z.boolean(),
  transactionDate: z.string().datetime(), // Adicionado
  journalEntryId: z.string().uuid().optional().nullable(), // Adicionado
});

export const calculateFiscalTaxesHandler = async (req: AuthenticatedRequest, res: VercelResponse) => {
  try {
    const parsedBody = fiscalOperationSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return handleErrorResponse(
        res,
        400,
        parsedBody.error.errors.map((err) => err.message).join(', '),
      );
    }

    const fiscalData = parsedBody.data;

    const organization_id = req.organizationId; // Assumindo que o middleware adiciona
    const token = req.token; // Assumindo que o middleware adiciona

    if (!organization_id || !token) {
      return handleErrorResponse(res, 401, 'Dados de autenticação incompletos.');
    }

    const taxSettings = await getTaxSettings(organization_id, token, fiscalData.transactionDate);
    const taxRegimeHistory = await getTaxRegimeHistory(organization_id, token);

    if (!taxSettings) {
      return handleErrorResponse(res, 404, 'Configurações de impostos não encontradas para a organização.');
    }

    const calculatedTaxes = await calculateTaxes({
      total_gross: fiscalData.totalAmount,
      icms_rate: taxSettings.icms_rate,
      ipi_rate: taxSettings.ipi_rate,
      pis_rate: taxSettings.pis_rate,
      cofins_rate: taxSettings.cofins_rate,
      mva_rate: taxSettings.mva_rate,
      operation_type: fiscalData.operationType,
      tax_regime: taxRegimeHistory?.regime, // Passa o regime tributário
      total_net: fiscalData.totalAmount,
      organization_id,
      token,
    });

    const supabase = getSupabaseClient(token);

    // Save tax calculation history
    const { error: dbError } = await supabase
      .from('tax_calculation_history')
      .insert({
        journal_entry_id: fiscalData.journalEntryId,
        fiscal_operation_data: fiscalData,
        tax_calculation_result: calculatedTaxes,
        details: calculatedTaxes.details,
        organization_id: organization_id,
        accounting_period_id: req.accountingPeriodId, // Assuming middleware adds this
      });

    if (dbError) {
      console.error('Error saving tax calculation history:', dbError);
      // Do not return error to user, as tax calculation was successful
    }

    res.status(200).json({ calculatedTaxes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao calcular impostos fiscais.';
    handleErrorResponse(res, 500, message);
  }
};
