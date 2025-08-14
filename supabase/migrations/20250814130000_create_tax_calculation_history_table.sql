DROP TABLE IF EXISTS tax_calculation_history;

CREATE TABLE tax_calculation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    calculation_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    input_data JSONB NOT NULL,
    calculated_taxes JSONB NOT NULL,
    applied_rules JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tax_calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own tax history"
ON tax_calculation_history
FOR ALL
USING (auth.uid() = user_id);

COMMENT ON TABLE tax_calculation_history IS 'Stores a detailed history of tax calculations for auditing and reference.';
COMMENT ON COLUMN tax_calculation_history.input_data IS 'The fiscal operation data used as input for the calculation.';
COMMENT ON COLUMN tax_calculation_history.calculated_taxes IS 'The resulting calculated tax data.';
COMMENT ON COLUMN tax_calculation_history.applied_rules IS 'Which specific tax rules were applied during the calculation.';
