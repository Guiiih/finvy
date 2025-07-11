ALTER TABLE public.profiles
ADD COLUMN email TEXT UNIQUE;

-- Opcional: Preencher a coluna email para perfis existentes
-- Isso pode ser feito se você tiver uma forma de associar emails aos perfis existentes
-- Por exemplo, se o email estiver disponível em auth.users
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id;

-- Adicionar um índice para a coluna email para buscas mais rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
