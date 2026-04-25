// Retorna a URL completa do webhook inbound (com secret embutido)
// para o admin colar no painel do ChatPro.
// Protegido: requer admin autenticado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: precisa ser admin
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    const secret = Deno.env.get("WHATSAPP_INBOUND_SECRET") || "";
    const baseUrl = `${supabaseUrl}/functions/v1/whatsapp-inbound`;
    const fullUrl = secret ? `${baseUrl}?secret=${encodeURIComponent(secret)}` : baseUrl;

    return json({
      ok: true,
      url: fullUrl,
      base_url: baseUrl,
      has_secret: !!secret,
      instructions: "Cole esta URL no painel do ChatPro em: Configurações → Webhooks → URL do webhook (POST). O ChatPro chamará automaticamente sempre que uma mensagem for recebida.",
    });
  } catch (e: any) {
    console.error("[whatsapp-inbound-url]", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});
