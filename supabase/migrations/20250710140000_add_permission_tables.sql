-- Create user_organization_roles table
CREATE TABLE public.user_organization_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL, -- e.g., 'owner', 'admin', 'member_read_write', 'member_read_only'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, organization_id)
);

-- Enable RLS for user_organization_roles
ALTER TABLE public.user_organization_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_organization_roles
CREATE POLICY "Allow authenticated users to read their roles"
ON public.user_organization_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow organization owners/admins to manage roles"
ON public.user_organization_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_organization_roles uor
        WHERE uor.user_id = auth.uid()
        AND uor.organization_id = user_organization_roles.organization_id
        AND uor.role IN ('owner', 'admin')
    )
);

-- Create shared_accounting_periods table
CREATE TABLE public.shared_accounting_periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    accounting_period_id uuid REFERENCES public.accounting_periods(id) ON DELETE CASCADE NOT NULL,
    shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_level text NOT NULL, -- e.g., 'read', 'write'
    shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Who shared it
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (accounting_period_id, shared_with_user_id)
);

-- Enable RLS for shared_accounting_periods
ALTER TABLE public.shared_accounting_periods ENABLE ROW LEVEL SECURITY;

-- Policies for shared_accounting_periods
CREATE POLICY "Allow authenticated users to read their shared periods"
ON public.shared_accounting_periods FOR SELECT
USING (auth.uid() = shared_with_user_id OR auth.uid() = shared_by_user_id);

CREATE POLICY "Allow period owner/org admin to manage shared periods"
ON public.shared_accounting_periods FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        JOIN public.user_organization_roles uor ON ap.organization_id = uor.organization_id
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND uor.user_id = auth.uid()
        AND uor.role IN ('owner', 'admin')
    )
);
