-- Adiciona token público único em public_booking_links (acesso por token, sem slug exposto)
ALTER TABLE public.public_booking_links
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Garante que registros existentes tenham token
UPDATE public.public_booking_links
  SET access_token = replace(gen_random_uuid()::text, '-', '')
  WHERE access_token IS NULL;

-- Cria um link "geral" padrão para a clínica se nao existir nenhum
INSERT INTO public.public_booking_links (slug, title, description, active)
SELECT 'geral', 'Agendamento Online', 'Agende sua consulta com a Clínica Levii.', true
WHERE NOT EXISTS (SELECT 1 FROM public.public_booking_links WHERE slug = 'geral');

-- Tabela de faturas/cobranças vinculadas a paciente (para área cliente)
CREATE TABLE IF NOT EXISTS public.patient_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  description text NOT NULL,
  amount_cents bigint NOT NULL DEFAULT 0,
  due_date date,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  payment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoices" ON public.patient_invoices
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Patients read own invoices" ON public.patient_invoices
  FOR SELECT TO authenticated USING (
    patient_phone IN (SELECT phone FROM public.patient_accounts WHERE user_id = auth.uid())
  );