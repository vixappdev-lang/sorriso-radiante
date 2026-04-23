
-- Appointments table (agendamentos)
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  treatment text NOT NULL,
  professional text,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  notes text,
  whatsapp_sent boolean NOT NULL DEFAULT false,
  whatsapp_response jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Public can insert (formulário público); reads/updates apenas via edge function (service role).
CREATE POLICY "Anyone can create an appointment"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ChatPro configuration (uma única linha de configuração)
CREATE TABLE public.chatpro_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_code text NOT NULL,
  token text NOT NULL,
  endpoint text NOT NULL,
  message_template text NOT NULL DEFAULT 'Olá {{nome}}! 🦷

Seu agendamento na *Clínica Levii* foi recebido com sucesso.

📋 Tratamento: {{tratamento}}
📅 Data: {{data}}
🕐 Horário: {{hora}}

Confirmaremos em instantes. Qualquer dúvida, é só responder aqui!',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatpro_config ENABLE ROW LEVEL SECURITY;
-- Sem políticas públicas: só edge functions (service role) podem ler/escrever.

-- Seed inicial com as credenciais fornecidas pelo cliente
INSERT INTO public.chatpro_config (instance_code, token, endpoint)
VALUES (
  'chatpro-df64ky5u87',
  '6722ad414605300de497db271bee9016',
  'https://v5.chatpro.com.br/chatpro-df64ky5u87'
);
