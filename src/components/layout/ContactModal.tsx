import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, HeadphonesIcon, ArrowRight } from "lucide-react";
import { CLINIC_INFO } from "@/data/clinic";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ContactModal({ open, onOpenChange }: Props) {
  const { open: openSchedule } = useScheduleModal();

  const channels = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      subtitle: "Resposta em minutos",
      action: CLINIC_INFO.whatsapp.display,
      href: `https://wa.me/${CLINIC_INFO.whatsapp.number}?text=${encodeURIComponent("Olá! Gostaria de mais informações sobre a LyneCloud.")}`,
      accent: "bg-[#25D366]/10 text-[#128C7E]",
      external: true,
    },
    {
      icon: Phone,
      title: "Telefone",
      subtitle: "Seg–Sex 8h–19h",
      action: CLINIC_INFO.phone.display,
      href: `tel:${CLINIC_INFO.phone.tel}`,
      accent: "bg-primary-soft text-primary",
      external: false,
    },
    {
      icon: Mail,
      title: "E-mail",
      subtitle: "Resposta em até 24h",
      action: CLINIC_INFO.email,
      href: `mailto:${CLINIC_INFO.email}`,
      accent: "bg-accent-gold/15 text-[hsl(var(--accent-gold))]",
      external: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100vw-1.5rem)] p-0 gap-0 overflow-hidden rounded-2xl border-border/60">
        <DialogHeader className="px-6 pt-6 pb-4 sm:px-7 sm:pt-7 border-b border-border/60 bg-gradient-to-br from-primary-soft/50 via-background to-background">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary text-primary-foreground shadow-soft shrink-0">
              <HeadphonesIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-xl sm:text-2xl text-balance leading-tight">
                Falar com nossa equipe
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                Escolha o canal de sua preferência. Estamos prontos para te ajudar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-2.5">
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              onClick={() => onOpenChange(false)}
              className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:shadow-soft transition-smooth"
            >
              <span className={`grid place-items-center h-11 w-11 rounded-xl ${c.accent} shrink-0`}>
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground">{c.title}</p>
                <p className="text-[12px] text-muted-foreground">{c.subtitle}</p>
                <p className="text-[13px] font-medium text-primary mt-0.5 truncate">{c.action}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </a>
          ))}

          <div className="pt-3 mt-2 border-t border-border/60">
            <Button
              onClick={() => { onOpenChange(false); openSchedule(); }}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ou agende uma avaliação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
