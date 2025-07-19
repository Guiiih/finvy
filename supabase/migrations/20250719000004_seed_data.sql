
-- Migração: Dados Iniciais

-- Insere configurações fiscais padrão para organizações existentes
-- ATENÇÃO: Substitua 'YOUR_ORGANIZATION_ID_HERE' pelo ID real da sua organização.
-- Para ambientes de produção, considere uma lógica para criar essas configurações automaticamente
-- para novas organizações ou para todas as organizações existentes.

INSERT INTO public.tax_settings (organization_id, icms_rate, ipi_rate, pis_rate, cofins_rate, mva_rate, effective_date)
SELECT
    o.id,
    0.18, -- Exemplo: 18% ICMS
    0.10, -- Exemplo: 10% IPI
    0.0165, -- Exemplo: 1.65% PIS
    0.076, -- Exemplo: 7.6% COFINS
    0.35, -- Exemplo: 35% MVA
    NOW()
FROM
    public.organizations o
ON CONFLICT (organization_id) DO NOTHING;

-- Se você tiver um processo de criação de organização, considere adicionar a inserção de tax_settings lá também.
