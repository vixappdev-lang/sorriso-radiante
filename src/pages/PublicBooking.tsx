import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar as CalIcon, Loader2, CheckCircle2, ArrowLeft, Clock, User as UserIcon, Stethoscope, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
import { cn } from "@/lib/utils";

const CLINIC_NAME = "Clínica Levii";

type LinkRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  professional_slug: string | null;
  treatment_slug: string | null;
};

const HOURS = Array.from({ length: 22 }).map((_, i) => {
  const t = 7 * 60 + i * 30;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
});

export default function PublicBooking() {
  // aceita /agendar/:token (ou slug, retrocompat)
  const { slug = "", token = "" } = useParams();
  const accessor = token || slug;

  const [link, setLink] = useState<LinkRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlots, setBusySlots] = useState<{ busy_date: string; start_time: string }[]>([]);

  const [step, setStep] = useState<"form" | "done">("form");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [treatment, setTreatment] = useState("");
  const [professional, setProfessional] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      // tenta por access_token primeiro, depois slug
      let row: any = null;
      const byToken = await supabase.from("public_booking_links").select("*").eq("access_token", accessor).eq("active", true).maybeSingle();
      if (byToken.data) row = byToken.data;
      if (!row) {
        const bySlug = await supabase.from("public_booking_links").select("*").eq("slug", accessor).eq("active", true).maybeSingle();
        if (bySlug.data) row = bySlug.data;
      }
      if (!row) { setError("Link de agendamento inválido ou desativado."); setLoading(false); return; }
      setLink(row as LinkRow);
      const t = TREATMENTS.find((x) => x.slug === row.treatment_slug);
      setTreatment(t?.name ?? TREATMENTS[0]?.name ?? "");
      const p = DENTISTS.find((d) => d.slug === row.professional_slug);
      setProfessional(p?.name ?? DENTISTS[0]?.name ?? "");
      setLoading(false);
    })();
  }, [accessor]);

  useEffect(() => {
    if (!date) return;
    const iso = date.toISOString().slice(0, 10);
    (async () => {
      const { data } = await supabase
        .from("clinicorp_busy_slots")
        .select("busy_date,start_time,professional_slug")
        .eq("busy_date", iso);
      setBusySlots(data ?? []);
    })();
  }, [date]);

  const takenTimes = useMemo(() => new Set(busySlots.map((b) => b.start_time?.slice(0, 5))), [busySlots]);

  async function submit() {
    if (!form.name || !form.phone || !time) { setError("Preencha nome, telefone e selecione um horário."); return; }
    setError(null);
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("create-appointment", {
      body: {
        name: form.name, phone: form.phone, email: form.email || null,
        treatment, professional,
        appointment_date: date.toISOString().slice(0, 10), appointment_time: time,
        notes: form.notes || null,
      },
    });
    setSubmitting(false);
    if (error || data?.error) { setError(error?.message || data?.error || "Falhou ao agendar."); return; }
    setStep("done");
  }

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
  if (error && !link) return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 text-center">
      <div>
        <p className="text-base font-semibold text-rose-600">{error}</p>
        <Link to="/" className="text-sm text-blue-600 underline mt-2 inline-block">Voltar para o site</Link>
      </div>
    </div>
  );

  return (
    <>
      <SEO title={link?.title || "Agendamento online"} description={link?.description || `Agende sua consulta com a ${CLINIC_NAME}`} />
      <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-5 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
          </Link>

          {/* Header */}
          <header className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-medium uppercase tracking-wider">
              <CalIcon className="h-3 w-3" /> {CLINIC_NAME}
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{link?.title}</h1>
            {link?.description && <p className="mt-1.5 text-sm text-slate-500 max-w-xl">{link.description}</p>}
          </header>

          {step === "done" ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center">
              <div className="grid place-items-center mx-auto h-16 w-16 rounded-full bg-emerald-50 mb-4 ring-8 ring-emerald-50/40">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Agendamento solicitado</h2>
              <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Em instantes a equipe entra em contato pelo WhatsApp para confirmar sua consulta.</p>
              <Link to="/"><Button variant="outline" className="mt-6">Voltar ao site</Button></Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {/* Coluna esquerda: data + horário */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <header className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2"><CalIcon className="h-3.5 w-3.5" /> Selecione data e horário</h3>
                </header>
                <div className="p-4 sm:p-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-2">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={(d) => d < new Date(new Date().toDateString())} className="mx-auto" />
                  </div>
                  <div className="mt-5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Horário</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {HOURS.map((h) => {
                        const taken = takenTimes.has(h);
                        const selected = time === h;
                        return (
                          <button key={h} type="button" disabled={taken} onClick={() => setTime(h)}
                            className={cn(
                              "text-xs rounded-lg py-2 font-medium transition tabular-nums border",
                              taken ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through" :
                              selected ? "bg-slate-900 text-white border-slate-900 shadow-sm" :
                              "bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            )}>{h}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Coluna direita: dados */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <header className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> Seus dados</h3>
                </header>
                <div className="p-5 space-y-4">
                  {!link?.treatment_slug && (
                    <div>
                      <Label className="text-[12px] font-medium text-slate-700 flex items-center gap-1.5"><Stethoscope className="h-3 w-3" /> Tratamento</Label>
                      <Select value={treatment} onValueChange={setTreatment}>
                        <SelectTrigger className="mt-1.5 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>{TREATMENTS.map((t) => <SelectItem key={t.slug} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {!link?.professional_slug && (
                    <div>
                      <Label className="text-[12px] font-medium text-slate-700">Profissional</Label>
                      <Select value={professional} onValueChange={setProfessional}>
                        <SelectTrigger className="mt-1.5 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>{DENTISTS.map((d) => <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="pt-2 border-t border-dashed border-slate-200">
                    <Label className="text-[12px] font-medium text-slate-700">Nome completo*</Label>
                    <Input className="mt-1.5 bg-slate-50 border-slate-200 focus:bg-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Como devemos te chamar?" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px] font-medium text-slate-700">Telefone*</Label>
                      <Input className="mt-1.5 bg-slate-50 border-slate-200 focus:bg-white" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <Label className="text-[12px] font-medium text-slate-700">E-mail</Label>
                      <Input className="mt-1.5 bg-slate-50 border-slate-200 focus:bg-white" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[12px] font-medium text-slate-700 flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Observação</Label>
                    <Textarea className="mt-1.5 bg-slate-50 border-slate-200 focus:bg-white resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  {/* Resumo */}
                  {time && (
                    <div className="rounded-xl bg-blue-50/50 border border-blue-100 px-4 py-3 text-xs text-blue-900">
                      <span className="font-semibold">Você está agendando: </span>
                      {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {time}
                    </div>
                  )}

                  {error && <p className="text-sm text-rose-600">{error}</p>}

                  <Button onClick={submit} disabled={submitting} className="w-full h-12 text-[15px] font-medium bg-slate-900 hover:bg-slate-800">
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agendando…</> : "Confirmar agendamento"}
                  </Button>
                  <p className="text-[11px] text-center text-slate-400">A equipe entrará em contato pelo WhatsApp para confirmar.</p>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
