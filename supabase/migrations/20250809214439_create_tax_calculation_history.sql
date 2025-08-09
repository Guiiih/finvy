CREATE TABLE tax_calculation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id), -- Optional, if linked to a specific entry
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fiscal_operation_data JSONB NOT NULL,
    tax_calculation_result JSONB NOT NULL,
    details JSONB, -- To store detailed breakdown of calculations
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    accounting_period_id UUID REFERENCES accounting_periods(id) NOT NULL
);

-- Add RLS policies for the new table
ALTER TABLE tax_calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users in their organization" ON tax_calculation_history
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM user_organization_roles WHERE organization_id = tax_calculation_history.organization_id));

CREATE POLICY "Enable insert for users in their organization" ON tax_calculation_history
FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM user_organization_roles WHERE organization_id = tax_calculation_history.organization_id));