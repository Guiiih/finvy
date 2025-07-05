-- Tabela de Contas
        CREATE TABLE accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            user_id UUID REFERENCES auth.users(id),
            code SERIAL
        );

        -- Tabela de Produtos
        CREATE TABLE products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            unit_cost NUMERIC(10, 2) NOT NULL,
            current_stock INTEGER NOT NULL,
            icms_rate NUMERIC(5, 2) DEFAULT 0,
            user_id UUID REFERENCES auth.users(id)
        );

        -- Tabela de Lançamentos Contábeis
        CREATE TABLE journal_entries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            entry_date DATE NOT NULL,
            description TEXT,
            user_id UUID REFERENCES auth.users(id)
        );

        -- Tabela de Linhas dos Lançamentos
        CREATE TABLE entry_lines (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
            account_id UUID REFERENCES accounts(id),
            debit NUMERIC(10, 2) DEFAULT 0,
            credit NUMERIC(10, 2) DEFAULT 0,
            product_id UUID REFERENCES products(id),
            quantity INTEGER,
            unit_cost NUMERIC(10, 2)
        );

        CREATE TABLE financial_transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            transaction_date DATE NOT NULL,
            amount NUMERIC(10, 2) NOT NULL,
            type VARCHAR(50) NOT NULL, -- Ex: 'income', 'expense', 'payment'
            description TEXT,
            account_id UUID REFERENCES accounts(id), -- Opcional: Para vincular a uma conta contábil
            user_id UUID REFERENCES auth.users(id)
        );