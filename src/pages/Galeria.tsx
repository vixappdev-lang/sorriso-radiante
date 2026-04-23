import { motion } from "framer-motion";
import { Camera, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";

type GalleryItem = {
  src: string;
  alt: string;
  category: "Ambiente" | "Resultados" | "Equipe";
  caption: string;
  size?: "tall" | "wide" | "default";
};

const IMAGES: GalleryItem[] = [
  { src: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1100&q=80&auto=format&fit=crop", alt: "Sorriso natural após tratamento estético", category: "Resultados", caption: "Lentes de contato dental — resultado natural", size: "tall" },
  { src: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1100&q=80&auto=format&fit=crop", alt: "Recepção moderna e acolhedora da clínica", category: "Ambiente", caption: "Recepção pensada para o seu conforto" },
  { src: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=80&auto=format&fit=crop", alt: "Equipamentos odontológicos modernos", category: "Ambiente", caption: "Consultórios com equipamentos de ponta", size: "wide" },
  { src: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1100&q=80&auto=format&fit=crop", alt: "Consultório clínico aconchegante", category: "Ambiente", caption: "Ambiente clínico premium", size: "tall" },
  { src: "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?w=1100&q=80&auto=format&fit=crop", alt: "Equipe atendendo paciente com cuidado", category: "Equipe", caption: "Atendimento humano e atencioso" },
  { src: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1100&q=80&auto=format&fit=crop", alt: "Planejamento digital de tratamento odontológico", category: "Resultados", caption: "Planejamento digital 3D" },
  { src: "https://images.unsplash.com/photo-1581585504064-a233a2b9e96c?w=1200&q=80&auto=format&fit=crop", alt: "Detalhe do consultório moderno", category: "Ambiente", caption: "Detalhes que fazem a diferença", size: "wide" },
  { src: "https://images.unsplash.com/photo-1564420179856-f70bf493b1bd?w=1100&q=80&auto=format&fit=crop", alt: "Profissional examinando paciente", category: "Equipe", caption: "Diagnóstico preciso, tratamento certeiro" },
  { src: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1100&q=80&auto=format&fit=crop", alt: "Microscópio em uso durante procedimento", category: "Resultados", caption: "Procedimentos com alta precisão", size: "tall" },
];

const CATEGORIES = ["Todos", "Ambiente", "Resultados", "Equipe"] as const;

import { useState } from "react";

export default function Galeria() {
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>("Todos");
  const filtered = filter === "Todos" ? IMAGES : IMAGES.filter((i) => i.category === filter);

  return (
    <SiteLayout>
      <SEO
        title="Galeria — Clínica Levii"
        description="Conheça por dentro a Clínica Levii: ambiente moderno, equipamentos de ponta, resultados reais e a equipe que cuida do seu sorriso."
      />
      <PageHero
        eyebrow="Galeria"
        title="Por dentro da Clínica Levii."
        subtitle="Ambiente acolhedor, tecnologia de ponta e resultados que falam por si. Veja com seus próprios olhos por que somos referência em Aracruz/ES."
      />

      {/* Filtros */}
      <section className="pt-8 sm:pt-10 pb-2">
        <div className="container-edge">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = filter === c;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-smooth ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-soft"
                      : "bg-card border-border/70 text-foreground/75 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {active && <Sparkles className="h-3.5 w-3.5" />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section pt-8 sm:pt-10">
        <div className="container-edge">
          {/* Grid Bento responsivo */}
          <motion.div
            layout
            className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[240px] gap-3 sm:gap-4"
          >
            {filtered.map((img, i) => (
              <motion.figure
                key={img.src}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: (i % 6) * 0.04, ease: "easeOut" }}
                className={`group relative overflow-hidden rounded-2xl border border-border/70 shadow-soft hover:shadow-elegant transition-smooth cursor-pointer ${
                  img.size === "tall" ? "row-span-2" : ""
                } ${img.size === "wide" ? "col-span-2" : ""}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay com gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                {/* Badge categoria */}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-dark text-[10px] uppercase tracking-wider font-semibold text-white">
                  <Camera className="h-2.5 w-2.5" />
                  {img.category}
                </span>

                {/* Caption */}
                <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                  <p className="text-sm sm:text-[15px] font-medium leading-snug text-balance translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {img.caption}
                  </p>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              Nenhuma imagem nesta categoria.
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
