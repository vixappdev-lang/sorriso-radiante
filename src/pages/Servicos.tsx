import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { TREATMENTS } from "@/data/clinic";
import { Button } from "@/components/ui/button";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";
import { CheckCircle2 } from "lucide-react";
import { useClinicName } from "@/hooks/useClinicBrand";

export default function Servicos() {
  const { open } = useScheduleModal();
  const clinicName = useClinicName();
  return (
    <SiteLayout>
      <SEO
        title={`Serviços e Preços — ${clinicName}`}
        description={`Lista completa de serviços odontológicos da ${clinicName} com faixas de preço e duração média de cada procedimento.`}
      />
      <PageHero
        eyebrow="Serviços e preços"
        title="Transparência do início ao fim."
        subtitle="Veja a faixa de investimento de cada serviço. Avaliação inicial sem compromisso para você fechar o plano que faz sentido para o seu momento."
      />

      <section className="section">
        <div className="container-edge">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="hidden md:grid grid-cols-12 px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-muted/40">
              <div className="col-span-5">Serviço</div>
              <div className="col-span-3">Duração</div>
              <div className="col-span-2">A partir de</div>
              <div className="col-span-2 text-right">Ação</div>
            </div>
            {TREATMENTS.map((t) => (
              <div key={t.slug} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 sm:px-6 py-5 border-b border-border/60 last:border-0 items-start md:items-center hover:bg-muted/30 transition-smooth">
                <div className="md:col-span-5">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{t.short}</p>
                </div>
                <div className="md:col-span-3 flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-primary md:hidden" />
                  <span className="md:hidden text-muted-foreground text-xs">Duração:</span> {t.duration}
                </div>
                <div className="md:col-span-2 text-sm">
                  <span className="md:hidden text-muted-foreground text-xs">A partir de </span>
                  <strong className="text-foreground">{t.priceFrom}</strong>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <Button onClick={() => open(t.slug)} size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary-soft">
                    Agendar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            * Os valores são referência de investimento mínimo. Cada caso é avaliado individualmente. Trabalhamos com parcelamento em até 12x sem juros e principais convênios.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
