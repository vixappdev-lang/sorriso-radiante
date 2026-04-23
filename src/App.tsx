import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScheduleModalProvider } from "@/components/booking/ScheduleModalProvider";
import Index from "./pages/Index.tsx";
import Sobre from "./pages/Sobre.tsx";
import Tratamentos from "./pages/Tratamentos.tsx";
import Equipe from "./pages/Equipe.tsx";
import Galeria from "./pages/Galeria.tsx";
import Servicos from "./pages/Servicos.tsx";
import Localizacao from "./pages/Localizacao.tsx";
import Contato from "./pages/Contato.tsx";
import Config from "./pages/Config.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScheduleModalProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/tratamentos" element={<Tratamentos />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/localizacao" element={<Localizacao />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/config" element={<Config />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ScheduleModalProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
