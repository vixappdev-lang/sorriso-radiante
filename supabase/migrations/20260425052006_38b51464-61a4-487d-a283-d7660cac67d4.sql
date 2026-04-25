
-- ============================================================
-- 1) PRÉ-PAGAMENTO
-- ============================================================
ALTER TABLE public.treatments_overrides
  ADD COLUMN IF NOT EXISTS requires_prepayment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prepayment_amount_cents bigint;

CREATE TABLE IF NOT EXISTS public.appointment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  amount_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending|paid|failed|refunded
  provider text NOT NULL DEFAULT 'pix',
  pix_payload text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage appointment_payments" ON public.appointment_payments;
CREATE POLICY "Admins manage appointment_payments" ON public.appointment_payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone create appointment_payments" ON public.appointment_payments;
CREATE POLICY "Anyone create appointment_payments" ON public.appointment_payments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_appointment_payments_appointment ON public.appointment_payments(appointment_id);

-- ============================================================
-- 2) ODONTOGRAMA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patient_odontogram (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  teeth jsonb NOT NULL DEFAULT '{}'::jsonb, -- { "11": {"status":"caries","note":"..."}, ... }
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_odontogram ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage odontogram" ON public.patient_odontogram;
CREATE POLICY "Admins manage odontogram" ON public.patient_odontogram
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX IF NOT EXISTS idx_odontogram_phone ON public.patient_odontogram(patient_phone);

-- ============================================================
-- 3) ORÇAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patient_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  patient_name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{slug,name,qty,unit_cents,discount_cents}]
  subtotal_cents bigint NOT NULL DEFAULT 0,
  discount_cents bigint NOT NULL DEFAULT 0,
  total_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft|sent|accepted|refused|expired
  token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  notes text,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage quotes" ON public.patient_quotes;
CREATE POLICY "Admins manage quotes" ON public.patient_quotes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read quote by token" ON public.patient_quotes;
CREATE POLICY "Public read quote by token" ON public.patient_quotes
  FOR SELECT TO anon, authenticated
  USING (status IN ('sent','accepted') AND (expires_at IS NULL OR expires_at > now()));

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_token ON public.patient_quotes(token);
CREATE INDEX IF NOT EXISTS idx_quotes_phone ON public.patient_quotes(patient_phone);

-- Função pública para aceite via token (sem auth)
CREATE OR REPLACE FUNCTION public.accept_quote_with_token(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _q patient_quotes%ROWTYPE;
BEGIN
  SELECT * INTO _q FROM patient_quotes
   WHERE token = _token AND status = 'sent' AND (expires_at IS NULL OR expires_at > now())
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Orçamento inválido ou expirado'; END IF;
  UPDATE patient_quotes SET status = 'accepted', accepted_at = now() WHERE id = _q.id;
  RETURN _q.id;
END; $$;

-- ============================================================
-- 4) COMISSÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_slug text NOT NULL,
  treatment_slug text, -- null = aplica a tudo
  percent numeric(5,2), -- 0..100
  fixed_cents bigint,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage commission_rules" ON public.commission_rules;
CREATE POLICY "Admins manage commission_rules" ON public.commission_rules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.commission_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_entry_id uuid,
  professional_slug text NOT NULL,
  professional_name text,
  base_amount_cents bigint NOT NULL DEFAULT 0,
  amount_cents bigint NOT NULL DEFAULT 0,
  rule_id uuid,
  status text NOT NULL DEFAULT 'pending', -- pending|paid|cancelled
  paid_at timestamptz,
  reference_month date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage commission_entries" ON public.commission_entries;
CREATE POLICY "Admins manage commission_entries" ON public.commission_entries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_commission_entries_pro ON public.commission_entries(professional_slug);
CREATE INDEX IF NOT EXISTS idx_commission_entries_fin ON public.commission_entries(financial_entry_id);

-- Trigger: ao marcar income como paid, gera commission_entry
CREATE OR REPLACE FUNCTION public.fn_generate_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _appt RECORD;
  _rule commission_rules%ROWTYPE;
  _amount bigint;
