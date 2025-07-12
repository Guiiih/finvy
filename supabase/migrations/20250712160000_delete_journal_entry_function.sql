
CREATE OR REPLACE FUNCTION delete_journal_entry_and_lines(
    p_journal_entry_id UUID,
    p_user_id UUID,
    p_organization_id UUID,
    p_accounting_period_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_entries_count INT;
BEGIN
    -- Delete associated entry_lines first
    DELETE FROM public.entry_lines
    WHERE
        journal_entry_id = p_journal_entry_id AND
        organization_id = p_organization_id AND
        accounting_period_id = p_accounting_period_id;

    -- Delete the journal entry
    DELETE FROM public.journal_entries
    WHERE
        id = p_journal_entry_id AND
        user_id = p_user_id AND
        organization_id = p_organization_id AND
        accounting_period_id = p_accounting_period_id
    RETURNING 1 INTO deleted_entries_count;

    -- Check if the journal entry was actually deleted
    IF deleted_entries_count > 0 THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated role (or appropriate role)
GRANT EXECUTE ON FUNCTION delete_journal_entry_and_lines TO authenticated;
