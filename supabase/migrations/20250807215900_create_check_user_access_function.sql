-- supabase/migrations/20250807215900_create_check_user_access_function.sql

CREATE OR REPLACE FUNCTION public.check_user_access_to_journal_entry(entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_org_id UUID;
  entry_org_id UUID;
  entry_period_id UUID;
  user_active_period_id UUID;
BEGIN
  -- Get the organization_id and accounting_period_id of the journal entry
  SELECT organization_id, accounting_period_id
  INTO entry_org_id, entry_period_id
  FROM public.journal_entries
  WHERE id = entry_id;

  -- Get the user's current active organization and accounting period
  SELECT organization_id, id
  INTO user_org_id, user_active_period_id
  FROM public.accounting_periods
  WHERE is_active = TRUE AND user_id = auth.uid(); -- Assuming user_id is linked to accounting_periods

  -- Check if the user's active organization and period match the entry's organization and period
  RETURN (user_org_id = entry_org_id AND user_active_period_id = entry_period_id);
END;
$$;