BEGIN
  IF NEW.type <> 'income' OR NEW.status <> 'paid' THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.status = 'paid') THEN RETURN NEW; END IF;
  IF NEW.appointment_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO _appt FROM appointments WHERE id = NEW.appointment_id;
  IF NOT FOUND OR _appt.professional IS NULL THEN RETURN NEW; END IF;

  -- Busca regra (mais específica primeiro)
  SELECT * INTO _rule FROM commission_rules
   WHERE active = true
     AND professional_slug = _appt.professional
     AND (treatment_slug IS NULL OR treatment_slug = _appt.treatment)
   ORDER BY (treatment_slug IS NOT NULL) DESC
   LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  _amount := COALESCE(_rule.fixed_cents, 0)
           + COALESCE(ROUND(NEW.amount_cents * _rule.percent / 100.0)::bigint, 0);

  IF _amount > 0 THEN
    INSERT INTO commission_entries (financial_entry_id, professional_slug, professional_name, base_amount_cents, amount_cents, rule_id, reference_month)
    VALUES (NEW.id, _appt.professional, _appt.professional, NEW.amount_cents, _amount, _rule.id, date_trunc('month', COALESCE(NEW.paid_at, now()))::date);
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_generate_commission ON public.financial_entries;
CREATE TRIGGER trg_generate_commission
  AFTER INSERT OR UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_generate_commission();

-- ============================================================
-- 5) ESTOQUE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text,
  name text NOT NULL,
  unit text DEFAULT 'un',
  current_qty numeric(12,3) NOT NULL DEFAULT 0,
  min_qty numeric(12,3) NOT NULL DEFAULT 0,
  cost_cents bigint NOT NULL DEFAULT 0,
  category text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage stock_items" ON public.stock_items;
CREATE POLICY "Admins manage stock_items" ON public.stock_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  type text NOT NULL, -- in|out|adjust
  qty numeric(12,3) NOT NULL,
  reason text,
  appointment_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage stock_movements" ON public.stock_movements;
CREATE POLICY "Admins manage stock_movements" ON public.stock_movements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements(item_id);

CREATE OR REPLACE FUNCTION public.fn_apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE stock_items SET current_qty = current_qty + NEW.qty, updated_at = now() WHERE id = NEW.item_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE stock_items SET current_qty = current_qty - NEW.qty, updated_at = now() WHERE id = NEW.item_id;
  ELSIF NEW.type = 'adjust' THEN
    UPDATE stock_items SET current_qty = NEW.qty, updated_at = now() WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_apply_stock_movement ON public.stock_movements;
CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.fn_apply_stock_movement();

-- ============================================================
-- 6) WHATSAPP BOT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_bot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  persona text NOT NULL DEFAULT 'Atendente humanizada de clínica',
  system_prompt text NOT NULL DEFAULT '',
  fallback_message text NOT NULL DEFAULT 'Vou te transferir para um humano em instantes 💙',
  business_hours_only boolean NOT NULL DEFAULT false,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  human_like_delay boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_bot_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage bot_config" ON public.whatsapp_bot_config;
CREATE POLICY "Admins manage bot_config" ON public.whatsapp_bot_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_bot_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  trigger_examples text[] NOT NULL DEFAULT '{}',
  response_template text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT 'reply', -- reply|handoff|schedule|quote
  enabled boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_bot_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage bot_intents" ON public.whatsapp_bot_intents;
CREATE POLICY "Admins manage bot_intents" ON public.whatsapp_bot_intents
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  contact_name text,
  status text NOT NULL DEFAULT 'active', -- active|handed_off|closed
  ai_enabled boolean NOT NULL DEFAULT true,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage conversations" ON public.whatsapp_conversations;
CREATE POLICY "Admins manage conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_phone ON public.whatsapp_conversations(phone);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  direction text NOT NULL, -- in|out
  body text NOT NULL,
  intent_matched text,
  ai_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage messages" ON public.whatsapp_messages;
CREATE POLICY "Admins manage messages" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.whatsapp_messages(conversation_id, created_at DESC);

-- ============================================================
-- 7) AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL, -- insert|update|delete|status_change
  entity text NOT NULL, -- table name
  entity_id text,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit" ON public.admin_audit_log;
CREATE POLICY "Admins read audit" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.admin_audit_log(entity, created_at DESC);

