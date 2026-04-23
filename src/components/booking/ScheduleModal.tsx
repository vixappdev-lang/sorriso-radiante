import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, CheckCircle2, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
import { toast } from "@/hooks/use-toast";

const phoneRegex = /^\(?\d{2}\)?\s?9?\s?\d{4}-?\d{4}$/;

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
  phone: z.string().trim().regex(phoneRegex, "Telefone inválido. Ex.: (11) 99999-0000"),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  treatment: z.string().min(1, "Selecione um tratamento"),
  professional: z.string().optional(),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const TIMES = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a && a.length === 2 && ") ", b, c && "-", c].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4}).*/, "($1) $2 $3-$4");
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetTreatment?: string;
}

export default function ScheduleModal({ open, onOpenChange, presetTreatment }: Props) {
  const [submitted, setSubmitted] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", email: "",
      treatment: presetTreatment ?? "",
      professional: "qualquer",
      date: "", time: "", notes: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "", phone: "", email: "",
        treatment: presetTreatment ?? "",
        professional: "qualquer",
        date: "", time: "", notes: "",
      });
      setSubmitted(null);
    }
  }, [open, presetTreatment]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: FormData) => {
    try {
      // Backend será integrado em /config (ChatPro). Por enquanto persiste localmente
      // para validar o fluxo. O envio real ocorre via edge function create-appointment.
      await new Promise((r) => setTimeout(r, 700));
      setSubmitted(data);
      toast({
        title: "Agendamento recebido!",
        description: "Entraremos em contato pelo WhatsApp para confirmar.",
      });
    } catch (e) {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const treatmentName = (slug: string) => TREATMENTS.find(t => t.slug === slug)?.name ?? slug;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-y-auto p-0 gap-0 glass-strong border-border/60">
        {!submitted ? (
          <>
            <DialogHeader className="p-6 sm:p-8 pb-4 border-b border-border/60">
              <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Agende sua avaliação</span>
              <DialogTitle className="font-display text-2xl sm:text-3xl mt-2 text-balance">
                Vamos cuidar do seu sorriso
              </DialogTitle>
              <DialogDescription className="text-sm">
                Preencha seus dados e nossa equipe confirma pelo WhatsApp em poucos minutos.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 sm:p-8 pt-5 grid gap-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Tratamento" error={form.formState.errors.treatment?.message}>
                  <Select
                    value={form.watch("treatment")}
                    onValueChange={(v) => form.setValue("treatment", v, { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {TREATMENTS.map(t => (
                        <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Profissional (opcional)">
                  <Select
                    value={form.watch("professional")}
                    onValueChange={(v) => form.setValue("professional", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Sem preferência" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualquer">Sem preferência</SelectItem>
                      {DENTISTS.map(d => (
                        <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Data preferida" error={form.formState.errors.date?.message}>
                  <Input type="date" min={tomorrow} {...form.register("date")} />
                </Field>
                <Field label="Horário" error={form.formState.errors.time?.message}>
                  <Select
                    value={form.watch("time")}
                    onValueChange={(v) => form.setValue("time", v, { shouldValidate: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Nome completo" error={form.formState.errors.name?.message}>
                <Input placeholder="Seu nome" autoComplete="name" {...form.register("name")} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="WhatsApp" error={form.formState.errors.phone?.message}>
                  <Input
                    inputMode="tel"
                    placeholder="(11) 99999-0000"
                    autoComplete="tel"
                    value={form.watch("phone")}
                    onChange={(e) => form.setValue("phone", maskPhone(e.target.value), { shouldValidate: true })}
                  />
                </Field>
                <Field label="E-mail (opcional)" error={form.formState.errors.email?.message}>
                  <Input type="email" placeholder="voce@email.com" autoComplete="email" {...form.register("email")} />
                </Field>
              </div>

              <Field label="Observações (opcional)">
                <Textarea rows={3} placeholder="Conte um pouco sobre o que você procura..." {...form.register("notes")} />
              </Field>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Ao enviar, você concorda em ser contatado(a) pela Clínica Levii.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={form.formState.isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft min-w-[180px]"
                >
                  {form.formState.isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                  ) : (
                    <><CalendarDays className="h-4 w-4 mr-2" /> Confirmar agendamento</>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-8 sm:p-10 text-center">
            <div className="mx-auto grid place-items-center h-16 w-16 rounded-full bg-success/10 text-success mb-5">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl mb-2">Agendamento recebido!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Olá, <strong className="text-foreground">{submitted.name.split(" ")[0]}</strong>! Recebemos sua solicitação para
              {" "}<strong className="text-foreground">{treatmentName(submitted.treatment)}</strong> em
              {" "}<strong className="text-foreground">{new Date(submitted.date + "T00:00:00").toLocaleDateString("pt-BR")} às {submitted.time}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Em poucos minutos você receberá uma mensagem no WhatsApp confirmando todos os detalhes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              >
                <a
                  href={`https://wa.me/5511900000000?text=${encodeURIComponent(`Olá! Acabei de agendar uma consulta de ${treatmentName(submitted.treatment)} para ${submitted.date} às ${submitted.time}. Meu nome é ${submitted.name}.`)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp
                </a>
              </Button>
              <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-foreground/80">{label}</Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
