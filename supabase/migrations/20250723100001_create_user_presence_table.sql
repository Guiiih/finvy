CREATE TABLE public.user_presence (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    active_accounting_period_id uuid REFERENCES public.accounting_periods(id) ON DELETE CASCADE,
    last_seen timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id)
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view user presence" ON public.user_presence
FOR SELECT USING (true); -- Adjust this policy if you want to restrict visibility

CREATE POLICY "Users can insert their own presence" ON public.user_presence
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence" ON public.user_presence
FOR UPDATE USING (auth.uid() = user_id);
