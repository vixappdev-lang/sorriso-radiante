
-- ============= Profissionais =============
CREATE TABLE IF NOT EXISTS public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  specialty text,
  cro text,
  photo_url text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  weekly_hours int DEFAULT 40,
  notes_internal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage professionals" ON public.professionals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read active professionals" ON public.professionals FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE TABLE IF NOT EXISTS public.professional_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time text NOT NULL,
  end_time text NOT NULL
);
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage schedules" ON public.professional_schedules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============= Patient notes =============
CREATE TABLE IF NOT EXISTS public.patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage patient notes" ON public.patient_notes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_patient_notes_phone ON public.patient_notes(patient_phone);

-- ============= Schedule blocks =============
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  start_time text,
  end_time text,
  professional_slug text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocks" ON public.schedule_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============= Treatments overrides =============
CREATE TABLE IF NOT EXISTS public.treatments_overrides (
  slug text PRIMARY KEY,
  price_from text,
  duration text,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.treatments_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage treatments" ON public.treatments_overrides FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read treatments overrides" ON public.treatments_overrides FOR SELECT TO anon, authenticated USING (true);

-- ============= Financial entries =============
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income','expense')),
  appointment_id uuid,
  patient_name text,
  amount_cents bigint NOT NULL DEFAULT 0,
  description text,
  due_date date,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  method text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage finance" ON public.financial_entries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_finance_status ON public.financial_entries(status);
CREATE INDEX IF NOT EXISTS idx_finance_due ON public.financial_entries(due_date);

-- ============= Leads =============
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  source text,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','contato','orcamento','fechado','perdido')),
  notes text,
  owner text,
  last_touch_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can submit lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- ============= Reviews =============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  source text NOT NULL DEFAULT 'manual',
  reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

-- ============= Site promotions =============
CREATE TABLE IF NOT EXISTS public.site_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  cta_label text,
  cta_url text,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage promos" ON public.site_promotions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read active promos" ON public.site_promotions FOR SELECT TO anon, authenticated USING (active = true);

-- ============= Clinic hours / holidays =============
CREATE TABLE IF NOT EXISTS public.clinic_hours (
  weekday smallint PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6),
  open_time text,
  close_time text,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage hours" ON public.clinic_hours FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read hours" ON public.clinic_hours FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.clinic_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date date NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage holidays" ON public.clinic_holidays FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read holidays" ON public.clinic_holidays FOR SELECT TO anon, authenticated USING (true);
