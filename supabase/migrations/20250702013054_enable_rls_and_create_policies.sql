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