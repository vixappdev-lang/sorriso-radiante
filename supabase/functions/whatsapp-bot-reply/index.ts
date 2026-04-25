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

async function callAiGateway(messages: any[], systemPrompt: string, model: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
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
    throw new Error(`AI Gateway ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
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

    if (matched && matched.action === "reply" && matched.response_template) {
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
        reply = await callAiGateway(aiMessages, cfg.system_prompt || cfg.persona || "Você é uma atendente humanizada de uma clínica odontológica. Responda de forma curta, gentil e prestativa em português brasileiro. Use no máximo 2 frases curtas. Use emojis com moderação.", cfg.model || "google/gemini-2.5-flash");
        aiUsed = true;
        if (matched) intentKey = matched.key;
      } catch (e: any) {
        console.error("AI error:", e.message);
        reply = cfg.fallback_message || "Vou te transferir para um humano em instantes 💙";
      }
    }

    if (!reply) reply = cfg.fallback_message || "Recebi sua mensagem 💙";

    // 6. Delay humanizado
    if (cfg.human_like_delay) {
      const delay = Math.min(3000, 800 + reply.length * 30);
      await new Promise((r) => setTimeout(r, delay));
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
