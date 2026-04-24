import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScheduleModalProvider } from "@/components/booking/ScheduleModalProvider";

// Site público
import Index from "./pages/Index.tsx";
import Sobre from "./pages/Sobre.tsx";
import Tratamentos from "./pages/Tratamentos.tsx";
import Equipe from "./pages/Equipe.tsx";
import Galeria from "./pages/Galeria.tsx";
import Servicos from "./pages/Servicos.tsx";
import Localizacao from "./pages/Localizacao.tsx";
import Contato from "./pages/Contato.tsx";
import NotFound from "./pages/NotFound.tsx";
import PublicReview from "./pages/PublicReview.tsx";
import PublicBooking from "./pages/PublicBooking.tsx";
import AreaCliente from "./pages/AreaCliente.tsx";
import Apresentacao from "./pages/Apresentacao.tsx";

// Painel admin
import RequireAdmin from "@/admin/layout/RequireAdmin";
import AdminLayout from "@/admin/layout/AdminLayout";
import AdminLogin from "@/admin/pages/AdminLogin";
import AdminDashboard from "@/admin/pages/AdminDashboard";
import AdminAgenda from "@/admin/pages/AdminAgenda";
import AdminPacientes from "@/admin/pages/AdminPacientes";
import AdminTratamentos from "@/admin/pages/AdminTratamentos";
import AdminProfissionais from "@/admin/pages/AdminProfissionais";
import AdminWhatsApp from "@/admin/pages/AdminWhatsApp";
import AdminFinanceiro from "@/admin/pages/AdminFinanceiro";
import AdminLeads from "@/admin/pages/AdminLeads";
import AdminAvaliacoes from "@/admin/pages/AdminAvaliacoes";
import AdminSite from "@/admin/pages/AdminSite";
import AdminRelatorios from "@/admin/pages/AdminRelatorios";
import AdminConfiguracoes from "@/admin/pages/AdminConfiguracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScheduleModalProvider>
          <Routes>
            {/* Site público */}
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/tratamentos" element={<Tratamentos />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/localizacao" element={<Localizacao />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/avaliar/:token" element={<PublicReview />} />
            <Route path="/agendar/:token" element={<PublicBooking />} />
            <Route path="/agendar/slug/:slug" element={<PublicBooking />} />
            <Route path="/area-cliente" element={<AreaCliente />} />
            <Route path="/apresentacao" element={<Apresentacao />} />

            {/* Painel admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="agenda" element={<AdminAgenda />} />
              <Route path="pacientes" element={<AdminPacientes />} />
              <Route path="tratamentos" element={<AdminTratamentos />} />
              <Route path="profissionais" element={<AdminProfissionais />} />
              <Route path="financeiro" element={<AdminFinanceiro />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="whatsapp" element={<AdminWhatsApp />} />
              <Route path="avaliacoes" element={<AdminAvaliacoes />} />
              <Route path="site" element={<AdminSite />} />
              <Route path="relatorios" element={<AdminRelatorios />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
            </Route>

            {/* Legado: /config → /admin/whatsapp */}
            <Route path="/config" element={<Navigate to="/admin/whatsapp" replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ScheduleModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
