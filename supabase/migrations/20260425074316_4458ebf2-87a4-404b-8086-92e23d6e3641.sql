
-- 1) Estoque: imagem do item
ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2) Templates de WhatsApp (biblioteca pronta + customizados)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'geral',
  title text NOT NULL,
  description text,
  content text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  trigger_keywords text[] NOT NULL DEFAULT '{}',
  requires_config boolean NOT NULL DEFAULT false,
  config_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  config_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  built_in boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_templates_category_idx ON public.whatsapp_templates (category);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "Admins manage whatsapp_templates"
  ON public.whatsapp_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS whatsapp_templates_touch_updated_at ON public.whatsapp_templates;
CREATE TRIGGER whatsapp_templates_touch_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
