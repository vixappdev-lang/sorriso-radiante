// Bootstrap do primeiro admin do painel Levii.
// Cria (ou recupera) o usuário definido em ADMIN_BOOTSTRAP_EMAIL/PASSWORD
// e garante a role 'admin' em public.user_roles.
// Pode ser chamado a qualquer momento — é idempotente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const email = Deno.env.get("ADMIN_BOOTSTRAP_EMAIL");
    const password = Deno.env.get("ADMIN_BOOTSTRAP_PASSWORD");

    if (!email || !password) {
      return json({ error: "ADMIN_BOOTSTRAP_EMAIL e ADMIN_BOOTSTRAP_PASSWORD precisam estar configurados." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Procura o usuário pelo e-mail.
    let userId: string | null = null;
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (list.error) return json({ error: list.error.message }, 500);
    const existing = list.data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // garante que a senha enviada também funciona (atualiza apenas se solicitado via ?reset=1)
      const url = new URL(req.url);
      if (url.searchParams.get("reset") === "1") {
        const upd = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
        if (upd.error) return json({ error: upd.error.message }, 500);
      }
    } else {
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error) return json({ error: created.error.message }, 500);
      userId = created.data.user!.id;
    }

    // 2) Garante a role admin (idempotente via UNIQUE constraint).
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) return json({ error: roleErr.message }, 500);

    return json({ ok: true, email, user_id: userId, created: !existing });
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
