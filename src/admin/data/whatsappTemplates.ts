// =====================================================================
// LyneCloud — Biblioteca de FLUXOS de WhatsApp (templates interligados)
// =====================================================================
// Cada FLOW representa uma intenção do paciente (agendar, pagar, etc.)
// e contém múltiplos STEPS encadeados por palavras-chave de resposta.
//
// Exemplo:
//   Cliente: "quero agendar"        → step "ask"   → bot pergunta "posso enviar o link?"
//   Cliente: "sim"                  → step "send"  → bot envia link de agendamento
//   Cliente: "obrigado"             → step "close" → bot fecha gentilmente
//
// O bot resolve sequencialmente, sem delays artificiais entre passos.
// Tudo em UM card só na UI — muito mais profissional.
// =====================================================================

export type FlowCategory =
  | "inicial"
  | "agendamento"
  | "pagamento"
  | "duvidas"
  | "pos_atendimento"
  | "captacao"
  | "lembrete"
  | "geral";

export type FlowConfigField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "url" | "money" | "longtext";
  required?: boolean;
  hint?: string;
};

export type FlowStep = {
  id: string;                        // identificador interno do passo
  title: string;                     // o que esse passo faz (UI)
  /** Palavras-chave da resposta DO PACIENTE que avançam para este passo.
   *  Vazio = primeiro passo (entrada do fluxo). */
  on_reply_keywords?: string[];
  /** Conteúdo da mensagem que o BOT envia neste passo. */
  content: string;
  /** Próximo passo padrão se nada casar (ex.: handoff). */
  next_default?: string;
};

export type WhatsAppFlow = {
  key: string;
  category: FlowCategory;
  title: string;
  description: string;
  /** Palavras-chave da PRIMEIRA mensagem do paciente que disparam o fluxo. */
  trigger_keywords: string[];
  /** Variáveis usadas em qualquer step. */
  variables: string[];
  steps: FlowStep[];
  config_fields?: FlowConfigField[];
  requires_config?: boolean;
};

export const FLOW_CATEGORIES: { key: FlowCategory; label: string; emoji: string }[] = [
  { key: "inicial",         label: "Abordagem inicial",   emoji: "👋" },
  { key: "agendamento",     label: "Agendamento",          emoji: "📅" },
  { key: "pagamento",       label: "Pagamento",            emoji: "💳" },
  { key: "duvidas",         label: "Dúvidas frequentes",   emoji: "❓" },
  { key: "captacao",        label: "Captação / Vendas",    emoji: "🎯" },
  { key: "pos_atendimento", label: "Pós-atendimento",      emoji: "💙" },
  { key: "lembrete",        label: "Lembretes",            emoji: "🔔" },
  { key: "geral",           label: "Geral",                emoji: "💬" },
];

// ============= FLUXOS PRONTOS =============

