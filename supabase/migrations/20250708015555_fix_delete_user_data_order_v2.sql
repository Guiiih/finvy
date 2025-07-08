DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.delete_user_data();