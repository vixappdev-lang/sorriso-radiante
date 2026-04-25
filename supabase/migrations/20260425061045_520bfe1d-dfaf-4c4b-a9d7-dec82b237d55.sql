-- Adiciona campo de saudação inicial padrão (primeiro contato)
ALTER TABLE public.whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS greeting_message text NOT NULL DEFAULT 'Olá! 👋 Aqui é da *LyneCloud*, em que podemos lhe ajudar hoje?';

-- Atualiza a resposta rápida do intent "greeting" para mencionar LyneCloud
UPDATE public.whatsapp_bot_intents
SET response_template = 'Olá! 😊 Aqui é da *LyneCloud*. Em que podemos lhe ajudar hoje? Posso te informar sobre tratamentos, valores, horários ou agendamento.'
WHERE key = 'greeting';