-- 1. PERMISSÕES
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage permissions" ON public.user_permissions;
CREATE POLICY "Admins manage permissions" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own permissions" ON public.user_permissions;
CREATE POLICY "Users read own permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  job_title text,
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage staff" ON public.staff_profiles;
CREATE POLICY "Admins manage staff" ON public.staff_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Staff read own profile" ON public.staff_profiles;
CREATE POLICY "Staff read own profile" ON public.staff_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _action text DEFAULT 'view')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = _user_id AND module = _module
      AND CASE _action WHEN 'view' THEN can_view WHEN 'edit' THEN can_edit WHEN 'delete' THEN can_delete ELSE false END
    );
$$;

-- 2. PACIENTES (área cliente)
CREATE TABLE IF NOT EXISTS public.patient_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  cpf text,
  birth_date date,
  avatar_url text,
  address jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_accounts_phone ON public.patient_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_patient_accounts_user ON public.patient_accounts(user_id);
ALTER TABLE public.patient_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all patients" ON public.patient_accounts;
CREATE POLICY "Admins manage all patients" ON public.patient_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Patients read own profile" ON public.patient_accounts;
CREATE POLICY "Patients read own profile" ON public.patient_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Patients update own profile" ON public.patient_accounts;
CREATE POLICY "Patients update own profile" ON public.patient_accounts
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users create own patient" ON public.patient_accounts;
CREATE POLICY "Authenticated users create own patient" ON public.patient_accounts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Patients read own appointments" ON public.appointments;
CREATE POLICY "Patients read own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (phone IN (SELECT phone FROM public.patient_accounts WHERE user_id = auth.uid()));

-- 3. PROFISSIONAIS extensão
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS services text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS slot_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';

ALTER TABLE public.professional_schedules
  ADD COLUMN IF NOT EXISTS break_start text,
  ADD COLUMN IF NOT EXISTS break_end text;

-- 4. AVALIAÇÃO PÚBLICA
CREATE TABLE IF NOT EXISTS public.review_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  patient_name text NOT NULL,
  patient_phone text,
  professional text,
  treatment text,
  used_at timestamptz,
  review_id uuid,
  expires_at timestamptz DEFAULT (now() + interval '60 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage invites" ON public.review_invites;
CREATE POLICY "Admins manage invites" ON public.review_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can read invite by token" ON public.review_invites;
CREATE POLICY "Public can read invite by token" ON public.review_invites
  FOR SELECT TO anon, authenticated
  USING (used_at IS NULL AND (expires_at IS NULL OR expires_at > now()));

CREATE OR REPLACE FUNCTION public.submit_review_with_token(
  _token text, _rating smallint, _comment text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _invite review_invites%ROWTYPE; _new_review_id uuid;
BEGIN
  SELECT * INTO _invite FROM review_invites
  WHERE token = _token AND used_at IS NULL AND (expires_at IS NULL OR expires_at > now()) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Nota inválida'; END IF;
  INSERT INTO reviews (patient_name, rating, comment, source)
  VALUES (_invite.patient_name, _rating, _comment, 'invite') RETURNING id INTO _new_review_id;
  UPDATE review_invites SET used_at = now(), review_id = _new_review_id WHERE id = _invite.id;
  RETURN _new_review_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_review_with_token(text, smallint, text) TO anon, authenticated;

-- 5. LINK PÚBLICO DE AGENDAMENTO
CREATE TABLE IF NOT EXISTS public.public_booking_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  professional_slug text,
  treatment_slug text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.public_booking_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage booking links" ON public.public_booking_links;
CREATE POLICY "Admins manage booking links" ON public.public_booking_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read active booking links" ON public.public_booking_links;
CREATE POLICY "Public read active booking links" ON public.public_booking_links
  FOR SELECT TO anon, authenticated USING (active = true);

-- 6. CLINICORP SYNC
CREATE TABLE IF NOT EXISTS public.clinicorp_busy_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  professional_external_id text,
  professional_slug text,
  busy_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  patient_name text,
  treatment text,
  status text NOT NULL DEFAULT 'busy',
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinicorp_busy_date ON public.clinicorp_busy_slots(busy_date);
CREATE INDEX IF NOT EXISTS idx_clinicorp_busy_prof ON public.clinicorp_busy_slots(professional_slug, busy_date);
ALTER TABLE public.clinicorp_busy_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage busy slots" ON public.clinicorp_busy_slots;
CREATE POLICY "Admins manage busy slots" ON public.clinicorp_busy_slots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read busy slots" ON public.clinicorp_busy_slots;
CREATE POLICY "Public read busy slots" ON public.clinicorp_busy_slots
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.clinicorp_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  message text,
  slots_synced integer DEFAULT 0,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinicorp_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sync log" ON public.clinicorp_sync_log;
CREATE POLICY "Admins read sync log" ON public.clinicorp_sync_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('professional-photos', 'professional-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-avatars', 'patient-avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read prof photos" ON storage.objects;
CREATE POLICY "Public read prof photos" ON storage.objects FOR SELECT USING (bucket_id = 'professional-photos');

DROP POLICY IF EXISTS "Admins upload prof photos" ON storage.objects;
CREATE POLICY "Admins upload prof photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'professional-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update prof photos" ON storage.objects;
CREATE POLICY "Admins update prof photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'professional-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete prof photos" ON storage.objects;
CREATE POLICY "Admins delete prof photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'professional-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read clinic assets" ON storage.objects;
CREATE POLICY "Public read clinic assets" ON storage.objects FOR SELECT USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Admins manage clinic assets" ON storage.objects;
CREATE POLICY "Admins manage clinic assets" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'clinic-assets' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'clinic-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read patient avatars" ON storage.objects;
CREATE POLICY "Public read patient avatars" ON storage.objects FOR SELECT USING (bucket_id = 'patient-avatars');

DROP POLICY IF EXISTS "Patients upload own avatar" ON storage.objects;
CREATE POLICY "Patients upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Patients update own avatar" ON storage.objects;
CREATE POLICY "Patients update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. TRIGGERS updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_patients_updated ON public.patient_accounts;
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patient_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_staff_updated ON public.staff_profiles;
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();