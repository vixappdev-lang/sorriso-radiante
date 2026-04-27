import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MessageCircle, Phone, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useClinicName } from "@/hooks/useClinicBrand";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  message: z.string().trim().min(10, "Conte um pouquinho mais (mín. 10 caracteres)").max(1000),
});
type Data = z.infer<typeof schema>;

export default function Contato() {
  const [sent, setSent] = useState(false);
  const form = useForm<Data>({ resolver: zodResolver(schema), mode: "onBlur" });
  const clinicName = useClinicName();

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    toast({ title: "Mensagem enviada!", description: "Retornaremos em breve." });
  };

  return (
    <SiteLayout>
      <SEO
        title={`Contato — ${clinicName}`}
        description={`Fale com a ${clinicName}: WhatsApp, telefone, e-mail e formulário de contato. Estamos prontos para tirar suas dúvidas.`}
      />
      <PageHero
        eyebrow="Fale com a gente"
        title="Vamos conversar sobre o seu sorriso."
        subtitle="Tire dúvidas, peça um orçamento ou agende uma avaliação. Respondemos rapidinho."
      />

      <section className="section">
        <div className="container-edge grid lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2 grid gap-4 content-start">
            <ContactCard icon={MessageCircle} title="WhatsApp" subtitle="Resposta em minutos" link="https://wa.me/5527981120322" linkText="(27) 98112-0322" />
            <ContactCard icon={Phone} title="Telefone" subtitle="Seg–Sex 8h–19h" link="tel:+5527981120322" linkText="(27) 98112-0322" />
            <ContactCard icon={Mail} title="E-mail" subtitle="Respondemos em até 24h" link="mailto:contato@lynecloud.com.br" linkText="contato@lynecloud.com.br" />
            <ContactCard icon={MapPin} title="Endereço" subtitle="Rua Exemplo, 123 — Aracruz/ES" />
          </div>

          <div className="lg:col-span-3">
            {!sent ? (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="rounded-2xl bg-card border border-border/70 p-6 sm:p-8 shadow-soft grid gap-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Nome completo</Label>
                    <Input placeholder="Seu nome" {...form.register("name")} />
                    {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Telefone</Label>
                    <Input placeholder="(11) 99999-0000" {...form.register("phone")} />
                    {form.formState.errors.phone && <span className="text-xs text-destructive">{form.formState.errors.phone.message}</span>}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">E-mail</Label>
                  <Input type="email" placeholder="voce@email.com" {...form.register("email")} />
                  {form.formState.errors.email && <span className="text-xs text-destructive">{form.formState.errors.email.message}</span>}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">Mensagem</Label>
                  <Textarea rows={5} placeholder="Como podemos te ajudar?" {...form.register("message")} />
                  {form.formState.errors.message && <span className="text-xs text-destructive">{form.formState.errors.message.message}</span>}
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                  {form.formState.isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</> : "Enviar mensagem"}
                </Button>
              </form>
            ) : (
              <div className="rounded-2xl bg-card border border-border/70 p-10 text-center shadow-soft">
                <div className="mx-auto grid place-items-center h-16 w-16 rounded-full bg-success/10 text-success mb-5">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-semibold">Mensagem enviada!</h3>
                <p className="mt-2 text-muted-foreground">Em breve nossa equipe entrará em contato com você.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ContactCard({ icon: Icon, title, subtitle, link, linkText }: { icon: any; title: string; subtitle: string; link?: string; linkText?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center h-10 w-10 rounded-lg bg-primary-soft text-primary"><Icon className="h-4 w-4" /></span>
        <div>
          <h3 className="font-display text-base font-semibold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {link && linkText && (
        <a href={link} className="mt-4 block text-sm font-medium text-primary link-underline">{linkText}</a>
      )}
    </div>
  );
}
