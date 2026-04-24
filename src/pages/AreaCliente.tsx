import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, LogOut, User, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

export default function AreaCliente() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({ enabled: true, allow_self_registration: true, welcome_title: "Bem-vindo à sua área exclusiva", welcome_text: "", portal_color: "#1e40af", show_appointments: true, show_history: true, allow_booking: true });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    supabase.from("clinic_settings").select("value").eq("key", "client_area").maybeSingle()
      .then(({ data }) => { if (data?.value) setConfig({ ...config, ...(data.value as any) }); });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando…</div>;

  if (!config.enabled) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30 px-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Portal indisponível</h1>
          <p className="text-sm text-muted-foreground">A área do cliente ainda não foi ativada pela clínica.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="Área do Cliente — Clínica Levii" description="Acesse seus agendamentos e histórico de tratamentos" />
      {session ? <Dashboard session={session} config={config} /> : <AuthForm config={config} />}
    </>
  );
}

function AuthForm({ config }: any) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!config.allow_self_registration) throw new Error("Cadastro não disponível. Solicite acesso à clínica.");
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: `${window.location.origin}/area-cliente`, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("patient_accounts").insert({ user_id: data.user.id, full_name: name, email, phone });
          toast({ title: "Conta criada", description: config.require_email_verification ? "Verifique seu e-mail." : "Você já pode fazer login." });
        }
      }
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 text-white" style={{ background: `linear-gradient(135deg, ${config.portal_color}, ${config.portal_color}cc)` }}>
        <div>
          <h2 className="text-xs uppercase tracking-[0.22em] opacity-70">Clínica Levii</h2>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">{config.welcome_title}</h1>
          <p className="mt-4 max-w-md text-white/80">{config.welcome_text}</p>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} Clínica Levii</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold mb-1">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <p className="text-sm text-muted-foreground mb-6">{mode === "login" ? "Acesse sua área exclusiva." : "Cadastre-se para acompanhar seus tratamentos."}</p>
          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <>
                <div><Label className="text-xs">Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div><Label className="text-xs">Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
              </>
            )}
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label className="text-xs">Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            <Button type="submit" className="w-full" disabled={busy} style={{ background: config.portal_color }}>{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</Button>
          </form>
          {config.allow_self_registration && (
            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-4 text-xs text-muted-foreground hover:text-foreground w-full text-center">
              {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

function Dashboard({ session, config }: any) {
  const navigate = useNavigate();
  const [appts, setAppts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.from("patient_accounts").select("*").eq("user_id", session.user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [session.user.id]);

  useEffect(() => {
    if (!profile?.phone) return;
    supabase.from("appointments").select("*").eq("phone", profile.phone).order("appointment_date", { ascending: false })
      .then(({ data }) => setAppts(data ?? []));
  }, [profile?.phone]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appts.filter((a) => a.appointment_date >= today);
  const past = appts.filter((a) => a.appointment_date < today);

  async function logout() { await supabase.auth.signOut(); navigate("/area-cliente"); }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Olá,</p>
            <h1 className="text-lg font-semibold">{profile?.full_name ?? session.user.email}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sair</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card className="p-6" style={{ borderTop: `4px solid ${config.portal_color}` }}>
          <h2 className="text-xl font-semibold">{config.welcome_title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{config.welcome_text}</p>
          {config.allow_booking && (
            <Button className="mt-4" style={{ background: config.portal_color }} onClick={() => navigate("/agendar/geral")}>
              <Calendar className="h-4 w-4 mr-2" />Agendar nova consulta
            </Button>
          )}
        </Card>

        <Tabs defaultValue="upcoming">
          <TabsList>
            {config.show_appointments && <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>}
            {config.show_history && <TabsTrigger value="history">Histórico ({past.length})</TabsTrigger>}
            <TabsTrigger value="profile">Meu perfil</TabsTrigger>
          </TabsList>

          {config.show_appointments && (
            <TabsContent value="upcoming" className="mt-4 space-y-3">
              {upcoming.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground"><Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhuma consulta agendada.</p></Card>
              ) : upcoming.map((a) => <ApptCard key={a.id} a={a} />)}
            </TabsContent>
          )}

          {config.show_history && (
            <TabsContent value="history" className="mt-4 space-y-3">
              {past.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground"><CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhuma consulta no histórico.</p></Card>
              ) : past.map((a) => <ApptCard key={a.id} a={a} />)}
            </TabsContent>
          )}

          <TabsContent value="profile" className="mt-4">
            <Card className="p-6 space-y-3">
              <div className="flex items-center gap-3 mb-2"><User className="h-5 w-5 text-muted-foreground" /><h3 className="font-semibold">Meus dados</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> {profile?.full_name ?? "—"}</div>
                <div><span className="text-muted-foreground">E-mail:</span> {profile?.email ?? session.user.email}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {profile?.phone ?? "—"}</div>
                <div><span className="text-muted-foreground">CPF:</span> {profile?.cpf ?? "—"}</div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ApptCard({ a }: any) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{a.treatment}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Clock className="h-3 w-3" />{new Date(a.appointment_date).toLocaleDateString("pt-BR")} · {a.appointment_time}
          {a.professional && <> · {a.professional}</>}
        </p>
      </div>
      <Badge variant="outline">{a.status}</Badge>
    </Card>
  );
}
