DROP POLICY IF EXISTS "Allow organization owners/admins to manage roles" ON public.user_organization_roles;

CREATE POLICY "Owners/Admins can insert roles"
ON public.user_organization_roles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_organization_roles uor_check
        WHERE uor_check.user_id = auth.uid()
        AND uor_check.organization_id = organization_id
        AND uor_check.role IN ('owner', 'admin')
    )
);

CREATE POLICY "Owners/Admins can update roles"
ON public.user_organization_roles FOR UPDATE
USING (
    can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can delete roles"
ON public.user_organization_roles FOR DELETE
USING (
    can_manage_organization_role(auth.uid(), organization_id)
);