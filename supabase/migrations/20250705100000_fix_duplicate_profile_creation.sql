-- Redefine a função handle_new_user para evitar a criação de perfis duplicados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se um perfil já existe para o novo usuário
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, role)
    VALUES (NEW.id, NEW.email, 'user'); -- Define o email como username inicial e role padrão como 'user'
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que a função handle_new_user seja executada como superuser para inserir na tabela profiles
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
