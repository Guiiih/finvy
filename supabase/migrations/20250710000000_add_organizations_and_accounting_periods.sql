-- Tabela de Organizações
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Períodos Contábeis
CREATE TABLE accounting_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, name),
    UNIQUE (organization_id, start_date, end_date)
);

-- Adicionar organization_id e active_accounting_period_id à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN active_accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE SET NULL;

-- Adicionar organization_id e accounting_period_id às tabelas financeiras
ALTER TABLE public.accounts
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.entry_lines
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

ALTER TABLE public.financial_transactions
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN accounting_period_id UUID REFERENCES accounting_periods(id) ON DELETE CASCADE;

-- Atualizar a função handle_new_user para criar uma organização e um período contábil padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_letter TEXT;
    avatar_svg TEXT;
    new_org_id UUID;
    new_period_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Extrai a primeira letra do nome, se disponível, ou usa 'U' como padrão
    IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND LENGTH(NEW.raw_user_meta_data->>'first_name') > 0 THEN
        first_letter := UPPER(SUBSTRING(NEW.raw_user_meta_data->>'first_name', 1, 1));
    ELSE
        first_letter := UPPER(SUBSTRING(NEW.email, 1, 1)); -- Fallback para a primeira letra do email
    END IF;

    -- Gera o SVG do avatar com fundo preto e texto branco
    avatar_svg :=
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' ||
        '<rect width="100" height="100" fill="#000000"/>' ||
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="60" font-weight="bold" fill="#FFFFFF">' || first_letter || '</text>' ||
        '</svg>';

    -- Cria uma nova organização para o usuário
    INSERT INTO public.organizations (name)
    VALUES (NEW.raw_user_meta_data->>'first_name' || ' Organization')
    RETURNING id INTO new_org_id;

    -- Cria um período contábil padrão para a nova organização (ex: ano atual)
    INSERT INTO public.accounting_periods (organization_id, name, start_date, end_date, is_active)
    VALUES (new_org_id, EXTRACT(YEAR FROM NOW())::TEXT || ' Fiscal Year', (EXTRACT(YEAR FROM NOW())::TEXT || '-01-01')::DATE, (EXTRACT(YEAR FROM NOW())::TEXT || '-12-31')::DATE, TRUE)
    RETURNING id INTO new_period_id;

    INSERT INTO public.profiles (id, username, role, avatar_url, organization_id, active_accounting_period_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'), new_org_id, new_period_id);

    -- Insere contas padrão para o novo usuário, vinculadas à nova organização e período
    INSERT INTO public.accounts (id, name, type, user_id, organization_id, accounting_period_id) VALUES
        (gen_random_uuid(), 'Cash', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Bank Account', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Accounts Receivable', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Inventory', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Equipment', 'asset', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Accounts Payable', 'liability', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Salaries Payable', 'liability', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Loans Payable', 'liability', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Owner''s Equity', 'equity', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Sales Revenue', 'revenue', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Service Revenue', 'revenue', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Cost of Goods Sold', 'expense', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Rent Expense', 'expense', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Utilities Expense', 'expense', NEW.id, new_org_id, new_period_id),
        (gen_random_uuid(), 'Salaries Expense', 'expense', NEW.id, new_org_id, new_period_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar a função delete_user_data para deletar dados da organização e períodos
CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
  -- Obtém o organization_id do usuário que está sendo deletado
  SELECT organization_id INTO user_org_id FROM public.profiles WHERE id = OLD.id;

  -- Deleta todos os dados associados ao usuário que está sendo deletado
  DELETE FROM public.accounts WHERE user_id = OLD.id;
  DELETE FROM public.journal_entries WHERE user_id = OLD.id;
  DELETE FROM public.financial_transactions WHERE user_id = OLD.id;
  DELETE FROM public.products WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE id = OLD.id;

  -- Se a organização não tiver mais usuários, deleta a organização e seus períodos
  IF user_org_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE organization_id = user_org_id) THEN
    DELETE FROM public.accounting_periods WHERE organization_id = user_org_id;
    DELETE FROM public.organizations WHERE id = user_org_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela "organizations"
CREATE POLICY "Organizations can be viewed by their members"
ON public.organizations FOR SELECT
TO authenticated
USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas de RLS para a tabela "accounting_periods"
CREATE POLICY "Accounting periods can be viewed by organization members"
ON public.accounting_periods FOR SELECT
TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Accounting periods can be inserted by organization members"
ON public.accounting_periods FOR INSERT
TO authenticated
WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Accounting periods can be updated by organization members"
ON public.accounting_periods FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Accounting periods can be deleted by organization members"
ON public.accounting_periods FOR DELETE
TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Atualizar políticas RLS existentes para incluir organization_id e accounting_period_id
-- As políticas existentes baseadas em user_id serão mantidas, mas adicionaremos a verificação de organização e período.

-- Função auxiliar para obter o organization_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Função auxiliar para obter o active_accounting_period_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_active_accounting_period_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT active_accounting_period_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Atualizar políticas para accounts
DROP POLICY IF EXISTS "Users can select their own accounts" ON public.accounts;
CREATE POLICY "Accounts can be viewed by organization members within their active period"
ON public.accounts FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
CREATE POLICY "Accounts can be inserted by organization members"
ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
CREATE POLICY "Accounts can be updated by organization members"
ON public.accounts FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
CREATE POLICY "Accounts can be deleted by organization members"
ON public.accounts FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

-- Atualizar políticas para products
DROP POLICY IF EXISTS "Users can select their own products" ON public.products;
CREATE POLICY "Products can be viewed by organization members within their active period"
ON public.products FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
CREATE POLICY "Products can be inserted by organization members"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Products can be updated by organization members"
ON public.products FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Products can be deleted by organization members"
ON public.products FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

-- Atualizar políticas para journal_entries
DROP POLICY IF EXISTS "Users can select their own journal entries" ON public.journal_entries;
CREATE POLICY "Journal entries can be viewed by organization members within their active period"
ON public.journal_entries FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.journal_entries;
CREATE POLICY "Journal entries can be inserted by organization members"
ON public.journal_entries FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
CREATE POLICY "Journal entries can be updated by organization members"
ON public.journal_entries FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.journal_entries;
CREATE POLICY "Journal entries can be deleted by organization members"
ON public.journal_entries FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

-- Políticas para entry_lines (dependem de journal_entries, então herdam a organização e período)
ALTER TABLE public.entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entry lines can be viewed by organization members within their active period"
ON public.entry_lines FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

CREATE POLICY "Entry lines can be inserted by organization members"
ON public.entry_lines FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

CREATE POLICY "Entry lines can be updated by organization members"
ON public.entry_lines FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

CREATE POLICY "Entry lines can be deleted by organization members"
ON public.entry_lines FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

-- Políticas para financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial transactions can be viewed by organization members within their active period"
ON public.financial_transactions FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

CREATE POLICY "Financial transactions can be inserted by organization members"
ON public.financial_transactions FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

CREATE POLICY "Financial transactions can be updated by organization members"
ON public.financial_transactions FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

CREATE POLICY "Financial transactions can be deleted by organization members"
ON public.financial_transactions FOR DELETE
TO authenticated
USING (organization_id = public.get_user_organization_id() AND accounting_period_id = public.get_user_active_accounting_period_id());

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
