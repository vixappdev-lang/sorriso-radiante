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
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSignOut, useAdminSession } from "@/admin/hooks/useAdminSession";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { user } = useAdminSession();
  const initials = (user?.email ?? "AD").slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-full w-full flex-col bg-[hsl(var(--admin-sidebar))] text-white">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[hsl(215_85%_55%)] to-[hsl(215_85%_38%)] shadow-[inset_0_-2px_6px_rgba(0,0,0,0.25)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21V8M5 8a7 7 0 0 1 14 0M5 8c0 4 3 6 3 8M19 8c0 4-3 6-3 8" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold">Clínica Levii</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Painel admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Menu principal</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-white/[0.06] text-white"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-[hsl(var(--admin-sidebar-active))]" : "text-white/45 group-hover:text-white/80")} />
                  <span className="truncate">{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--admin-sidebar-active))]" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-1">
        <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors">
          <LifeBuoy className="h-[18px] w-[18px]" />
          Ajuda e suporte
        </button>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/[0.04]">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-[hsl(215_85%_55%)] to-[hsl(215_85%_35%)] text-white text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">Administrador</p>
            <p className="text-[11px] text-white/45 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
        <button
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.04] hover:text-white transition-colors"
          onClick={() => adminSignOut().then(() => window.location.assign("/admin/login"))}
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sair
        </button>
      </div>
    </aside>
  );
}
