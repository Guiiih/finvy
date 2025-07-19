ALTER TABLE public.profiles
ADD COLUMN handle TEXT UNIQUE;

-- Opcional: Adicionar um valor padrão para handles existentes, se necessário
-- UPDATE public.profiles
-- SET handle = LOWER(REPLACE(COALESCE(username, SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)), ' ', ''))
-- WHERE handle IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN handle SET NOT NULL;
