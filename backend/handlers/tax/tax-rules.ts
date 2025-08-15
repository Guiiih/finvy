import type { VercelRequest, VercelResponse } from '@vercel/node'
import logger from '../../utils/logger.js'
import { handleErrorResponse, getUserOrganizationAndPeriod } from '../../utils/supabaseClient.js'
import { createTaxRuleSchema, updateTaxRuleSchema } from '../../utils/schemas.js'
import {
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
} from '../../services/taxRuleService.js'

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
  const { organization_id } = userOrgAndPeriod

  try {
    if (req.method === 'GET') {
      const rules = await getTaxRules(organization_id, token)
      return res.status(200).json(rules)
    }

    if (req.method === 'POST') {
      const parsedBody = createTaxRuleSchema.safeParse(req.body)
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }
      const newRule = await createTaxRule(parsedBody.data, organization_id, token)
      return res.status(201).json(newRule)
    }

    if (req.method === 'PUT') {
      const id = req.query.id as string
      const parsedBody = updateTaxRuleSchema.safeParse(req.body)
      if (!parsedBody.success) {
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }
      const updatedRule = await updateTaxRule(id, parsedBody.data, organization_id, token)
      return res.status(200).json(updatedRule)
    }

    if (req.method === 'DELETE') {
      const id = req.query.id as string
      await deleteTaxRule(id, organization_id, token)
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API de regras de impostos:')
    const message = error instanceof Error ? error.message : 'Erro desconhecido.'
    return handleErrorResponse(res, 500, message)
  }
}
