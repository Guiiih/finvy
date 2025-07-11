-- Drop the problematic RLS policy that was FOR ALL
DROP POLICY IF EXISTS "shared_acct_periods_manage_admin" ON public.shared_accounting_periods;

-- Recreate the policy specifically for INSERT, UPDATE, DELETE operations
-- This policy allows organization owners/admins to manage shared periods for their organization's periods.
CREATE POLICY "shared_acct_periods_manage_admin"
ON public.shared_accounting_periods FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);
