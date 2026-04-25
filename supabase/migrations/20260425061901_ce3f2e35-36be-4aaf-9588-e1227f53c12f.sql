ALTER TABLE public.whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'openai',
  ADD COLUMN IF NOT EXISTS ai_model text NOT NULL DEFAULT 'gpt-4o-mini',
  ADD COLUMN IF NOT EXISTS ai_fallback_enabled boolean NOT NULL DEFAULT true;

-- Atualiza configuração existente para usar OpenAI por padrão
UPDATE public.whatsapp_bot_config
SET ai_provider = 'openai',
    ai_model = 'gpt-4o-mini'
WHERE ai_provider IS NULL OR ai_provider = '' OR ai_provider = 'lovable';