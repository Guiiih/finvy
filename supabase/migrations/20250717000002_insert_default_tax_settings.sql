
-- Inserir configurações de impostos padrão para organizações existentes
-- ATENÇÃO: Substitua 'SEU_ORGANIZATION_ID_AQUI' pelo ID real da sua organização.
-- Para ambientes de produção, considere uma lógica para criar essas configurações automaticamente
-- para novas organizações ou para todas as organizações existentes.

INSERT INTO public.tax_settings (organization_id, icms_rate, ipi_rate, pis_rate, cofins_rate, mva_rate, effective_date)
SELECT
    o.id,
    0.18, -- Exemplo: 18% de ICMS
    0.10, -- Exemplo: 10% de IPI
    0.0165, -- Exemplo: 1.65% de PIS
    0.076, -- Exemplo: 7.6% de COFINS
    0.35, -- Exemplo: 35% de MVA
    NOW()
FROM
    public.organizations o
ON CONFLICT (organization_id) DO NOTHING;

-- Se você tiver um processo de criação de organização, considere adicionar a inserção de tax_settings lá também.
