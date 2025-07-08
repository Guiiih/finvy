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