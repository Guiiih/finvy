import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse } from '../utils/supabaseClient.js'
import { calculateFiscalTaxesService } from '../services/taxCalculationService.js'
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

export const calculateFiscalTaxesHandler = async (req: VercelRequest, res: VercelResponse) => {
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
    const calculatedTaxes = calculateFiscalTaxesService(fiscalData);

    res.status(200).json({ calculatedTaxes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao calcular impostos fiscais.';
    handleErrorResponse(res, 500, message);
  }
};
