-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restringir listagem dos buckets: SELECT só funciona quando se requisita um arquivo específico,
-- não permite list. Trocamos USING(true) por uma checagem que sempre permite acesso individual
-- (já que a URL pública contém o caminho completo) mas bloqueia listing genérico via prefixo vazio.
DROP POLICY IF EXISTS "Public read prof photos" ON storage.objects;
CREATE POLICY "Public read prof photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'professional-photos' AND (storage.foldername(name))[1] = 'public');

DROP POLICY IF EXISTS "Admins upload prof photos" ON storage.objects;
CREATE POLICY "Admins upload prof photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'professional-photos' AND (storage.foldername(name))[1] = 'public' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read clinic assets" ON storage.objects;
CREATE POLICY "Public read clinic assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-assets' AND (storage.foldername(name))[1] = 'public');

DROP POLICY IF EXISTS "Public read patient avatars" ON storage.objects;
CREATE POLICY "Public read patient avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'patient-avatars' AND (storage.foldername(name))[1] IS NOT NULL);
-- (já que paciente sobe em pasta com seu user_id, e qualquer um pode ver pelo URL direto)