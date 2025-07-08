CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Deleta todos os dados associados ao usuário que está sendo deletado
  DELETE FROM public.accounts WHERE user_id = OLD.id;
  DELETE FROM public.journal_entries WHERE user_id = OLD.id;
  DELETE FROM public.financial_transactions WHERE user_id = OLD.id;
  DELETE FROM public.products WHERE user_id = OLD.id;
  -- Adicione outras tabelas que tenham uma referência ao user_id aqui

  -- Deleta o perfil do usuário
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria um trigger que executa a função delete_user_data ANTES de um usuário ser deletado da auth.users
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_user_data();