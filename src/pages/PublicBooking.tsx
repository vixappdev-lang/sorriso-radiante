import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar as CalIcon, Loader2, CheckCircle2, ArrowLeft, ArrowRight, Clock,
  User as UserIcon, Stethoscope, Sparkles, Check, ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import SEO from "@/components/SEO";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
import { useClinicName } from "@/hooks/useClinicBrand";
import { cn } from "@/lib/utils";

type DbProfessional = {
  id: string;
  slug: string;
  name: string;
  specialty: string | null;
  photo_url: string | null;
};



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

type StepKey = "treatment" | "professional" | "datetime" | "details";

const STEPS: { key: StepKey; label: string; icon: any }[] = [
  { key: "treatment", label: "Tratamento", icon: Stethoscope },
  { key: "professional", label: "Profissional", icon: UserIcon },
  { key: "datetime", label: "Data & Hora", icon: CalIcon },
  { key: "details", label: "Confirmação", icon: Check },
];

export default function PublicBooking() {
  const { slug = "", token = "" } = useParams();
  const accessor = token || slug;
  const CLINIC_NAME = useClinicName();

  const [link, setLink] = useState<LinkRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlots, setBusySlots] = useState<{ busy_date: string; start_time: string }[]>([]);

  const [stepIdx, setStepIdx] = useState(0);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [treatment, setTreatment] = useState("");
  const [professional, setProfessional] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [dbPros, setDbPros] = useState<DbProfessional[]>([]);

  const step = STEPS[stepIdx].key;

  useEffect(() => {
    (async () => {
      // Carrega profissionais reais do DB com fotos
      const { data: pros } = await supabase
        .from("professionals")
        .select("id, slug, name, specialty, photo_url")
        .eq("status", "active")
        .order("name", { ascending: true });
      setDbPros((pros as DbProfessional[]) ?? []);

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
      if (t) { setTreatment(t.name); }
      const proRow = (pros as DbProfessional[] | null)?.find((d) => d.slug === row.professional_slug)
        ?? DENTISTS.find((d) => d.slug === row.professional_slug);
      if (proRow) { setProfessional(proRow.name); }
      // Se link já fixou tratamento/profissional, pula etapas
      const initialStep = (t && proRow) ? 2 : t ? 1 : 0;
      setStepIdx(initialStep);
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
    setDone(true);
  }

  function canAdvance(): boolean {
    if (step === "treatment") return !!treatment;
    if (step === "professional") return !!professional;
    if (step === "datetime") return !!time;
    if (step === "details") return !!form.name && !!form.phone;
    return false;
  }

  function next() { setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)); setError(null); }
  function back() { setStepIdx((i) => Math.max(i - 1, 0)); setError(null); }

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

  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  return (
    <div className="app-shell">
      <SEO title={link?.title || "Agendamento online"} description={link?.description || `Agende sua consulta com a ${CLINIC_NAME}`} />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 px-4 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {/* Topbar */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
            </Link>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-3 w-3 text-amber-500" /> {CLINIC_NAME}
            </div>
          </div>

          {done ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 sm:p-12 text-center">
              <div className="grid place-items-center mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 mb-6 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-11 w-11 text-emerald-600" strokeWidth={2.2} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Agendamento solicitado!</h2>
              <p className="text-slate-500 mt-3 text-[15px] max-w-md mx-auto leading-relaxed">
                Em instantes a equipe entra em contato pelo WhatsApp para confirmar sua consulta.
              </p>
              <div className="mt-6 inline-flex flex-col sm:flex-row gap-3">
                <Link to="/"><Button variant="outline" className="rounded-xl">Voltar ao site</Button></Link>
              </div>
            </div>
          ) : (
            <>
              {/* Header + progresso */}
              <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{link?.title || "Agendamento"}</h1>
                {link?.description && <p className="mt-1.5 text-sm text-slate-500 max-w-xl">{link.description}</p>}
              </header>

              {/* Stepper */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const active = i === stepIdx;
                    const done = i < stepIdx;
                    return (
                      <div key={s.key} className="flex flex-col items-center flex-1">
                        <div className={cn(
                          "h-9 w-9 sm:h-10 sm:w-10 rounded-full grid place-items-center transition-all duration-300",
                          done ? "bg-emerald-500 text-white shadow-[0_2px_8px_-2px_rgba(16,185,129,0.5)]" :
                          active ? "bg-slate-900 text-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.45)] scale-110" :
                          "bg-white border border-slate-200 text-slate-400"
                        )}>
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                        </div>
                        <p className={cn(
                          "text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mt-2 hidden sm:block transition-colors",
                          (active || done) ? "text-slate-900" : "text-slate-400"
                        )}>
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Conteúdo da etapa */}
              <div className="bg-white rounded-3xl border-2 border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15),0_2px_8px_-2px_rgba(15,23,42,0.06)] overflow-hidden">
                <div key={step} className="step-enter p-6 sm:p-8 min-h-[420px]">
                  {step === "treatment" && (
                    <StepTreatment value={treatment} onChange={setTreatment} />
                  )}
                  {step === "professional" && (
                    <StepProfessional value={professional} onChange={setProfessional} dbPros={dbPros} />
                  )}
                  {step === "datetime" && (
                    <StepDateTime date={date} setDate={setDate} time={time} setTime={setTime} takenTimes={takenTimes} />
                  )}
                  {step === "details" && (
                    <StepDetails
                      form={form} setForm={setForm}
                      summary={{ treatment, professional, date, time }}
                      error={error}
                    />
                  )}
                </div>

                {/* Footer com navegação */}
                <div className="border-t border-slate-100 bg-slate-50/40 px-6 sm:px-8 py-4 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    onClick={back}
                    disabled={stepIdx === 0}
                    className="text-slate-600 hover:text-slate-900 rounded-xl h-11"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
                  </Button>
                  {stepIdx < STEPS.length - 1 ? (
                    <Button
                      onClick={next}
                      disabled={!canAdvance()}
                      className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl h-11 px-6 font-semibold shadow-[0_2px_8px_-2px_rgba(15,23,42,0.3)]"
                    >
                      Continuar <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={submit}
                      disabled={submitting || !canAdvance()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl h-11 px-6 font-semibold shadow-[0_2px_8px_-2px_rgba(16,185,129,0.4)]"
                    >
                      {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agendando…</> : <>Confirmar agendamento <Check className="h-4 w-4 ml-1.5" /></>}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400 mt-5 font-medium">
                A equipe entrará em contato pelo WhatsApp para confirmar.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ───────── Steps ───────── */

function StepTreatment({ value, onChange }: any) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Qual tratamento você procura?</h2>
      <p className="text-sm text-slate-500 mt-1.5">Escolha a opção que mais se aproxima da sua necessidade.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {TREATMENTS.map((t) => {
          const selected = value === t.name;
          return (
            <button
              key={t.slug}
              onClick={() => onChange(t.name)}
              className={cn(
                "text-left p-4 rounded-2xl border-2 transition-all duration-200",
                selected
                  ? "border-slate-900 bg-slate-50 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.2)]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-[15px]">{t.name}</p>
                  {t.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>}
                </div>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 grid place-items-center flex-shrink-0 transition-all",
                  selected ? "border-slate-900 bg-slate-900" : "border-slate-300"
                )}>
                  {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepProfessional({ value, onChange, dbPros }: any) {
  // Mescla profissionais do DB (com fotos) com fallback do data/clinic
  const list: { slug: string; name: string; specialty?: string | null; photo_url?: string | null }[] =
    (dbPros && dbPros.length > 0)
      ? dbPros
      : DENTISTS.map((d: any) => ({ slug: d.slug, name: d.name, specialty: d.specialty, photo_url: null }));

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Escolha seu profissional</h2>
      <p className="text-sm text-slate-500 mt-1.5">Selecione com quem você gostaria de ser atendido.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {list.map((d) => {
          const selected = value === d.name;
          const initials = d.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
          return (
            <button
              key={d.slug}
              onClick={() => onChange(d.name)}
              className={cn(
                "flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all duration-200",
                selected
                  ? "border-slate-900 bg-slate-50 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.22)]"
                  : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 hover:shadow-[0_2px_10px_-4px_rgba(15,23,42,0.10)]"
              )}
            >
              {d.photo_url ? (
                <img
                  src={d.photo_url}
                  alt={d.name}
                  className="h-14 w-14 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="h-14 w-14 rounded-full grid place-items-center text-white font-semibold text-base flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 ring-2 ring-white shadow-sm">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-[15px] truncate">{d.name}</p>
                {d.specialty && <p className="text-xs text-slate-500 mt-0.5 truncate">{d.specialty}</p>}
              </div>
              <div className={cn(
                "h-5 w-5 rounded-full border-2 grid place-items-center flex-shrink-0",
                selected ? "border-slate-900 bg-slate-900" : "border-slate-300"
              )}>
                {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDateTime({ date, setDate, time, setTime, takenTimes }: any) {
  const morning = HOURS.filter((h) => parseInt(h.slice(0, 2), 10) < 12);
  const afternoon = HOURS.filter((h) => { const x = parseInt(h.slice(0, 2), 10); return x >= 12 && x < 18; });
  const evening = HOURS.filter((h) => parseInt(h.slice(0, 2), 10) >= 18);

  const slotBtn = (h: string) => {
    const taken = takenTimes.has(h);
    const selected = time === h;
    return (
      <button
        key={h} type="button" disabled={taken} onClick={() => setTime(h)}
        className={cn(
          "text-xs rounded-lg py-2.5 font-semibold transition-all tabular-nums border",
          taken ? "bg-slate-50 border-slate-200/70 text-slate-300 cursor-not-allowed line-through" :
          selected ? "bg-slate-900 text-white border-slate-900 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.45)] scale-[1.04]" :
          "bg-white border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-blue-50/40 hover:text-blue-700"
        )}
      >{h}</button>
    );
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Quando você quer ser atendido?</h2>
      <p className="text-sm text-slate-500 mt-1.5">Escolha o melhor dia e horário para você.</p>

      <div className="mt-6 grid lg:grid-cols-[auto_1fr] gap-5">
        {/* Calendário em surface elevada */}
        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 mx-auto lg:mx-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_-4px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-700 flex items-center gap-1.5">
              <CalIcon className="h-3.5 w-3.5 text-blue-600" /> Data
            </p>
            <p className="text-[11px] text-slate-500 font-medium capitalize">
              {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </p>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            disabled={(d) => d < new Date(new Date().toDateString())}
            locale={ptBR}
            className="pointer-events-auto"
          />
        </div>

        {/* Horários agrupados por turno */}
        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50/60 to-white p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_-4px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" /> Horários
            </p>
            {time && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                {time} selecionado
              </span>
            )}
          </div>

          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 -mr-1">
            {morning.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-2">Manhã</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">{morning.map(slotBtn)}</div>
              </div>
            )}
            {afternoon.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-2">Tarde</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">{afternoon.map(slotBtn)}</div>
              </div>
            )}
            {evening.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-2">Noite</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">{evening.map(slotBtn)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDetails({ form, setForm, summary, error }: any) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Seus dados</h2>
      <p className="text-sm text-slate-500 mt-1.5">Para confirmarmos sua consulta pelo WhatsApp.</p>

      <div className="mt-6 grid gap-4">
        <div>
          <Label className="text-[12px] font-semibold text-slate-700">Nome completo *</Label>
          <Input
            className="mt-1.5 h-12 bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-[15px] shadow-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Como devemos te chamar?"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-[12px] font-semibold text-slate-700">WhatsApp *</Label>
            <Input
              className="mt-1.5 h-12 bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-[15px] shadow-sm"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-slate-700">E-mail</Label>
            <Input
              className="mt-1.5 h-12 bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-[15px] shadow-sm"
              type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label className="text-[12px] font-semibold text-slate-700">Observação</Label>
          <Textarea
            className="mt-1.5 bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none rounded-xl text-[15px] shadow-sm"
            rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Algo que devemos saber? (opcional)"
          />
        </div>

        {/* Resumo */}
        <div className="mt-2 rounded-2xl bg-gradient-to-br from-blue-50/70 to-blue-50/30 border border-blue-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-blue-700 font-bold mb-3">Resumo do agendamento</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Tratamento</dt><dd className="text-slate-900 font-semibold text-right">{summary.treatment}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Profissional</dt><dd className="text-slate-900 font-semibold text-right">{summary.professional}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Data</dt><dd className="text-slate-900 font-semibold text-right capitalize">{summary.date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Horário</dt><dd className="text-slate-900 font-semibold tabular-nums">{summary.time || "—"}</dd></div>
          </dl>
        </div>

        {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
      </div>
    </div>
  );
}
