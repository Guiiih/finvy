
-- Create the tax_regime_enum
DO $$ BEGIN
    CREATE TYPE tax_regime_enum AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to the organizations table
ALTER TABLE organizations
ADD COLUMN cnpj VARCHAR(18),
ADD COLUMN razao_social VARCHAR(255),
ADD COLUMN uf VARCHAR(2),
ADD COLUMN municipio VARCHAR(100);

-- Create the tax_regime_history table
CREATE TABLE IF NOT EXISTS tax_regime_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    regime tax_regime_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent overlapping periods for the same organization
ALTER TABLE tax_regime_history
ADD CONSTRAINT unique_tax_regime_period UNIQUE (organization_id, start_date, end_date);

-- Optional: Add a function to check for overlapping periods before insert/update
-- This is better handled in application logic for more complex validation,
-- but a basic check can be done with a trigger or exclusion constraint if needed.
-- For now, the unique constraint on (organization_id, start_date, end_date)
-- prevents exact duplicates, but not overlaps. Overlap logic will be in backend.

-- Enable Row Level Security (RLS) for tax_regime_history
ALTER TABLE tax_regime_history ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own organization's tax regime history
CREATE POLICY "Users can view their own organization's tax regime history" ON tax_regime_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);

-- Policy for users to insert tax regime history for their own organization
CREATE POLICY "Users can insert tax regime history for their own organization" ON tax_regime_history
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);

-- Policy for users to update tax regime history for their own organization
CREATE POLICY "Users can update tax regime history for their own organization" ON tax_regime_history
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);

-- Policy for users to delete tax regime history for their own organization
CREATE POLICY "Users can delete tax regime history for their own organization" ON tax_regime_history
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = tax_regime_history.organization_id
    )
);
