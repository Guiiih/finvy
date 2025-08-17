-- Migração: Atualiza a política de RLS para accounting_periods

DROP POLICY IF EXISTS "acct_periods_view_shared" ON public.accounting_periods;

CREATE POLICY "acct_periods_view_for_organization_members"
ON public.accounting_periods FOR SELECT
USING (
  accounting_periods.organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);