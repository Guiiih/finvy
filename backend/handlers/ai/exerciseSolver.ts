import logger from '../../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleErrorResponse, getUserOrganizationAndPeriod } from '../../utils/supabaseClient.js'
import { z } from 'zod'
import { solveExercise } from '../../services/exerciseSolverService.js'

const exerciseSolverRequestSchema = z.object({
  exercise: z.string().min(1, 'O texto do exercício não pode ser vazio.'),
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[ExerciseSolverHandler] Recebida requisição para o resolvedor de exercícios.`)

  try {
    if (req.method === 'POST') {
      const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
      if (!userOrgAndPeriod) {
        return handleErrorResponse(
          res,
          403,
          'Organização ou período contábil não encontrado para o usuário.',
        )
      }
      // Linha 'const { } = userOrgAndPeriod;' foi removida daqui.

      const parsedBody = exerciseSolverRequestSchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.warn(
          `[ExerciseSolverHandler] Erro de validação do corpo da requisição: ${parsedBody.error.errors
            .map((err) => err.message)
            .join(', ')}`,
        )
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }

      const { exercise } = parsedBody.data

      const solution = await solveExercise(exercise)

      logger.info(`[ExerciseSolverHandler] Solução do exercício enviada.`)
      return res.status(200).json({ solution })
    }

    logger.warn(`[ExerciseSolverHandler] Método ${req.method} não permitido.`)
    res.setHeader('Allow', ['POST'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API do resolvedor de exercícios:')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return handleErrorResponse(
      res,
      500,
      `Erro interno do servidor ao resolver exercício: ${errorMessage}`,
    )
  }
}
