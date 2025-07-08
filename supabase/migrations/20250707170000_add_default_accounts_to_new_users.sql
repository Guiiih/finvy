CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se um perfil já existe para o novo usuário
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', 'user');

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