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

    -- Cria uma nova organização para o usuário, marcando-a como pessoal
    INSERT INTO public.organizations (name, is_personal)
    VALUES (NEW.raw_user_meta_data->>'first_name' || ' Personal', TRUE) -- Changed name and added is_personal = TRUE
    RETURNING id INTO new_org_id;

    -- Cria um período contábil padrão para a nova organização (ex: ano atual)
    INSERT INTO public.accounting_periods (organization_id, name, start_date, end_date, is_active)
    VALUES (new_org_id, EXTRACT(YEAR FROM NOW())::TEXT || ' Fiscal Year', (EXTRACT(YEAR FROM NOW())::TEXT || '-01-01')::DATE, (EXTRACT(YEAR FROM NOW())::TEXT || '-12-31')::DATE, TRUE)
    RETURNING id INTO new_period_id;

    -- Insere o perfil do usuário
    INSERT INTO public.profiles (id, username, email, role, avatar_url, organization_id, active_accounting_period_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.email, 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'), new_org_id, new_period_id);

    -- ATRIBUI O PAPEL DE 'owner' AO NOVO USUÁRIO NA SUA NOVA ORGANIZAÇÃO
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'owner');

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