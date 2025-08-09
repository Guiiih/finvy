-- 1. Create tax_rules table
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uf_origin VARCHAR(2) NOT NULL,
    uf_destination VARCHAR(2) NOT NULL,
    ncm_pattern VARCHAR(8),
    tax_type VARCHAR(20) NOT NULL, -- e.g., 'ICMS', 'ICMS-ST', 'FCP'
    rate NUMERIC(5, 4) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    CONSTRAINT uq_tax_rule UNIQUE (organization_id, uf_origin, uf_destination, ncm_pattern, tax_type)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tax_rules_geo ON tax_rules (uf_origin, uf_destination);
CREATE INDEX IF NOT EXISTS idx_tax_rules_ncm ON tax_rules (ncm_pattern);
CREATE INDEX IF NOT EXISTS idx_tax_rules_org ON tax_rules (organization_id);

-- RLS for tax_rules
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own organization tax rules" 
ON tax_rules 
FOR ALL 
USING (check_user_organization_access(organization_id));

-- 2. Add uf column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS uf VARCHAR(2);

-- 3. Add uf_origin and uf_destination to entry_lines table
ALTER TABLE entry_lines
ADD COLUMN IF NOT EXISTS uf_origin VARCHAR(2),
ADD COLUMN IF NOT EXISTS uf_destination VARCHAR(2);

-- Trigger to update 'updated_at' timestamp on tax_rules table
CREATE TRIGGER handle_updated_at_tax_rules
BEFORE UPDATE ON tax_rules
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);
