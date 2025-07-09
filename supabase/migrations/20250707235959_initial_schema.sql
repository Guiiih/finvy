-- Tabela de Contas
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    code SERIAL,
    parent_account_id UUID REFERENCES accounts(id)
);

-- Tabela de Produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_cost NUMERIC(10, 2) NOT NULL,
    current_stock INTEGER NOT NULL,
    icms_rate NUMERIC(5, 2) DEFAULT 0,
    user_id UUID REFERENCES auth.users(id)
);

-- Tabela de Lançamentos Contábeis
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id)
);

-- Tabela de Linhas dos Lançamentos
CREATE TABLE entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    debit NUMERIC(10, 2) DEFAULT 0,
    credit NUMERIC(10, 2) DEFAULT 0,
    product_id UUID REFERENCES products(id),
    quantity INTEGER,
    unit_cost NUMERIC(10, 2),
    ipi_rate NUMERIC,
    pis_rate NUMERIC,
    cofins_rate NUMERIC,
    mva_rate NUMERIC,
    icms_st_value NUMERIC,
    ipi_value NUMERIC,
    pis_value NUMERIC,
    cofins_value NUMERIC,
    icms_value NUMERIC,
    total_gross NUMERIC,
    total_net NUMERIC,
    transaction_type VARCHAR(50)
);

CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Ex: 'income', 'expense', 'payment'
    description TEXT,
    account_id UUID REFERENCES accounts(id), -- Opcional: Para vincular a uma conta contábil
    user_id UUID REFERENCES auth.users(id)
);

-- Habilita a Row-Level Security para cada tabela
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Políticas para a tabela "accounts"
--
-- 1. Permite que utilizadores leiam as suas próprias contas
CREATE POLICY "Users can select their own accounts"
ON public.accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Permite que utilizadores insiram novas contas para si mesmos
CREATE POLICY "Users can insert their own accounts"
ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Permite que utilizadores atualizem as suas próprias contas
CREATE POLICY "Users can update their own accounts"
ON public.accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Permite que utilizadores apaguem as suas próprias contas
CREATE POLICY "Users can delete their own accounts"
ON public.accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


--
-- Políticas para a tabela "products"
--
-- 1. Permite que utilizadores leiam os seus próprios produtos
CREATE POLICY "Users can select their own products"
ON public.products FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Permite que utilizadores insiram novos produtos para si mesmos
CREATE POLICY "Users can insert their own products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Permite que utilizadores atualizem os seus próprios produtos
CREATE POLICY "Users can update their own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Permite que utilizadores apaguem os seus próprios produtos
CREATE POLICY "Users can delete their own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


--
-- Políticas para a tabela "journal_entries"
--
-- 1. Permite que utilizadores leiam as suas próprias entradas de diário
CREATE POLICY "Users can select their own journal entries"
ON public.journal_entries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Permite que utilizadores insiram novas entradas de diário para si mesmos
CREATE POLICY "Users can insert their own journal entries"
ON public.journal_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Permite que utilizadores atualizem as suas próprias entradas de diário
CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Permite que utilizadores apaguem as suas próprias entradas de diário
CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Otimização de Performance: Adiciona índices para acelerar consultas comuns.

-- Index para filtrar rapidamente as tabelas principais por usuário.
-- Usado em quase todas as listagens (contas, produtos, transações, etc.).
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);

-- Índice composto para a tabela de lançamentos contábeis.
-- Acelera drasticamente a geração de relatórios, que filtra por usuário E por intervalo de datas.
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id_entry_date ON public.journal_entries(user_id, entry_date);

-- Index na chave estrangeira da tabela de linhas de lançamento.
-- Melhor a performance das junções (implícitas) ao buscar lançamentos com suas linhas.
CREATE INDEX IF NOT EXISTS idx_entry_lines_journal_entry_id ON public.entry_lines(journal_entry_id);

-- Cria a tabela 'profiles' para armazenar informações adicionais do usuário, incluindo o nível de permissão.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    avatar_url TEXT
);

-- Habilita RLS para a tabela 'profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela 'profiles'

-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios perfis (excluindo a role, que será atualizada apenas por admins)
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create a security definer function to check if the user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$;

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admins podem atualizar qualquer perfil (incluindo a role)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Função para criar um perfil automaticamente quando um novo usuário é criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_letter TEXT;
    avatar_svg TEXT;
BEGIN
  -- Verifica se um perfil já existe para o novo usuário
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

    INSERT INTO public.profiles (id, username, role, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'));

    -- Insere contas padrão para o novo usuário
    INSERT INTO public.accounts (id, name, type, user_id) VALUES
        (gen_random_uuid(), 'Cash', 'asset', NEW.id),
        (gen_random_uuid(), 'Bank Account', 'asset', NEW.id),
        (gen_random_uuid(), 'Accounts Receivable', 'asset', NEW.id),
        (gen_random_uuid(), 'Inventory', 'asset', NEW.id),
        (gen_random_uuid(), 'Equipment', 'asset', NEW.id),
        (gen_random_uuid(), 'Accounts Payable', 'liability', NEW.id),
        (gen_random_uuid(), 'Salaries Payable', 'liability', NEW.id),
        (gen_random_uuid(), 'Loans Payable', 'liability', NEW.id),
        (gen_random_uuid(), 'Owner''s Equity', 'equity', NEW.id),
        (gen_random_uuid(), 'Sales Revenue', 'revenue', NEW.id),
        (gen_random_uuid(), 'Service Revenue', 'revenue', NEW.id),
        (gen_random_uuid(), 'Cost of Goods Sold', 'expense', NEW.id),
        (gen_random_uuid(), 'Rent Expense', 'expense', NEW.id),
        (gen_random_uuid(), 'Utilities Expense', 'expense', NEW.id),
        (gen_random_uuid(), 'Salaries Expense', 'expense', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- Trigger para chamar a função handle_new_user após a inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.delete_user_data();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para deletar dados do usuário
CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Deleta todos os dados associados ao usuário que está sendo deletado
  DELETE FROM public.accounts WHERE user_id = OLD.id;
  DELETE FROM public.journal_entries WHERE user_id = OLD.id;
  DELETE FROM public.financial_transactions WHERE user_id = OLD.id;
  DELETE FROM public.products WHERE user_id = OLD.id;
  -- Adicione outras tabelas que tenham uma referência ao user_id aqui

  -- Deleta o perfil do usuário
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria um trigger que executa a função delete_user_data ANTES de um usuário ser deletado da auth.users
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_user_data();

set check_function_bodies = off;