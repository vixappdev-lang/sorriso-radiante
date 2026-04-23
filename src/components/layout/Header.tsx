import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/tratamentos", label: "Tratamentos" },
  { to: "/equipe", label: "Equipe" },
  { to: "/tecnologia", label: "Tecnologia" },
  { to: "/galeria", label: "Galeria" },
  { to: "/servicos", label: "Serviços" },
  { to: "/localizacao", label: "Localização" },
  { to: "/contato", label: "Contato" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { open: openSchedule } = useScheduleModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
        "fixed inset-x-0 top-0 z-50 transition-smooth",
        transparent
          ? "bg-transparent"
          : "glass-strong shadow-soft border-b border-border/60"
      )}
    >
      <div className="container-edge flex h-16 items-center justify-between sm:h-20">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Clínica Levii — início">
          <Logo light={transparent} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Principal">
          {NAV.slice(0, 7).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-smooth",
                  transparent
                    ? "text-white/85 hover:text-white"
                    : "text-foreground/75 hover:text-foreground",
                  isActive && (transparent ? "text-white" : "text-primary")
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="tel:+551130000000"
            className={cn(
              "hidden md:inline-flex items-center gap-2 text-sm font-medium",
              transparent ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-primary"
            )}
          >
            <Phone className="h-4 w-4" />
            (11) 3000-0000
          </a>
          <Button
            onClick={openSchedule}
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
                  "lg:hidden",
                  transparent && "text-white hover:bg-white/10 hover:text-white"
                )}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:w-96 p-0">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4" aria-label="Navegação móvel">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "px-4 py-3 rounded-lg text-base font-medium transition-smooth",
                        isActive ? "bg-primary-soft text-primary" : "text-foreground/85 hover:bg-secondary"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <Button
                  onClick={() => { setOpen(false); openSchedule(); }}
                  className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  Agendar consulta
                </Button>
                <a
                  href="tel:+551130000000"
                  className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-foreground/80 py-3"
                >
                  <Phone className="h-4 w-4" /> (11) 3000-0000
                </a>
              </nav>
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
        "grid place-items-center h-9 w-9 rounded-xl",
        light ? "bg-white/15 backdrop-blur border border-white/25" : "bg-primary text-primary-foreground"
      )}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5c-2.5 0-4 2-4 4.5 0 3 1.5 5 2 8 .3 1.6 1 3.5 2.5 3.5 1.3 0 1.7-1.5 2.5-3 .5-1 1-1.5 2-1.5s1.5.5 2 1.5c.8 1.5 1.2 3 2.5 3 1.5 0 2.2-1.9 2.5-3.5.5-3 2-5 2-8 0-2.5-1.5-4.5-4-4.5-1.7 0-2.7.9-3.5 1.6-.7.6-1 .9-1.5.9s-.8-.3-1.5-.9C9.7 4.4 8.7 3.5 7 3.5Z"/>
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className={cn(
          "font-display text-lg font-semibold tracking-tight",
          light ? "text-white" : "text-foreground"
        )}>
          Clínica Levii
        </span>
        <span className={cn(
          "text-[10px] uppercase tracking-[0.22em] font-semibold",
          light ? "text-white/65" : "text-muted-foreground"
        )}>
          Odontologia
        </span>
      </span>
    </span>
  );
}
