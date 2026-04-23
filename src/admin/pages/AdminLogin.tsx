import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ShieldCheck, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

const FEATURES = [
  { Icon: ShieldCheck, title: "Acesso seguro", desc: "Autenticação criptografada e RLS no banco." },
  { Icon: Activity, title: "Dados em tempo real", desc: "Agendamentos, leads e métricas ao vivo." },
  { Icon: Sparkles, title: "Integrações nativas", desc: "WhatsApp, Clinicorp e API própria." },
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";
  const showBootstrap = params.get("bootstrap") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível entrar", description: "Verifique e-mail e senha.", variant: "destructive" });
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <>
      <SEO title="Painel Levii — Acesso restrito" description="Acesso ao painel administrativo da Clínica Levii." />
      <div className="admin-shell min-h-screen w-full bg-[hsl(var(--admin-bg))] grid lg:grid-cols-[1.05fr_1fr]">
        {/* ---------- LADO ESQUERDO (lg+) ---------- */}
        <aside className="hidden lg:flex relative overflow-hidden bg-[hsl(222_32%_8%)] text-white">
          {/* Mesh + grid + animação */}
          <div className="absolute inset-0 admin-mesh admin-pan" aria-hidden />
          <div className="absolute inset-0 opacity-30" aria-hidden style={{
            backgroundImage: "linear-gradient(hsl(220 30% 100% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(220 30% 100% / 0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full blur-[110px] bg-[hsl(215_85%_55%/0.28)]" aria-hidden />
          <div className="absolute -bottom-40 -right-24 h-[560px] w-[560px] rounded-full blur-[130px] bg-[hsl(215_80%_40%/0.30)]" aria-hidden />

          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
            {/* Logo top */}
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[hsl(215_85%_60%)] to-[hsl(215_85%_38%)] shadow-[0_10px_30px_-10px_hsl(215_85%_50%/0.6)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21V8M5 8a7 7 0 0 1 14 0M5 8c0 4 3 6 3 8M19 8c0 4-3 6-3 8" />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-[16px] font-semibold tracking-tight">Clínica Levii</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Plataforma de gestão</p>
              </div>
            </div>

            {/* Mensagem central */}
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur ring-1 ring-white/10">
                Painel administrativo
              </span>
              <h1 className="mt-5 text-[40px] xl:text-[44px] leading-[1.05] font-semibold tracking-[-0.02em]">
                Toda a clínica em uma só plataforma.
              </h1>
              <p className="mt-4 text-white/70 text-[15px] leading-relaxed max-w-md">
                Agenda, financeiro, leads, avaliações e integrações trabalhando juntos para a equipe Levii.
              </p>

              <ul className="mt-10 space-y-4">
                {FEATURES.map(({ Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.08] ring-1 ring-white/10">
                      <Icon className="h-4 w-4 text-[hsl(215_85%_70%)]" />
                    </span>
                    <div>
                      <p className="text-[14px] font-medium">{title}</p>
                      <p className="text-[12.5px] text-white/55 mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <p className="text-[11px] text-white/40">
              © {new Date().getFullYear()} Clínica Levii · Aracruz/ES · v1.0
            </p>
          </div>
        </aside>

        {/* ---------- LADO DIREITO ---------- */}
        <section className="relative flex items-center justify-center px-5 sm:px-8 py-10 sm:py-16">
          {/* Logo mobile */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[hsl(215_85%_55%)] to-[hsl(215_85%_35%)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21V8M5 8a7 7 0 0 1 14 0M5 8c0 4 3 6 3 8M19 8c0 4-3 6-3 8" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold tracking-tight">Clínica Levii</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Painel</span>
          </div>

          <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-7">
              <h2 className="text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[hsl(var(--admin-text))]">Bem-vindo de volta</h2>
              <p className="mt-1.5 text-[14px] text-[hsl(var(--admin-text-muted))]">Acesse o painel da Clínica Levii.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-semibold text-[hsl(var(--admin-text))]">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white text-[14px]"
                    placeholder="voce@clinicalevii.com.br"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] font-semibold text-[hsl(var(--admin-text))]">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPwd ? "text" : "password"} autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-12 bg-white text-[14px]"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button
                type="submit" disabled={loading}
                className="group w-full h-12 mt-1 text-[14px] font-semibold bg-gradient-to-b from-[hsl(215_82%_46%)] to-[hsl(215_82%_34%)] hover:from-[hsl(215_82%_50%)] hover:to-[hsl(215_82%_36%)] shadow-[0_10px_24px_-12px_hsl(215_85%_30%/0.55)]"
              >
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando…</>) : (<>Entrar no painel <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" /></>)}
              </Button>

              <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p>Acesso restrito à equipe. Solicite acesso à coordenação.</p>
              </div>

              {showBootstrap && (
                <button type="button"
                  onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("admin-bootstrap");
                    if (error || data?.error) { toast({ title: "Bootstrap indisponível", description: error?.message || data?.error, variant: "destructive" }); return; }
                    toast({ title: "Acesso pronto", description: "Use o e-mail e senha cadastrados nos secrets." });
                  }}
                  className="block mx-auto text-[11px] text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
                  Inicializar conta admin
                </button>
              )}
            </form>

            <p className="mt-8 text-center text-[11px] text-muted-foreground lg:hidden">
              © {new Date().getFullYear()} Clínica Levii · Aracruz/ES
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
