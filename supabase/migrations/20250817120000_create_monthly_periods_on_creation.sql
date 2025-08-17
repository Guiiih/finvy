
-- Migração: Criação Automática de Períodos Mensais

set check_function_bodies = off;

-- 1. Cria a nova função para gerar períodos mensais
CREATE OR REPLACE FUNCTION public.create_monthly_accounting_periods(
    p_organization_id UUID,
    p_fiscal_year INT,
    p_start_date DATE,
    p_end_date DATE,
    p_regime tax_regime_enum,
    p_annex VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    month_start_date DATE;
    month_end_date DATE;
    current_month DATE;
BEGIN
    current_month := date_trunc('month', p_start_date)::DATE;

    WHILE current_month <= p_end_date LOOP
        month_start_date := current_month;
        month_end_date := (current_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

        INSERT INTO public.accounting_periods (
            organization_id,
            fiscal_year,
            start_date,
            end_date,
            regime,
            annex,
            is_active
        ) VALUES (
            p_organization_id,
            p_fiscal_year,
            month_start_date,
            month_end_date,
            p_regime,
            p_annex,
            FALSE -- Períodos mensais não são ativos
        );

        current_month := (current_month + INTERVAL '1 month')::DATE;
    END LOOP;
END;
$$;

-- 2. Atualiza a função create_organization_and_assign_owner
CREATE OR REPLACE FUNCTION public.create_organization_and_assign_owner(
    p_organization_name TEXT,
    p_user_id UUID,
    p_cnpj VARCHAR DEFAULT NULL,
    p_razao_social VARCHAR DEFAULT NULL,
    p_uf VARCHAR DEFAULT NULL,
    p_municipio VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    accounting_period_id UUID,
    fiscal_year INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_org_id UUID;
    new_period_id UUID;
    current_year INT;
    default_start_date DATE;
    default_end_date DATE;
    -- Adicionado para o regime padrão
    default_regime tax_regime_enum := 'simples_nacional';
    default_annex VARCHAR := 'annex_i';
BEGIN
    -- Cria a organização
    INSERT INTO public.organizations (name, is_personal, cnpj, razao_social, uf, municipio)
    VALUES (p_organization_name, FALSE, p_cnpj, p_razao_social, p_uf, p_municipio)
    RETURNING id, name INTO new_org_id, organization_name;

    -- Atribui o papel de 'owner'
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (p_user_id, new_org_id, 'owner');

    -- Cria o período contábil anual (principal)
    current_year := EXTRACT(YEAR FROM NOW());
    default_start_date := (current_year::TEXT || '-01-01')::DATE;
    default_end_date := (current_year::TEXT || '-12-31')::DATE;

    INSERT INTO public.accounting_periods (organization_id, fiscal_year, start_date, end_date, regime, annex, is_active)
    VALUES (new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex, TRUE)
    RETURNING id, fiscal_year INTO new_period_id, fiscal_year;

    -- Cria o registro no histórico de regimes
    INSERT INTO public.tax_regime_history (organization_id, regime, start_date, end_date)
    VALUES (new_org_id, default_regime, default_start_date, default_end_date);

    -- **NOVO: Chama a função para criar os períodos mensais**
    PERFORM public.create_monthly_accounting_periods(new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex);

    -- Atualiza o perfil do usuário
    UPDATE public.profiles
    SET organization_id = new_org_id, active_accounting_period_id = new_period_id
    WHERE id = p_user_id;

    -- Cria o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);

    RETURN QUERY SELECT new_org_id, organization_name, new_period_id, fiscal_year;
END;
$$;

-- 3. Atualiza a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    first_letter TEXT;
    avatar_svg TEXT;
    new_org_id UUID;
    new_period_id UUID;
    generated_handle TEXT;
    base_handle_string TEXT;
    current_year INT;
    default_start_date DATE;
    default_end_date DATE;
    default_regime tax_regime_enum := 'simples_nacional';
    default_annex VARCHAR := 'annex_i';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Lógica para criar avatar e handle
    IF NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND LENGTH(NEW.raw_user_meta_data->>'first_name') > 0 THEN
        first_letter := UPPER(SUBSTRING(NEW.raw_user_meta_data->>'first_name', 1, 1));
        base_handle_string := NEW.raw_user_meta_data->>'first_name';
    ELSE
        first_letter := UPPER(SUBSTRING(NEW.email, 1, 1));
        base_handle_string := '';
    END IF;
    generated_handle := public.generate_unique_handle(base_handle_string);
    avatar_svg :=
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' ||
        '<rect width="100" height="100" fill="#000000"/>' ||
        '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="60" font-weight="bold" fill="#FFFFFF">' || first_letter || '</text>' ||
        '</svg>';

    -- Cria a organização pessoal
    INSERT INTO public.organizations (name, is_personal)
    VALUES (NEW.raw_user_meta_data->>'first_name' || ' Personal', TRUE)
    RETURNING id INTO new_org_id;

    -- Cria o período contábil anual (principal)
    current_year := EXTRACT(YEAR FROM NOW());
    default_start_date := (current_year::TEXT || '-01-01')::DATE;
    default_end_date := (current_year::TEXT || '-12-31')::DATE;

    INSERT INTO public.accounting_periods (organization_id, fiscal_year, start_date, end_date, regime, annex, is_active)
    VALUES (new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex, TRUE)
    RETURNING id INTO new_period_id;

    -- Cria o registro no histórico de regimes
    INSERT INTO public.tax_regime_history (organization_id, regime, start_date, end_date)
    VALUES (new_org_id, default_regime, default_start_date, default_end_date);

    -- **NOVO: Chama a função para criar os períodos mensais**
    PERFORM public.create_monthly_accounting_periods(new_org_id, current_year, default_start_date, default_end_date, default_regime, default_annex);

    -- Cria o perfil do usuário
    INSERT INTO public.profiles (id, username, email, role, avatar_url, organization_id, active_accounting_period_id, handle)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.email, 'user', 'data:image/svg+xml;base64,' || encode(avatar_svg::bytea, 'base64'), new_org_id, new_period_id, generated_handle);

    -- Atribui o papel de 'owner'
    INSERT INTO public.user_organization_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'owner');

    -- Cria o plano de contas padrão
    PERFORM public.create_default_chart_of_accounts(new_org_id, new_period_id);
  END IF;
  RETURN NEW;
END;
$$;
