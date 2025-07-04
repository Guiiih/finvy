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
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, NEW.email, 'user'); -- Define o email como username inicial e role padrão como 'user'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função handle_new_user após a inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Garante que a função handle_new_user seja executada como superuser para inserir na tabela profiles
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
