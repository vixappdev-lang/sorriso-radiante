import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar as CalIcon, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SEO from "@/components/SEO";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
const CLINIC_NAME = "Clínica Levii";
import { cn } from "@/lib/utils";

type Link = {
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
  const { slug = "" } = useParams();
  const [link, setLink] = useState<Link | null>(null);
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
      const { data, error } = await supabase.from("public_booking_links").select("*").eq("slug", slug).eq("active", true).maybeSingle();
      if (error || !data) { setError("Link de agendamento inválido ou desativado."); setLoading(false); return; }
      setLink(data as Link);
      // pré-preenche
      const t = TREATMENTS.find((x) => x.slug === data.treatment_slug);
      setTreatment(t?.name ?? TREATMENTS[0]?.name ?? "");
      const p = DENTISTS.find((d) => d.slug === data.professional_slug);
      setProfessional(p?.name ?? DENTISTS[0]?.name ?? "");
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!date) return;
    const iso = date.toISOString().slice(0, 10);
    (async () => {
      // Combina ocupados Clinicorp + appointments locais (não exposto, mas usamos count via RPC futura)
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

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  if (error && !link) return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <p className="text-base font-semibold text-rose-600">{error}</p>
        <Link to="/" className="text-sm text-blue-600 underline mt-2 inline-block">Voltar para o site</Link>
      </div>
    </div>
  );

  return (
    <>
      <SEO title={link?.title || "Agendamento direto"} description={link?.description || `Agende sua consulta com a ${CLINIC_NAME}`} />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 px-4 py-8 sm:py-14">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
          </Link>

          <div className="bg-white rounded-3xl shadow-xl ring-1 ring-black/5 overflow-hidden">
            <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-6 sm:px-10 py-7 text-white">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/70 mb-2">
                <CalIcon className="h-4 w-4" /> Agendamento direto
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold">{link?.title}</h1>
              {link?.description && <p className="mt-1 text-sm text-white/80">{link.description}</p>}
            </header>

            <div className="p-6 sm:p-10">
              {step === "done" ? (
                <div className="text-center py-8">
                  <div className="grid place-items-center mx-auto h-16 w-16 rounded-full bg-emerald-100 mb-4">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold">Agendamento solicitado!</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Em instantes a equipe entra em contato pelo WhatsApp para confirmar.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Escolha a data</Label>
                    <div className="mt-2 rounded-xl border bg-white p-2">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={(d) => d < new Date(new Date().toDateString())} className="mx-auto" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Horário disponível</Label>
                      <div className="mt-2 grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-1">
                        {HOURS.map((h) => {
                          const taken = takenTimes.has(h);
                          return (
                            <button key={h} type="button" disabled={taken} onClick={() => setTime(h)}
                              className={cn(
                                "text-xs rounded-lg py-2 font-medium transition tabular-nums",
                                taken ? "bg-slate-100 text-slate-400 cursor-not-allowed line-through" :
                                time === h ? "bg-blue-600 text-white shadow" : "bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                              )}>{h}</button>
                          );
                        })}
                      </div>
                    </div>

                    {!link?.treatment_slug && (
                      <div>
                        <Label className="text-xs">Tratamento</Label>
                        <Select value={treatment} onValueChange={setTreatment}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{TREATMENTS.map((t) => <SelectItem key={t.slug} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}
                    {!link?.professional_slug && (
                      <div>
                        <Label className="text-xs">Profissional</Label>
                        <Select value={professional} onValueChange={setProfessional}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{DENTISTS.map((d) => <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="pt-2 border-t border-dashed">
                      <Label className="text-xs">Seu nome*</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Telefone*</Label>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
                      </div>
                      <div>
                        <Label className="text-xs">E-mail</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Observação</Label>
                      <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>

                    {error && <p className="text-sm text-rose-600">{error}</p>}

                    <Button onClick={submit} disabled={submitting} className="w-full h-11 bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-800">
                      {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agendando…</> : "Confirmar agendamento"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
