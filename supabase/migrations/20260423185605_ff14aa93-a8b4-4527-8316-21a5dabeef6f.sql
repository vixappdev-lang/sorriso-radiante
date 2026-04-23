UPDATE public.chatpro_config
SET message_template = E'✅ *Agendamento confirmado*\n\nOlá, {{nome}}! Seu horário na *Clínica Levii* foi reservado com sucesso. 🦷\n\n📋 *Tratamento:* {{tratamento}}\n📅 *Data:* {{data}}\n🕐 *Horário:* {{hora}}\n📍 *Local:* Av. Venâncio Flores, 350 — Sala 04, Centro, Aracruz/ES\n\nChegue 10 minutos antes para um cafezinho. Se precisar reagendar ou tirar dúvidas, é só responder esta conversa.\n\nObrigado pela confiança! 💙\n— Equipe Clínica Levii',
    updated_at = now()
WHERE is_active = true;