import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAdminTheme } from "@/admin/hooks/useAdminTheme";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Inicializa o tema admin (aplica classe .admin-dark se persistido)
  useAdminTheme();

  return (
    <div className="admin-shell min-h-screen bg-[hsl(var(--admin-bg))]">
      <div className="flex">
        {/* Sidebar fixa em desktop */}
        <div className="hidden lg:flex w-[260px] shrink-0 sticky top-0 h-screen">
          <AdminSidebar />
        </div>

        {/* Sidebar drawer em mobile */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-[hsl(var(--admin-sidebar))] border-r-0">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 pb-8 lg:pt-4 lg:pb-10 w-full max-w-[1600px]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
