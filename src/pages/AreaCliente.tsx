import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, LogOut, User as UserIcon, Clock, CheckCircle2, FileText, Home as HomeIcon,
  CreditCard, ChevronRight, Loader2, ShieldCheck, Eye, EyeOff, Receipt, Phone, Mail, MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

const BRAND = "Clínica Levii";

type Section = "home" | "appointments" | "history" | "invoices" | "profile";

export default function AreaCliente() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({
    enabled: true, allow_self_registration: false, welcome_title: "Sua área exclusiva",
    welcome_text: "Acompanhe consultas, faturas e mantenha seus dados em um só lugar.",
    portal_color: "#1e3a8a", show_appointments: true, show_history: true, allow_booking: true,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    supabase.from("clinic_settings").select("value").eq("key", "client_area").maybeSingle()
      .then(({ data }) => { if (data?.value) setConfig((c: any) => ({ ...c, ...(data.value as any) })); });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );

  if (!config.enabled) {
    return (
      <div className="min-h-screen grid place-items-center bg-white px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 grid place-items-center mb-4">
            <ShieldCheck className="h-6 w-6 text-slate-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Portal indisponível</h1>
          <p className="text-sm text-slate-500 mt-2">A área do cliente ainda não foi ativada pela clínica.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SEO title={`Área do Cliente — ${BRAND}`} description="Acesse seus agendamentos, faturas e histórico." />
      {session ? <ClientApp session={session} config={config} /> : <LoginScreen config={config} />}
    </div>
  );
}

/* ───────────────────────── LOGIN ───────────────────────── */

function LoginScreen({ config }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Não foi possível entrar", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-slate-50">
      {/* Painel lateral (desktop) */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(140deg, ${config.portal_color}, ${shade(config.portal_color, -25)})` }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 25% 20%, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <div className="absolute -top-32 -left-20 h-[400px] w-[400px] rounded-full blur-[120px]" style={{ background: shade(config.portal_color, 20) + "60" }} />
        <div className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full blur-[140px]" style={{ background: shade(config.portal_color, -40) + "50" }} />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">{BRAND}</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight">{config.welcome_title}</h1>
          <p className="mt-4 text-white/75 max-w-md leading-relaxed">{config.welcome_text}</p>
          <ul className="mt-10 space-y-3 text-sm text-white/80">
            {[
              "Suas consultas em tempo real",
              "Histórico completo de tratamentos",
              "Faturas e pagamentos organizados",
              "Agendamento direto pelo portal",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-white/60" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} {BRAND}</p>
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center px-6 py-10 sm:py-16 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Brand mobile */}
          <div className="lg:hidden text-center mb-10">
            <div className="mx-auto h-14 w-14 rounded-2xl grid place-items-center text-white shadow-lg mb-4"
                 style={{ background: `linear-gradient(140deg, ${config.portal_color}, ${shade(config.portal_color, -25)})` }}>
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{BRAND}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 tracking-tight">Área do Cliente</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-sm text-slate-500 mt-1">Entre com seus dados de acesso.</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] p-6 sm:p-7">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label className="text-[12px] font-semibold text-slate-700">E-mail</Label>
                <Input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="seuemail@exemplo.com"
                  className="mt-1.5 h-11 bg-slate-50/60 border-2 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-[12px] font-semibold text-slate-700">Senha</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    placeholder="••••••••"
                    className="h-11 bg-slate-50/60 border-2 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-10 rounded-xl"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit" disabled={busy}
                className="w-full h-11 text-[15px] font-semibold shadow-md hover:shadow-lg transition-shadow rounded-xl"
                style={{ background: config.portal_color }}
              >
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando…</> : "Entrar na minha área"}
              </Button>
            </form>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200/70 p-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-[11px] text-slate-600 leading-relaxed">Seus dados são protegidos com criptografia de ponta a ponta.</p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Acesso exclusivo para pacientes cadastrados. <br />
            Solicite seu acesso à recepção da clínica.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ───────────────────────── APP (logado) ───────────────────────── */

function ClientApp({ session, config }: any) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [section, setSection] = useState<Section>("home");
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    supabase.from("patient_accounts").select("*").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [session.user.id]);

  useEffect(() => {
    if (!profile?.phone) return;
    supabase.from("appointments").select("*").eq("phone", profile.phone)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => setAppts(data ?? []));
    supabase.from("patient_invoices").select("*").eq("patient_phone", profile.phone)
      .order("created_at", { ascending: false })
      .then(({ data }) => setInvoices(data ?? []));
  }, [profile?.phone]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(() => appts.filter((a) => a.appointment_date >= today), [appts, today]);
  const past = useMemo(() => appts.filter((a) => a.appointment_date < today), [appts, today]);
  const openInvoices = useMemo(() => invoices.filter((i) => i.status !== "paid"), [invoices]);

  async function logout() {
    await supabase.auth.signOut();
    setLogoutOpen(false);
    navigate("/area-cliente");
  }

  const NAV: { id: Section; label: string; icon: any; count?: number; show?: boolean }[] = [
    { id: "home", label: "Início", icon: HomeIcon, show: true },
    { id: "appointments", label: "Consultas", icon: Calendar, count: upcoming.length, show: config.show_appointments !== false },
    { id: "history", label: "Histórico", icon: Clock, count: past.length, show: config.show_history !== false },
    { id: "invoices", label: "Faturas", icon: Receipt, count: openInvoices.length, show: true },
    { id: "profile", label: "Meu perfil", icon: UserIcon, show: true },
  ];

  const initials = (profile?.full_name || session.user.email || "P").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  const Sidebar = (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center text-white text-sm font-semibold shadow-sm"
               style={{ background: `linear-gradient(140deg, ${config.portal_color}, ${shade(config.portal_color, -25)})` }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Bem-vindo</p>
            <p className="font-semibold text-slate-900 text-sm truncate">{profile?.full_name ?? "Paciente"}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.filter((n) => n.show !== false).map((n) => {
          const active = section === n.id;
          const Icon = n.icon;
          return (
            <button
              key={n.id} onClick={() => setSection(n.id)}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{n.label}</span>
              {!!n.count && (
                <span className={cn("text-[11px] tabular-nums px-2 py-0.5 rounded-full",
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                )}>{n.count}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <button onClick={() => setLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-shrink-0">{Sidebar}</aside>

      {/* Mobile topbar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg grid place-items-center text-white text-xs font-semibold"
                 style={{ background: config.portal_color }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">Olá,</p>
              <p className="font-semibold text-slate-900 text-sm truncate">{profile?.full_name?.split(" ")[0] ?? "Paciente"}</p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-lg">Menu</Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-72">{Sidebar}</SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-24 lg:pb-10 max-w-5xl w-full mx-auto">
          {section === "home" && <HomeView config={config} profile={profile} upcoming={upcoming} openInvoices={openInvoices} setSection={setSection} navigate={navigate} bookingSlug={config.booking_slug || "geral"} />}
          {section === "appointments" && <AppointmentsView items={upcoming} title="Próximas consultas" empty="Você não tem consultas agendadas." canBook={config.allow_booking !== false} bookingSlug={config.booking_slug || "geral"} navigate={navigate} portalColor={config.portal_color} />}
          {section === "history" && <AppointmentsView items={past} title="Histórico" empty="Sem consultas concluídas ainda." />}
          {section === "invoices" && <InvoicesView items={invoices} />}
          {section === "profile" && <ProfileView profile={profile} session={session} />}
        </main>

        {/* Mobile bottom nav (Apple-like) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.12)]">
          <div className="grid grid-cols-5 gap-1">
            {NAV.filter((n) => n.show !== false).map((n) => {
              const active = section === n.id;
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 rounded-xl transition relative",
                    active ? "text-slate-900" : "text-slate-400"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} strokeWidth={active ? 2.4 : 2} />
                    {!!n.count && n.count > 0 && (
                      <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">
                        {n.count > 9 ? "9+" : n.count}
                      </span>
                    )}
                  </div>
                  <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>{n.label}</span>
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-slate-900" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Modal logout */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 grid place-items-center mb-4">
              <LogOut className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-center text-lg font-semibold text-slate-900">Tem certeza que deseja sair?</h3>
            <p className="text-center text-sm text-slate-500 mt-2">Você será desconectado da sua área exclusiva.</p>
            <div className="grid grid-cols-2 gap-2 mt-6">
              <Button variant="outline" onClick={() => setLogoutOpen(false)}>Cancelar</Button>
              <Button onClick={logout} className="bg-rose-600 hover:bg-rose-700">Sim, sair</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── VIEWS ───────────────────────── */

function HomeView({ config, profile, upcoming, openInvoices, setSection, navigate, bookingSlug }: any) {
  const next = upcoming[0];
  const totalDue = openInvoices.reduce((s: number, i: any) => s + (i.amount_cents || 0), 0);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden"
           style={{ background: `linear-gradient(135deg, ${config.portal_color}, ${shade(config.portal_color, -25)})` }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">{BRAND}</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Olá, {profile?.full_name?.split(" ")[0] ?? "paciente"}</h2>
          <p className="mt-2 text-white/80 max-w-lg text-sm sm:text-base leading-relaxed">{config.welcome_text}</p>
          {config.allow_booking !== false && (
            <Button onClick={() => navigate(`/agendar/${bookingSlug}`)} className="mt-5 bg-white text-slate-900 hover:bg-white/90 shadow-sm">
              <Calendar className="h-4 w-4 mr-2" /> Agendar consulta
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Próxima consulta" value={next ? new Date(next.appointment_date).toLocaleDateString("pt-BR") : "—"}
          hint={next ? `${next.appointment_time} · ${next.treatment}` : "Nenhuma agendada"} icon={Calendar} onClick={() => setSection("appointments")} />
        <SummaryCard label="Faturas em aberto" value={openInvoices.length}
          hint={openInvoices.length > 0 ? `R$ ${(totalDue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Nenhuma pendente"} icon={Receipt} onClick={() => setSection("invoices")} accent="amber" />
        <SummaryCard label="Meu cadastro" value="Ver dados" hint={profile?.email ?? ""} icon={UserIcon} onClick={() => setSection("profile")} />
      </div>

      {next && (
        <section className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_-6px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Próxima consulta</h3>
            <Badge variant="outline" className="capitalize">{next.status}</Badge>
          </div>
          <ApptRow a={next} />
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value, hint, icon: Icon, onClick, accent = "blue" }: any) {
  const colors: any = {
    blue: "from-blue-50 to-white text-blue-600 ring-blue-100",
    amber: "from-amber-50 to-white text-amber-600 ring-amber-100",
  };
  return (
    <button onClick={onClick} className="text-left bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_-6px_rgba(15,23,42,0.08)] transition group">
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br ring-4", colors[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 mt-1.5" />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1 truncate">{hint}</p>}
    </button>
  );
}

function AppointmentsView({ items, title, empty, canBook, bookingSlug, navigate, portalColor }: any) {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
        {canBook && (
          <Button onClick={() => navigate(`/agendar/${bookingSlug}`)} size="sm" style={{ background: portalColor }}>
            <Calendar className="h-4 w-4 mr-2" /> Agendar
          </Button>
        )}
      </header>
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{empty}</p>
        </div>
      ) : (
        <div className="space-y-3">{items.map((a: any) => <div key={a.id} className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.16)] hover:border-slate-300 transition"><ApptRow a={a} /></div>)}</div>
      )}
    </div>
  );
}

function ApptRow({ a }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 grid place-items-center flex-shrink-0">
        <Calendar className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{a.treatment}</p>
        <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(a.appointment_date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · {a.appointment_time}</span>
          {a.professional && <span>· {a.professional}</span>}
        </p>
      </div>
      <Badge variant="outline" className="capitalize text-[10px]">{a.status}</Badge>
    </div>
  );
}

function InvoicesView({ items }: any) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Você não possui faturas no momento.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Faturas</h2>
      <div className="bg-white rounded-2xl border-2 border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_-6px_rgba(15,23,42,0.08)]">
        {items.map((i: any) => {
          const paid = i.status === "paid";
          return (
            <div key={i.id} className="p-5 flex items-center gap-4">
              <div className={cn("h-11 w-11 rounded-xl grid place-items-center flex-shrink-0",
                paid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{i.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {i.due_date && `Vence em ${new Date(i.due_date).toLocaleDateString("pt-BR")}`}
                  {paid && i.paid_at && ` · Paga em ${new Date(i.paid_at).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900 tabular-nums">R$ {(i.amount_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <Badge variant={paid ? "secondary" : "outline"} className={cn("mt-1", paid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-amber-700 border-amber-300")}>
                  {paid ? "Paga" : "Em aberto"}
                </Badge>
              </div>
              {!paid && i.payment_url && (
                <a href={i.payment_url} target="_blank" rel="noreferrer">
                  <Button size="sm">Pagar</Button>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileView({ profile, session }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Meu perfil</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="h-14 w-14 rounded-full bg-slate-900 text-white grid place-items-center text-base font-semibold">
            {(profile?.full_name || session.user.email).split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.full_name ?? "Paciente"}</p>
            <p className="text-xs text-slate-500">Cliente {BRAND}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
          <Field icon={Mail} label="E-mail" value={profile?.email ?? session.user.email} />
          <Field icon={Phone} label="Telefone" value={profile?.phone ?? "—"} />
          <Field icon={FileText} label="CPF" value={profile?.cpf ?? "—"} />
          <Field icon={Calendar} label="Nascimento" value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString("pt-BR") : "—"} />
          <Field icon={MapPin} label="Endereço" value={profile?.address?.street ?? "—"} />
        </dl>
        <p className="text-[11px] text-slate-400 mt-6">Para atualizar seus dados, entre em contato com a recepção da clínica.</p>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: any) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}

/* util: escurecer/clarear cor hex */
function shade(hex: string, percent: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * (percent / 100))));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * (percent / 100))));
  const b = Math.max(0, Math.min(255, (n & 0xff) + Math.round(255 * (percent / 100))));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
