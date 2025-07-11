-- Add foreign key from user_organization_roles to profiles
ALTER TABLE public.user_organization_roles
ADD CONSTRAINT fk_user_organization_roles_profile
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from shared_accounting_periods to profiles for shared_with_user_id
ALTER TABLE public.shared_accounting_periods
ADD CONSTRAINT fk_shared_accounting_periods_shared_with_profile
FOREIGN KEY (shared_with_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from shared_accounting_periods to profiles for shared_by_user_id (if not already done)
-- This is important for the `profiles(username, email)` join in the sharing handler.
ALTER TABLE public.shared_accounting_periods
ADD CONSTRAINT fk_shared_accounting_periods_shared_by_profile
FOREIGN KEY (shared_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
