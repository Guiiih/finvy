DROP POLICY IF EXISTS "Allow organization owners/admins to manage roles" ON public.user_organization_roles;

CREATE POLICY "Owners/Admins can insert roles"
ON public.user_organization_roles FOR INSERT
WITH CHECK (FALSE);

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