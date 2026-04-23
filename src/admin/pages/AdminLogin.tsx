import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LoginAside from "@/admin/components/LoginAside";
import SEO from "@/components/SEO";

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";

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
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
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
      <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
        {/* ASIDE — desktop à esquerda, faixa superior em mobile */}
        <div className="hidden lg:block">
          <LoginAside />
        </div>
        <div className="lg:hidden h-44 sm:h-56">
          <LoginAside />
        </div>

        {/* FORM */}
        <div className="flex items-center justify-center px-6 sm:px-10 py-10 sm:py-16 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary mb-2">Bem-vindo de volta</p>
              <h2 className="font-display text-3xl sm:text-4xl tracking-tight">Acesse seu painel</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Use suas credenciais de administrador. O acesso é restrito à equipe interna.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    placeholder="voce@clinicalevii.com.br"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando…</>
                ) : (
                  "Entrar no painel"
                )}
              </Button>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">acesso restrito</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p>
                  Não há cadastro público. Se precisa de acesso, fale com a coordenação da Clínica Levii.
                </p>
              </div>
            </form>

            <p className="text-[11px] text-muted-foreground mt-8 text-center">
              © {new Date().getFullYear()} Clínica Levii · Aracruz/ES
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
