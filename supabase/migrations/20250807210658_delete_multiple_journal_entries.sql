
CREATE OR REPLACE FUNCTION public.delete_multiple_journal_entries_and_lines(
    p_journal_entry_ids UUID[],
    p_organization_id UUID,
    p_accounting_period_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete associated entry_lines first
    DELETE FROM public.entry_lines
    WHERE journal_entry_id = ANY(p_journal_entry_ids)
    AND organization_id = p_organization_id
    AND accounting_period_id = p_accounting_period_id;

    -- Delete the journal_entries
    DELETE FROM public.journal_entries
    WHERE id = ANY(p_journal_entry_ids)
    AND organization_id = p_organization_id
    AND accounting_period_id = p_accounting_period_id;

    RETURN TRUE;
END;
$$;
