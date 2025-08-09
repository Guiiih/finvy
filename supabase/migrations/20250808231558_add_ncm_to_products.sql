-- Add ncm column to products table
ALTER TABLE products
ADD COLUMN ncm VARCHAR(8);

-- Add a check constraint to ensure ncm is a string of 8 digits
ALTER TABLE products
ADD CONSTRAINT ncm_format_check CHECK (ncm ~ '^[0-9]{8}$$');

-- Optional: Add an index for faster lookups on ncm
CREATE INDEX IF NOT EXISTS idx_products_ncm ON products(ncm);
