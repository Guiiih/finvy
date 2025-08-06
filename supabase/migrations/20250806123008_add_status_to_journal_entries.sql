-- Adiciona o tipo ENUM para o status do lançamento contábil
CREATE TYPE public.journal_entry_status AS ENUM (
    'draft',
    'posted',
    'reviewed'
);

-- Adiciona a coluna de status à tabela de lançamentos contábeis
ALTER TABLE public.journal_entries
ADD COLUMN status public.journal_entry_status NOT NULL DEFAULT 'draft';
