ALTER TABLE products
ADD COLUMN product_service_type TEXT CHECK (product_service_type IN ('Produto', 'Serviço')),
ADD COLUMN default_cfop_purchase TEXT,
ADD COLUMN default_cfop_sale TEXT;