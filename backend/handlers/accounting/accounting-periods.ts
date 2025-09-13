import logger from '../../utils/logger.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  getSupabaseClient,
  handleErrorResponse,
  getUserOrganizationAndPeriod,
} from '../../utils/supabaseClient.js'
import { z } from 'zod'
import { formatSupabaseError } from '../../utils/errorUtils.js'
import { AccountingPeriod, TaxRegime } from '../../types/index.js'

interface MonthlyPeriod {
  organization_id: string
  fiscal_year: number
  start_date: string
  end_date: string
  regime: TaxRegime
  annex: string | null | undefined
  is_active: boolean
  period_type: 'monthly'
}

// Esquemas de validação para períodos contábeis
const createAccountingPeriodSchema = z.object({
  fiscal_year: z.number().int().min(1900).max(2100, 'Ano fiscal inválido.'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de início inválido. Use YYYY-MM-DD.'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de fim inválido. Use YYYY-MM-DD.'),
  regime: z.nativeEnum(TaxRegime, { invalid_type_error: 'Regime tributário inválido.' }),
  annex: z.string().optional().nullable(),
})

const updateAccountingPeriodSchema = z
  .object({
    fiscal_year: z.number().int().min(1900).max(2100, 'Ano fiscal inválido.').optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de início inválido. Use YYYY-MM-DD.')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de fim inválido. Use YYYY-MM-DD.')
      .optional(),
    regime: z
      .nativeEnum(TaxRegime, { invalid_type_error: 'Regime tributário inválido.' })
      .optional(),
    annex: z.string().optional().nullable(),
  })
  .partial()

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
  user_id: string,
  token: string,
) {
  logger.info(`[Accounting Periods] Recebida requisição para user_id: ${user_id}`)
  const userSupabase = getSupabaseClient(token)

  try {
    if (req.method === 'POST') {
      const parsedBody = createAccountingPeriodSchema.safeParse(req.body)
      if (!parsedBody.success) {
        logger.warn(
          `[Accounting Periods] Erro de validação do corpo da requisição: ${parsedBody.error.errors.map((err) => err.message).join(', ')}`,
        )
        return handleErrorResponse(
          res,
          400,
          parsedBody.error.errors.map((err) => err.message).join(', '),
        )
      }

      logger.info(`[Accounting Periods] Tentando obter organization_id para user_id: ${user_id}`)
      const { data: profile, error: profileError } = await userSupabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user_id)
        .single()

      if (profileError) {
        logger.error(
          `[Accounting Periods] Erro ao buscar perfil para user_id ${user_id}: ${profileError.message}`,
        )
        return handleErrorResponse(
          res,
          403,
          'Não foi possível determinar a organização do usuário.',
        )
      }

      if (!profile || !profile.organization_id) {
        logger.warn(
          `[Accounting Periods] Perfil encontrado, mas organization_id ausente para user_id: ${user_id}. Perfil: ${JSON.stringify(profile)}`,
        )
        return handleErrorResponse(
          res,
          403,
          'Não foi possível determinar a organização do usuário.',
        )
      }

      logger.info(
        `[Accounting Periods] organization_id encontrado para user_id ${user_id}: ${profile.organization_id}`,
      )
      const { organization_id } = profile
      const { fiscal_year, start_date, end_date, regime, annex } = parsedBody.data

      // Validação de sobreposição de datas para tax_regime_history
      const { data: existingRegimes, error: fetchError } = await userSupabase
        .from('tax_regime_history')
        .select('start_date, end_date')
        .eq('organization_id', organization_id)
        .order('start_date', { ascending: true })

      if (fetchError) {
        logger.error(
          `[Accounting Periods] Erro ao buscar regimes existentes para validação: ${fetchError.message}`,
        )
        throw fetchError
      }

      const newStartDate = new Date(start_date)
      const newEndDate = new Date(end_date)

      if (newStartDate > newEndDate) {
        return handleErrorResponse(
          res,
          400,
          'A data de início não pode ser posterior à data de fim.',
        )
      }

      for (const existing of existingRegimes) {
        const existingStartDate = new Date(existing.start_date)
        const existingEndDate = new Date(existing.end_date)

        // Check for overlap
        if (newStartDate <= existingEndDate && newEndDate >= existingStartDate) {
          return handleErrorResponse(
            res,
            400,
            'O período do regime tributário especificado se sobrepõe a um regime tributário existente.',
          )
        }
      }

      logger.info(
        `[Accounting Periods] Inserindo novo período contábil para organization_id: ${organization_id}`,
      )
      const { data: accountingPeriod, error: dbError } = await userSupabase
        .from('accounting_periods')
        .insert([
          { fiscal_year, start_date, end_date, organization_id, annex, period_type: 'yearly', regime },
        ])
        .select()
        .single()

      if (dbError) {
        logger.error(
          `[Accounting Periods] Erro ao inserir novo período contábil: ${dbError.message}`,
        )
        throw dbError
      }

      logger.info(
        `[Accounting Periods] Novo período contábil criado com sucesso: ${accountingPeriod.id}`,
      )

      // Automaticamente criar períodos mensais para o ano fiscal
      logger.info(`[Accounting Periods] Criando períodos mensais para o ano fiscal ${fiscal_year}`)
      const monthlyPeriodsToInsert: MonthlyPeriod[] = []
      // Use UTC para evitar problemas de fuso horário
      const startDate = new Date(`${start_date}T00:00:00Z`)
      const endDate = new Date(`${end_date}T00:00:00Z`)
      const currentMonth = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1),
      )

      while (currentMonth <= endDate) {
        const monthStartDate = new Date(
          Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1),
        )
        const monthEndDate = new Date(
          Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 0),
        )

        monthlyPeriodsToInsert.push({
          organization_id,
          fiscal_year,
          start_date: monthStartDate.toISOString().split('T')[0],
          end_date: monthEndDate.toISOString().split('T')[0],
          regime,
          annex,
          is_active: false, // Períodos mensais não são ativos por padrão
          period_type: 'monthly', // Adicionado
        })
        currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1)
      }

      if (monthlyPeriodsToInsert.length > 0) {
        const { error: monthlyPeriodsDbError } = await userSupabase
          .from('accounting_periods')
          .insert(monthlyPeriodsToInsert)

        if (monthlyPeriodsDbError) {
          logger.error(
            `[Accounting Periods] Erro ao inserir períodos mensais: ${monthlyPeriodsDbError.message}`,
          )
          // Não lançar erro fatal aqui, pois o período fiscal principal já foi criado
        }
      }

      // Inserir no tax_regime_history
      logger.info(
        `[Accounting Periods] Inserindo novo regime tributário para organization_id: ${organization_id}`,
      )
      const { data: taxRegimeHistory, error: taxDbError } = await userSupabase
        .from('tax_regime_history')
        .insert([{ organization_id, regime, start_date, end_date }])
        .select()
        .single()

      if (taxDbError) {
        logger.error(
          `[Accounting Periods] Erro ao inserir novo regime tributário: ${taxDbError.message}`,
        )
        // Consider rolling back accounting period creation if tax regime history fails
        throw taxDbError
      }
      logger.info(
        `[Accounting Periods] Novo regime tributário criado com sucesso: ${taxRegimeHistory.id}`,
      )

      return res.status(201).json({
        accountingPeriod,
        taxRegimeHistory,
      })
    } else {
      logger.info(
        `[Accounting Periods] Tentando obter organização e período para user_id: ${user_id} (GET/PUT/DELETE)`,
      )
      const userOrgAndPeriod = await getUserOrganizationAndPeriod(user_id, token)
      if (!userOrgAndPeriod) {
        logger.warn(
          `[Accounting Periods] Organização ou período contábil não encontrado para user_id: ${user_id} (GET/PUT/DELETE)`,
        )
        return handleErrorResponse(
          res,
          403,
          'Organização ou período contábil não encontrado para o usuário.',
        )
      }
      logger.info(
        `[Accounting Periods] Organização e período encontrados para user_id ${user_id}: Org ID ${userOrgAndPeriod.organization_id}, Period ID ${userOrgAndPeriod.active_accounting_period_id}`,
      )
      const { organization_id } = userOrgAndPeriod
      logger.info(`[Accounting Periods] User auth.uid(): ${user_id}`);
      logger.info(`[Accounting Periods] User profiles.organization_id from getUserOrganizationAndPeriod: ${organization_id}`);

      // Explicitly fetch organization_id from profiles table for RLS verification
      const { data: profileOrg, error: profileOrgError } = await userSupabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user_id)
        .single();

      if (profileOrgError || !profileOrg) {
        logger.error(`[Accounting Periods] Erro ao buscar organization_id do perfil para RLS: ${profileOrgError?.message || 'Perfil não encontrado.'}`);
        return handleErrorResponse(res, 500, 'Erro interno: Não foi possível verificar permissões de organização.');
      }
      logger.info(`[Accounting Periods] User profiles.organization_id directly from profiles table: ${profileOrg.organization_id}`);

      if (req.method === 'GET') {
        logger.info(
          `[Accounting Periods] Buscando períodos contábeis para organization_id: ${organization_id}`,
        )
        const { data, error: dbError } = await userSupabase
          .from('accounting_periods')
          .select('id, fiscal_year, start_date, end_date, annex, period_type')
          .eq('organization_id', organization_id)
          .order('start_date', { ascending: false })

        if (dbError) {
          logger.error(`[Accounting Periods] Erro ao buscar períodos contábeis: ${dbError.message}`)
          throw dbError
        }
        logger.info(`[Accounting Periods] Períodos contábeis encontrados: ${data.length}`)
        return res.status(200).json(data)
      } else if (req.method === 'PUT') {
        const id = req.url?.split('?')[0].split('/').pop() as string
        logger.info(
          `[Accounting Periods] Atualizando período contábil ${id} para organization_id: ${organization_id}`,
        )
        const parsedBody = updateAccountingPeriodSchema.safeParse(req.body)
        if (!parsedBody.success) {
          logger.warn(
            `[Accounting Periods] Erro de validação do corpo da requisição PUT: ${parsedBody.error.errors.map((err) => err.message).join(', ')}`,
          )
          return handleErrorResponse(
            res,
            400,
            parsedBody.error.errors.map((err) => err.message).join(', '),
          )
        }
        const updateData = parsedBody.data
        const newRegime = updateData.regime

        const accountingPeriodUpdateData: Partial<AccountingPeriod> = {}
        if (updateData.fiscal_year !== undefined)
          accountingPeriodUpdateData.fiscal_year = updateData.fiscal_year
        if (updateData.start_date !== undefined)
          accountingPeriodUpdateData.start_date = updateData.start_date
        if (updateData.end_date !== undefined)
          accountingPeriodUpdateData.end_date = updateData.end_date
        if (updateData.annex !== undefined) accountingPeriodUpdateData.annex = updateData.annex
        if (newRegime !== undefined) accountingPeriodUpdateData.regime = newRegime;
        // If regime is not Simples Nacional, ensure annex is null
        if (newRegime && newRegime !== 'simples_nacional') {
          accountingPeriodUpdateData.annex = null;
        }

        if (Object.keys(accountingPeriodUpdateData).length === 0 && !newRegime) {
          logger.warn(
            `[Accounting Periods] Nenhuma campo para atualizar fornecido para período ${id}`,
          )
          return handleErrorResponse(res, 400, 'Nenhum campo para atualizar fornecido.')
        }

        // Fetch current accounting period to get original dates if not updated
        logger.info(`[Accounting Periods] Buscando período contábil atual ${id} para PUT.`);
        const { data: currentPeriod, error: fetchCurrentPeriodError } = await userSupabase
          .from('accounting_periods')
          .select('fiscal_year, start_date, end_date, annex, regime')
          .eq('id', id)
          .single()

        if (fetchCurrentPeriodError || !currentPeriod) {
          logger.error(
            `[Accounting Periods] Erro ao buscar período contábil atual ${id}: ${fetchCurrentPeriodError?.message || 'Período contábil não encontrado.'}`,
          )
          return handleErrorResponse(res, 404, `Período contábil não encontrado: ${fetchCurrentPeriodError?.message || 'Detalhes desconhecidos.'}`)
        }

        const newStartDate = updateData.start_date || currentPeriod.start_date
        const newEndDate = updateData.end_date || currentPeriod.end_date

        // Validação de sobreposição de datas para tax_regime_history no PUT
        if (newRegime || updateData.start_date || updateData.end_date) {
          logger.info(`[Accounting Periods] Buscando taxRegimeToUpdate para PUT.`);
          const { data: taxRegimeToUpdate } = await userSupabase
            .from('tax_regime_history')
            .select('id, regime') // Select regime to compare
            .eq('organization_id', organization_id)
            .eq('start_date', currentPeriod.start_date)
            .eq('end_date', currentPeriod.end_date)
            .single()
          logger.info(`[Accounting Periods] taxRegimeToUpdate: ${JSON.stringify(taxRegimeToUpdate)}`);

          logger.info(`[Accounting Periods] Buscando existingRegimes para PUT.`);
          let query = userSupabase
            .from('tax_regime_history')
            .select('id, start_date, end_date')
            .eq('organization_id', organization_id);

          // Conditionally add the .neq clause back
          if (taxRegimeToUpdate?.id) {
            query = query.neq('id', taxRegimeToUpdate.id);
          }

          const { data: existingRegimes, error: fetchError } = await query;
          logger.info(`[Accounting Periods] existingRegimes: ${JSON.stringify(existingRegimes)}`);

          if (fetchError) {
            logger.error(
              `[Accounting Periods] Erro ao buscar regimes existentes para PUT: ${fetchError.message}`,
            )
            return handleErrorResponse(res, 500, `Erro ao buscar regimes existentes: ${fetchError.message}`)
          }

          const updatedStartDate = new Date(newStartDate)
          const updatedEndDate = new Date(newEndDate)

          if (updatedStartDate > updatedEndDate) {
            return handleErrorResponse(
              res,
              400,
              'A data de início não pode ser posterior à data de fim.',
            )
          }

          // Only iterate if existingRegimes is not null and is an array
          if (existingRegimes) {
            for (const existing of existingRegimes) {
              const existingStartDate = new Date(existing.start_date)
              const existingEndDate = new Date(existing.end_date)

              if (updatedStartDate <= existingEndDate && updatedEndDate >= existingStartDate) {
                return handleErrorResponse(
                  res,
                  400,
                  `O período do regime tributário atualizado se sobrepõe a um regime tributário existente: ${existing.start_date} a ${existing.end_date}`,
                )
              }
            }
          }

          // Atualizar ou inserir no tax_regime_history
          logger.info(`[Accounting Periods] Organization ID for tax_regime_history update/insert: ${organization_id}`);

          // Delete existing tax regime history entry if found
          if (taxRegimeToUpdate) {
            logger.info(`[Accounting Periods] Deletando regime tributário existente para PUT: ${taxRegimeToUpdate.id}`);
            const { error: deleteTaxError, count: deletedTaxCount } = await userSupabase
              .from('tax_regime_history')
              .delete()
              .eq('id', taxRegimeToUpdate.id);

            if (deleteTaxError) {
              logger.error(
                `[Accounting Periods] Erro ao deletar regime tributário existente: ${deleteTaxError.message}`,
              );
              return handleErrorResponse(res, 500, `Erro ao deletar regime tributário existente: ${deleteTaxError.message}`);
            }
            if (deletedTaxCount === 0) {
              logger.warn(`[Accounting Periods] RLS pode ter bloqueado a exclusão do regime tributário para ${taxRegimeToUpdate.id}.`);
              // Continue, but log a warning, as the delete might have been blocked by RLS
            }
          }

          // Always insert a new tax regime history entry if a new regime is provided or dates changed
          if (newRegime || updateData.start_date || updateData.end_date) {
            logger.info(`[Accounting Periods] Inserindo novo regime tributário para PUT.`);
            logger.info(`[Accounting Periods] Insert values: regime=${newRegime}, start_date=${newStartDate}, end_date=${newEndDate}, annex=${updateData.annex}`);

            const { error: insertTaxError } = await userSupabase.from('tax_regime_history').insert({
              organization_id,
              regime: newRegime || currentPeriod.regime, // Use newRegime if provided, else currentPeriod's regime
              start_date: newStartDate,
              end_date: newEndDate,
            })

            if (insertTaxError) {
              logger.error(
                `[Accounting Periods] Erro ao inserir novo regime tributário: ${insertTaxError.message}`,
              )
              return handleErrorResponse(res, 500, `Erro ao inserir novo regime tributário: ${insertTaxError.message}`)
            }
          }
        }

        logger.info(`[Accounting Periods] Atualizando período contábil no banco de dados para PUT.`);
        const { data, error: dbError } = await userSupabase
          .from('accounting_periods')
          .update(accountingPeriodUpdateData)
          .eq('id', id)
          .eq('organization_id', organization_id)
          .select()
          .single()

        if (dbError) {
          logger.error(
            `[Accounting Periods] Erro ao atualizar período contábil ${id}: ${dbError.message}`,
          )
          return handleErrorResponse(res, 500, `Erro ao atualizar período contábil: ${dbError.message}`)
        }
        if (!data) {
          logger.warn(
            `[Accounting Periods] Período contábil ${id} não encontrado ou sem permissão para atualizar.`,
          )
          return handleErrorResponse(
            res,
            404,
            `Período contábil ${id} não encontrado ou você não tem permissão para atualizar este período.`,
          )
        }
        logger.info(`[Accounting Periods] Período contábil ${id} atualizado com sucesso.`)

        // Update associated monthly periods if the annual period's regime or annex changed
        if (newRegime !== undefined || updateData.annex !== undefined) {
          logger.info(`[Accounting Periods] Atualizando períodos mensais associados para o ano fiscal ${currentPeriod.fiscal_year}.`);
          const { error: monthlyUpdateError } = await userSupabase
            .from('accounting_periods')
            .update({
              regime: newRegime || currentPeriod.regime,
              annex: (newRegime && newRegime !== 'simples_nacional') ? null : (updateData.annex || currentPeriod.annex),
            })
            .eq('organization_id', organization_id)
            .eq('fiscal_year', currentPeriod.fiscal_year)
            .eq('period_type', 'monthly');

          if (monthlyUpdateError) {
            logger.error(
              `[Accounting Periods] Erro ao atualizar períodos mensais associados: ${monthlyUpdateError.message}`,
            );
            // Do not return error here, as the main annual period update was successful
          }
        }

        return res.status(200).json(data)
      } else if (req.method === 'DELETE') {
        const id = req.url?.split('?')[0].split('/').pop() as string
        logger.info(
          `[Accounting Periods] Deletando período contábil ${id} para organization_id: ${organization_id}`,
        )

        // Fetch the accounting period to get its start_date and end_date
        const { data: accountingPeriodToDelete, error: fetchPeriodError } = await userSupabase
          .from('accounting_periods')
          .select('fiscal_year, start_date, end_date, annex, regime, period_type') // Added period_type
          .eq('id', id)
          .single()

        if (fetchPeriodError || !accountingPeriodToDelete) {
          logger.error(
            `[Accounting Periods] Erro ao buscar período contábil ${id} para exclusão: ${fetchPeriodError?.message || 'Período contábil não encontrado.'}`,
          )
          return handleErrorResponse(
            res,
            404,
            'Período contábil não encontrado ou você não tem permissão para deletar este período.',
          )
        }

        // If the period to delete is a yearly period, delete its associated monthly periods
        if (accountingPeriodToDelete.period_type === 'yearly') {
          logger.info(`[Accounting Periods] Deletando períodos mensais associados ao ano fiscal ${accountingPeriodToDelete.fiscal_year}.`);
          const { error: deleteMonthlyPeriodsError, count: monthlyPeriodsCount } = await userSupabase
            .from('accounting_periods')
            .delete()
            .eq('organization_id', organization_id)
            .eq('fiscal_year', accountingPeriodToDelete.fiscal_year)
            .eq('period_type', 'monthly');

          if (deleteMonthlyPeriodsError) {
            logger.error(
              `[Accounting Periods] Erro ao deletar períodos mensais associados: ${deleteMonthlyPeriodsError.message}`,
            );
            // Do not throw error here, as the main annual period deletion should still proceed
          } else {
            logger.info(`[Accounting Periods] ${monthlyPeriodsCount} períodos mensais associados deletados.`);
          }
        }

        // Delete corresponding tax_regime_history entry
        const { error: deleteTaxRegimeError, count: taxRegimeCount } = await userSupabase
          .from('tax_regime_history')
          .delete()
          .eq('organization_id', organization_id)
          .eq('start_date', accountingPeriodToDelete.start_date)
          .eq('end_date', accountingPeriodToDelete.end_date)

        if (deleteTaxRegimeError) {
          logger.error(
            `[Accounting Periods] Erro ao deletar regime tributário associado ao período ${id}: ${deleteTaxRegimeError.message}`,
          )
          throw deleteTaxRegimeError
        }
        if (taxRegimeCount === 0) {
          logger.warn(
            `[Accounting Periods] Nenhum regime tributário associado encontrado para o período ${id}.`,
          )
        }

        // Logic to set previous period as active if the deleted one was active
        const { data: userProfile, error: profileFetchError } = await userSupabase
          .from('profiles')
          .select('active_accounting_period_id, organization_id')
          .eq('id', user_id)
          .single();

        if (profileFetchError) {
          logger.error(`[Accounting Periods] Erro ao buscar perfil do usuário para verificar período ativo: ${profileFetchError.message}`);
          // Continue, as the main delete was successful
        } else if (userProfile && userProfile.active_accounting_period_id === id) {
          // The deleted period was the active one for this user
          logger.info(`[Accounting Periods] Período deletado ${id} era o período ativo do usuário. Buscando próximo período ativo.`);

          const { data: previousPeriods, error: previousPeriodsError } = await userSupabase
            .from('accounting_periods')
            .select('id')
            .eq('organization_id', userProfile.organization_id)
            .eq('period_type', 'yearly') // Assuming we want to find the previous yearly period
            .lt('start_date', accountingPeriodToDelete.start_date) // Find periods before the deleted one
            .order('start_date', { ascending: false }) // Get the most recent previous one
            .limit(1);

          if (previousPeriodsError) {
            logger.error(`[Accounting Periods] Erro ao buscar períodos anteriores: ${previousPeriodsError.message}`);
          }

          let newActivePeriodId: string | null = null;
          if (previousPeriods && previousPeriods.length > 0) {
            newActivePeriodId = previousPeriods[0].id;
            logger.info(`[Accounting Periods] Definindo período ${newActivePeriodId} como novo período ativo.`);
          } else {
            logger.info(`[Accounting Periods] Nenhum período anterior encontrado para definir como ativo.`);
          }

          // FIRST: Update user_presence to reflect the change in active_accounting_period_id
          const { error: updateUserPresenceError } = await userSupabase
            .from('user_presence')
            .update({ active_accounting_period_id: newActivePeriodId })
            .eq('user_id', user_id);

          if (updateUserPresenceError) {
            logger.error(`[Accounting Periods] Erro ao atualizar período ativo na presença do usuário: ${updateUserPresenceError.message}`);
            // Do not throw error here, as the main annual period update was successful
          } else {
            logger.info(`[Accounting Periods] Período ativo na presença do usuário atualizado para ${newActivePeriodId || 'NULL'}.`);
          }

          // THEN: Update profiles table
          const { error: updateProfileError } = await userSupabase
            .from('profiles')
            .update({ active_accounting_period_id: newActivePeriodId })
            .eq('id', user_id);

          if (updateProfileError) {
            logger.error(`[Accounting Periods] Erro ao atualizar período ativo no perfil do usuário: ${updateProfileError.message}`);
          } else {
            logger.info(`[Accounting Periods] Período ativo do usuário atualizado para ${newActivePeriodId || 'NULL'}.`);
          }
        }

        const { error: dbError, count } = await userSupabase
          .from('accounting_periods')
          .delete()
          .eq('id', id)
          .eq('organization_id', organization_id)

        if (dbError) {
          logger.error(
            `[Accounting Periods] Erro ao deletar período contábil ${id}: ${dbError.message}`,
          )
          throw dbError
        }
        if (count === 0) {
          logger.warn(
            `[Accounting Periods] Período contábil ${id} não encontrado ou sem permissão para deletar.`,
          )
          return handleErrorResponse(
            res,
            404,
            'Período contábil não encontrado ou você não tem permissão para deletar este período.',
          )
        }
        logger.info(`[Accounting Periods] Período contábil ${id} deletado com sucesso.`);

        return res.status(204).send('')
      }
    }

    logger.warn(`[Accounting Periods] Método ${req.method} não permitido.`)
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return handleErrorResponse(res, 405, `Method ${req.method} Not Allowed`)
  } catch (error: unknown) {
    logger.error({ error }, 'Erro inesperado na API de períodos contábeis:')
    const message = formatSupabaseError(error)
    return handleErrorResponse(res, 500, message)
  }
}
