import type { AuthenticatedRequest } from '../types/index.js'
import type { VercelResponse } from '@vercel/node'
import { handleErrorResponse } from '../utils/supabaseClient.js'
import { calculateTaxes } from '../services/taxService.js'
import { getTaxSettings } from '../services/taxSettingService.js'
import { z } from 'zod'

const fiscalOperationSchema = z.object({
  operationType: z.enum(['Compra', 'Venda']).nullable(),
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

    const taxSettings = await getTaxSettings(organization_id, token);

    if (!taxSettings) {
      return handleErrorResponse(res, 404, 'Configurações de impostos não encontradas para a organização.');
    }

    const transaction_type = fiscalData.operationType === 'Venda' ? 'sale' : 'purchase';

    const calculatedTaxes = calculateTaxes({
      total_gross: fiscalData.totalAmount,
      icms_rate: taxSettings.icms_rate,
      ipi_rate: taxSettings.ipi_rate,
      pis_rate: taxSettings.pis_rate,
      cofins_rate: taxSettings.cofins_rate,
      mva_rate: taxSettings.mva_rate,
      transaction_type: transaction_type,
      // irrf_rate, csll_rate, inss_rate não estão em TaxSetting, mas podem ser adicionados
      // total_net para compras pode ser o totalAmount se não houver outro campo
      total_net: fiscalData.totalAmount, // Ajustar conforme a necessidade para compras
    });

    res.status(200).json({ calculatedTaxes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao calcular impostos fiscais.';
    handleErrorResponse(res, 500, message);
  }
};
