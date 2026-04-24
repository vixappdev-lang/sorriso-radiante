
-- Provedores de WhatsApp (ChatPro, VPS própria, etc)
CREATE TABLE public.whatsapp_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('chatpro', 'baileys_vps')),
  label text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'disconnected',
  is_active boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage providers" ON public.whatsapp_providers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Campanhas automáticas
CREATE TABLE public.whatsapp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('billing', 'birthday', 'reactivation', 'custom')),
  template text NOT NULL,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule_cron text,
  active boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{"sent":0,"delivered":0,"replied":0}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns" ON public.whatsapp_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Log de envios
CREATE TABLE public.whatsapp_messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.whatsapp_providers(id) ON DELETE SET NULL,
  provider_type text NOT NULL,
  to_number text NOT NULL,
  template_key text,
  message text,
  status text NOT NULL DEFAULT 'queued',
  response jsonb,
  campaign_id uuid REFERENCES public.whatsapp_campaigns(id) ON DELETE SET NULL,
  appointment_id uuid,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_log_to ON public.whatsapp_messages_log(to_number);
CREATE INDEX idx_wa_log_sent ON public.whatsapp_messages_log(sent_at DESC);
CREATE INDEX idx_wa_log_campaign ON public.whatsapp_messages_log(campaign_id);

ALTER TABLE public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read log" ON public.whatsapp_messages_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert log" ON public.whatsapp_messages_log
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Configuração de eventos automáticos
CREATE TABLE public.whatsapp_event_settings (
  event_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  template text NOT NULL DEFAULT '',
  delay_minutes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_event_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage event settings" ON public.whatsapp_event_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed eventos padrão
INSERT INTO public.whatsapp_event_settings (event_key, enabled, template) VALUES
  ('appointment_confirmed', true, 'Olá {{nome}}! ✅ Seu agendamento de {{tratamento}} para {{data}} às {{hora}} foi confirmado. Te esperamos na Clínica Levii!'),
  ('appointment_cancelled', true, 'Olá {{nome}}, infelizmente seu agendamento de {{tratamento}} no dia {{data}} às {{hora}} foi cancelado. Entre em contato para reagendar. — Clínica Levii'),
  ('appointment_reminder_24h', true, 'Lembrete 🦷: amanhã às {{hora}} você tem consulta de {{tratamento}} na Clínica Levii. Confirma pra gente?'),
  ('appointment_followup', false, 'Olá {{nome}}, esperamos que tudo esteja bem após sua consulta. Qualquer dúvida estamos à disposição! — Clínica Levii')
ON CONFLICT (event_key) DO NOTHING;
