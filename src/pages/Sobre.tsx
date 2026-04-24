import { motion } from "framer-motion";
import { ShieldCheck, HeartHandshake, Microscope, Sparkles, Users, Award } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";

export default function Sobre() {
  const { open } = useScheduleModal();
  return (
    <SiteLayout>
      <SEO
        title="Sobre — LyneCloud"
        description="Conheça a história, missão e valores da LyneCloud. Mais de 15 anos transformando sorrisos com excelência clínica e atendimento humano."
      />
      <PageHero
        eyebrow="Sobre nós"
        title="Sorrisos saudáveis começam com confiança."
        subtitle="Há mais de 15 anos, unimos ciência, arte e empatia para oferecer a você uma experiência odontológica diferente — do primeiro oi à manutenção do seu sorriso."
      />

      <section className="section">
        <div className="container-edge grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="eyebrow">Nossa história</span>
            <h2 className="font-display font-semibold h-section mt-3 text-balance">
              Uma clínica feita por pessoas, para pessoas.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              A LyneCloud nasceu do sonho da Dra. Camila LyneCloud em criar um espaço onde o paciente não fosse só
              mais um número. Aqui, cada sorriso tem uma história, e cada plano de tratamento é desenhado para você.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Hoje somos referência em São Paulo em estética dental, implantes e ortodontia digital, com uma
              equipe de especialistas reconhecidos e tecnologia de ponta em cada procedimento.
            </p>
          </motion.div>
          <motion.img
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
            alt="Ambiente acolhedor da LyneCloud"
            className="rounded-3xl shadow-elegant w-full aspect-[4/3] object-cover"
            loading="lazy"
          />
        </div>
      </section>

      <section className="section bg-soft">
        <div className="container-edge">
          <div className="max-w-2xl">
            <span className="eyebrow">Missão, visão e valores</span>
            <h2 className="font-display font-semibold h-section mt-3 text-balance">
              O que move tudo o que fazemos.
            </h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: HeartHandshake, title: "Missão", text: "Transformar vidas através de sorrisos saudáveis, com excelência clínica e atendimento humano." },
              { icon: Sparkles, title: "Visão", text: "Ser referência nacional em odontologia integrada, reconhecida pela qualidade e ética." },
              { icon: ShieldCheck, title: "Valores", text: "Ética, transparência, acolhimento, atualização constante e respeito ao paciente." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl p-6 sm:p-7 bg-card border border-border/70 shadow-soft">
                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary-soft text-primary mb-5">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-edge grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Award, v: "15+", l: "Anos de história" },
            { icon: Users, v: "5.000+", l: "Pacientes atendidos" },
            { icon: Microscope, v: "12", l: "Especialidades" },
            { icon: Sparkles, v: "4,9★", l: "Google Avaliações" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border/70 p-6 text-center bg-card">
              <s.icon className="h-6 w-6 text-primary mx-auto mb-3" />
              <p className="font-display text-3xl font-semibold">{s.v}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="container-edge mt-16 text-center">
          <Button onClick={() => open()} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8">
            Agendar minha avaliação
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