export const WHATSAPP_FLOWS: WhatsAppFlow[] = [

  // ============ INICIAL — MENU ============
  {
    key: "inicial_menu",
    category: "inicial",
    title: "Saudação inicial com menu",
    description: "Primeira mensagem do paciente. Bot envia menu com opções e responde de acordo com o número escolhido (1, 2, 3...).",
    trigger_keywords: ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "tudo bem", "informação", "informacao", "atendimento"],
    variables: ["nome", "nome_clinica", "link_agendamento", "endereco", "link_maps", "horario_funcionamento"],
    requires_config: true,
    config_fields: [
      { key: "nome_clinica", label: "Nome da clínica", placeholder: "LyneCloud Odonto", required: true },
      { key: "link_agendamento", label: "Link de agendamento online", placeholder: "https://suaclinica.com/agendar", type: "url", required: true },
      { key: "endereco", label: "Endereço completo", placeholder: "Rua X, 123 — Bairro, Cidade-UF" },
      { key: "link_maps", label: "Link Google Maps", placeholder: "https://maps.app.goo.gl/...", type: "url" },
      { key: "horario_funcionamento", label: "Horário de funcionamento", placeholder: "Seg–Sex 8h–19h, Sáb 8h–13h" },
    ],
    steps: [
      {
        id: "menu",
        title: "Menu inicial",
        content:
          "Olá, {{nome}}! 👋 Aqui é da *{{nome_clinica}}*.\nComo posso te ajudar hoje?\n\n*1*  Agendar consulta 📅\n*2*  Tirar dúvida sobre tratamento 🦷\n*3*  Endereço e horário 📍\n*4*  Falar com atendente 💬\n\n_Responde só o número da opção._",
      },
      {
        id: "opt_1_agendar",
        title: "Resposta para opção 1 (agendar)",
        on_reply_keywords: ["1", "um", "agendar", "marcar"],
        content:
          "Perfeito, {{nome}}! ✨ Aqui está nosso link de agendamento online:\n👉 {{link_agendamento}}\n\nVocê escolhe o horário e já fica confirmado. Qualquer dúvida me chama por aqui!",
      },
      {
        id: "opt_2_duvida",
        title: "Resposta para opção 2 (dúvida)",
        on_reply_keywords: ["2", "dois", "dúvida", "duvida", "tratamento"],
        content:
          "Claro! Me conta um pouco do que está sentindo ou qual tratamento te interessa, {{nome}}? 🦷\nAssim já encaminho pra dentista certa e adianto seu atendimento.",
      },
      {
        id: "opt_3_endereco",
        title: "Resposta para opção 3 (endereço)",
        on_reply_keywords: ["3", "três", "tres", "endereço", "endereco", "horário", "horario"],
        content:
          "📍 Estamos em: *{{endereco}}*\n🗺️ Maps: {{link_maps}}\n🕐 Atendemos {{horario_funcionamento}}\n\nQuer que eu te envie o link pra agendar uma visita?",
      },
      {
        id: "opt_4_humano",
        title: "Resposta para opção 4 (humano)",
        on_reply_keywords: ["4", "quatro", "atendente", "humano", "pessoa", "falar com alguém"],
        content:
          "Já chamando uma de nossas atendentes pra você, {{nome}} 💙\nEm instantes alguém te responde por aqui!",
      },
    ],
  },

  // ============ AGENDAMENTO ============
  {
    key: "fluxo_agendar",
    category: "agendamento",
    title: "Cliente quer agendar",
    description: "Fluxo completo: pergunta → envia link → confirma. Tudo encadeado, sem múltiplos cards.",
    trigger_keywords: ["agendar", "marcar", "marca pra mim", "quero agendar", "horário disponível", "tem vaga", "consulta", "agendamento"],
    variables: ["nome", "link_agendamento", "horario_funcionamento"],
    requires_config: true,
    config_fields: [
      { key: "link_agendamento", label: "Link de agendamento público", placeholder: "https://suaclinica.com/agendar", type: "url", required: true },
      { key: "horario_funcionamento", label: "Horário de funcionamento", placeholder: "Seg–Sex 8h–19h, Sáb 8h–13h" },
    ],
    steps: [
      {
        id: "ask",
        title: "Pergunta inicial",
        content:
          "Que bom falar contigo, {{nome}}! 😊\nPosso te enviar nosso link de agendamento online? É rapidinho — você escolhe o horário que melhor te atende. Pode ser?",
      },
      {
        id: "send_link",
        title: "Resposta SIM — envia link",
        on_reply_keywords: ["sim", "pode", "claro", "manda", "envia", "ok", "👍", "quero", "vamos"],
        content:
          "Aqui está, {{nome}} 👉 {{link_agendamento}}\nQualquer dúvida durante o agendamento, é só me chamar! 💙",
      },
      {
        id: "show_hours",
        title: "Resposta NÃO — mostra horários",
        on_reply_keywords: ["não", "nao", "prefiro aqui", "manda aqui"],
        content:
          "Sem problemas! Atendemos {{horario_funcionamento}}.\nMe diz uma data e turno (manhã/tarde) que me agrade você que já confirmo a vaga 😊",
      },
    ],
  },

  {
    key: "fluxo_remarcar",
    category: "agendamento",
    title: "Cliente quer remarcar/cancelar",
    description: "Fluxo de remarcação encadeado: confirma intenção → pede dados.",
    trigger_keywords: ["remarcar", "desmarcar", "cancelar", "trocar horário", "mudar consulta"],
    variables: ["nome"],
    steps: [
      {
        id: "ack",
        title: "Confirma intenção",
        content:
          "Sem problemas, {{nome}}! 😊\nMe envia a data/horário do agendamento atual e a nova preferência (data + turno) que já encaminho pro time da agenda.",
      },
      {
        id: "thanks",
        title: "Confirmação após paciente enviar dados",
        on_reply_keywords: ["obrigado", "obrigada", "ok", "valeu"],
        content:
          "Perfeito, {{nome}}! Já estou cuidando disso. Em instantes te confirmo o novo horário 💙",
      },
    ],
  },

  // ============ PAGAMENTO ============
  {
    key: "fluxo_pagamento",
    category: "pagamento",
    title: "Cliente quer pagar",
    description: "Pergunta a forma → envia PIX ou link → confirma comprovante. Tudo no mesmo fluxo.",
    trigger_keywords: ["pagar", "pagamento", "boleto", "pix", "como pago", "fazer pagamento"],
    variables: ["nome", "chave_pix", "link_pagamento", "max_parcelas", "taxa_juros"],
    requires_config: true,
    config_fields: [
      { key: "chave_pix", label: "Chave PIX da clínica", placeholder: "CNPJ, e-mail ou telefone", required: true },
      { key: "link_pagamento", label: "Link padrão de pagamento (cartão/boleto)", placeholder: "https://...", type: "url" },
      { key: "max_parcelas", label: "Máximo de parcelas no cartão", placeholder: "12" },
      { key: "taxa_juros", label: "Texto sobre juros", placeholder: "sem juros até 6x" },
    ],
    steps: [
      {
        id: "ask_method",
        title: "Pergunta a forma de pagamento",
        content:
          "Claro, {{nome}} 💚 Como prefere pagar?\n\n*1*  PIX (rápido e sem taxa)\n*2*  Cartão (até {{max_parcelas}}x — {{taxa_juros}})\n*3*  Boleto\n\n_Responde só o número._",
      },
      {
        id: "pix",
        title: "Resposta 1 — envia PIX",
        on_reply_keywords: ["1", "pix"],
        content:
          "Perfeito! Nossa chave PIX é:\n*{{chave_pix}}*\n\nAssim que pagar, me manda o comprovante por aqui que já confirmo na hora 🙏",
      },
      {
        id: "card",
        title: "Resposta 2 — envia link cartão",
        on_reply_keywords: ["2", "cartão", "cartao", "credito", "crédito"],
        content:
          "Aqui está o link de pagamento por cartão, {{nome}} 💳\n👉 {{link_pagamento}}\n\nApós o pagamento eu já recebo a confirmação automaticamente.",
      },
      {
        id: "boleto",
        title: "Resposta 3 — envia boleto",
        on_reply_keywords: ["3", "boleto"],
        content:
          "Vou gerar o boleto pra você, {{nome}}. Só me confirma o nome completo e CPF do titular que em poucos minutos te envio aqui. ✅",
      },
      {
        id: "received",
        title: "Confirmação após comprovante",
        on_reply_keywords: ["comprovante", "paguei", "fiz o pix", "transferi", "feito"],
        content:
          "Recebemos, {{nome}}! ✅\nPagamento confirmado. Obrigado pela confiança 💙",
      },
    ],
  },

  // ============ DÚVIDAS ============
  {
    key: "duvida_endereco",
    category: "duvidas",
    title: "Onde fica a clínica?",
    description: "Endereço + maps + sugere agendamento numa única conversa.",
    trigger_keywords: ["endereço", "endereco", "onde fica", "localização", "localizacao", "como chego", "rua"],
    variables: ["endereco", "link_maps"],
    requires_config: true,
    config_fields: [
      { key: "endereco", label: "Endereço completo", placeholder: "Rua X, 123 — Bairro, Cidade-UF", required: true },
      { key: "link_maps", label: "Link Google Maps", placeholder: "https://maps.app.goo.gl/...", type: "url" },
    ],
    steps: [
      {
        id: "addr",
        title: "Envia endereço + maps",
        content:
          "Estamos em:\n📍 *{{endereco}}*\n🗺️ {{link_maps}}\n\nQuer que eu já te envie o link pra agendar uma visita?",
      },
      {
        id: "wants_agend",
        title: "Resposta SIM — direciona para agendamento",
        on_reply_keywords: ["sim", "claro", "quero", "manda"],
        content:
          "Já te envio aqui em segundos! Vou puxar o link da agenda agora 👇",
      },
    ],
  },

  {
    key: "duvida_convenio",
    category: "duvidas",
    title: "Aceita convênio?",
    description: "Resposta + convite para avaliação cortesia.",
    trigger_keywords: ["convênio", "convenio", "plano", "unimed", "amil", "bradesco", "sulamerica", "sul américa"],
    variables: ["nome", "convenios"],
    requires_config: true,
    config_fields: [
      { key: "convenios", label: "Convênios aceitos / texto livre", placeholder: "particular e principais convênios — me chame que confirmo o seu", type: "longtext" },
    ],
    steps: [
      {
        id: "answer",
        title: "Responde sobre convênios",
        content:
          "Hoje atendemos {{convenios}}, {{nome}}.\nMas a primeira avaliação é *cortesia* 💙 — quer aproveitar pra entender o tratamento ideal pro seu caso? Posso te enviar o link.",
      },
    ],
  },

  // ============ CAPTAÇÃO ============
  {
    key: "captacao_preco",
    category: "captacao",
    title: "Pergunta sobre preço",
    description: "Não dá tabela — converte para avaliação cortesia → envia link.",
    trigger_keywords: ["preço", "preco", "valor", "quanto custa", "quanto fica", "tabela", "investimento"],
    variables: ["nome", "link_agendamento"],
    requires_config: true,
    config_fields: [
      { key: "link_agendamento", label: "Link de agendamento público", placeholder: "https://suaclinica.com/agendar", type: "url", required: true },
    ],
    steps: [
      {
        id: "convert",
        title: "Converte para avaliação",
        content:
          "Cada caso é avaliado individualmente, {{nome}} 😊\nA primeira consulta é *cortesia* — você sai com o plano completo e o investimento exato pro seu caso.\nQuer que eu te envie o link pra agendar?",
      },
      {
        id: "send",
        title: "Resposta SIM — envia link",
        on_reply_keywords: ["sim", "claro", "quero", "manda", "envia", "ok"],
        content:
          "Aqui está 👉 {{link_agendamento}}\nQualquer dúvida durante o agendamento, é só me chamar 💙",
      },
    ],
  },

  {
    key: "captacao_promo",
    category: "captacao",
    title: "Promoção / oferta ativa",
    description: "Divulga campanha + oferece agendamento direto.",
    trigger_keywords: ["promoção", "promocao", "desconto", "oferta", "cupom"],
    variables: ["nome", "descricao_promocao", "link_agendamento"],
    requires_config: true,
    config_fields: [
      { key: "descricao_promocao", label: "Descrição da promoção atual", placeholder: "Avaliação + limpeza por R$ 99 até sábado", type: "longtext", required: true },
      { key: "link_agendamento", label: "Link de agendamento público", placeholder: "https://suaclinica.com/agendar", type: "url", required: true },
    ],
    steps: [
      {
        id: "promo",
        title: "Divulga promo",
        content:
          "Boa hora, {{nome}}! 🎁\n{{descricao_promocao}}\nQuer aproveitar? Posso já te enviar o link pra agendar.",
      },
      {
        id: "send",
        title: "Resposta SIM — envia link",
        on_reply_keywords: ["sim", "quero", "manda", "envia", "claro"],
        content:
          "Show! Aqui está 👉 {{link_agendamento}}",
      },
    ],
  },

  // ============ PÓS-ATENDIMENTO ============
  {
    key: "pos_avaliacao",
    category: "pos_atendimento",
    title: "Pedir avaliação no Google",
    description: "Convite gentil + agradecimento.",
    trigger_keywords: [],
    variables: ["nome", "link_avaliacao"],
    requires_config: true,
    config_fields: [
      { key: "link_avaliacao", label: "Link da avaliação (Google)", placeholder: "https://g.page/r/...", type: "url", required: true },
    ],
    steps: [
      {
        id: "ask_review",
        title: "Pede avaliação",
        content:
          "{{nome}}, sua opinião vale muito pra gente! 🌟\nSe puder, deixa uma avaliação rapidinha aqui: {{link_avaliacao}}\nLeva só 30 segundos e ajuda outras pessoas a confiarem no nosso trabalho. 💙",
      },
      {
        id: "thanks",
        title: "Agradecimento após resposta",
        on_reply_keywords: ["pronto", "deixei", "feito", "avaliei", "ok"],
        content:
          "Você é demais, {{nome}}! 💙 Muito obrigado mesmo. Qualquer coisa, é só chamar.",
      },
    ],
  },

  // ============ LEMBRETES (1 step só, disparados por job) ============
  {
    key: "lemb_24h",
    category: "lembrete",
    title: "Lembrete 24h antes",
    description: "Disparado automaticamente 1 dia antes da consulta.",
    trigger_keywords: [],
    variables: ["nome", "data", "hora", "tratamento"],
    steps: [{
      id: "remind",
      title: "Mensagem do lembrete",
      content: "Oi {{nome}}! 👋 Lembrete:\nSua consulta é *amanhã*, {{data}} às {{hora}} ({{tratamento}}).\nSe precisar reagendar, me avisa por aqui. 💙",
    }],
  },
  {
    key: "lemb_2h",
    category: "lembrete",
    title: "Lembrete 2h antes",
    description: "Disparado no dia da consulta.",
    trigger_keywords: [],
    variables: ["nome", "hora"],
    steps: [{
      id: "remind",
      title: "Mensagem do lembrete",
      content: "{{nome}}, hoje é o seu dia! 🦷\nSua consulta é às *{{hora}}*. Te esperamos!",
    }],
  },

  // ============ GERAL ============
  {
    key: "geral_fora_horario",
    category: "geral",
    title: "Fora do horário comercial",
    description: "Resposta automática fora do expediente.",
    trigger_keywords: [],
    variables: ["nome", "horario_funcionamento"],
    requires_config: true,
    config_fields: [
      { key: "horario_funcionamento", label: "Horário de funcionamento", placeholder: "Seg–Sex 8h–19h, Sáb 8h–13h", required: true },
    ],
    steps: [{
      id: "msg",
      title: "Mensagem fora do horário",
      content: "Oi {{nome}}! 👋 Recebemos sua mensagem fora do nosso horário ({{horario_funcionamento}}).\nAssim que abrirmos, te respondemos com prioridade. 💙",
    }],
  },
  {
    key: "geral_urgencia",
    category: "geral",
    title: "Urgência / emergência",
    description: "Detecta urgência e prioriza atendimento humano.",
    trigger_keywords: ["urgência", "urgencia", "emergência", "emergencia", "dor forte", "sangramento", "socorro", "muito ruim"],
    variables: ["nome"],
    steps: [{
      id: "msg",
      title: "Resposta de urgência",
      content: "Entendi, {{nome}}. Vou chamar agora alguém da equipe pra te atender com prioridade 🚑\nSe for urgência forte com sangramento intenso, procure o pronto-socorro mais próximo.",
    }],
  },
  {
    key: "geral_handoff",
    category: "geral",
    title: "Transferir para humano",
    description: "Quando o paciente pede atendente.",
    trigger_keywords: ["atendente", "humano", "pessoa", "falar com alguém", "falar com alguem"],
    variables: ["nome"],
    steps: [{
      id: "msg",
      title: "Mensagem de handoff",
      content: "Vou chamar uma de nossas atendentes pra te ajudar melhor, {{nome}} 💙\nEm instantes alguém te responde por aqui!",
    }],
  },
];
