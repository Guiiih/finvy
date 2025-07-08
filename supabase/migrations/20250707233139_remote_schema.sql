alter table "public"."entry_lines" add column "cofins_rate" numeric;

alter table "public"."entry_lines" add column "cofins_value" numeric;

alter table "public"."entry_lines" add column "icms_st_value" numeric;

alter table "public"."entry_lines" add column "icms_value" numeric;

alter table "public"."entry_lines" add column "ipi_rate" numeric;

alter table "public"."entry_lines" add column "ipi_value" numeric;

alter table "public"."entry_lines" add column "mva_rate" numeric;

alter table "public"."entry_lines" add column "pis_rate" numeric;

alter table "public"."entry_lines" add column "pis_value" numeric;

alter table "public"."entry_lines" add column "total_gross" numeric;

alter table "public"."entry_lines" add column "total_net" numeric;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Verifica se um perfil já existe para o novo usuário
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, role)
    VALUES (NEW.id, NEW.email, 'user'); -- Define o email como username inicial e role padrão como 'user'
  END IF;
  RETURN NEW;
END;
$function$
;

