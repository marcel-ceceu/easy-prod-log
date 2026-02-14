-- Permitir edição pública (MVP sem auth)
CREATE POLICY "Edição pública produtos_inseridos"
  ON public.produtos_inseridos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão pública (MVP sem auth)
CREATE POLICY "Exclusão pública produtos_inseridos"
  ON public.produtos_inseridos
  FOR DELETE
  USING (true);
