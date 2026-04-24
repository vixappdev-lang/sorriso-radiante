// Edge function — API pública usando chaves Levii (levii_xxxx)
// Endpoints: GET /appointments, POST /leads, GET /reviews
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey?.startsWith("levii_")) return json({ error: "API key inválida" }, 401);

    const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
    const hashHex = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: keyRow } = await admin.from("api_keys").select("*").eq("key_hash", hashHex).maybeSingle();
    if (!keyRow) return json({ error: "API key não autorizada" }, 401);

    await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

    const url = new URL(req.url);
    const pathname = url.pathname.replace(/^\/(functions\/v1\/)?public-api/, "") || "/";

    if (pathname === "/appointments" && req.method === "GET") {
      if (!keyRow.scopes.includes("read")) return json({ error: "Sem permissão de leitura" }, 403);
      const { data, error } = await admin.from("appointments").select("id,name,phone,treatment,appointment_date,appointment_time,status").order("appointment_date", { ascending: false }).limit(100);
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (pathname === "/leads" && req.method === "POST") {
      if (!keyRow.scopes.includes("write")) return json({ error: "Sem permissão de escrita" }, 403);
      const body = await req.json();
      if (!body.name) return json({ error: "Campo 'name' obrigatório" }, 400);
      const { data, error } = await admin.from("leads").insert({
        name: body.name, phone: body.phone, email: body.email,
        source: body.source ?? "api", treatment_interest: body.treatment_interest,
        notes: body.notes, status: "novo",
      }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    if (pathname === "/reviews" && req.method === "GET") {
      if (!keyRow.scopes.includes("read")) return json({ error: "Sem permissão de leitura" }, 403);
      const { data, error } = await admin.from("reviews").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) return json({ error: error.message }, 400);
      return json({ data });
    }

    return json({ error: "Rota não encontrada", available: ["GET /appointments", "POST /leads", "GET /reviews"] }, 404);
  } catch (e: any) {
    return json({ error: e.message ?? "erro" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
