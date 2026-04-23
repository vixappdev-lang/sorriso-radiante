import { motion } from "framer-motion";
import { Microscope, ScanLine, Cpu, Camera, Radio, Activity } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { useScheduleModal } from "@/components/booking/ScheduleModalProvider";

const TECH = [
  { icon: ScanLine, title: "Scanner Intraoral 3D", text: "Moldagens digitais sem aquela massinha desconfortável. Precisão de mícrons em segundos." },
  { icon: Cpu, title: "Tomografia Cone Beam", text: "Imagens tridimensionais de altíssima resolução para diagnósticos e planejamentos cirúrgicos." },
  { icon: Microscope, title: "Microscopia Operatória", text: "Aumento óptico de até 25x para tratamentos endodônticos e cirurgias com máxima precisão." },
  { icon: Camera, title: "Fotografia Clínica", text: "Documentação completa antes/durante/depois para acompanhar cada detalhe da sua evolução." },
  { icon: Radio, title: "Laser Terapêutico", text: "Cicatrização acelerada, controle de dor e clareamentos sem sensibilidade." },
  { icon: Activity, title: "CAD/CAM Same Day", text: "Coroas e restaurações em cerâmica feitas no mesmo dia, sem moldes provisórios." },
];

export default function Tecnologia() {
  const { open } = useScheduleModal();
  return (
    <SiteLayout>
      <SEO
        title="Tecnologia — Clínica Levii"
        description="Tecnologia de ponta em odontologia: scanner intraoral, tomografia 3D, microscopia, laser e CAD/CAM. Diagnósticos precisos e tratamentos eficientes."
      />
      <PageHero
        eyebrow="Tecnologia"
        title="A tecnologia a serviço do seu conforto."
        subtitle="Equipamentos de última geração combinados com a mão experiente dos nossos especialistas. Diagnósticos mais precisos, tratamentos mais rápidos."
      />

      <section className="section">
        <div className="container-edge grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TECH.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.05, ease: "easeOut" }}
              className="rounded-2xl bg-card border border-border/70 p-6 sm:p-7 shadow-soft hover:shadow-elegant transition-smooth"
            >
              <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary-soft text-primary mb-5">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="container-edge mt-16 text-center">
          <Button onClick={() => open()} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8">
            Conhecer a clínica pessoalmente
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
