DO $$
DECLARE
  policy_name TEXT;
  table_name TEXT;
BEGIN
  -- Loop through tables to update RLS policies
  FOREACH table_name IN ARRAY ARRAY['accounts', 'products', 'journal_entries', 'entry_lines', 'financial_transactions']
  LOOP
    -- Drop existing policies if they exist
    policy_name := '"' || table_name || '_view_shared_org" ON public.' || table_name;
    EXECUTE 'DROP POLICY IF EXISTS ' || policy_name;
    policy_name := '"' || table_name || '_manage_shared_org" ON public.' || table_name;
    EXECUTE 'DROP POLICY IF EXISTS ' || policy_name;

    -- Create new policies
    EXECUTE 'CREATE POLICY "' || table_name || '_view_org_personal_shared"' || 
      ' ON public.' || table_name || ' FOR SELECT
      TO authenticated
      USING (
        (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id())
        OR
        (organization_id = public.get_personal_organization_id(auth.uid()))
        OR
        (accounting_period_id IN (SELECT sap.accounting_period_id FROM shared_accounting_periods sap WHERE sap.shared_with_user_id = auth.uid()))
      )';
    

    EXECUTE 'CREATE POLICY "' || table_name || '_insert_org_personal"' || 
      ' ON public.' || table_name || ' FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )';
    

    EXECUTE 'CREATE POLICY "' || table_name || '_update_org_personal"' || 
      ' ON public.' || table_name || ' FOR UPDATE
      TO authenticated
      USING (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )
      WITH CHECK (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )';
    

    EXECUTE 'CREATE POLICY "' || table_name || '_delete_org_personal"' || 
      ' ON public.' || table_name || ' FOR DELETE
      TO authenticated
      USING (
        organization_id = public.get_user_organization_id()
        OR
        organization_id = public.get_personal_organization_id(auth.uid())
      )';
  END LOOP;
END
$$;