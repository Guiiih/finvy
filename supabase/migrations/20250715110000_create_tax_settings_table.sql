-- Create tax_settings table
CREATE TABLE tax_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    icms_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    ipi_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    pis_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cofins_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    mva_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, effective_date)
);

-- Add RLS policies for tax_settings
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own tax settings." ON tax_settings
  FOR SELECT USING (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

CREATE POLICY "Organizations can insert their own tax settings." ON tax_settings
  FOR INSERT WITH CHECK (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

CREATE POLICY "Organizations can update their own tax settings." ON tax_settings
  FOR UPDATE USING (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));

CREATE POLICY "Organizations can delete their own tax settings." ON tax_settings
  FOR DELETE USING (organization_id IN ( SELECT user_organization_roles.organization_id
   FROM user_organization_roles
  WHERE user_id = auth.uid()));
