// Bot conversacional WhatsApp — recebe mensagens do provedor (VPS/ChatPro)
// e responde com IA (Lovable AI Gateway) usando intents + system_prompt.
//
// POST { from, message, conversation_id?, contact_name? }
//
// Fluxo:
// 1. Encontra/cria conversation
// 2. Salva mensagem in
// 3. Tenta match de intent (resposta rápida)
// 4. Se nenhuma intent ou intent action=ai → chama Lovable AI Gateway
// 5. Salva resposta out e dispara whatsapp-gateway com a mensagem

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(raw: string): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("55")) return d;
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}

function matchIntent(msg: string, intents: any[]) {
  const m = msg.toLowerCase().trim();
  for (const i of intents) {
    if (!i.enabled) continue;
    for (const trig of (i.trigger_examples || []) as string[]) {
      const t = trig.toLowerCase().trim();
      if (!t) continue;
      // exact match short triggers, or substring match longer ones
      if (t.length <= 6 ? m === t || m.startsWith(t + " ") : m.includes(t)) {
        return i;
      }
    }
  }
  return null;
}

// ============ PROVEDORES DE IA ============
// 3 provedores suportados: openai, gemini, lovable
// Com fallback automático entre eles se ai_fallback_enabled=true.

async function callOpenAI(messages: any[], systemPrompt: string, model: string): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY ausente");
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(messages: any[], systemPrompt: string, model: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY ausente");
  const m = model || "gemini-2.0-flash";
  // Converte formato OpenAI → Gemini
  const contents = messages.map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: String(msg.content || "") }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") ?? "";
  return String(text).trim();
}

