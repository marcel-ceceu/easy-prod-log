CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.search_produtos(search_term text)
RETURNS SETOF public.produtos_referencia
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT *
  FROM public.produtos_referencia
  WHERE
    extensions.unaccent(COALESCE(refforn,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(codprod,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(compldesc,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(descrprod,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(marca,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
  LIMIT 5;
$$;