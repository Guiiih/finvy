-- Drop existing problematic policies (including FOR ALL ones)
DROP POLICY IF EXISTS "Allow organization owners/admins to manage roles" ON public.user_organization_roles;
DROP POLICY IF EXISTS "Allow organization owners/admins to manage roles (IUD)" ON public.user_organization_roles; -- If it exists from previous attempt

DROP POLICY IF EXISTS "Allow period owner/org admin to manage shared periods" ON public.shared_accounting_periods;
DROP POLICY IF EXISTS "Allow period owner/org admin to manage shared periods (IUD)" ON public.shared_accounting_periods; -- If it exists from previous attempt


-- Policies for user_organization_roles
-- SELECT policy (should already be there and correct, but for completeness)
-- CREATE POLICY "Allow authenticated users to read their roles"
-- ON public.user_organization_roles FOR SELECT
-- USING (auth.uid() = user_id);

-- INSERT policy for user_organization_roles
CREATE POLICY "Allow organization owners/admins to insert roles"
ON public.user_organization_roles FOR INSERT
WITH CHECK (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
);

-- UPDATE policy for user_organization_roles
CREATE POLICY "Allow organization owners/admins to update roles"
ON public.user_organization_roles FOR UPDATE
USING (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
)
WITH CHECK (
    public.is_org_admin_or_owner(user_organization_roles.organization_id)
);

-- DELETE policy for user_organization_roles
CREATE POLICY "Allow organization owners/admins to delete roles"
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
CREATE POLICY "Allow period owner/org admin to insert shared periods"
ON public.shared_accounting_periods FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

-- UPDATE policy for shared_accounting_periods (less common, but for completeness)
CREATE POLICY "Allow period owner/org admin to update shared periods"
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
CREATE POLICY "Allow period owner/org admin to delete shared periods"
ON public.shared_accounting_periods FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);
