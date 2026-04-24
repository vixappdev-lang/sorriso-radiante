// Roteador unificado de WhatsApp: ChatPro OU VPS própria (Baileys)
// POST { event_key, to, vars: {nome, data, hora, tratamento, profissional}, message? }
// Lê qual provider está ativo em whatsapp_providers e dispara o correto.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function normalizePhone(raw: string): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("55")) return d;
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}

async function sendChatpro(supabase: any, to: string, message: string) {
  const { data: cfg } = await supabase
    .from("chatpro_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cfg?.endpoint || !cfg?.token) throw new Error("ChatPro não configurado");
  const base = String(cfg.endpoint).replace(/\/$/, "");
  const resp = await fetch(`${base}/api/v1/send_message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: cfg.token },
    body: JSON.stringify({ number: to, message }),
  });
  const text = await resp.text();
  let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: resp.ok, status: resp.status, data };
}

async function sendBaileysVps(provider: any, to: string, message: string) {
  const cfg = provider.config || {};
  if (!cfg.url || !cfg.token) throw new Error("VPS Baileys não configurada");
  const base = String(cfg.url).replace(/\/$/, "");
  const resp = await fetch(`${base}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify({ to, message }),
  });
  const text = await resp.text();
  let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: resp.ok, status: resp.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { event_key, to, vars = {}, message: rawMessage, appointment_id, campaign_id } = body;
    const phone = normalizePhone(to);
    if (!phone) return json({ error: "Telefone inválido" }, 400);

    // Resolve mensagem: se rawMessage vier, usa; senão pega do template do evento
    let finalMessage = rawMessage;
    if (!finalMessage && event_key) {
      const { data: evt } = await supabase
        .from("whatsapp_event_settings")
        .select("*").eq("event_key", event_key).maybeSingle();
      if (!evt?.enabled) {
        return json({ ok: false, skipped: true, reason: "event_disabled" });
      }
      finalMessage = render(evt.template || "", vars);
    }
    if (!finalMessage) return json({ error: "Sem mensagem" }, 400);

    // Provider ativo
    const { data: providers } = await supabase
      .from("whatsapp_providers")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    const active = (providers || [])[0];

    let result: any = null;
    let providerType = "none";
    let providerId: string | null = null;

    if (active?.type === "baileys_vps") {
      providerType = "baileys_vps";
      providerId = active.id;
      try {
        result = await sendBaileysVps(active, phone, finalMessage);
      } catch (e: any) {
        // Fallback para ChatPro
        try {
          result = await sendChatpro(supabase, phone, finalMessage);
          providerType = "chatpro";
          providerId = null;
        } catch (e2: any) {
          result = { ok: false, error: `vps_failed:${e.message} | chatpro_failed:${e2.message}` };
        }
      }
    } else if (active?.type === "chatpro") {
      providerType = "chatpro";
      providerId = active.id;
      try { result = await sendChatpro(supabase, phone, finalMessage); }
      catch (e: any) { result = { ok: false, error: e.message }; }
    } else {
      // Fallback: tenta chatpro_config legado
      try {
        result = await sendChatpro(supabase, phone, finalMessage);
        providerType = "chatpro";
      } catch (e: any) {
        result = { ok: false, error: `no_provider_active:${e.message}` };
      }
    }

    // Log
    await supabase.from("whatsapp_messages_log").insert({
      provider_id: providerId,
      provider_type: providerType,
      to_number: phone,
      template_key: event_key ?? null,
      message: finalMessage,
      status: result?.ok ? "sent" : "failed",
      response: result,
      appointment_id: appointment_id ?? null,
      campaign_id: campaign_id ?? null,
    });

    return json({ ok: !!result?.ok, provider: providerType, result });
  } catch (e: any) {
    console.error("[whatsapp-gateway]", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
