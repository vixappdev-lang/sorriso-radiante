import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentBody {
  name: string;
  phone: string;
  email?: string;
  treatment: string;
  professional?: string;
  date: string;
  time: string;
  notes?: string;
}

const TREATMENT_LABELS: Record<string, string> = {
  "implantes": "Implantes Dentários",
  "ortodontia": "Ortodontia & Alinhadores",
  "lentes-de-contato-dental": "Lentes de Contato Dental",
  "clareamento": "Clareamento a Laser",
  "harmonizacao-orofacial": "Harmonização Orofacial",
  "endodontia": "Endodontia (Canal)",
  "odontopediatria": "Odontopediatria",
  "proteses": "Próteses Dentárias",
  "periodontia": "Periodontia",
  "emergencia-24h": "Emergência 24h",
};

// Coordenadas reais do Centro de Aracruz/ES
const CLINIC_LOCATION = {
  lat: "-19.8203",
  lng: "-40.2741",
  address: "Av. Venâncio Flores, 350 - Sala 04, Centro, Aracruz/ES",
  name: "Clínica Levii",
};

function normalizePhoneToE164BR(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{\{nome\}\}/g, vars.nome)
    .replace(/\{\{tratamento\}\}/g, vars.tratamento)
    .replace(/\{\{data\}\}/g, vars.data)
    .replace(/\{\{hora\}\}/g, vars.hora);
}

async function chatproSend(endpoint: string, token: string, path: string, body: unknown) {
  const url = `${endpoint.replace(/\/$/, "")}/api/v1/${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": token },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { ok: resp.ok, status: resp.status, body: parsed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AppointmentBody;

    if (!body.name || !body.phone || !body.treatment || !body.date || !body.time) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: appt, error: insertError } = await supabase
      .from("appointments")
      .insert({
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        treatment: body.treatment,
        professional: body.professional || null,
        appointment_date: body.date,
        appointment_time: body.time,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao salvar:", insertError);
      return new Response(JSON.stringify({ error: "Falha ao salvar agendamento" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config } = await supabase
      .from("chatpro_config")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let whatsappSent = false;
    const responses: Record<string, unknown> = {};

    if (config?.token && config?.endpoint) {
      const treatmentLabel = TREATMENT_LABELS[body.treatment] ?? body.treatment;
      const message = applyTemplate(config.message_template, {
        nome: body.name.split(" ")[0],
        tratamento: treatmentLabel,
        data: formatDateBR(body.date),
        hora: body.time,
      });

      const number = normalizePhoneToE164BR(body.phone);

      try {
        // 1) Mensagem refinada de confirmação
        const msgResp = await chatproSend(config.endpoint, config.token, "send_message", { number, message });
        responses.message = msgResp.body;
        whatsappSent = msgResp.ok;
        if (!msgResp.ok) console.error("ChatPro send_message falhou:", msgResp.status, msgResp.body);

        // 2) Localização nativa (gera mapa interativo "Como chegar" no WhatsApp)
        // ChatPro v1 send_button_message está deprecated — usamos send_location que é
        // a melhor alternativa nativa: o WhatsApp já oferece "Abrir no mapa" automaticamente.
        if (msgResp.ok) {
          // pequeno delay para preservar ordem
          await new Promise((r) => setTimeout(r, 600));
          const locResp = await chatproSend(config.endpoint, config.token, "send_location", {
            number,
            lat: CLINIC_LOCATION.lat,
            lng: CLINIC_LOCATION.lng,
            address: CLINIC_LOCATION.address,
            name: CLINIC_LOCATION.name,
          });
          responses.location = locResp.body;
          if (!locResp.ok) console.error("ChatPro send_location falhou:", locResp.status, locResp.body);
        }
      } catch (err) {
        console.error("Erro ChatPro:", err);
        responses.error = String(err);
      }

      await supabase
        .from("appointments")
        .update({
          whatsapp_sent: whatsappSent,
          whatsapp_response: responses,
          status: whatsappSent ? "confirmed" : "pending",
        })
        .eq("id", appt.id);
    } else {
      console.warn("ChatPro não configurado — agendamento salvo sem envio.");
    }

    return new Response(
      JSON.stringify({ success: true, id: appt.id, whatsappSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
