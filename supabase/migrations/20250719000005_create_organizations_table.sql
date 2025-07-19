
DROP TABLE IF EXISTS organizations CASCADE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    uf TEXT NOT NULL,
    municipio TEXT NOT NULL,
    regime_tributario TEXT NOT NULL CHECK (regime_tributario IN ('simples_nacional', 'lucro_presumido', 'lucro_real')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a trigger to update the 'updated_at' column automatically
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
