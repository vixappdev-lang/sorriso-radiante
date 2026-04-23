import { Clock, MapPin, Phone, Car, TrainFront } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";

export default function Localizacao() {
  return (
    <SiteLayout>
      <SEO
        title="Localização — Clínica Levii"
        description="Av. Paulista, 1000 — São Paulo. Como chegar, horários de funcionamento e estacionamento da Clínica Levii."
      />
      <PageHero
        eyebrow="Localização"
        title="Estamos prontos para te receber."
        subtitle="No coração de São Paulo, com fácil acesso por metrô, ônibus e carro."
      />

      <section className="section">
        <div className="container-edge grid lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-border/70 shadow-soft aspect-[4/3] lg:aspect-auto lg:min-h-[460px]">
            <iframe
              title="Localização da Clínica Levii no mapa"
              src="https://www.google.com/maps?q=Av.+Paulista,+1000,+S%C3%A3o+Paulo&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          </div>

          <aside className="lg:col-span-2 grid gap-4 content-start">
            <Info icon={MapPin} title="Endereço">
              Av. Paulista, 1000 — 12º andar<br />
              Bela Vista, São Paulo — SP<br />
              CEP 01310-100
            </Info>
            <Info icon={Clock} title="Horário de funcionamento">
              Segunda a Sexta: 8h às 20h<br />
              Sábado: 8h às 14h<br />
              Emergências: 24h
            </Info>
            <Info icon={Phone} title="Contato">
              (11) 3000-0000<br />
              (11) 9 0000-0000 (WhatsApp)<br />
              contato@clinicalevii.com.br
            </Info>
            <Info icon={TrainFront} title="Transporte público">
              Metrô Trianon-MASP — 250m<br />
              Diversas linhas de ônibus
            </Info>
            <Info icon={Car} title="Estacionamento">
              Estacionamento conveniado no edifício, com desconto para pacientes.
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
