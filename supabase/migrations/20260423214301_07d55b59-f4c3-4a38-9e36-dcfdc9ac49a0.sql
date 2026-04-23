-- site_content
DROP POLICY IF EXISTS "Admins manage site content" ON public.site_content;
CREATE POLICY "Admins insert site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update site content" ON public.site_content FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete site content" ON public.site_content FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- landing_pages
DROP POLICY IF EXISTS "Admins manage landing pages" ON public.landing_pages;
CREATE POLICY "Admins read all landing pages" ON public.landing_pages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert landing pages" ON public.landing_pages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update landing pages" ON public.landing_pages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete landing pages" ON public.landing_pages FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- external_integrations
DROP POLICY IF EXISTS "Admins manage integrations" ON public.external_integrations;
CREATE POLICY "Admins read integrations" ON public.external_integrations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert integrations" ON public.external_integrations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update integrations" ON public.external_integrations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete integrations" ON public.external_integrations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- api_keys
DROP POLICY IF EXISTS "Admins manage api keys" ON public.api_keys;
CREATE POLICY "Admins read api keys" ON public.api_keys FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert api keys" ON public.api_keys FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update api keys" ON public.api_keys FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete api keys" ON public.api_keys FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- webhook_endpoints
DROP POLICY IF EXISTS "Admins manage webhooks" ON public.webhook_endpoints;
CREATE POLICY "Admins read webhooks" ON public.webhook_endpoints FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert webhooks" ON public.webhook_endpoints FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update webhooks" ON public.webhook_endpoints FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete webhooks" ON public.webhook_endpoints FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- clinic_settings
DROP POLICY IF EXISTS "Admins manage settings" ON public.clinic_settings;
CREATE POLICY "Admins read settings" ON public.clinic_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert settings" ON public.clinic_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update settings" ON public.clinic_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete settings" ON public.clinic_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));