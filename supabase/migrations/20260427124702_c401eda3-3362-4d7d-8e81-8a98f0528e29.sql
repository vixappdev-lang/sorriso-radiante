-- Ensure 'general' clinic settings are publicly readable so the public site can show the configured clinic name
INSERT INTO public.clinic_settings (key, value, is_public)
VALUES ('general', '{}'::jsonb, true)
ON CONFLICT (key) DO UPDATE SET is_public = true;

-- Also mark branding as public (logo, colors)
INSERT INTO public.clinic_settings (key, value, is_public)
VALUES ('branding', '{}'::jsonb, true)
ON CONFLICT (key) DO UPDATE SET is_public = true;