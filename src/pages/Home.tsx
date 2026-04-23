import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight, Sparkles, ShieldCheck, Award, Stethoscope, Smile, Star,
  Clock, Users, Microscope, HeartHandshake, Quote, ChevronRight
} from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";
import ContactModal from "@/components/layout/ContactModal";
import { TREATMENTS, TESTIMONIALS, DENTISTS } from "@/data/clinic";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

export default function Home() {
  const { open } = useScheduleModal();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <SiteLayout>
      <SEO
        title="Clínica Levii — Odontologia de Excelência em Aracruz/ES"
        description="Tecnologia de ponta, atendimento humano e resultados que duram em Aracruz/ES. Implantes, ortodontia, lentes de contato dental e emergência 24h."
      />

      {/* HERO — DARK */}
      <section className="relative isolate overflow-hidden bg-hero text-surface-dark-foreground pt-28 sm:pt-36 pb-20 sm:pb-32">
        {/* glow sutil de marca, sem neon */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="container-edge grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" as const }}
            className="lg:col-span-7"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
              <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
              Odontologia de excelência em Aracruz/ES
            </span>

            <h1 className="mt-6 font-display font-semibold h-display text-white text-balance">
              O sorriso que você sempre quis está mais perto do que imagina.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/75 max-w-xl leading-relaxed">
              Tecnologia de ponta, profissionais especialistas e um atendimento que acolhe.
              Na Clínica Levii, cada detalhe é pensado para o seu conforto e para um resultado natural que dura.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => open()}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow text-base h-12 px-7"
              >
                Agendar avaliação gratuita
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-7"
              >
                <Link to="/tratamentos">Ver tratamentos</Link>
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-3 sm:gap-8 max-w-lg mx-auto sm:mx-0 text-center sm:text-left">
              {[
                { v: "+15 anos", l: "de experiência" },
                { v: "+5.000", l: "sorrisos transformados" },
                { v: "4,9★", l: "avaliação Google" },
              ].map((s) => (
                <div key={s.l} className="px-1">
                  <dt className="font-display text-xl sm:text-3xl text-white leading-tight">{s.v}</dt>
                  <dd className="text-[11px] sm:text-sm text-white/60 mt-1 leading-snug">{s.l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* Cartão glass com imagem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" as const }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-[28px] overflow-hidden border border-white/10 shadow-elegant">
              <img
                src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=80"
                alt="Sorriso saudável e natural"
                className="w-full h-[460px] sm:h-[520px] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/80 via-transparent to-transparent" />

              {/* Card flutuante */}
              <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6 glass-dark rounded-2xl p-4 sm:p-5 flex items-center gap-4">
                <div className="grid place-items-center h-11 w-11 rounded-xl bg-primary/20 text-primary-glow shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">Avaliação inicial sem compromisso</p>
                  <p className="text-xs text-white/65 truncate">Plano de tratamento personalizado em 30 minutos</p>
                </div>
              </div>
            </div>

            {/* Badge flutuante */}
            <div className="hidden sm:flex absolute -left-6 top-12 glass-dark rounded-2xl px-4 py-3 items-center gap-3 animate-float">
              <Award className="h-5 w-5 text-gold" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">Top 1% Brasil</p>
                <p className="text-[11px] text-white/60">Estética Dental</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Faixa de logos / confiança */}
        <div className="container-edge mt-16 sm:mt-20">
          <p className="text-center text-[11px] uppercase tracking-[0.22em] text-white/40">
            Confiança de quem entende: parceiros e certificações
          </p>
          <div className="mt-5 flex flex-wrap justify-center items-center gap-x-10 gap-y-4 opacity-70">
            {["ITI Brasil", "Invisalign®", "Straumann", "Neodent", "APCD", "Anvisa"].map((n) => (
              <span key={n} className="text-white/55 text-sm font-medium tracking-wide">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="section bg-soft">
        <div className="container-edge">
          <motion.div {...fadeUp} className="max-w-2xl">
            <span className="eyebrow"><Stethoscope className="h-3.5 w-3.5" /> Por que escolher a Levii</span>
            <h2 className="font-display font-semibold h-section mt-3 text-foreground text-balance">
              Cuidado clínico premium, do diagnóstico ao acompanhamento.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Reunimos os melhores especialistas, equipamentos de última geração e um ambiente pensado para que você se sinta em casa.
            </p>
          </motion.div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { icon: Microscope, title: "Tecnologia de ponta", text: "Scanner intraoral, tomografia 3D e microscopia em todos os procedimentos." },
              { icon: Users, title: "Equipe especialista", text: "Dentistas com mestrado, doutorado e formação internacional." },
              { icon: HeartHandshake, title: "Atendimento humano", text: "Escutamos você, explicamos cada etapa e respeitamos seu ritmo." },
              { icon: Clock, title: "Agilidade & pontualidade", text: "Tempo de espera reduzido e horários que cabem na sua rotina." },
            ].map((f, i) => (
              <motion.article
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className="rounded-2xl bg-card p-6 border border-border/70 shadow-soft hover:shadow-elegant transition-smooth"
              >
                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary-soft text-primary mb-5">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* TRATAMENTOS */}
      <section className="section">
        <div className="container-edge">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="eyebrow"><Smile className="h-3.5 w-3.5" /> Tratamentos</span>
              <h2 className="font-display font-semibold h-section mt-3 text-balance">
                Soluções completas para o seu sorriso.
              </h2>
              <p className="mt-3 text-muted-foreground">Da prevenção à reabilitação estética avançada.</p>
            </motion.div>
            <Link to="/tratamentos" className="inline-flex items-center gap-1 text-sm font-semibold text-primary link-underline">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {TREATMENTS.slice(0, 6).map((t, i) => (
              <motion.article
                key={t.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
                className="group rounded-2xl card-elevated p-6 sm:p-7 transition-smooth"
              >
                <h3 className="font-display text-xl font-semibold">{t.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{t.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">A partir de <strong className="text-foreground">{t.priceFrom}</strong></span>
                  <button
                    onClick={() => open(t.slug)}
                    className="inline-flex items-center text-sm font-semibold text-primary group-hover:gap-2 gap-1 transition-all"
                  >
                    Agendar <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPE PREVIEW */}
      <section className="section bg-soft">
        <div className="container-edge">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <motion.div {...fadeUp} className="max-w-xl">
              <span className="eyebrow"><Users className="h-3.5 w-3.5" /> Nossa equipe</span>
              <h2 className="font-display font-semibold h-section mt-3 text-balance">
                Especialistas que você pode confiar.
              </h2>
              <p className="mt-3 text-muted-foreground">Profissionais com formação de excelência e centenas de casos resolvidos.</p>
            </motion.div>
            <Link to="/equipe" className="inline-flex items-center gap-1 text-sm font-semibold text-primary link-underline">
              Conhecer todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {DENTISTS.map((d, i) => (
              <motion.article
                key={d.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden bg-card border border-border/70 shadow-soft hover:shadow-elegant transition-smooth"
              >
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <img src={d.photo} alt={d.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">{d.specialty}</p>
                  <h3 className="font-display text-lg font-semibold mt-1.5">{d.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{d.cro}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="section">
        <div className="container-edge">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center">
            <span className="eyebrow justify-center"><Star className="h-3.5 w-3.5" /> Depoimentos</span>
            <h2 className="font-display font-semibold h-section mt-3 text-balance">
              Histórias reais de quem voltou a sorrir.
            </h2>
          </motion.div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {TESTIMONIALS.slice(0, 6).map((t, i) => (
              <motion.figure
                key={t.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
                className="rounded-2xl p-6 sm:p-7 card-elevated transition-smooth"
              >
                <Quote className="h-6 w-6 text-primary/30" />
                <blockquote className="mt-3 text-[15px] leading-relaxed text-foreground/90">"{t.text}"</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="grid place-items-center h-10 w-10 rounded-full bg-primary-soft text-primary font-semibold text-sm">
                    {t.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.city}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 text-gold">
                    {Array.from({ length: t.rating }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section pt-0">
        <div className="container-edge">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[28px] bg-surface-dark text-white p-8 sm:p-14 lg:p-20"
          >
            <div className="pointer-events-none absolute inset-0 -z-0">
              <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
            </div>
            <div className="relative max-w-2xl">
              <h2 className="font-display font-semibold h-section text-white text-balance">
                Comece hoje a transformação do seu sorriso.
              </h2>
              <p className="mt-4 text-white/75 text-base sm:text-lg">
                Avaliação inicial sem compromisso. Em 30 minutos você sai com um plano personalizado e claro.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => open()}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-7 shadow-glow"
                >
                  Agendar agora <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button onClick={() => setContactOpen(true)} variant="outline" size="lg" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-7">
                  Falar com a equipe
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </SiteLayout>
  );
}
