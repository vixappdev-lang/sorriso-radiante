// Webhook público que recebe mensagens recebidas do WhatsApp (VPS Baileys ou ChatPro)
// e roteia para o bot conversacional (whatsapp-bot-reply).
//
// FORMATOS ACEITOS:
//
// 1) ChatPro (oficial — chatpro.readme.io/reference/received_message):
//    {
//      "event": "received_message",
//      "event_ts": "...",
//      "message_data": {
//        "from_me": false,
//        "id": "...",
//        "instance_id": "chatpro-XXXX",
//        "message": "Olá",
//        "number": "5562999999999@s.whatsapp.net",
//        "type": "receveid_message",
//        ...
//      }
//    }
//
// 2) VPS Baileys (nosso): { from, message, contact_name, message_id, from_me }
//    Header: X-LyneCloud-Token (precisa bater com WHATSAPP_INBOUND_SECRET)
//
// 3) ChatPro legacy (formato antigo flat): { from, body|message, sender:{...}, fromMe }
//
// AUTH: Esse endpoint é público (verify_jwt=false).
// O ChatPro NÃO permite headers customizados no webhook → use ?secret=... na URL.
// Se WHATSAPP_INBOUND_SECRET não estiver definido, aceita qualquer chamada.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lynecloud-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function digits(s: string): string {
  return String(s || "").replace(/\D/g, "");
}

type Extracted = {
  from: string;
  message: string;
  contact_name: string | null;
  message_id: string | null;
  from_me: boolean;
  event: string | null;
  source: string;
};

function extractFields(body: any): Extracted {
  // 1) ChatPro OFICIAL — payload aninhado em message_data
  if (body?.message_data && typeof body.message_data === "object") {
    const md = body.message_data;
    const fromRaw = md.number || md.participant || md.from || "";
    return {
      from: digits(fromRaw),
      message: String(md.message ?? md.body ?? md.text ?? "").trim(),
      contact_name: md.notify_name || md.pushname || md.name || null,
      message_id: md.id || null,
      from_me: !!md.from_me,
      event: String(body.event || md.type || ""),
      source: "chatpro",
    };
  }

  // 2) VPS Baileys (nosso payload simples)
  if (body?.from && (body?.message !== undefined || body?.body !== undefined)) {
    return {
      from: digits(body.from),
      message: String(body.message ?? body.body ?? "").trim(),
      contact_name: body.contact_name ?? body.pushName ?? null,
      message_id: body.message_id ?? body.id ?? null,
      from_me: !!body.from_me,
      event: body.event || null,
      source: "vps_baileys",
    };
  }

  // 3) ChatPro legacy / outros formatos flat
  const sender = body?.sender || body?.contact || {};
  const fromRaw = body?.from || body?.number || body?.phone || sender?.id || sender?.number || "";
  const msg = body?.body || body?.message || body?.text || body?.content || "";
  return {
    from: digits(fromRaw),
    message: String(msg).trim(),
    contact_name: sender?.pushname || sender?.name || body?.notifyName || null,
    message_id: body?.id || body?.messageId || null,
    from_me: !!(body?.fromMe || body?.from_me),
    event: body?.event || null,
    source: "unknown",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // GET → endpoint de "ping" para o ChatPro validar a URL
  if (req.method === "GET") {
    return json({ ok: true, service: "lynecloud-whatsapp-inbound", ready: true });
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    // Auth por shared secret — só exige se o secret existir no ambiente
    const expected = Deno.env.get("WHATSAPP_INBOUND_SECRET");
    if (expected) {
      const url = new URL(req.url);
      const provided =
        req.headers.get("x-lynecloud-token") ||
        url.searchParams.get("secret") ||
        url.searchParams.get("token") ||
        "";
      if (provided !== expected) {
        console.warn("[inbound] unauthorized — secret mismatch");
        return json({ error: "unauthorized" }, 401);
      }
    }

    const raw = await req.json().catch(() => ({}));
    const fields = extractFields(raw);

    console.log("[inbound] received", {
      source: fields.source,
      event: fields.event,
      from: fields.from,
      from_me: fields.from_me,
      msg_preview: fields.message.slice(0, 80),
    });

    // Filtra eventos que não são mensagens recebidas
    if (fields.event && !/received|receveid|message|incoming/i.test(fields.event)) {
      return json({ ok: true, skipped: "not_received_event", event: fields.event });
    }

    if (fields.from_me) return json({ ok: true, skipped: "from_me" });

    if (!fields.from || !fields.message) {
      console.warn("[inbound] empty payload", { hasFrom: !!fields.from, hasMessage: !!fields.message });
      return json({ ok: true, skipped: "empty", debug: { hasFrom: !!fields.from, hasMessage: !!fields.message, raw_keys: Object.keys(raw || {}) } });
    }

    // Encaminha ao bot
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const r = await fetch(`${supabaseUrl}/functions/v1/whatsapp-bot-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        from: fields.from,
        message: fields.message,
        contact_name: fields.contact_name,
      }),
    });

    const data = await r.json().catch(() => ({}));
    console.log("[inbound] bot reply", { ok: data?.ok, ai_used: data?.ai_used, intent: data?.intent });

    // Log de auditoria (silencioso se falhar)
    try {
      const sb = createClient(supabaseUrl, serviceKey);
      await sb.from("admin_audit_log").insert({
        entity: "whatsapp_inbound",
        entity_id: fields.message_id || fields.from,
        action: "received",
        diff: {
          source: fields.source,
          from: fields.from,
          snippet: fields.message.slice(0, 160),
          bot_ok: data?.ok ?? null,
          intent: data?.intent ?? null,
        },
      });
    } catch { /* silencioso */ }

    return json({ ok: true, bot: data });
  } catch (e: any) {
    console.error("[whatsapp-inbound] FATAL", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
