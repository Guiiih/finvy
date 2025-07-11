


-- Drop existing RLS policies for tables that will be updated
-- This is crucial to avoid conflicts when creating new policies with the same name or for the same operation.

-- accounting_periods
DROP POLICY IF EXISTS "org_acct_periods_view" ON public.accounting_periods;
DROP POLICY IF EXISTS "org_acct_periods_insert" ON public.accounting_periods;
DROP POLICY IF EXISTS "org_acct_periods_update" ON public.accounting_periods;
DROP POLICY IF EXISTS "org_acct_periods_delete" ON public.accounting_periods;

-- accounts
DROP POLICY IF EXISTS "accounts_view_by_org_period" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_by_org_period" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_by_org_period" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_by_org_period" ON public.accounts;

-- products
DROP POLICY IF EXISTS "products_view_by_org_period" ON public.products;
DROP POLICY IF EXISTS "products_insert_by_org_period" ON public.products;
DROP POLICY IF EXISTS "products_update_by_org_period" ON public.products;
DROP POLICY IF EXISTS "products_delete_by_org_period" ON public.products;

-- journal_entries
DROP POLICY IF EXISTS "journal_entries_view_by_org_period" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert_by_org_period" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_update_by_org_period" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_delete_by_org_period" ON public.journal_entries;

-- entry_lines
DROP POLICY IF EXISTS "entry_lines_view_by_org_period" ON public.entry_lines;
DROP POLICY IF EXISTS "entry_lines_insert_by_org_period" ON public.entry_lines;
DROP POLICY IF EXISTS "entry_lines_update_by_org_period" ON public.entry_lines;
DROP POLICY IF EXISTS "entry_lines_delete_by_org_period" ON public.entry_lines;



-- organizations
DROP POLICY IF EXISTS "org_view_members" ON public.organizations;


-- Drop existing RLS policies for tables that will be updated
-- This is crucial to avoid conflicts when creating new policies with the same name or for the same operation.

-- accounting_periods
DROP POLICY IF EXISTS "org_acct_periods_view" ON public.accounting_periods;
DROP POLICY IF EXISTS "org_acct_periods_insert" ON public.accounting_periods;
DROP POLICY IF EXISTS "org_acct_periods_update" ON public.accounting_periods;
DROP POLICY IF EXISTS "org_acct_periods_delete" ON public.accounting_periods;

-- accounts
DROP POLICY IF EXISTS "accounts_view_by_org_period" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_by_org_period" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_by_org_period" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_by_org_period" ON public.accounts;

-- products
DROP POLICY IF EXISTS "products_view_by_org_period" ON public.products;
DROP POLICY IF EXISTS "products_insert_by_org_period" ON public.products;
DROP POLICY IF EXISTS "products_update_by_org_period" ON public.products;
DROP POLICY IF EXISTS "products_delete_by_org_period" ON public.products;

-- journal_entries
DROP POLICY IF EXISTS "journal_entries_view_by_org_period" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert_by_org_period" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_update_by_org_period" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_delete_by_org_period" ON public.journal_entries;

-- entry_lines
DROP POLICY IF EXISTS "entry_lines_view_by_org_period" ON public.entry_lines;
DROP POLICY IF EXISTS "entry_lines_insert_by_org_period" ON public.entry_lines;
DROP POLICY IF EXISTS "entry_lines_update_by_org_period" ON public.entry_lines;
DROP POLICY IF EXISTS "entry_lines_delete_by_org_period" ON public.entry_lines;



-- organizations
DROP POLICY IF EXISTS "org_view_members" ON public.organizations;


-- Re-create RLS policies with new logic

-- Policy for accounting_periods
CREATE POLICY "acct_periods_view_shared"
ON public.accounting_periods FOR SELECT
USING (
  -- User has a role in the organization of the period
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = accounting_periods.id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "acct_periods_insert_by_role"
ON public.accounting_periods FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
);

CREATE POLICY "acct_periods_update_by_role"
ON public.accounting_periods FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
);

CREATE POLICY "acct_periods_delete_by_role"
ON public.accounting_periods FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
);


-- Policies for organizations
CREATE POLICY "org_view_for_members"
ON public.organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = organizations.id
  )
);


-- Helper function to get the organization_id of a given accounting_period_id
-- This is useful for RLS policies on financial tables that reference accounting_period_id
CREATE OR REPLACE FUNCTION public.get_organization_id_from_period(p_accounting_period_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.accounting_periods WHERE id = p_accounting_period_id);
END;
$$;


-- Policies for financial tables (accounts, products, journal_entries, entry_lines, financial_transactions)
-- These policies will be similar, checking both organization roles and shared periods.

-- accounts
CREATE POLICY "accounts_view_shared_org"
ON public.accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(accounts.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write', 'member_read_only')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = accounts.accounting_period_id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "accounts_manage_shared_org"
ON public.accounts FOR ALL -- INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(accounts.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = accounts.accounting_period_id
    AND sap.permission_level = 'write'
  )
);

-- products
CREATE POLICY "products_view_shared_org"
ON public.products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(products.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write', 'member_read_only')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = products.accounting_period_id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "products_manage_shared_org"
ON public.products FOR ALL -- INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(products.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = products.accounting_period_id
    AND sap.permission_level = 'write'
  )
);

-- journal_entries
CREATE POLICY "journal_entries_view_shared_org"
ON public.journal_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(journal_entries.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write', 'member_read_only')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = journal_entries.accounting_period_id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "journal_entries_manage_shared_org"
ON public.journal_entries FOR ALL -- INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(journal_entries.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = journal_entries.accounting_period_id
    AND sap.permission_level = 'write'
  )
);

-- entry_lines
CREATE POLICY "entry_lines_view_shared_org"
ON public.entry_lines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(entry_lines.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write', 'member_read_only')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = entry_lines.accounting_period_id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "entry_lines_manage_shared_org"
ON public.entry_lines FOR ALL -- INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(entry_lines.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = entry_lines.accounting_period_id
    AND sap.permission_level = 'write'
  )
);

-- financial_transactions
CREATE POLICY "financial_trans_view_shared_org"
ON public.financial_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(financial_transactions.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write', 'member_read_only')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = financial_transactions.accounting_period_id
    AND sap.permission_level IN ('read', 'write')
  )
);

CREATE POLICY "financial_trans_manage_shared_org"
ON public.financial_transactions FOR ALL -- INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = public.get_organization_id_from_period(financial_transactions.accounting_period_id)
    AND uor.role IN ('owner', 'admin', 'member_read_write')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = financial_transactions.accounting_period_id
    AND sap.permission_level = 'write'
  )
);

-- Atualizar políticas para profiles (para permitir que usuários atualizem seu active_accounting_period_id)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Re-habilitar RLS para as tabelas que tiveram suas políticas atualizadas
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


set check_function_bodies = off;
