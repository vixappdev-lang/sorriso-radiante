import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAdminSession, adminSignOut } from "@/admin/hooks/useAdminSession";
import { Button } from "@/components/ui/button";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, session, isAdmin } = useAdminSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando painel…
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl mb-2">Sem permissão</h1>
          <p className="text-muted-foreground mb-6">
            Sua conta não possui acesso de administrador. Solicite à equipe da Clínica Levii.
          </p>
          <Button onClick={() => adminSignOut().then(() => window.location.assign("/admin/login"))}>
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
