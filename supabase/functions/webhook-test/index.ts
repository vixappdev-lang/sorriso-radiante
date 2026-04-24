// Edge function — Webhook tester: dispara um payload exemplo para uma URL com assinatura HMAC
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", claims.claims.sub).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { id } = await req.json();
    const { data: hook } = await admin.from("webhook_endpoints").select("*").eq("id", id).maybeSingle();
    if (!hook) return json({ error: "Webhook não encontrado" }, 404);

    const payload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      data: { message: "Disparo de teste do painel LyneCloud" },
    };
    const body = JSON.stringify(payload);

    // HMAC sha-256
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(hook.secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const signature = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const start = Date.now();
    let status = 0; let respBody = "";
    try {
      const r = await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-LyneCloud-Signature": signature, "X-LyneCloud-Event": "test.ping" },
        body,
      });
      status = r.status;
      respBody = (await r.text()).slice(0, 500);
    } catch (e: any) {
      return json({ ok: false, error: e.message }, 200);
    }

    return json({ ok: status >= 200 && status < 300, status, response: respBody, duration_ms: Date.now() - start });
  } catch (e: any) {
    return json({ error: e.message ?? "erro" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
