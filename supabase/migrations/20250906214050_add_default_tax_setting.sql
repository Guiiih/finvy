-- Add a default tax setting for any organization that does not have one.
INSERT INTO tax_settings (organization_id, effective_date, icms_rate, ipi_rate, pis_rate, cofins_rate, mva_rate)
SELECT
    o.id,
    CURRENT_DATE,
    0.00,
    0.00,
    0.00,
    0.00,
    0.00
FROM
    organizations o
WHERE NOT EXISTS (
    SELECT 1
    FROM tax_settings ts
    WHERE ts.organization_id = o.id
);