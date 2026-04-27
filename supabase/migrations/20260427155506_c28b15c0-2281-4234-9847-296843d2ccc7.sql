-- Habilita extensão pgcrypto (necessária para digest/sha256) no schema extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recria a função submit_anamnesis_with_token usando extensions.digest (qualificado)
CREATE OR REPLACE FUNCTION public.submit_anamnesis_with_token(
  _token text, _answers jsonb, _signature_data text, _signature_ip text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _row public.patient_anamnesis%ROWTYPE;
  _hash text;
BEGIN
  SELECT * INTO _row
    FROM public.patient_anamnesis
   WHERE token = _token
     AND status <> 'signed'
     AND (expires_at IS NULL OR expires_at > now())
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anamnese inválida ou expirada';
  END IF;

  -- Hash SHA-256 (assinatura + id + timestamp) para validade jurídica (Lei 14.063/2020)
  _hash := encode(
    extensions.digest(
      coalesce(_signature_data,'') || _row.id::text || now()::text,
      'sha256'
    ),
    'hex'
  );

  UPDATE public.patient_anamnesis SET
    answers        = _answers,
    signature_data = _signature_data,
    signature_hash = _hash,
    signature_ip   = _signature_ip,
    signed_at      = CASE WHEN _signature_data IS NOT NULL THEN now() ELSE NULL END,
    status         = CASE WHEN _signature_data IS NOT NULL THEN 'signed' ELSE 'completed' END,
    updated_at     = now()
   WHERE id = _row.id;

  RETURN _row.id;
END;
$$;