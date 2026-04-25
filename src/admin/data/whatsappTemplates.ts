// Biblioteca padrão de templates de mensagem para WhatsApp.
// Categorias cobrem todos os fluxos comuns de uma clínica.

export type WhatsAppTemplateCategory =
  | "agendamento"
  | "pagamento"
  | "duvidas"
  | "pos_atendimento"
  | "captacao"
  | "lembrete"
  | "geral";

export type WhatsAppTemplateConfigField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "url" | "money";
  required?: boolean;
};

export type WhatsAppTemplate = {
  key: string;
  category: WhatsAppTemplateCategory;
  title: string;
  description: string;
  content: string;
  variables: string[];
  trigger_keywords: string[];
  requires_config?: boolean;
  config_fields?: WhatsAppTemplateConfigField[];
};

export const TEMPLATE_CATEGORIES: { key: WhatsAppTemplateCategory; label: string; color: string; emoji: string }[] = [
  { key: "agendamento", label: "Agendamento", color: "blue", emoji: "📅" },
  { key: "pagamento", label: "Pagamento", color: "emerald", emoji: "💳" },
  { key: "duvidas", label: "Dúvidas frequentes", color: "violet", emoji: "❓" },
  { key: "pos_atendimento", label: "Pós-atendimento", color: "rose", emoji: "💙" },
  { key: "captacao", label: "Captação / Vendas", color: "amber", emoji: "🎯" },
  { key: "lembrete", label: "Lembretes", color: "sky", emoji: "🔔" },
  { key: "geral", label: "Geral", color: "slate", emoji: "💬" },
];

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  // ===== AGENDAMENTO =====
  {
    key: "agendar_solicitar",
    category: "agendamento",
    title: "Cliente quer agendar",
    description: "Resposta inicial quando o paciente diz 'quero marcar', 'agendar', etc.",
    content:
      "Que bom falar contigo, {{nome}}! 😊\nPosso te enviar nosso link de agendamento online?\nÉ rapidinho — você escolhe o horário que melhor te atende.",
    variables: ["nome"],
    trigger_keywords: ["agendar", "marcar", "marca pra mim", "quero agendar", "horário disponível", "tem vaga", "consulta"],
  },
  {
    key: "agendar_link",
    category: "agendamento",
    title: "Enviar link de agendamento",
    description: "Manda o link público de agendamento para o paciente escolher o horário.",
    content:
      "Aqui está, {{nome}} 👉 {{link_agendamento}}\nQualquer dúvida durante o agendamento, é só me chamar por aqui!",
    variables: ["nome", "link_agendamento"],
    trigger_keywords: ["link", "agenda online", "site"],
    requires_config: true,
    config_fields: [
      { key: "link_agendamento", label: "Link de agendamento público", placeholder: "https://suaclinica.com/agendar", type: "url", required: true },
    ],
  },
  {
    key: "agendar_horarios",
    category: "agendamento",
    title: "Horários disponíveis (resposta padrão)",
    description: "Quando o paciente pergunta apenas pelos horários sem especificar.",
    content:
      "Atendemos {{horario_funcionamento}}.\nQuer que eu te envie o link pra ver os horários livres em tempo real?",
    variables: ["horario_funcionamento"],
    trigger_keywords: ["horário", "horarios", "que horas", "atendimento", "quando atendem"],
    requires_config: true,
    config_fields: [
      { key: "horario_funcionamento", label: "Horário de funcionamento", placeholder: "Seg–Sex 8h–19h, Sáb 8h–13h", required: true },
    ],
  },
  {
    key: "agendar_confirmar",
    category: "agendamento",
    title: "Confirmação de agendamento",
    description: "Disparo automático após o paciente concluir o agendamento.",
    content:
      "Tudo certo, {{nome}}! ✅\nSeu agendamento foi confirmado:\n📅 {{data}} às {{hora}}\n💼 {{tratamento}}\n\nNos vemos lá! 💙",
    variables: ["nome", "data", "hora", "tratamento"],
    trigger_keywords: [],
  },
  {
    key: "agendar_remarcar",
    category: "agendamento",
    title: "Cliente quer remarcar/cancelar",
    description: "Trata pedidos de remarcação ou cancelamento.",
    content:
      "Sem problemas, {{nome}}! 😊\nMe diz a data/horário do agendamento atual e eu já encaminho pro time da agenda remarcar pra você.",
    variables: ["nome"],
    trigger_keywords: ["remarcar", "desmarcar", "cancelar", "trocar horário", "mudar"],
  },

  // ===== PAGAMENTO =====
  {
    key: "pag_link",
    category: "pagamento",
    title: "Enviar link de pagamento",
    description: "Manda o link de cobrança/checkout para o paciente.",
    content:
      "Aqui está o link de pagamento, {{nome}} 💳\n👉 {{link_pagamento}}\n\nValor: {{valor}}\nReferente a: {{descricao}}\n\nAssim que cair, te confirmo aqui!",
    variables: ["nome", "link_pagamento", "valor", "descricao"],
    trigger_keywords: ["pagar", "pagamento", "boleto", "pix", "como pago"],
    requires_config: true,
    config_fields: [
      { key: "link_pagamento_padrao", label: "Link padrão de pagamento (se não tiver gerado)", placeholder: "https://...", type: "url" },
      { key: "chave_pix", label: "Chave PIX da clínica", placeholder: "CNPJ, e-mail ou telefone" },
    ],
  },
  {
    key: "pag_pix",
    category: "pagamento",
    title: "Enviar chave PIX",
    description: "Resposta rápida com a chave PIX da clínica.",
    content:
      "Claro, {{nome}}! 💚\nNossa chave PIX é:\n*{{chave_pix}}*\n\nValor: {{valor}}\nMe manda o comprovante por aqui que já confirmo. 🙏",
    variables: ["nome", "chave_pix", "valor"],
    trigger_keywords: ["pix", "chave pix", "qual o pix"],
    requires_config: true,
    config_fields: [
      { key: "chave_pix", label: "Chave PIX da clínica", placeholder: "CNPJ, e-mail ou telefone", required: true },
    ],
  },
  {
    key: "pag_parcelamento",
    category: "pagamento",
    title: "Dúvida sobre parcelamento",
    description: "Resposta padrão quando perguntam sobre parcelar.",
    content:
      "Trabalhamos com parcelamento em até *{{max_parcelas}}x* no cartão {{taxa_juros}}, {{nome}}.\nPodemos avaliar a melhor forma na sua avaliação. 💙",
    variables: ["nome", "max_parcelas", "taxa_juros"],
    trigger_keywords: ["parcela", "parcelar", "dividir", "vezes", "cartão"],
    requires_config: true,
    config_fields: [
      { key: "max_parcelas", label: "Máximo de parcelas", placeholder: "12", required: true },
      { key: "taxa_juros", label: "Texto sobre juros", placeholder: "sem juros ou com juros a partir de 4x" },
    ],
  },
  {
    key: "pag_confirmar",
    category: "pagamento",
    title: "Confirmação de pagamento recebido",
    description: "Quando o paciente envia comprovante.",
    content:
      "Recebemos, {{nome}}! ✅\nPagamento confirmado. Obrigado pela confiança 💙\nQualquer dúvida, é só chamar.",
    variables: ["nome"],
    trigger_keywords: ["comprovante", "paguei", "fiz o pix", "transferi"],
  },

  // ===== DÚVIDAS =====
  {
    key: "duv_endereco",
    category: "duvidas",
    title: "Endereço da clínica",
    description: "Resposta automática para 'onde fica?'.",
    content:
      "Estamos em:\n📍 *{{endereco}}*\n\nLink Google Maps: {{link_maps}}\nQualquer dúvida pra chegar, me avisa!",
    variables: ["endereco", "link_maps"],
    trigger_keywords: ["endereço", "onde fica", "localização", "como chego", "rua"],
    requires_config: true,
    config_fields: [
      { key: "endereco", label: "Endereço completo", placeholder: "Rua X, 123 — Bairro, Cidade-UF", required: true },
      { key: "link_maps", label: "Link do Google Maps", placeholder: "https://maps.app.goo.gl/...", type: "url" },
    ],
  },
  {
    key: "duv_estacionamento",
    category: "duvidas",
    title: "Tem estacionamento?",
    description: "Pergunta comum.",
    content:
      "Sim! {{descricao_estacionamento}}\nQualquer dúvida, é só me avisar 🚗",
    variables: ["descricao_estacionamento"],
    trigger_keywords: ["estacionamento", "vaga", "carro"],
    requires_config: true,
    config_fields: [
      { key: "descricao_estacionamento", label: "Descrição do estacionamento", placeholder: "Estacionamento gratuito no local com manobrista" },
    ],
  },
  {
    key: "duv_convenio",
    category: "duvidas",
    title: "Aceita convênio?",
    description: "Resposta padrão sobre convênios.",
    content:
      "Hoje atendemos {{convenios}}, {{nome}}.\nMas a primeira avaliação é cortesia 💙 e você pode aproveitar pra entender o tratamento ideal pro seu caso!",
    variables: ["nome", "convenios"],
    trigger_keywords: ["convênio", "convenio", "plano", "unimed", "amil", "bradesco"],
    requires_config: true,
    config_fields: [
      { key: "convenios", label: "Convênios aceitos (texto livre)", placeholder: "particular e principais convênios — me chame que confirmo o seu" },
    ],
  },
  {
    key: "duv_demora",
    category: "duvidas",
    title: "Quanto tempo dura a consulta?",
    description: "Pergunta frequente.",
    content:
      "A primeira avaliação leva em média *{{duracao}}*, {{nome}}. Depois, cada procedimento tem seu tempo conforme o plano de tratamento. 😊",
    variables: ["nome", "duracao"],
    trigger_keywords: ["quanto tempo", "demora", "duração"],
    requires_config: true,
    config_fields: [
      { key: "duracao", label: "Duração média da consulta", placeholder: "30 a 45 minutos" },
    ],
  },

  // ===== PÓS-ATENDIMENTO =====
  {
    key: "pos_obrigado",
    category: "pos_atendimento",
    title: "Agradecimento pós-consulta",
    description: "Mensagem de carinho enviada após o atendimento.",
    content:
      "Foi ótimo te receber hoje, {{nome}}! 💙\nQualquer dúvida sobre o que conversamos, é só me chamar por aqui — estou à disposição.",
    variables: ["nome"],
    trigger_keywords: [],
  },
  {
    key: "pos_avaliacao",
    category: "pos_atendimento",
    title: "Pedir avaliação no Google",
    description: "Convite gentil para deixar review.",
    content:
      "{{nome}}, sua opinião vale muito pra gente! 🌟\nSe puder, deixa uma avaliação rapidinha aqui: {{link_avaliacao}}\nLeva só 30 segundos e ajuda outras pessoas a confiarem no nosso trabalho. 💙",
    variables: ["nome", "link_avaliacao"],
    trigger_keywords: [],
    requires_config: true,
    config_fields: [
      { key: "link_avaliacao", label: "Link da avaliação (Google ou interno)", placeholder: "https://g.page/r/...", type: "url", required: true },
    ],
  },
  {
    key: "pos_pos_op",
    category: "pos_atendimento",
    title: "Cuidados pós-procedimento",
    description: "Orientações genéricas após procedimento.",
    content:
      "Algumas dicas pras próximas horas, {{nome}}:\n• Evite alimentos muito quentes ou duros\n• Não faça bochechos fortes\n• Se sentir dor, pode tomar o analgésico que conversamos\n\nQualquer coisa fora do normal, me chama imediatamente. 💙",
    variables: ["nome"],
    trigger_keywords: ["dor", "incômodo", "depois da consulta", "depois do procedimento"],
  },

  // ===== CAPTAÇÃO / VENDAS =====
  {
    key: "cap_preco",
    category: "captacao",
    title: "Pergunta sobre preço (sem dar valor)",
    description: "Convida pra avaliação em vez de mandar tabela.",
    content:
      "Cada caso é avaliado individualmente, {{nome}} 😊\nA primeira consulta é *cortesia* — você sai com o plano completo e o investimento exato pro seu caso.\nQuer que eu te envie o link pra agendar?",
    variables: ["nome"],
    trigger_keywords: ["preço", "preco", "valor", "quanto custa", "quanto fica", "tabela"],
  },
  {
    key: "cap_promo",
    category: "captacao",
    title: "Promoção / oferta ativa",
    description: "Divulga campanha vigente.",
    content:
      "Boa hora, {{nome}}! 🎁\n{{descricao_promocao}}\nQuer aproveitar? Posso já te enviar o link pra agendar.",
    variables: ["nome", "descricao_promocao"],
    trigger_keywords: ["promoção", "promocao", "desconto", "oferta", "cupom"],
    requires_config: true,
    config_fields: [
      { key: "descricao_promocao", label: "Descrição da promoção atual", placeholder: "Avaliação + limpeza profissional por R$ 99 até sábado", required: true },
    ],
  },
  {
    key: "cap_indicacao",
    category: "captacao",
    title: "Programa de indicação",
    description: "Resposta para quem quer indicar.",
    content:
      "Adoramos! 💙 {{descricao_indicacao}}\nQuer que eu te explique melhor?",
    variables: ["descricao_indicacao"],
    trigger_keywords: ["indicar", "indicação", "amigo", "família"],
    requires_config: true,
    config_fields: [
      { key: "descricao_indicacao", label: "Descrição do programa", placeholder: "Cada amigo indicado que fechar tratamento te dá R$ 50 de crédito." },
    ],
  },

  // ===== LEMBRETES =====
  {
    key: "lemb_24h",
    category: "lembrete",
    title: "Lembrete 24h antes",
    description: "Disparo automático 1 dia antes da consulta.",
    content:
      "Oi {{nome}}! 👋 Lembrete:\nSua consulta é *amanhã*, {{data}} às {{hora}} ({{tratamento}}).\nSe precisar reagendar, me avisa por aqui. 💙",
    variables: ["nome", "data", "hora", "tratamento"],
    trigger_keywords: [],
  },
  {
    key: "lemb_2h",
    category: "lembrete",
    title: "Lembrete 2h antes",
    description: "Disparo automático no dia da consulta.",
    content:
      "{{nome}}, hoje é o seu dia! 🦷\nSua consulta é às *{{hora}}*. Te esperamos!",
    variables: ["nome", "hora"],
    trigger_keywords: [],
  },
  {
    key: "lemb_inativo",
    category: "lembrete",
    title: "Reativação paciente inativo",
    description: "Para pacientes sem retorno há meses.",
    content:
      "Oi {{nome}}, faz um tempo que a gente não se fala 💙\nQue tal agendar uma avaliação de rotina? A primeira é por nossa conta.",
    variables: ["nome"],
    trigger_keywords: [],
  },

  // ===== GERAL =====
  {
    key: "ger_saudacao",
    category: "geral",
    title: "Saudação inicial",
    description: "Resposta automática à primeira mensagem.",
    content:
      "Olá {{nome}}! 👋\nAqui é da *{{nome_clinica}}*, em que podemos te ajudar hoje?",
    variables: ["nome", "nome_clinica"],
    trigger_keywords: ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "tudo bem", "tudo bom"],
    requires_config: true,
    config_fields: [
      { key: "nome_clinica", label: "Nome da clínica", placeholder: "LyneCloud Odonto", required: true },
    ],
  },
  {
    key: "ger_handoff",
    category: "geral",
    title: "Transferir para humano",
    description: "Quando o bot não sabe responder ou paciente pede atendente.",
    content:
      "Vou chamar uma de nossas atendentes pra te ajudar melhor, {{nome}} 💙\nEm instantes alguém te responde por aqui!",
    variables: ["nome"],
    trigger_keywords: ["atendente", "humano", "pessoa", "falar com alguém"],
  },
  {
    key: "ger_fora_horario",
    category: "geral",
    title: "Fora do horário comercial",
    description: "Resposta automática fora do expediente.",
    content:
      "Oi {{nome}}! 👋 Recebemos sua mensagem fora do nosso horário ({{horario_funcionamento}}).\nAssim que abrirmos, te respondemos com prioridade. 💙",
    variables: ["nome", "horario_funcionamento"],
    trigger_keywords: [],
    requires_config: true,
    config_fields: [
      { key: "horario_funcionamento", label: "Horário de funcionamento", placeholder: "Seg–Sex 8h–19h, Sáb 8h–13h" },
    ],
  },
  {
    key: "ger_urgencia",
    category: "geral",
    title: "Urgência/emergência",
    description: "Encaminha imediatamente.",
    content:
      "Entendi, {{nome}}. Vou chamar agora alguém da equipe pra te atender com prioridade 🚑\nSe for urgência forte com sangramento intenso, procure o pronto-socorro mais próximo.",
    variables: ["nome"],
    trigger_keywords: ["urgência", "urgencia", "emergência", "emergencia", "dor forte", "sangramento", "socorro", "muito ruim"],
  },
];
