import { useLocation, Link } from "react-router-dom";
import { Bell, Menu, ChevronRight, Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminSession, adminSignOut } from "@/admin/hooks/useAdminSession";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { NAV_ITEMS } from "./AdminSidebar";

export default function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const location = useLocation();
  const { user } = useAdminSession();
  const { data: appts = [] } = useAppointments();

  // Notificações = agendamentos pendentes (status pending) recentes
  const pending = appts.filter((a) => a.status === "pending").slice(0, 6);

  // Breadcrumb
  const current = NAV_ITEMS.find((i) => location.pathname.startsWith(i.to));
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/65">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar} aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
          <Link to="/admin/dashboard" className="hover:text-foreground">Painel</Link>
          {current && (
            <>
              <ChevronRight className="h-4 w-4 mx-1.5 opacity-60" />
              <span className="text-foreground font-medium">{current.label}</span>
            </>
          )}
        </nav>

        {/* Search (visual) */}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente, agendamento…" className="pl-9 w-72 bg-muted/50 border-transparent focus-visible:bg-background" />
          </div>

          {/* Notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {pending.length > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="font-medium text-sm">Notificações</p>
                {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pending.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Mail className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  pending.map((a) => (
                    <div key={a.id} className="px-4 py-3 border-b last:border-0 hover:bg-muted/40">
                      <p className="text-sm font-medium">Novo agendamento — {a.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.treatment} · {new Date(a.appointment_date).toLocaleDateString("pt-BR")} às {a.appointment_time}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t text-xs">
                <Link to="/admin/agenda" className="text-primary hover:underline">Ver agenda completa →</Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Avatar */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-muted/60 transition">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">{user?.email}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <div className="p-2">
                <Link to="/admin/configuracoes" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">Preferências</Link>
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted text-destructive"
                  onClick={() => adminSignOut().then(() => window.location.assign("/admin/login"))}
                >
                  Sair da conta
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
