import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";
import { DENTISTS } from "@/data/clinic";

export default function Equipe() {
  const { open } = useScheduleModal();
  return (
    <SiteLayout>
      <SEO
        title="Equipe — Clínica Levii"
        description="Conheça os especialistas da Clínica Levii: implantodontistas, ortodontistas, endodontistas e odontopediatras com formação de excelência."
      />
      <PageHero
        eyebrow="Nossa equipe"
        title="Especialistas dedicados ao seu sorriso."
        subtitle="Profissionais com mestrado, doutorado e formação internacional, unidos por um mesmo propósito: o seu bem-estar."
      />

      <section className="section">
        <div className="container-edge grid md:grid-cols-2 gap-6 lg:gap-8">
          {DENTISTS.map((d, i) => (
            <motion.article
              key={d.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.06, ease: "easeOut" }}
              className="grid sm:grid-cols-[200px_1fr] gap-5 sm:gap-7 rounded-2xl bg-card border border-border/70 p-5 sm:p-7 shadow-soft"
            >
              <div className="aspect-square sm:aspect-auto sm:h-full rounded-xl overflow-hidden bg-muted">
                <img src={d.photo} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">{d.specialty}</p>
                <h3 className="font-display text-2xl font-semibold mt-1">{d.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{d.cro}</p>
                <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{d.bio}</p>
                <ul className="mt-4 space-y-1.5">
                  {d.formation.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => open()}
                  size="sm"
                  variant="outline"
                  className="mt-5 self-start border-primary/30 text-primary hover:bg-primary-soft"
                >
                  Agendar com {d.name.split(" ")[0]} {d.name.split(" ")[1]}
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
