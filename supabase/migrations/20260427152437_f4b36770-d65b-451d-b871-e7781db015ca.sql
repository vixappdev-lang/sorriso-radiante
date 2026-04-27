
-- =====================================================================
-- SPRINT 1: Anamnese + Assinatura
-- =====================================================================
CREATE TABLE public.anamnesis_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.anamnesis_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage anamnesis_templates" ON public.anamnesis_templates FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Public read active templates by token" ON public.anamnesis_templates FOR SELECT TO anon, authenticated USING (active = true);
CREATE TRIGGER trg_anamnesis_templates_updated BEFORE UPDATE ON public.anamnesis_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.patient_anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  patient_name text NOT NULL,
  template_id uuid REFERENCES public.anamnesis_templates(id) ON DELETE SET NULL,
  template_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, completed, signed
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  signature_data text, -- SVG dataURL
  signature_hash text,
  signature_ip text,
  signed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '60 days'),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_anamnesis_phone ON public.patient_anamnesis(patient_phone);
CREATE INDEX idx_patient_anamnesis_token ON public.patient_anamnesis(token);
ALTER TABLE public.patient_anamnesis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage anamnesis" ON public.patient_anamnesis FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Public read anamnesis by token" ON public.patient_anamnesis FOR SELECT TO anon, authenticated USING ((status IN ('pending','completed','signed')) AND (expires_at IS NULL OR expires_at > now()));
CREATE TRIGGER trg_patient_anamnesis_updated BEFORE UPDATE ON public.patient_anamnesis FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RPC: paciente envia respostas via token (sem auth)
CREATE OR REPLACE FUNCTION public.submit_anamnesis_with_token(
  _token text, _answers jsonb, _signature_data text, _signature_ip text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row patient_anamnesis%ROWTYPE; _hash text;
BEGIN
  SELECT * INTO _row FROM patient_anamnesis WHERE token = _token AND status <> 'signed' AND (expires_at IS NULL OR expires_at > now()) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Anamnese inválida ou expirada'; END IF;
  _hash := encode(digest(coalesce(_signature_data,'') || _row.id::text || now()::text, 'sha256'), 'hex');
  UPDATE patient_anamnesis SET
    answers = _answers,
    signature_data = _signature_data,
    signature_hash = _hash,
    signature_ip = _signature_ip,
    signed_at = CASE WHEN _signature_data IS NOT NULL THEN now() ELSE NULL END,
    status = CASE WHEN _signature_data IS NOT NULL THEN 'signed' ELSE 'completed' END,
    updated_at = now()
   WHERE id = _row.id;
  RETURN _row.id;
END; $$;

-- =====================================================================
-- SPRINT 1: Prontuário clínico
-- =====================================================================
CREATE TABLE public.clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  patient_name text NOT NULL,
  appointment_id uuid,
  professional_slug text,
  professional_name text,
  specialty text,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  content text,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_records_phone ON public.clinical_records(patient_phone);
CREATE INDEX idx_clinical_records_date ON public.clinical_records(record_date DESC);
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage clinical_records" ON public.clinical_records FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_clinical_records_updated BEFORE UPDATE ON public.clinical_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- SPRINT 1: Galeria clínica
-- =====================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-clinical-images', 'patient-clinical-images', false) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.patient_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  category text NOT NULL DEFAULT 'intraoral', -- intraoral, extraoral, xray, before, after, document
  tooth_fdi smallint,
  storage_path text NOT NULL,
  caption text,
  taken_at date DEFAULT CURRENT_DATE,
  pair_id uuid, -- agrupa antes/depois
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_patient_images_phone ON public.patient_images(patient_phone);
CREATE INDEX idx_patient_images_pair ON public.patient_images(pair_id);
ALTER TABLE public.patient_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient_images" ON public.patient_images FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Storage policies — só admins
CREATE POLICY "Admins read clinical images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'patient-clinical-images' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins upload clinical images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'patient-clinical-images' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins delete clinical images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'patient-clinical-images' AND has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins update clinical images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'patient-clinical-images' AND has_role(auth.uid(),'admin'::app_role));

-- =====================================================================
-- SPRINT 3: Recall
-- =====================================================================
CREATE TABLE public.recall_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  patient_name text NOT NULL,
  appointment_id uuid,
  treatment text,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, scheduled, dismissed
  notes text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_recall_due ON public.recall_tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_recall_phone ON public.recall_tasks(patient_phone);
ALTER TABLE public.recall_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage recall_tasks" ON public.recall_tasks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_recall_tasks_updated BEFORE UPDATE ON public.recall_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- SPRINT 3: Metas
-- =====================================================================
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'clinic', -- clinic, professional
  professional_slug text,
  metric text NOT NULL DEFAULT 'revenue', -- revenue, appointments, conversion, new_patients
  period text NOT NULL DEFAULT 'month',
  reference_month date NOT NULL DEFAULT date_trunc('month', now())::date,
  target_value numeric NOT NULL DEFAULT 0,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage goals" ON public.goals FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- SPRINT 3: Estoque pro (lotes + validade)
-- =====================================================================
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS expiry_alert_days int NOT NULL DEFAULT 30;

CREATE TABLE public.stock_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  lot_code text,
  qty numeric NOT NULL DEFAULT 0,
  expiry_date date,
  cost_cents bigint DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_lots_item ON public.stock_lots(item_id);
CREATE INDEX idx_stock_lots_expiry ON public.stock_lots(expiry_date);
ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock_lots" ON public.stock_lots FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_stock_lots_updated BEFORE UPDATE ON public.stock_lots FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- SPRINT 2: Conciliação bancária
-- =====================================================================
CREATE TABLE public.bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text,
  account text,
  period_start date,
  period_end date,
  total_lines int NOT NULL DEFAULT 0,
  reconciled_lines int NOT NULL DEFAULT 0,
  imported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bank_statements" ON public.bank_statements FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.bank_statement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id uuid NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  posted_at date NOT NULL,
  description text,
  amount_cents bigint NOT NULL,
  raw_id text,
  matched_entry_id uuid REFERENCES public.financial_entries(id) ON DELETE SET NULL,
  matched_at timestamptz,
  matched_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bsl_statement ON public.bank_statement_lines(statement_id);
CREATE INDEX idx_bsl_unmatched ON public.bank_statement_lines(statement_id) WHERE matched_entry_id IS NULL;
ALTER TABLE public.bank_statement_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bank_statement_lines" ON public.bank_statement_lines FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- =====================================================================
-- SPRINT 2: Payment Charges (Asaas / PIX)
-- =====================================================================
CREATE TABLE public.payment_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_entry_id uuid REFERENCES public.financial_entries(id) ON DELETE SET NULL,
  patient_phone text,
  patient_name text,
  amount_cents bigint NOT NULL DEFAULT 0,
  description text,
  billing_type text NOT NULL DEFAULT 'PIX', -- PIX, BOLETO, CREDIT_CARD
  provider text NOT NULL DEFAULT 'asaas',
  external_id text,
  invoice_url text,
  payment_url text,
  pix_qr_code text,
  pix_payload text,
  bank_slip_url text,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, overdue, refunded, cancelled
  due_date date,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_charges_entry ON public.payment_charges(financial_entry_id);
CREATE INDEX idx_payment_charges_status ON public.payment_charges(status);
ALTER TABLE public.payment_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payment_charges" ON public.payment_charges FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Patients read own charges" ON public.payment_charges FOR SELECT TO authenticated USING (patient_phone IN (SELECT phone FROM patient_accounts WHERE user_id = auth.uid()));
CREATE TRIGGER trg_payment_charges_updated BEFORE UPDATE ON public.payment_charges FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- Seeds: Templates de anamnese padrão
-- =====================================================================
INSERT INTO public.anamnesis_templates (name, specialty, description, is_default, questions) VALUES
('Anamnese Geral','geral','Modelo padrão para primeira consulta.', true, '[
  {"id":"saude_geral","label":"Como você avalia sua saúde geral?","type":"select","options":["Excelente","Boa","Regular","Ruim"],"required":true},
  {"id":"alergias","label":"Possui alergias a medicamentos? Quais?","type":"textarea"},
  {"id":"medicamentos","label":"Faz uso contínuo de algum medicamento?","type":"textarea"},
  {"id":"doencas","label":"Tem alguma doença diagnosticada (diabetes, hipertensão etc.)?","type":"textarea"},
  {"id":"cirurgias","label":"Já fez alguma cirurgia? Qual e quando?","type":"textarea"},
  {"id":"gestante","label":"Está grávida ou amamentando?","type":"select","options":["Não","Grávida","Amamentando"]},
  {"id":"fuma","label":"Fuma?","type":"select","options":["Não","Sim, ocasionalmente","Sim, diariamente"]},
  {"id":"queixa","label":"Qual a sua queixa principal?","type":"textarea","required":true}
]'::jsonb),
('Anamnese Ortodontia','ortodontia','Para avaliação ortodôntica completa.', false, '[
  {"id":"queixa","label":"Qual sua principal queixa estética/funcional?","type":"textarea","required":true},
  {"id":"tratamento_anterior","label":"Já usou aparelho antes?","type":"select","options":["Não","Sim, fixo","Sim, móvel","Sim, alinhador"]},
  {"id":"chupava_dedo","label":"Chupou dedo ou chupeta na infância?","type":"select","options":["Não","Sim, até 3 anos","Sim, depois dos 3 anos"]},
  {"id":"respira_boca","label":"Respira pela boca?","type":"select","options":["Não","Às vezes","Sim, sempre"]},
  {"id":"ronca","label":"Ronca ao dormir?","type":"select","options":["Não","Às vezes","Sim, sempre"]},
  {"id":"dor_atm","label":"Sente dor ou estalido na ATM?","type":"textarea"},
  {"id":"alergias","label":"Alergia a látex ou metais?","type":"textarea"}
]'::jsonb),
('Anamnese Implante','implantodontia','Avaliação para implantes dentários.', false, '[
  {"id":"queixa","label":"Quais dentes deseja repor?","type":"textarea","required":true},
  {"id":"diabetes","label":"É diabético?","type":"select","options":["Não","Sim, controlado","Sim, descontrolado"]},
  {"id":"bisfosfonatos","label":"Faz uso de bisfosfonatos?","type":"select","options":["Não","Sim"]},
  {"id":"radioterapia","label":"Já fez radioterapia na cabeça/pescoço?","type":"select","options":["Não","Sim"]},
  {"id":"fumante","label":"É fumante?","type":"select","options":["Não","Sim"]},
  {"id":"anticoagulante","label":"Usa anticoagulante?","type":"textarea"},
  {"id":"perdeu_quando","label":"Há quanto tempo perdeu o(s) dente(s)?","type":"text"}
]'::jsonb),
('Anamnese Estética / HOF','estetica','Harmonização orofacial, bichectomia, botox, preenchimento.', false, '[
  {"id":"objetivo","label":"Qual seu objetivo estético?","type":"textarea","required":true},
  {"id":"procedimentos_anteriores","label":"Já fez algum procedimento estético facial?","type":"textarea"},
  {"id":"alergias","label":"Alergia a anestésicos ou toxina botulínica?","type":"textarea"},
  {"id":"gestante","label":"Está grávida ou amamentando?","type":"select","options":["Não","Sim"]},
  {"id":"medicamentos","label":"Uso contínuo de medicamentos?","type":"textarea"},
  {"id":"doencas_autoimunes","label":"Possui doenças autoimunes?","type":"textarea"},
  {"id":"herpes","label":"Tem histórico de herpes labial recorrente?","type":"select","options":["Não","Sim"]}
]'::jsonb),
('Anamnese Endodontia','endodontia','Tratamento de canal.', false, '[
  {"id":"dor","label":"Descreva a dor (intensidade, frequência, gatilhos):","type":"textarea","required":true},
  {"id":"sensibilidade","label":"Sensibilidade ao quente, frio ou doce?","type":"select","options":["Não","Frio","Quente","Doce","Todos"]},
  {"id":"trauma","label":"Sofreu algum trauma no dente?","type":"textarea"},
  {"id":"medicamentos","label":"Tomou algum analgésico nas últimas 24h?","type":"textarea"},
  {"id":"alergias","label":"Alergia a anestésicos?","type":"textarea"}
]'::jsonb),
('Anamnese Cirurgia / Extração','cirurgia','Para extrações e cirurgias bucais.', false, '[
  {"id":"motivo","label":"Motivo da cirurgia/extração:","type":"textarea","required":true},
  {"id":"alergias","label":"Alergias medicamentosas:","type":"textarea"},
  {"id":"anticoagulante","label":"Usa anticoagulante?","type":"textarea"},
  {"id":"diabetes","label":"Diabético?","type":"select","options":["Não","Sim"]},
  {"id":"hipertensao","label":"Hipertenso?","type":"select","options":["Não","Sim"]},
  {"id":"jejum","label":"Pode fazer jejum se necessário?","type":"select","options":["Sim","Não"]},
  {"id":"acompanhante","label":"Terá acompanhante no dia?","type":"select","options":["Sim","Não"]}
]'::jsonb);
