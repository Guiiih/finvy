-- Migração: Habilita RLS e cria políticas

-- Habilita RLS para as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_regime_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculation_history ENABLE ROW LEVEL SECURITY;


-- Políticas de RLS
-- Políticas para organizações
CREATE POLICY "org_view_for_members"
ON public.organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = organizations.id
  )
);

CREATE POLICY "org_insert_auth_users"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas para períodos contábeis
CREATE POLICY "acct_periods_view_shared"
ON public.accounting_periods FOR SELECT
USING (
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
    AND uor.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "acct_periods_update_by_role"
ON public.accounting_periods FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "acct_periods_delete_by_role"
ON public.accounting_periods FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = accounting_periods.organization_id
    AND uor.role IN ('owner', 'admin', 'member')
  )
);

-- Políticas para user_organization_roles
CREATE POLICY "Users can view their own roles" ON public.user_organization_roles
FOR SELECT USING (
    auth.uid() = user_id
);

CREATE POLICY "Owners/Admins can view all organization members" ON public.user_organization_roles
FOR SELECT USING (
    public.can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "All members can view organization members" ON public.user_organization_roles
FOR SELECT USING (
    public.is_member_of_any_organization(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can insert roles" ON public.user_organization_roles
FOR INSERT
WITH CHECK (
    can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can update roles" ON public.user_organization_roles
FOR UPDATE
USING (
    can_manage_organization_role(auth.uid(), organization_id)
);

CREATE POLICY "Owners/Admins can delete roles" ON public.user_organization_roles
FOR DELETE
USING (
    can_manage_organization_role(auth.uid(), organization_id)
);

-- Políticas para shared_accounting_periods
CREATE POLICY "shared_acct_periods_read_self"
ON public.shared_accounting_periods FOR SELECT
USING (auth.uid() = shared_with_user_id OR auth.uid() = shared_by_user_id);

CREATE POLICY "shared_acct_periods_insert_admin"
ON public.shared_accounting_periods FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

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

CREATE POLICY "shared_acct_periods_delete_admin"
ON public.shared_accounting_periods FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.accounting_periods ap
        WHERE ap.id = shared_accounting_periods.accounting_period_id
        AND public.is_org_admin_or_owner(ap.organization_id)
    )
);

-- Políticas para perfis
-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios perfis (excluindo a role, que será atualizada apenas por admins)
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admins podem atualizar qualquer perfil (incluindo a role)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Políticas para tabelas financeiras (accounts, products, journal_entries, entry_lines, financial_transactions)
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['accounts', 'products', 'journal_entries', 'entry_lines', 'financial_transactions']
  LOOP
    -- Política de SELECT: Permite ver dados de qualquer organização da qual é membro
    -- ou qualquer período contábil compartilhado.
    EXECUTE format('
CREATE POLICY "%s_view_for_members_and_shared"
ON public.%s FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles uor
    WHERE uor.user_id = auth.uid()
    AND uor.organization_id = %I.organization_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.shared_accounting_periods sap
    WHERE sap.shared_with_user_id = auth.uid()
    AND sap.accounting_period_id = %I.accounting_period_id
  )
);
', table_name, table_name, table_name, table_name);

    -- Políticas de INSERT, UPDATE, DELETE: Mantêm a restrição à organização ativa do usuário
    -- ou à sua organização pessoal, para garantir que o usuário só possa modificar dados
    -- dentro do contexto de sua organização principal ou pessoal.
    EXECUTE format('
CREATE POLICY "%s_insert_org_active_personal"
ON public.%s FOR INSERT
TO authenticated
WITH CHECK (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
);
', table_name, table_name, table_name, table_name);

    EXECUTE format('
CREATE POLICY "%s_update_org_active_personal"
ON public.%s FOR UPDATE
TO authenticated
USING (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
)
WITH CHECK (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
);
', table_name, table_name, table_name, table_name, table_name, table_name);

    EXECUTE format('
CREATE POLICY "%s_delete_org_active_personal"
ON public.%s FOR DELETE
TO authenticated
USING (
  %I.organization_id = public.get_user_organization_id()
  OR
  %I.organization_id = public.get_personal_organization_id(auth.uid())
);
', table_name, table_name, table_name, table_name);
  END LOOP;
END
$$;

-- Adiciona políticas RLS para tax_settings
CREATE POLICY "Organizations can view their own tax settings." ON tax_settings
  FOR SELECT USING (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

CREATE POLICY "Organizations can insert their own tax settings." ON tax_settings
  FOR INSERT WITH CHECK (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

CREATE POLICY "Organizations can update their own tax settings." ON tax_settings
  FOR UPDATE USING (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

CREATE POLICY "Organizations can delete their own tax settings." ON tax_settings
  FOR DELETE USING (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

-- Policy for users to view their own organization's tax regime history
CREATE POLICY "Users can view their own organization's tax regime history" ON tax_regime_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);

-- Policy for users to insert tax regime history for their own organization
CREATE POLICY "Users can insert tax regime history for their own organization" ON tax_regime_history
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);

-- Policy for users to update tax regime history for their own organization
CREATE POLICY "Users can update tax regime history for their own organization" ON tax_regime_history
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);

-- Policy for users to delete tax regime history for their own organization
CREATE POLICY "Users can delete tax regime history for their own organization" ON tax_regime_history
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);


CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);


CREATE POLICY "Users can view user presence" ON public.user_presence
FOR SELECT USING (true); -- Adjust this policy if you want to restrict visibility

CREATE POLICY "Users can insert their own presence" ON public.user_presence
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence" ON public.user_presence
FOR UPDATE USING (auth.uid() = user_id);

-- Adiciona RLS (Row Level Security) para a tabela reference_sequences

-- Políticas de segurança para reference_sequences
CREATE POLICY "Enable read access for all users" ON reference_sequences
  FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users based on organization_id" ON reference_sequences
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));

CREATE POLICY "Enable update for authenticated users based on organization_id" ON reference_sequences
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));

CREATE POLICY "Enable delete for authenticated users based on organization_id" ON reference_sequences
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));

-- RLS Policies for the new table

CREATE POLICY "Allow read access to users who can access the journal entry" ON public.journal_entry_history FOR
SELECT
  USING (
    (
      SELECT
        check_user_access_to_journal_entry (journal_entry_id)
    )
  );

-- RLS for tax_rules
CREATE POLICY "Allow full access to own organization tax rules" 
ON tax_rules 
FOR ALL 
USING (check_user_organization_access(organization_id));

-- Add RLS policies for the new table

CREATE POLICY "Allow full access to own tax history"
ON tax_calculation_history
FOR ALL
USING (auth.uid() = user_id);