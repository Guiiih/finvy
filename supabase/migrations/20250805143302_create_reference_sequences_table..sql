-- Cria a tabela para armazenar as sequências de referência
CREATE TABLE reference_sequences (
    prefix VARCHAR(50) NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    accounting_period_id UUID NOT NULL REFERENCES accounting_periods(id) ON DELETE CASCADE,
    PRIMARY KEY (prefix, organization_id, accounting_period_id)
);

-- Adiciona RLS (Row Level Security) para a tabela reference_sequences
ALTER TABLE reference_sequences ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para reference_sequences
CREATE POLICY "Enable read access for all users" ON reference_sequences
  FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users based on organization_id" ON reference_sequences
  FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));

CREATE POLICY "Enable update for authenticated users based on organization_id" ON reference_sequences
  FOR UPDATE USING (organization_id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));

CREATE POLICY "Enable delete for authenticated users based on organization_id" ON reference_sequences
  FOR DELETE USING (organization_id IN (SELECT organization_id FROM user_organization_roles WHERE user_id = auth.uid()));
