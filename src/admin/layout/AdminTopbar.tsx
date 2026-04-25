import { useLocation, Link, useNavigate } from "react-router-dom";
import { Bell, Menu, Search, ChevronDown, Mail, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminSession, adminSignOut } from "@/admin/hooks/useAdminSession";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { useAdminTheme } from "@/admin/hooks/useAdminTheme";
import { NAV_ITEMS } from "./AdminSidebar";
import { useState } from "react";
import ConfirmDialog from "@/admin/components/ConfirmDialog";

export default function AdminTopbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAdminSession();
  const { data: appts = [] } = useAppointments();
  const { theme, toggle: toggleTheme } = useAdminTheme();
  const [q, setQ] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);

  const pending = appts.filter((a) => a.status === "pending").slice(0, 6);
  const current = NAV_ITEMS.find((i) => location.pathname.startsWith(i.to));
  const initials = (user?.email ?? "AD").slice(0, 2).toUpperCase();

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/admin/pacientes?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="admin-topbar sticky top-0 z-30 border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-card))]/85 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--admin-card))]/70">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar} aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden lg:flex items-center gap-2 text-[13px] text-[hsl(var(--admin-text-muted))]">
          <Link to="/admin/dashboard" className="hover:text-foreground">Painel</Link>
          {current && (
            <>
              <span className="opacity-40">/</span>
              <span className="text-[hsl(var(--admin-text))] font-medium">{current.label}</span>
            </>
          )}
        </div>

        <form onSubmit={onSearchSubmit} className="ml-auto flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente, agendamento, lead…"
              className="h-10 pl-9 bg-white border-[hsl(var(--admin-border))] rounded-full shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 md:ml-2 ml-auto">
          {/* Toggle Tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            className="relative rounded-full h-10 w-10 hover:bg-muted/80 overflow-hidden"
          >
            <Sun className={`h-[18px] w-[18px] absolute transition-all duration-500 ${theme === "dark" ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
            <Moon className={`h-[18px] w-[18px] absolute transition-all duration-500 ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} />
          </Button>

          {/* Notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 hover:bg-muted/80">
                <Bell className="h-[18px] w-[18px]" />
                {pending.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                    {pending.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="font-semibold text-sm">Notificações</p>
                {pending.length > 0 && <Badge variant="secondary">{pending.length} novas</Badge>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pending.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Mail className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  pending.map((a) => (
                    <Link to="/admin/agenda" key={a.id} className="block px-4 py-3 border-b last:border-0 hover:bg-muted/40">
                      <p className="text-sm font-medium">Novo agendamento — {a.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.treatment} · {new Date(a.appointment_date).toLocaleDateString("pt-BR")} às {a.appointment_time}
                      </p>
                    </Link>
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
              <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted/80 transition">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(215_85%_55%)] to-[hsl(215_85%_35%)] text-white text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left leading-tight pr-1">
                  <p className="text-[13px] font-semibold">Administrador</p>
                  <p className="text-[11px] text-muted-foreground max-w-[140px] truncate">{user?.email}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <div className="p-1">
                <Link to="/admin/configuracoes" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">Preferências</Link>
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive"
                  onClick={() => setLogoutOpen(true)}
                >
                  <LogOut className="h-4 w-4" /> Sair da conta
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Tem certeza que deseja sair?"
        description="Você será desconectado da sua conta de administrador e precisará entrar novamente para acessar o painel."
        confirmLabel="Sim, sair"
        cancelLabel="Cancelar"
        destructive
        onConfirm={async () => {
          await adminSignOut();
          window.location.assign("/admin/login");
        }}
      />
    </header>
  );
}
