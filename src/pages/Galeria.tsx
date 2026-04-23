import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";

const IMAGES = [
  { src: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=900&q=80&auto=format&fit=crop", alt: "Sorriso natural após tratamento" },
  { src: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900&q=80&auto=format&fit=crop", alt: "Recepção da clínica" },
  { src: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=80&auto=format&fit=crop", alt: "Equipamentos modernos" },
  { src: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&q=80&auto=format&fit=crop", alt: "Consultório aconchegante" },
  { src: "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?w=900&q=80&auto=format&fit=crop", alt: "Equipe atendendo paciente" },
  { src: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=900&q=80&auto=format&fit=crop", alt: "Planejamento digital" },
  { src: "https://images.unsplash.com/photo-1581585504064-a233a2b9e96c?w=900&q=80&auto=format&fit=crop", alt: "Ambiente moderno" },
  { src: "https://images.unsplash.com/photo-1564420179856-f70bf493b1bd?w=900&q=80&auto=format&fit=crop", alt: "Detalhe do consultório" },
  { src: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=900&q=80&auto=format&fit=crop", alt: "Microscópio em uso" },
];

export default function Galeria() {
  return (
    <SiteLayout>
      <SEO
        title="Galeria — Clínica Levii"
        description="Conheça a Clínica Levii por dentro: ambiente moderno, acolhedor e equipamentos de ponta para o seu conforto."
      />
      <PageHero
        eyebrow="Galeria"
        title="Um ambiente pensado para o seu bem-estar."
        subtitle="Espaços modernos, acolhedores e impecáveis. Conheça por dentro a clínica que cuida do seu sorriso."
      />

      <section className="section">
        <div className="container-edge columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-5 [column-fill:_balance]">
          {IMAGES.map((img, i) => (
            <motion.figure
              key={img.src}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.05, ease: "easeOut" }}
              className="mb-4 sm:mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-border/70 shadow-soft"
            >
              <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-auto object-cover transition-transform duration-700 hover:scale-[1.03]" />
            </motion.figure>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
