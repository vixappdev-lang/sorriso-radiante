// Proxy autenticado para VPS Baileys (mantém token server-side)
// Ações: status | qr | logout | restart | info

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await sb.auth.getClaims(token);
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);

    // Verifica admin
    const sbService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: isAdmin } = await sbService.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { action, provider_id } = body;

    const { data: provider } = await sbService
      .from("whatsapp_providers")
      .select("*")
      .eq("id", provider_id)
      .eq("type", "baileys_vps")
      .maybeSingle();

    if (!provider) return json({ error: "Provider VPS não encontrado" }, 404);

    const cfg = (provider.config as any) || {};
    if (!cfg.url || !cfg.token) return json({ error: "VPS sem URL/token configurados" }, 400);

    const base = String(cfg.url).replace(/\/$/, "");
    const path = ({
      status: "/status",
      qr: "/qr",
      logout: "/logout",
      restart: "/restart",
      info: "/info",
    } as Record<string, string>)[action];

    if (!path) return json({ error: "Ação inválida" }, 400);

    const resp = await fetch(`${base}${path}`, {
      method: action === "logout" || action === "restart" ? "POST" : "GET",
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    const text = await resp.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Atualiza status do provider
    if (action === "status" && data?.status) {
      await sbService.from("whatsapp_providers")
        .update({ status: data.status, last_seen_at: new Date().toISOString() })
        .eq("id", provider_id);
    }

    return json({ ok: resp.ok, status: resp.status, data });
  } catch (e: any) {
    console.error("[whatsapp-vps-proxy]", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
