import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(220_18%_97%)]">
      <div className="flex">
        {/* Sidebar fixa em desktop */}
        <div className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen">
          <AdminSidebar />
        </div>

        {/* Sidebar drawer em mobile */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-[hsl(var(--surface-dark))] border-r-0">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1600px] w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