-- Triggers de updated_at em todas tabelas novas
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'appointment_payments','patient_odontogram','patient_quotes',
    'commission_rules','commission_entries','stock_items',
    'whatsapp_bot_config','whatsapp_bot_intents','whatsapp_conversations'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- Seed: configuração default do bot
INSERT INTO public.whatsapp_bot_config (enabled, persona, system_prompt, fallback_message, model)
SELECT false,
  'Atendente humanizada de clínica',
  'Você é a assistente virtual de uma clínica odontológica de alto padrão. Fale em português brasileiro, de forma calorosa, breve e profissional. Sempre cumprimente o paciente, identifique o motivo do contato (dúvida, preço, agendamento, urgência) e responda com clareza. Para dúvidas clínicas complexas ou urgências reais, transfira para a recepção humana usando a ferramenta transferir_humano. Para pedidos de agendamento, peça nome, telefone, tratamento desejado e melhor data/horário, depois use agendar_consulta. Nunca invente preços — quando perguntarem valores, ofereça uma avaliação gratuita. Responda em no máximo 3 frases.',
  'Em alguns instantes nossa equipe vai te responder por aqui 💙',
  'google/gemini-2.5-flash'
WHERE NOT EXISTS (SELECT 1 FROM public.whatsapp_bot_config);

-- Seed: intents padrão
INSERT INTO public.whatsapp_bot_intents (key, label, trigger_examples, response_template, action, position)
SELECT * FROM (VALUES
  ('greeting','Saudação',
    ARRAY['oi','olá','ola','bom dia','boa tarde','boa noite','tudo bem','e ai','hey']::text[],
    'Olá! 😊 Aqui é a assistente da clínica. Como posso te ajudar hoje? Posso te informar sobre tratamentos, valores, horários ou agendamento.','reply',1),
  ('schedule','Quer agendar',
    ARRAY['quero agendar','marcar consulta','agendar','marcar horario','quero marcar']::text[],
    'Perfeito! Para agendar preciso de: seu nome completo, telefone para contato, qual tratamento te interessa e o melhor dia/horário 📅','schedule',2),
  ('price','Pergunta preço',
    ARRAY['quanto custa','qual o valor','preço','valor','quanto fica','quanto é']::text[],
    'Os valores variam conforme cada caso. Que tal agendar uma avaliação gratuita? Em 30 minutos a doutora te dá o orçamento exato 💙','reply',3),
  ('hours','Horário de funcionamento',
    ARRAY['horário','horario','que horas','funcionamento','abertos','aberto']::text[],
    'Atendemos de segunda a sexta das 8h às 19h e sábados das 8h às 13h. Quer que eu já agende um horário para você?','reply',4),
  ('address','Endereço',
    ARRAY['endereço','endereco','onde fica','localização','localizacao','como chegar']::text[],
    'Estamos em local de fácil acesso 🗺️ Posso te enviar o link do Google Maps?','reply',5),
  ('urgency','Urgência / dor',
    ARRAY['estou com dor','dor de dente','urgente','urgência','quebrei','sangrando','muita dor']::text[],
    'Entendo, vamos te encaixar com prioridade. Estou chamando a recepção agora para te atender em segundos ⚡','handoff',6),
  ('cancel','Cancelar / remarcar',
    ARRAY['cancelar','remarcar','desmarcar','não vou poder ir','transferir consulta']::text[],
    'Tudo certo, vou te ajudar a remarcar. Me passa o dia da consulta atual e a nova data que prefere?','reply',7),
  ('insurance','Convênio',
    ARRAY['convênio','convenio','plano','aceita plano','unimed','amil','bradesco saude']::text[],
    'Trabalhamos como particular com condições facilitadas (parcelamos em até 12x) e aceitamos reembolso para alguns convênios. Quer mais detalhes?','reply',8),
  ('thanks','Agradecimento',
    ARRAY['obrigado','obrigada','valeu','grato','vlw']::text[],
    'Por nada! 😊 Qualquer coisa estou por aqui. Tenha um ótimo dia!','reply',9)
) AS v(key,label,trigger_examples,response_template,action,position)
WHERE NOT EXISTS (SELECT 1 FROM public.whatsapp_bot_intents);
