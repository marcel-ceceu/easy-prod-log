
-- Add CHECK constraint for positive quantity
ALTER TABLE public.produtos_inseridos 
  ADD CONSTRAINT qtd_positive CHECK (qtd > 0);

-- Add length limit for descrprod
ALTER TABLE public.produtos_inseridos 
  ADD CONSTRAINT descrprod_length CHECK (char_length(descrprod) <= 500);
