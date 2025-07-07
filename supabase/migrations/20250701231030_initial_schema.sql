-- Tabela de Contas
        CREATE TABLE accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            user_id UUID REFERENCES auth.users(id),
            code SERIAL
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
            unit_cost NUMERIC(10, 2)
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
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin'))
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

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins podem atualizar qualquer perfil (incluindo a role)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Função para criar um perfil automaticamente quando um novo usuário é criado no auth.users
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se um perfil já existe para o novo usuário
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, role)
    VALUES (NEW.id, NEW.email, 'user'); -- Define o email como username inicial e role padrão como 'user'
  END IF;

  -- Gera o avatar SVG baseado na primeira letra do email
  DECLARE
    first_letter TEXT := UPPER(SUBSTRING(NEW.email FROM 1 FOR 1));
    avatar_svg TEXT := 
      '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#000000"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="60" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">' || first_letter || '</text>
      </svg>';
    base64_avatar TEXT := 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64');
  BEGIN
    -- Atualiza o user_metadata na tabela auth.users com o avatar_url
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('avatar_url', base64_avatar)
    WHERE id = NEW.id;

    -- Insere contas pré-definidas para o novo usuário
    INSERT INTO public.accounts (name, type, user_id)
    VALUES
      ('Caixa', 'Asset', NEW.id),
      ('Banco', 'Asset', NEW.id),
      ('Contas a Receber', 'Asset', NEW.id),
      ('Contas a Pagar', 'Liability', NEW.id),
      ('Receita de Vendas', 'Revenue', NEW.id),
      ('Despesas Gerais', 'Expense', NEW.id);
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que a função handle_new_user seja executada como superuser para inserir na tabela profiles
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

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

-- Recreate policies using the is_admin() function
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE entry_lines
ADD COLUMN ipi_rate NUMERIC,
ADD COLUMN pis_rate NUMERIC,
ADD COLUMN cofins_rate NUMERIC,
ADD COLUMN mva_rate NUMERIC,
ADD COLUMN icms_st_value NUMERIC,
ADD COLUMN ipi_value NUMERIC,
ADD COLUMN pis_value NUMERIC,
ADD COLUMN cofins_value NUMERIC;

ALTER TABLE entry_lines
ADD COLUMN icms_value NUMERIC;

ALTER TABLE entry_lines
ADD COLUMN total_gross NUMERIC;

ALTER TABLE entry_lines
ADD COLUMN total_net NUMERIC;