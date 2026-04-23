-- Dedupe externo
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_source text;
CREATE UNIQUE INDEX IF NOT EXISTS appointments_external_uniq
  ON public.appointments (external_source, external_id)
  WHERE external_id IS NOT NULL;

-- Tratamentos: campos completos
ALTER TABLE public.treatments_overrides
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS professional_slug text,
  ADD COLUMN IF NOT EXISTS availability text[];

-- Leads: CRM premium
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS treatment_interest text,
  ADD COLUMN IF NOT EXISTS estimated_value_cents bigint,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz;

-- Conteúdo do site (overrides editáveis)
CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site content" ON public.site_content;
CREATE POLICY "Public read site content" ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage site content" ON public.site_content;
CREATE POLICY "Admins manage site content" ON public.site_content FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Landing pages
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active landing pages" ON public.landing_pages;
CREATE POLICY "Public read active landing pages" ON public.landing_pages FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Admins manage landing pages" ON public.landing_pages;
CREATE POLICY "Admins manage landing pages" ON public.landing_pages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Integrações externas
CREATE TABLE IF NOT EXISTS public.external_integrations (
  provider text PRIMARY KEY,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secrets_set boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  last_sync_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage integrations" ON public.external_integrations;
CREATE POLICY "Admins manage integrations" ON public.external_integrations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- API keys (hash, nunca o valor)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read'],
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage api keys" ON public.api_keys;
CREATE POLICY "Admins manage api keys" ON public.api_keys FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Webhooks de saída
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY[]::text[],
  secret text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage webhooks" ON public.webhook_endpoints;
CREATE POLICY "Admins manage webhooks" ON public.webhook_endpoints FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Configurações da clínica (chave/valor) — opcional público
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read public settings" ON public.clinic_settings;
CREATE POLICY "Public read public settings" ON public.clinic_settings FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Admins manage settings" ON public.clinic_settings;
CREATE POLICY "Admins manage settings" ON public.clinic_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));