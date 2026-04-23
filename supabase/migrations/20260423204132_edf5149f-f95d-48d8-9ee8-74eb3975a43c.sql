-- =========================================================
-- 1) Enum de papéis
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin');
  END IF;
END$$;

-- =========================================================
-- 2) Tabela user_roles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3) Função security definer (sem recursão em RLS)
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- =========================================================
-- 4) RLS — user_roles (apenas admins gerenciam)
-- =========================================================
DROP POLICY IF EXISTS "Admins can view roles"   ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 5) RLS — appointments (admins enxergam/gerenciam tudo)
--    Mantém a policy pública de INSERT já existente.
-- =========================================================
DROP POLICY IF EXISTS "Admins can view appointments"   ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

CREATE POLICY "Admins can view appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 6) RLS — chatpro_config (admins podem ler/atualizar)
-- =========================================================
DROP POLICY IF EXISTS "Admins can view chatpro config"   ON public.chatpro_config;
DROP POLICY IF EXISTS "Admins can update chatpro config" ON public.chatpro_config;
DROP POLICY IF EXISTS "Admins can insert chatpro config" ON public.chatpro_config;

CREATE POLICY "Admins can view chatpro config"
  ON public.chatpro_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chatpro config"
  ON public.chatpro_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chatpro config"
  ON public.chatpro_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 7) Índices
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id          ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appt_date      ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at     ON public.appointments(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status         ON public.appointments(status);