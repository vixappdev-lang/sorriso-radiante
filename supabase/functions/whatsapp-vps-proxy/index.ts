// Proxy autenticado para VPS Baileys (mantém token server-side)
// Ações: status | qr | logout | restart | info
// Aceita provider_id (existente) OU vps_config { url, token } (teste antes de salvar)

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
    const { action, provider_id, vps_config } = body;

    let cfg: { url?: string; token?: string } = {};
    let providerRow: any = null;

    if (vps_config?.url && vps_config?.token) {
      cfg = vps_config;
    } else if (provider_id) {
      const { data: provider } = await sbService
        .from("whatsapp_providers")
        .select("*")
        .eq("id", provider_id)
        .maybeSingle();
      if (!provider) return json({ error: "Provider VPS não encontrado" }, 404);
      providerRow = provider;
      cfg = (provider.config as any) || {};
    } else {
      // Auto: pega o provider tipo baileys_vps mais recente
      const { data: any_vps } = await sbService
        .from("whatsapp_providers")
        .select("*")
        .eq("type", "baileys_vps")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!any_vps) return json({ error: "Nenhuma VPS configurada" }, 404);
      providerRow = any_vps;
      cfg = (any_vps.config as any) || {};
    }

    if (!cfg.url || !cfg.token) return json({ error: "VPS sem URL/token configurados" }, 400);

    const base = String(cfg.url).replace(/\/$/, "");
    const path = ({
      status: "/status",
      qr: "/qr",
      logout: "/logout",
      restart: "/restart",
      info: "/info",
      health: "/health",
    } as Record<string, string>)[action];

    if (!path) return json({ error: "Ação inválida" }, 400);

    const resp = await fetch(`${base}${path}`, {
      method: action === "logout" || action === "restart" ? "POST" : "GET",
      headers: action === "health" ? {} : { Authorization: `Bearer ${cfg.token}` },
    });
    const text = await resp.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Atualiza status do provider, se aplicável
    if (providerRow && (action === "status" || action === "qr") && data?.status) {
      const newStatus = data.status === "qr" ? "waiting_qr" : data.status;
      await sbService.from("whatsapp_providers")
        .update({ status: newStatus, last_seen_at: new Date().toISOString() })
        .eq("id", providerRow.id);
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
