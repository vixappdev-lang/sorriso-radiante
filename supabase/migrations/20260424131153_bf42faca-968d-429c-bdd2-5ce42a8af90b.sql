
UPDATE public.whatsapp_event_settings
SET template = REPLACE(REPLACE(REPLACE(template,
    'Clínica Levii', 'LyneCloud'),
    'Clinica Levii', 'LyneCloud'),
    '99999-0000', '98112-0322')
WHERE template ILIKE '%Levii%' OR template ILIKE '%99999-0000%';

UPDATE public.clinic_settings
SET value = REPLACE(REPLACE(REPLACE(value::text,
    'Clínica Levii', 'LyneCloud'),
    'Clinica Levii', 'LyneCloud'),
    '99999-0000', '98112-0322')::jsonb
WHERE value::text ILIKE '%Levii%' OR value::text ILIKE '%99999-0000%';

UPDATE public.site_content
SET value = REPLACE(REPLACE(REPLACE(value::text,
    'Clínica Levii', 'LyneCloud'),
    'Clinica Levii', 'LyneCloud'),
    '99999-0000', '98112-0322')::jsonb
WHERE value::text ILIKE '%Levii%' OR value::text ILIKE '%99999-0000%';
