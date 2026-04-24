import { Clock, MapPin, Phone, Car, TrainFront } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";

export default function Localizacao() {
  return (
    <SiteLayout>
      <SEO
        title="Localização — LyneCloud em Aracruz/ES"
        description="Av. Venâncio Flores, 350 — Centro, Aracruz/ES. Como chegar, horários e estacionamento da LyneCloud."
      />
      <PageHero
        eyebrow="Localização"
        title="Estamos prontos para te receber."
        subtitle="No coração de Aracruz/ES, com fácil acesso e estacionamento próximo."
      />

      <section className="section">
        <div className="container-edge grid lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-border/70 shadow-soft aspect-[4/3] lg:aspect-auto lg:min-h-[460px]">
            <iframe
              title="Localização da LyneCloud no mapa"
              src="https://www.google.com/maps?q=Av.+Ven%C3%A2ncio+Flores+Aracruz+ES&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>

          <aside className="lg:col-span-2 grid gap-4 content-start">
            <Info icon={MapPin} title="Endereço">
              Av. Venâncio Flores, 350 — Sala 04<br />
              Centro, Aracruz — ES<br />
              CEP 29190-036
            </Info>
            <Info icon={Clock} title="Horário de funcionamento">
              Segunda a Sexta: 8h às 19h<br />
              Sábado: 8h às 13h<br />
              Emergências: 24h
            </Info>
            <Info icon={Phone} title="Contato">
              (27) 98112-0322<br />
              (27) 98112-0322 (WhatsApp)<br />
              contato@lynecloud.com.br
            </Info>
            <Info icon={TrainFront} title="Como chegar">
              A 2 min do Centro de Aracruz<br />
              Próximo à Praça Monsenhor Guilherme Schmitz
            </Info>
            <Info icon={Car} title="Estacionamento">
              Estacionamento gratuito para pacientes nas dependências do edifício.
            </Info>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Info({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center h-10 w-10 rounded-lg bg-primary-soft text-primary"><Icon className="h-4 w-4" /></span>
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{children}</p>
    </div>
  );
}