async function callLovableAi(messages: any[], systemPrompt: string, model: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model || "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Lovable AI ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callAiWithFallback(
  primary: string,
  model: string,
  messages: any[],
  systemPrompt: string,
  fallbackEnabled: boolean,
): Promise<{ text: string; provider: string }> {
  // Modelos padrão por provider quando o usuário não definiu um específico
  const defaultModels: Record<string, string> = {
    openai: "gpt-4o-mini",
    gemini: "gemini-2.0-flash",
    lovable: "google/gemini-2.5-flash",
  };
  const callers: Record<string, (m: any[], s: string, mdl: string) => Promise<string>> = {
    openai: callOpenAI,
    gemini: callGemini,
    lovable: callLovableAi,
  };

  const order = [primary];
  if (fallbackEnabled) {
    if (primary !== "openai") order.push("openai");
    if (primary !== "gemini") order.push("gemini");
    if (primary !== "lovable") order.push("lovable");
  }

  let lastErr: any = null;
  for (const prov of order) {
    const fn = callers[prov];
    if (!fn) continue;
    const mdl = prov === primary ? (model || defaultModels[prov]) : defaultModels[prov];
    try {
      const text = await fn(messages, systemPrompt, mdl);
      if (text) return { text, provider: prov };
    } catch (e: any) {
      console.warn(`[ai] ${prov} falhou:`, e.message);
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Nenhum provedor de IA respondeu");
}


// ============ TEMPLATES (FLUXOS ENCADEADOS) ============
// Templates ficam em `whatsapp_templates`. Cada row tem:
//   key, content, trigger_keywords[], config_values { steps?: FlowStep[], ...vars }
// Steps: { id, on_reply_keywords?: string[], content }
// Quando o paciente responde, tentamos:
//   1) Continuar o flow ativo (conv.current_flow_key) checando steps[].on_reply_keywords
//   2) Iniciar um flow novo se algum trigger_keywords casar
function lcMatch(msg: string, words: string[] | null | undefined) {
  if (!words || words.length === 0) return false;
  const m = msg.toLowerCase().trim();
  for (const w of words) {
    const t = String(w || "").toLowerCase().trim();
    if (!t) continue;
    if (t.length <= 4 ? (m === t || m.startsWith(t + " ") || m.endsWith(" " + t)) : m.includes(t)) return true;
  }
  return false;
}

function applyVars(content: string, vars: Record<string, string>, contactName: string | null) {
  let txt = String(content || "").replace(/\{\{nome\}\}/g, contactName || "");
  for (const k of Object.keys(vars || {})) {
    if (k === "steps") continue;
    txt = txt.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(vars[k] ?? ""));
  }
  return txt;
}

async function resolveTemplate(
  supabase: any,
  message: string,
  currentFlowKey: string | null,
  contactName: string | null,
): Promise<{ reply: string; flow_key: string; step_id: string; next_flow_key: string | null } | null> {
  const { data: tpls } = await supabase.from("whatsapp_templates").select("*").eq("enabled", true);
  const list = (tpls ?? []) as any[];
  if (list.length === 0) return null;

  // 1) Tenta continuar o fluxo ativo
  if (currentFlowKey) {
    const cur = list.find((t) => t.key === currentFlowKey);
    const steps: any[] = cur?.config_values?.steps ?? [];
    for (const st of steps.slice(1)) {
      if (lcMatch(message, st.on_reply_keywords)) {
        const reply = applyVars(st.content, cur.config_values ?? {}, contactName);
        return { reply, flow_key: cur.key, step_id: st.id, next_flow_key: cur.key };
      }
    }
  }

  // 2) Inicia um fluxo novo (primeiro step)
  for (const tpl of list) {
    const triggers: string[] = tpl.trigger_keywords ?? [];
    if (triggers.length === 0) continue;
    if (lcMatch(message, triggers)) {
      const steps: any[] = tpl.config_values?.steps ?? [];
      const first = steps[0] ?? { id: "msg", content: tpl.content };
      const reply = applyVars(first.content, tpl.config_values ?? {}, contactName);
      return { reply, flow_key: tpl.key, step_id: first.id, next_flow_key: tpl.key };
    }
  }
  return null;
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const phone = normalizePhone(body.from || body.phone || "");
    const message = String(body.message || body.body || "").trim();
    const contactName = body.contact_name || null;
    if (!phone || !message) return json({ error: "from e message são obrigatórios" }, 400);

    // 1. Carrega config do bot
    const { data: cfg } = await supabase.from("whatsapp_bot_config").select("*").limit(1).maybeSingle();
    if (!cfg?.enabled) return json({ ok: true, skipped: "bot_disabled" });

    // 2. Encontra ou cria conversation
    let { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("*").eq("phone", phone).maybeSingle();

    let isFirstContact = false;
    if (!conv) {
      isFirstContact = true;
      const { data: c } = await supabase.from("whatsapp_conversations")
        .insert({ phone, contact_name: contactName, ai_enabled: true })
        .select().single();
      conv = c;
    } else {
      // Verifica se já houve mensagens out (resposta do bot/atendente)
      const { count: outCount } = await supabase
        .from("whatsapp_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("direction", "out");
      if (!outCount || outCount === 0) isFirstContact = true;

      await supabase.from("whatsapp_conversations")
        .update({ last_message_at: new Date().toISOString(), unread_count: (conv.unread_count || 0) + 1 })
        .eq("id", conv.id);
    }

    if (!conv?.ai_enabled) {
      // humano assumiu — só registra a mensagem entrante
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conv!.id, direction: "in", body: message,
      });
      return json({ ok: true, skipped: "handed_off" });
    }

    // 3. Salva mensagem in
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conv!.id, direction: "in", body: message,
    });

    // 4. Match intent
    const { data: intents = [] } = await supabase
      .from("whatsapp_bot_intents")
      .select("*").eq("enabled", true).order("position");

    const matched = matchIntent(message, intents || []);
    let reply = "";
    let aiUsed = false;
    let intentKey: string | null = null;
    let nextFlowKey: string | null | undefined = undefined;

    // 4.0 PRIORIDADE: Templates (fluxos encadeados) — sem delay, sem IA.
    // Continua o flow ativo ou inicia um novo se trigger casar.
    const tplResult = await resolveTemplate(supabase, message, conv!.current_flow_key ?? null, contactName);

    // 4.1 Saudação inicial padrão LyneCloud (primeira mensagem da conversa)
    if (isFirstContact && !tplResult) {
      const nome = contactName ? `, ${String(contactName).split(" ")[0]}` : "";
      const greetingTpl =
        (cfg as any).greeting_message ||
        `Olá${nome}! 👋 Aqui é da *LyneCloud*, em que podemos lhe ajudar hoje?`;
      reply = greetingTpl.replace(/\{\{nome\}\}/g, contactName || "");
      intentKey = "first_contact_greeting";
    } else if (tplResult) {
      reply = tplResult.reply;
      intentKey = `tpl:${tplResult.flow_key}#${tplResult.step_id}`;
      nextFlowKey = tplResult.next_flow_key;
    } else if (matched && matched.action === "reply" && matched.response_template) {
      reply = String(matched.response_template).replace(/\{\{nome\}\}/g, contactName || "");
      intentKey = matched.key;
    } else if (matched && matched.action === "handoff") {
      await supabase.from("whatsapp_conversations").update({ ai_enabled: false, status: "handed_off" }).eq("id", conv!.id);
      reply = String(matched.response_template || cfg.fallback_message || "Vou te transferir para um humano em instantes 💙")
        .replace(/\{\{nome\}\}/g, contactName || "");
      intentKey = matched.key;
    } else {
      // 5. Chama IA com histórico (últimas 10)
      const { data: history } = await supabase
        .from("whatsapp_messages")
        .select("direction, body")
        .eq("conversation_id", conv!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      const ordered = (history || []).reverse();
      const aiMessages = ordered.map((m: any) => ({
        role: m.direction === "in" ? "user" : "assistant",
        content: m.body,
      }));
      try {
        const sysPrompt = cfg.system_prompt || cfg.persona || "Você é uma atendente humanizada da LyneCloud (clínica odontológica). Responda de forma curta, gentil e prestativa em português brasileiro. Use no máximo 2 frases curtas. Use emojis com moderação.";
        const provider = (cfg as any).ai_provider || "openai";
        const model = (cfg as any).ai_model || cfg.model || "";
        const fallback = (cfg as any).ai_fallback_enabled !== false;
        const result = await callAiWithFallback(provider, model, aiMessages, sysPrompt, fallback);
        reply = result.text;
        aiUsed = true;
        intentKey = `ai:${result.provider}`;
        if (matched) intentKey = matched.key;
      } catch (e: any) {
        console.error("AI error (todos provedores):", e.message);
        reply = cfg.fallback_message || "Vou te transferir para um humano em instantes 💙";
      }
    }

    if (!reply) reply = cfg.fallback_message || "Recebi sua mensagem 💙";

    // 6. Delay humanizado — pulado quando veio de template (resposta instantânea)
    const fromTemplate = nextFlowKey !== undefined;
    if (cfg.human_like_delay && !fromTemplate) {
      const delay = Math.min(3000, 800 + reply.length * 30);
      await new Promise((r) => setTimeout(r, delay));
    }

    // 6.1 Atualiza fluxo ativo da conversa (se template definiu)
    if (nextFlowKey !== undefined) {
      await supabase.from("whatsapp_conversations")
        .update({ current_flow_key: nextFlowKey })
        .eq("id", conv!.id);
    }

    // 7. Envia via gateway
    let sent: any = { ok: false };
    try {
      const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-gateway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ to: phone, message: reply }),
      });
      sent = await r.json();
    } catch (e: any) {
      console.error("send error:", e.message);
    }

    // 8. Salva mensagem out
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conv!.id, direction: "out", body: reply,
      ai_used: aiUsed, intent_matched: intentKey,
    });

    return json({ ok: true, reply, ai_used: aiUsed, intent: intentKey, send_result: sent });
  } catch (e: any) {
    console.error("bot error:", e);
    return json({ error: e.message }, 500);
  }
});
