import { supabase } from '../../utils/supabaseClient.js'
import logger from '../../utils/logger.js'

export async function getNextReferenceNumber(
  prefix: string,
  organizationId: string,
  accountingPeriodId: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('reference_sequences')
      .select('last_number')
      .eq('prefix', prefix)
      .eq('organization_id', organizationId)
      .eq('accounting_period_id', accountingPeriodId)
      .single()

    let nextNumber = 1

    if (error && error.code === 'PGRST116') { // No rows found
      // Insert new sequence
      const { error: insertError } = await supabase.from('reference_sequences').insert({
        prefix,
        last_number: nextNumber,
        organization_id: organizationId,
        accounting_period_id: accountingPeriodId,
      })
      if (insertError) throw insertError
    } else if (error) {
      throw error
    } else if (data) {
      nextNumber = data.last_number + 1
      // Update existing sequence
      const { error: updateError } = await supabase
        .from('reference_sequences')
        .update({ last_number: nextNumber })
        .eq('prefix', prefix)
        .eq('organization_id', organizationId)
        .eq('accounting_period_id', accountingPeriodId)
      if (updateError) throw updateError
    }

    return nextNumber
  } catch (err) {
    logger.error(`Erro ao obter o próximo número de referência para ${prefix}:`, err)
    throw new Error(`Falha ao gerar número de referência: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
  }
}
