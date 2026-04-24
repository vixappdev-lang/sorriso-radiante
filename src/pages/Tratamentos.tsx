import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";
import { TREATMENTS } from "@/data/clinic";

export default function Tratamentos() {
  const { open } = useScheduleModal();
  return (
    <SiteLayout>
      <SEO
        title="Tratamentos — LyneCloud"
        description="Implantes, ortodontia, lentes, clareamento, harmonização e mais. Tratamentos odontológicos completos com tecnologia de ponta."
      />
      <PageHero
        eyebrow="Tratamentos"
        title="Soluções completas para o seu sorriso."
        subtitle="Da prevenção à reabilitação estética. Cada plano é desenhado especialmente para você."
      />

      <section className="section">
        <div className="container-edge grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TREATMENTS.map((t, i) => (
            <motion.article
              key={t.slug}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.05, ease: "easeOut" }}
              className="group relative flex flex-col rounded-2xl card-elevated p-6 sm:p-7 transition-smooth overflow-hidden"
            >
              {/* Acento superior sutil */}
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Numeração discreta */}
              <span className="absolute top-5 right-5 font-display text-3xl text-primary/10 font-semibold leading-none select-none">
                {String(i + 1).padStart(2, "0")}
              </span>

              <h3 className="font-display text-xl font-semibold pr-12">{t.name}</h3>
              <p className="mt-1 text-sm text-primary font-medium">{t.short}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t.description}</p>

              <ul className="mt-4 space-y-1.5">
                {t.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {h}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">A partir de</p>
                  <p className="font-semibold text-foreground">{t.priceFrom}</p>
                </div>
                <Button onClick={() => open(t.slug)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft group-hover:shadow-glow transition-shadow">
                  Agendar <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
