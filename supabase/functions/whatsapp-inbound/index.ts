// Webhook público que recebe mensagens recebidas do WhatsApp (VPS Baileys ou ChatPro)
// e roteia para o bot conversacional (whatsapp-bot-reply).
//
// Aceita 2 formatos:
//
// 1) VPS Baileys (nosso): { from, message, contact_name, message_id }
//    Header: X-LyneCloud-Token (precisa bater com WHATSAPP_INBOUND_SECRET)
//
// 2) ChatPro: { from?: "5511...", message?, body?, sender?: {pushname,...}, ... }
//    Auth via query ?secret=... ou header X-LyneCloud-Token
//
// Esse endpoint é público (verify_jwt=false) e protegido por shared secret.

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

function digits(s: string): string { return String(s || "").replace(/\D/g, ""); }

function extractFields(body: any): { from: string; message: string; contact_name: string | null; message_id: string | null; from_me: boolean } {
  // VPS Baileys (nosso)
  if (body?.from && (body?.message !== undefined || body?.body !== undefined)) {
    return {
      from: digits(body.from),
      message: String(body.message ?? body.body ?? "").trim(),
      contact_name: body.contact_name ?? body.pushName ?? null,
      message_id: body.message_id ?? body.id ?? null,
      from_me: !!body.from_me,
    };
  }
  // ChatPro variantes comuns
  const sender = body?.sender || body?.contact || {};
  const fromRaw = body?.from || body?.number || body?.phone || sender?.id || sender?.number || "";
  const msg = body?.body || body?.message || body?.text || body?.content || "";
  return {
    from: digits(fromRaw),
    message: String(msg).trim(),
    contact_name: sender?.pushname || sender?.name || body?.notifyName || null,
    message_id: body?.id || body?.messageId || null,
    from_me: !!(body?.fromMe || body?.from_me),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    // Auth por shared secret (header ou query string)
    const expected = Deno.env.get("WHATSAPP_INBOUND_SECRET");
    if (expected) {
      const url = new URL(req.url);
      const provided = req.headers.get("x-lynecloud-token") || url.searchParams.get("secret") || "";
      if (provided !== expected) {
        return json({ error: "unauthorized" }, 401);
      }
    }

    const raw = await req.json().catch(() => ({}));
    const fields = extractFields(raw);

    if (fields.from_me) return json({ ok: true, skipped: "from_me" });
    if (!fields.from || !fields.message) {
      return json({ ok: true, skipped: "empty", debug: { hasFrom: !!fields.from, hasMessage: !!fields.message } });
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

    // Log opcional
    try {
      const sb = createClient(supabaseUrl, serviceKey);
      await sb.from("admin_audit_log").insert({
        entity: "whatsapp_inbound",
        entity_id: fields.message_id || fields.from,
        action: "received",
        diff: { from: fields.from, snippet: fields.message.slice(0, 120), bot_result: data?.ok ?? null },
      });
    } catch { /* silencioso */ }

    return json({ ok: true, bot: data });
  } catch (e: any) {
    console.error("[whatsapp-inbound]", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
