-- supabase/migrations/20250807220000_create_journal_entry_history.sql

-- 1. Create the history table
CREATE TABLE
  public.journal_entry_history (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id),
    action_type TEXT NOT NULL, -- e.g., 'CREATED', 'STATUS_UPDATED', 'EDITED'
    details JSONB, -- To store old and new values
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL,
    changed_by_name TEXT -- To store the user's name or 'System'
  );

-- RLS Policies for the new table
ALTER TABLE public.journal_entry_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to users who can access the journal entry" ON public.journal_entry_history FOR
SELECT
  USING (
    (
      SELECT
        check_user_access_to_journal_entry (journal_entry_id)
    )
  );

-- 2. Create a function to log history
CREATE OR REPLACE FUNCTION public.log_journal_entry_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile RECORD;
  details_jsonb JSONB;
BEGIN
  -- Get the user's name from the profiles table
  IF auth.uid() IS NOT NULL THEN
    SELECT p.username INTO user_profile FROM public.profiles p WHERE p.id = auth.uid();
  END IF;

  details_jsonb := '{}'::jsonb;

  IF TG_OP = 'INSERT' THEN
    details_jsonb := jsonb_build_object(
      'new_data', to_jsonb(NEW)
    );
    INSERT INTO public.journal_entry_history (journal_entry_id, user_id, action_type, details, changed_by_name)
    VALUES (NEW.id, auth.uid(), 'CREATED', details_jsonb, COALESCE(user_profile.username, 'System'));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status change specifically
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      details_jsonb := jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      );
      INSERT INTO public.journal_entry_history (journal_entry_id, user_id, action_type, details, changed_by_name)
      VALUES (NEW.id, auth.uid(), 'STATUS_UPDATED', details_jsonb, COALESCE(user_profile.username, 'System'));
    END IF;

    -- You can add more specific field tracking here if needed
    -- For a general edit, we can log that as well
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) AND OLD.status = NEW.status THEN
       details_jsonb := jsonb_build_object(
        'changes', 'Lançamento foi editado' -- A more detailed diff could be implemented here
      );
       INSERT INTO public.journal_entry_history (journal_entry_id, user_id, action_type, details, changed_by_name)
       VALUES (NEW.id, auth.uid(), 'EDITED', details_jsonb, COALESCE(user_profile.username, 'System'));
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create a trigger to execute the function
CREATE TRIGGER on_journal_entry_change
AFTER INSERT OR UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.log_journal_entry_change();
