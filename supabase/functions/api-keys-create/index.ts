// Edge function — gera nova chave de API para o admin
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
    const callerId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const { label, scopes } = await req.json();
    if (!label) return json({ error: "Label obrigatório" }, 400);

    // gera chave: lyne_<32 chars hex>
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const raw = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const fullKey = `lyne_${raw}`;
    const prefix = fullKey.slice(0, 14);

    // hash sha-256
    const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fullKey));
    const hashHex = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data, error } = await admin.from("api_keys").insert({
      label, key_prefix: prefix, key_hash: hashHex,
      scopes: Array.isArray(scopes) && scopes.length ? scopes : ["read"],
      created_by: callerId,
    }).select().single();
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true, key: fullKey, record: data });
  } catch (e: any) {
    return json({ error: e.message ?? "erro" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
