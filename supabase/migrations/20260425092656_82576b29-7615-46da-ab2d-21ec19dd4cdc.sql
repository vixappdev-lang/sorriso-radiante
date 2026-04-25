-- Suporte a fluxos encadeados de WhatsApp templates
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS current_flow_key text;

CREATE INDEX IF NOT EXISTS idx_conversations_current_flow ON public.whatsapp_conversations(current_flow_key);