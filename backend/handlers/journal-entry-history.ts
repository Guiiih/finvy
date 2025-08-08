import { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../utils/supabaseClient.js'

export const getJournalEntryHistory = async (req: VercelRequest, res: VercelResponse, entryId: string) => {
  const { id } = req.query

  try {
    const { data, error } = await supabase
      .from('journal_entry_history')
      .select('*')
      .eq('journal_entry_id', entryId)
      .order('changed_at', { ascending: false })

    if (error) throw error

    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
