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

function normalizePhoneToE164BR(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Já com DDI 55
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // 10 ou 11 dígitos (DDD + número)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AppointmentBody;

    // Validação simples
    if (!body.name || !body.phone || !body.treatment || !body.date || !body.time) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Salvar agendamento
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

    // Buscar config ChatPro
    const { data: config } = await supabase
      .from("chatpro_config")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let whatsappSent = false;
    let whatsappResponse: unknown = null;

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
        // ChatPro Send Text API: POST {endpoint}/api/v1/send_message?instance_id=...
        // Documentação: https://chatpro.readme.io/reference/send-message
        const url = `${config.endpoint.replace(/\/$/, "")}/api/v1/send_message`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": config.token,
          },
          body: JSON.stringify({ number, message }),
        });
        const text = await resp.text();
        try { whatsappResponse = JSON.parse(text); } catch { whatsappResponse = { raw: text }; }
        whatsappSent = resp.ok;
        if (!resp.ok) console.error("ChatPro send falhou:", resp.status, text);
      } catch (err) {
        console.error("Erro ChatPro:", err);
        whatsappResponse = { error: String(err) };
      }

      // Atualizar status no banco
      await supabase
        .from("appointments")
        .update({
          whatsapp_sent: whatsappSent,
          whatsapp_response: whatsappResponse,
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
