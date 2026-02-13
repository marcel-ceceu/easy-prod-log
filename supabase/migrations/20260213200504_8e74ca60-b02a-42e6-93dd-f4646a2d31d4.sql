
CREATE OR REPLACE FUNCTION public.next_codprod_novo()
RETURNS TEXT AS $$
BEGIN
  RETURN nextval('public.codprod_novo_seq')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
