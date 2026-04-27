import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Phone, Copy, Check } from "lucide-react";
import { useState } from "react";
import { CLINIC_INFO } from "@/data/clinic";
import { useClinicName } from "@/hooks/useClinicBrand";
import { toast } from "@/hooks/use-toast";

const ADDRESS_FULL = "Av. Venâncio Flores, 350 - Sala 04, Centro, Aracruz - ES, 29190-036";
const LAT = -19.8203;
const LNG = -40.2741;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function LocationModal({ open, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false);
  const clinicName = useClinicName();

  // Detecta plataforma para abrir o app de mapa nativo correto
  const handleOpenGPS = () => {
    const ua = navigator.userAgent || navigator.vendor;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const encodedAddress = encodeURIComponent(ADDRESS_FULL);

    let url: string;
    if (isIOS) {
      // Apple Maps (abre nativamente no iOS, fallback web no desktop)
      url = `https://maps.apple.com/?q=${encodedAddress}&ll=${LAT},${LNG}`;
    } else {
      // Google Maps universal — abre app no Android, web em desktop
      url = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}&destination_place_id=${encodedAddress}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS_FULL);
      setCopied(true);
      toast({ title: "Endereço copiado!", description: "Cole no app de mapa que preferir." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] p-0 gap-0 overflow-hidden rounded-2xl border-border/60">
        <DialogHeader className="px-6 pt-6 pb-4 sm:px-7 sm:pt-7 border-b border-border/60 bg-gradient-to-br from-primary-soft/50 via-background to-background">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary text-primary-foreground shadow-soft shrink-0">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-xl sm:text-2xl text-balance leading-tight">
                Como chegar à LyneCloud
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                Toque em "Abrir no mapa" para iniciar a rota no seu GPS.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 sm:px-7 py-5">
          {/* Mini-mapa preview */}
          <div className="rounded-xl overflow-hidden border border-border/70 aspect-video shadow-soft">
            <iframe
              title="Mapa LyneCloud"
              src={`https://www.google.com/maps?q=${LAT},${LNG}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Endereço completo</p>
                <p className="text-muted-foreground text-[13px] leading-relaxed">{ADDRESS_FULL}</p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 grid place-items-center h-8 w-8 rounded-lg bg-secondary hover:bg-primary-soft text-foreground/70 hover:text-primary transition-smooth"
                aria-label="Copiar endereço"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Horário</p>
                <p className="text-muted-foreground text-[13px]">{CLINIC_INFO.hours}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Telefone</p>
                <a href={`tel:${CLINIC_INFO.phone.tel}`} className="text-primary hover:underline text-[13px]">
                  {CLINIC_INFO.phone.display}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-7 sm:pb-7 flex flex-col-reverse sm:flex-row gap-2.5">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:flex-1">
            Fechar
          </Button>
          <Button
            onClick={handleOpenGPS}
            size="lg"
            className="sm:flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Abrir no GPS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
