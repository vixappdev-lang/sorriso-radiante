
-- Bloqueia explicitamente leitura/edição/exclusão pelo lado do cliente.
-- O backend (edge functions) usa service role e ignora RLS naturalmente.

CREATE POLICY "Block client reads on appointments"
ON public.appointments FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Block client updates on appointments"
ON public.appointments FOR UPDATE
TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Block client deletes on appointments"
ON public.appointments FOR DELETE
TO anon, authenticated
USING (false);

-- chatpro_config: nenhum acesso pelo cliente (segredos)
CREATE POLICY "Block all client access on chatpro_config"
ON public.chatpro_config FOR SELECT
TO anon, authenticated
USING (false);
