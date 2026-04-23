import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  UserCog,
  Wallet,
  Megaphone,
  MessageCircle,
  Star,
  Globe,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSignOut } from "@/admin/hooks/useAdminSession";
import { Button } from "@/components/ui/button";

export const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/agenda", label: "Agenda", icon: Calendar },
  { to: "/admin/pacientes", label: "Pacientes", icon: Users },
  { to: "/admin/tratamentos", label: "Tratamentos", icon: Stethoscope },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserCog },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/admin/leads", label: "Leads & Captação", icon: Megaphone },
  { to: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/site", label: "Site & Landing", icon: Globe },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <aside className="flex h-full w-full flex-col bg-[hsl(var(--surface-dark))] text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 grid place-items-center rounded-xl bg-white/10 border border-white/15">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-base leading-tight">Clínica Levii</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Painel admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Menu principal</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[hsl(var(--primary-glow))]" />
                  )}
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--primary-glow))]" : "")} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5"
          onClick={() => adminSignOut().then(() => window.location.assign("/admin/login"))}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
