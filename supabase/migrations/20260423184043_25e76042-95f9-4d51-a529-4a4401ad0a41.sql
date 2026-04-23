UPDATE public.chatpro_config 
SET message_template = '✅ *Agendamento Confirmado*

Olá, {{nome}}! Seu horário na *Clínica Levii* foi confirmado com sucesso. 🦷✨

📋 *Tratamento:* {{tratamento}}
📅 *Data:* {{data}}
🕐 *Horário:* {{hora}}
📍 *Local:* Av. Venâncio Flores, 350 — Sala 04, Centro, Aracruz/ES

Em instantes enviaremos a *localização exata* com mapa para te ajudar a chegar. 🗺️

Caso precise reagendar ou tirar dúvidas, é só responder esta conversa. Estamos te esperando! 💙

— Equipe Clínica Levii',
updated_at = now()
WHERE is_active = true;