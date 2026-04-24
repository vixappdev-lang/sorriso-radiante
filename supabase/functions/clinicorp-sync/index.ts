// Edge function — sincronização Clinicorp.
// Estrutura completa pronta para ativação: ao definir os secrets CLINICORP_TOKEN
// e CLINICORP_CLINIC_ID, a função busca os agendamentos da Clinicorp dos próximos
// 60 dias e popula a tabela `clinicorp_busy_slots`. O site lê dela para bloquear
// horários ocupados na hora de agendar.
//
// Docs: https://sistema.clinicorp.com/api-docs/
//
// Endpoints utilizados (típicos REST Clinicorp):
//   GET /api/v1/appointments?clinic_id={id}&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
//
// Para ativação programada (a cada 15min), o usuário deve criar um cron pg_cron
// chamando esta function — instruções na aba de Configurações > Integrações.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const TOKEN = Deno.env.get("CLINICORP_TOKEN");
  const CLINIC_ID = Deno.env.get("CLINICORP_CLINIC_ID");
  const ENDPOINT = Deno.env.get("CLINICORP_ENDPOINT") ?? "https://api.clinicorp.com";

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    if (!TOKEN || !CLINIC_ID) {
      const msg = "Secrets CLINICORP_TOKEN e/ou CLINICORP_CLINIC_ID não configurados — sincronização desativada.";
      await admin.from("clinicorp_sync_log").insert({ status: "skipped", message: msg, slots_synced: 0, duration_ms: Date.now() - started });
      return json({ ok: false, skipped: true, message: msg }, 200);
    }

    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 60);
    const start_date = today.toISOString().slice(0, 10);
    const end_date = end.toISOString().slice(0, 10);

    const url = `${ENDPOINT.replace(/\/$/, "")}/api/v1/appointments?clinic_id=${encodeURIComponent(CLINIC_ID)}&start_date=${start_date}&end_date=${end_date}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
    if (!res.ok) {
      const txt = await res.text();
      await admin.from("clinicorp_sync_log").insert({ status: "failed", message: `HTTP ${res.status}: ${txt.slice(0, 500)}`, duration_ms: Date.now() - started });
      return json({ ok: false, error: `Clinicorp respondeu ${res.status}` }, 502);
    }
    const data = await res.json();
    const items: any[] = Array.isArray(data) ? data : (data?.data ?? data?.appointments ?? []);

    const rows = items.map((it) => ({
      external_id: String(it.id ?? it.appointment_id ?? `${it.date}-${it.start_time}-${it.professional_id ?? ""}`),
      professional_external_id: it.professional_id ? String(it.professional_id) : null,
      professional_slug: it.professional_slug ?? null,
      busy_date: it.date ?? it.start_date ?? it.appointment_date,
      start_time: (it.start_time ?? it.time ?? "").toString().slice(0, 5),
      end_time: (it.end_time ?? "").toString().slice(0, 5) || addMinutes((it.start_time ?? it.time ?? "00:00"), it.duration_minutes ?? 30),
      patient_name: it.patient_name ?? it.patient?.name ?? null,
      treatment: it.procedure ?? it.treatment ?? null,
      status: it.status ?? "busy",
      raw: it,
    })).filter((r) => r.busy_date && r.start_time);

    if (rows.length > 0) {
      await admin.from("clinicorp_busy_slots").upsert(rows as any, { onConflict: "external_id" });
    }

    await admin.from("clinicorp_sync_log").insert({
      status: "success", message: `Sincronizados ${rows.length} slots`, slots_synced: rows.length, duration_ms: Date.now() - started,
    });
    return json({ ok: true, synced: rows.length });
  } catch (e: any) {
    await admin.from("clinicorp_sync_log").insert({ status: "failed", message: e.message ?? String(e), duration_ms: Date.now() - started });
    return json({ ok: false, error: e.message ?? "Erro interno" }, 500);
  }
});

function addMinutes(hhmm: string, min: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + (min || 30);
  const nh = Math.floor(total / 60).toString().padStart(2, "0");
  const nm = (total % 60).toString().padStart(2, "0");
  return `${nh}:${nm}`;
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
