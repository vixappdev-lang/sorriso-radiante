import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Endpoint admin: ler/atualizar configuração ChatPro, gerar QR, ver status, enviar teste.
// Ações: get_config | save_config | get_qr | get_status | send_test | list_appointments
// Autenticação simples por senha admin (ADMIN_PASSWORD via Supabase secret).

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, password, payload } = await req.json();

    const adminPassword = Deno.env.get("ADMIN_PASSWORD") ?? "lynecloud2025"; // fallback inicial
    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: "Senha incorreta" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const getConfig = async () => {
      const { data } = await supabase
        .from("chatpro_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    };

    if (action === "get_config") {
      const cfg = await getConfig();
      return json({ config: cfg });
    }

    if (action === "save_config") {
      const { instance_code, token, endpoint, message_template } = payload;
      const existing = await getConfig();
      if (existing) {
        const { error } = await supabase
          .from("chatpro_config")
          .update({
            instance_code, token, endpoint,
            message_template: message_template ?? existing.message_template,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await supabase.from("chatpro_config").insert({
          instance_code, token, endpoint,
          message_template: message_template ?? undefined,
        });
        if (error) return json({ error: error.message }, 500);
      }
      return json({ success: true });
    }

    const cfg = await getConfig();
    if (!cfg) return json({ error: "Configure as credenciais primeiro." }, 400);
    const base = cfg.endpoint.replace(/\/$/, "");

    if (action === "get_status") {
      // ChatPro: GET /api/v1/status
      const resp = await fetch(`${base}/api/v1/status`, {
        headers: { Authorization: cfg.token },
      });
      const text = await resp.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return json({ ok: resp.ok, status: resp.status, data });
    }

    if (action === "get_qr") {
      // ChatPro: GET /api/v1/generate_qrcode  (retorna imagem base64 OU URL)
      const resp = await fetch(`${base}/api/v1/generate_qrcode`, {
        headers: { Authorization: cfg.token },
      });
      const text = await resp.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return json({ ok: resp.ok, status: resp.status, data });
    }

    if (action === "send_test") {
      const { number, message } = payload;
      const digits = String(number).replace(/\D/g, "");
      const e164 = digits.startsWith("55") ? digits : (digits.length === 10 || digits.length === 11 ? "55" + digits : digits);
      const resp = await fetch(`${base}/api/v1/send_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: cfg.token },
        body: JSON.stringify({ number: e164, message }),
      });
      const text = await resp.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return json({ ok: resp.ok, status: resp.status, data });
    }

    if (action === "list_appointments") {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return json({ error: error.message }, 500);
      return json({ appointments: data });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
