// Edge function — gerência de usuários do painel (criar/atualizar permissões/excluir)
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

    // valida sessão admin
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    // checa role admin
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);

    const { action, payload } = await req.json();

    if (action === "create") {
      const { email, password, full_name, job_title, is_admin, permissions } = payload;
      if (!email || !password || !full_name) return json({ error: "Campos obrigatórios faltando" }, 400);

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name },
      });
      if (cErr) return json({ error: cErr.message }, 400);
      const newUserId = created.user!.id;

      await admin.from("staff_profiles").insert({ user_id: newUserId, full_name, email, job_title });
      if (is_admin) await admin.from("user_roles").insert({ user_id: newUserId, role: "admin" });
      if (permissions) {
        const rows = Object.entries(permissions).map(([module, p]: [string, any]) => ({
          user_id: newUserId, module, can_view: !!p.view, can_edit: !!p.edit, can_delete: !!p.delete,
        }));
        if (rows.length) await admin.from("user_permissions").insert(rows);
      }
      return json({ ok: true, user_id: newUserId });
    }

    if (action === "update_perms") {
      const { user_id, is_admin, permissions } = payload;
      // sync admin role
      await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin");
      if (is_admin) await admin.from("user_roles").insert({ user_id, role: "admin" });
      // reset permissions
      await admin.from("user_permissions").delete().eq("user_id", user_id);
      const rows = Object.entries(permissions || {}).map(([module, p]: [string, any]) => ({
        user_id, module, can_view: !!p.view, can_edit: !!p.edit, can_delete: !!p.delete,
      }));
      if (rows.length) await admin.from("user_permissions").insert(rows);
      return json({ ok: true });
    }

    if (action === "delete") {
      const { user_id } = payload;
      if (user_id === callerId) return json({ error: "Você não pode excluir a própria conta" }, 400);
      await admin.from("staff_profiles").delete().eq("user_id", user_id);
      await admin.from("user_roles").delete().eq("user_id", user_id);
      await admin.from("user_permissions").delete().eq("user_id", user_id);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e: any) {
    return json({ error: e.message ?? "Erro interno" }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
