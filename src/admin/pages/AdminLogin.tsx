import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
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
      <div className="admin-shell relative min-h-screen overflow-hidden bg-[hsl(var(--admin-bg))]">
        {/* Soft gradient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-[hsl(215_85%_60%/0.18)] blur-[100px]" />
          <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-[hsl(215_85%_45%/0.15)] blur-[120px]" />
          <div className="absolute inset-0 admin-soft-grid opacity-50" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
          {/* Logo top */}
          <div className="mb-8 flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[hsl(215_85%_55%)] to-[hsl(215_85%_35%)] shadow-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21V8M5 8a7 7 0 0 1 14 0M5 8c0 4 3 6 3 8M19 8c0 4-3 6-3 8" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight">Clínica Levii</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Painel admin</p>
            </div>
          </div>

          {/* Card */}
          <div className="w-full max-w-[440px] rounded-2xl border border-[hsl(var(--admin-border))] bg-white/95 p-6 sm:p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)] backdrop-blur animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Acesse o painel</h1>
              <p className="mt-1 text-sm text-muted-foreground">Gerencie sua clínica em um só lugar.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-12 bg-white"
                    placeholder="voce@clinicalevii.com.br"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPwd ? "text" : "password"} autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-12 bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button
                type="submit" disabled={loading}
                className="group w-full h-12 text-sm font-semibold bg-gradient-to-b from-[hsl(215_80%_44%)] to-[hsl(215_80%_34%)] hover:from-[hsl(215_80%_48%)] hover:to-[hsl(215_80%_36%)] shadow-md shadow-[hsl(215_80%_30%/0.25)]"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando…</>
                ) : (
                  <>Entrar no painel <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" /></>
                )}
              </Button>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">acesso restrito</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-bg))] p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p>Não há cadastro público. Solicite acesso à coordenação da Clínica Levii.</p>
              </div>

              {showBootstrap && (
                <button
                  type="button"
                  onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("admin-bootstrap");
                    if (error || data?.error) {
                      toast({ title: "Bootstrap indisponível", description: error?.message || data?.error, variant: "destructive" });
                      return;
                    }
                    toast({ title: "Acesso pronto", description: "Use o e-mail e a senha cadastrados nos secrets para entrar." });
                  }}
                  className="block mx-auto text-[11px] text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Inicializar conta admin
                </button>
              )}
            </form>
          </div>

          <p className="mt-8 text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Clínica Levii · Aracruz/ES · v1.0
          </p>
        </div>
      </div>
    </>
  );
}
