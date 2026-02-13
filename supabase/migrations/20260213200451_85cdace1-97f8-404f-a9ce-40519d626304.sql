
-- Tabela de referência para busca de produtos
CREATE TABLE public.produtos_referencia (
  codprod TEXT NOT NULL PRIMARY KEY,
  refforn TEXT,
  compldesc TEXT,
  descrprod TEXT,
  marca TEXT
);

-- Permitir leitura pública (sem autenticação no MVP)
ALTER TABLE public.produtos_referencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública produtos_referencia"
  ON public.produtos_referencia
  FOR SELECT
  USING (true);

-- Sequência para CODPROD de produtos novos (começa em 90001)
CREATE SEQUENCE public.codprod_novo_seq START WITH 90001 INCREMENT BY 1;

-- Tabela de registros inseridos
CREATE TABLE public.produtos_inseridos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codprod TEXT NOT NULL,
  qtd INTEGER NOT NULL,
  dtinsert TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  novo TEXT NOT NULL DEFAULT 'N' CHECK (novo IN ('S', 'N')),
  descrprod TEXT
);

ALTER TABLE public.produtos_inseridos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inserção pública produtos_inseridos"
  ON public.produtos_inseridos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Leitura pública produtos_inseridos"
  ON public.produtos_inseridos
  FOR SELECT
  USING (true);

-- Função para gerar próximo CODPROD para produtos novos
CREATE OR REPLACE FUNCTION public.next_codprod_novo()
RETURNS TEXT AS $$
BEGIN
  RETURN nextval('public.codprod_novo_seq')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
