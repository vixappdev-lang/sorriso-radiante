import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Phone, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";
import { useClinicName } from "@/hooks/useClinicBrand";
import { cn } from "@/lib/utils";

// Topo enxuto: apenas o essencial
const NAV = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/tratamentos", label: "Tratamentos" },
  { to: "/servicos", label: "Serviços" },
  { to: "/localizacao", label: "Localização" },
  { to: "/contato", label: "Contato" },
];

// Páginas adicionais (mobile menu + footer)
const NAV_EXTRA = [
  { to: "/equipe", label: "Equipe" },
  { to: "/galeria", label: "Galeria" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { open: openSchedule } = useScheduleModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isHome = location.pathname === "/";
  // Header transparente sobre hero escuro da Home, sólido nas demais
  const transparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        // transição manual mais suave (cor + backdrop juntos)
        "transition-[background-color,backdrop-filter,box-shadow,border-color] duration-500 ease-out",
        transparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_hsl(220_25%_12%/0.04),0_8px_24px_-12px_hsl(220_25%_12%/0.08)] border-b border-border/50"
      )}
    >
      <div className="container-edge flex h-16 items-center justify-between sm:h-20">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="LyneCloud — início">
          <Logo light={transparent} />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Principal">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative px-3.5 py-2 text-sm font-medium rounded-md transition-colors duration-300",
                  transparent
                    ? "text-white/85 hover:text-white"
                    : "text-foreground/75 hover:text-foreground",
                  isActive && (transparent ? "text-white" : "text-primary"),
                  // sublinhado discreto no ativo
                  isActive && "after:content-[''] after:absolute after:left-3.5 after:right-3.5 after:bottom-1 after:h-px",
                  isActive && (transparent ? "after:bg-white/70" : "after:bg-primary/70")
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="tel:+5527981120322"
            className={cn(
              "hidden md:inline-flex items-center gap-2 text-sm font-medium transition-colors duration-300",
              transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-primary"
            )}
          >
            <Phone className="h-4 w-4" />
            (27) 98112-0322
          </a>
          <Button
            onClick={() => openSchedule()}
            size="sm"
            className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
          >
            Agendar consulta
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "lg:hidden transition-colors duration-300",
                  transparent && "text-white hover:bg-white/10 hover:text-white"
                )}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88vw] sm:w-[400px] p-0 border-l border-border/60 bg-background flex flex-col overflow-hidden"
            >
              {/* Cabeçalho do menu — gradient sutil */}
              <SheetHeader className="px-6 pt-6 pb-5 border-b border-border/60 bg-gradient-to-br from-primary-soft/60 via-background to-background shrink-0">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <Logo />
                </SheetTitle>
                <p className="text-xs text-muted-foreground text-left mt-1">Odontologia de excelência em Aracruz/ES</p>
              </SheetHeader>

              {/* Área rolável */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {/* CTA prioritário no topo */}
                <div className="px-5 pt-5 pb-2">
                  <Button
                    onClick={() => { setOpen(false); openSchedule(); }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft h-12"
                    size="lg"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar consulta
                  </Button>
                </div>

                {/* Navegação */}
                <nav className="px-3 py-3" aria-label="Navegação móvel">
                  <p className="px-3 pt-2 pb-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                    Principal
                  </p>
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors",
                          isActive ? "bg-primary-soft text-primary" : "text-foreground/85 hover:bg-secondary"
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}

                  {NAV_EXTRA.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors",
                          isActive ? "bg-primary-soft text-primary" : "text-foreground/85 hover:bg-secondary"
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                {/* Contato direto */}
                <div className="px-5 pb-6 border-t border-border/60 pt-5 space-y-2.5">
                  <a
                    href="tel:+5527981120322"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
                  >
                    <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary-soft text-primary"><Phone className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Telefone</p>
                      <p className="text-sm font-semibold text-foreground">(27) 98112-0322</p>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/5527981120322"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
                  >
                    <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#25D366]/15 text-[#128C7E]">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .2 5.3.2 11.85a11.78 11.78 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.69 1.45h.01c6.54 0 11.84-5.3 11.84-11.85 0-3.16-1.23-6.13-3.38-8.46Z"/></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">WhatsApp</p>
                      <p className="text-sm font-semibold text-foreground">(27) 98112-0322</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-3 px-3 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Av. Venâncio Flores, 350 — Centro, Aracruz/ES
                    </p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn(
        "grid place-items-center h-9 w-9 rounded-xl transition-colors duration-300",
        light ? "bg-white/15 backdrop-blur border border-white/25" : "bg-primary text-primary-foreground"
      )}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5c-2.5 0-4 2-4 4.5 0 3 1.5 5 2 8 .3 1.6 1 3.5 2.5 3.5 1.3 0 1.7-1.5 2.5-3 .5-1 1-1.5 2-1.5s1.5.5 2 1.5c.8 1.5 1.2 3 2.5 3 1.5 0 2.2-1.9 2.5-3.5.5-3 2-5 2-8 0-2.5-1.5-4.5-4-4.5-1.7 0-2.7.9-3.5 1.6-.7.6-1 .9-1.5.9s-.8-.3-1.5-.9C9.7 4.4 8.7 3.5 7 3.5Z"/>
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn(
          "font-display text-lg font-semibold tracking-tight transition-colors duration-300",
          light ? "text-white" : "text-foreground"
        )}>
          LyneCloud
        </span>
        <span className={cn(
          "text-[10px] uppercase tracking-[0.22em] font-semibold transition-colors duration-300",
          light ? "text-white/65" : "text-muted-foreground"
        )}>
          Odontologia
        </span>
      </span>
    </span>
  );
}
