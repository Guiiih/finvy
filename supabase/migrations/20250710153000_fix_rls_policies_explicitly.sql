-- Drop existing problematic policies (including FOR ALL ones)
DROP POLICY IF EXISTS "user_org_roles_manage_admin" ON public.user_organization_roles;

DROP POLICY IF EXISTS "shared_acct_periods_manage_admin" ON public.shared_accounting_periods;


-- Policies for user_organization_roles
-- SELECT policy (should already be there and correct, but for completeness)
-- CREATE POLICY "Allow authenticated users to read their roles"
-- ON public.user_organization_roles FOR SELECT
-- USING (auth.uid() = user_id);

-- INSERT policy for user_organization_roles
CREATE POLICY "user_org_roles_insert_admin"
ON public.user_organization_roles FOR INSERT
WITH CHECK (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
);

-- UPDATE policy for user_organization_roles
CREATE POLICY "user_org_roles_update_admin"
ON public.user_organization_roles FOR UPDATE
USING (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
)
WITH CHECK (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
);

-- DELETE policy for user_organization_roles
CREATE POLICY "user_org_roles_delete_admin"
ON public.user_organization_roles FOR DELETE
USING (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
);


-- Policies for shared_accounting_periods
-- SELECT policy (should already be there and correct, but for completeness)
-- CREATE POLICY "Allow authenticated users to read their shared periods"
-- ON public.shared_accounting_periods FOR SELECT
-- USING (auth.uid() = shared_with_user_id OR auth.uid() = shared_by_user_id);

-- INSERT policy for shared_accounting_periods
CREATE POLICY "shared_acct_periods_insert_admin"
ON public.shared_accounting_periods FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

-- UPDATE policy for shared_accounting_periods (less common, but for completeness)
CREATE POLICY "shared_acct_periods_update_admin"
ON public.shared_accounting_periods FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

-- DELETE policy for shared_accounting_periods
CREATE POLICY "shared_acct_periods_delete_admin"
ON public.shared_accounting_periods FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);
