
-- Add 'referencia' column to produtos_inseridos
ALTER TABLE public.produtos_inseridos
ADD COLUMN IF NOT EXISTS referencia text;

-- Add 'codbarra' column to produtos_referencia
ALTER TABLE public.produtos_referencia
ADD COLUMN IF NOT EXISTS codbarra text;
