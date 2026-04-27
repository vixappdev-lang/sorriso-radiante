import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, CheckCircle2, Loader2, MessageCircle, Sparkles, Clock, User, Stethoscope, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClinicName } from "@/hooks/useClinicBrand";
import { cn } from "@/lib/utils";

const phoneRegex = /^\(?\d{2}\)?\s?9?\s?\d{4}-?\d{4}$/;

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
  phone: z.string().trim().regex(phoneRegex, "Telefone inválido. Ex.: (27) 98112-0322"),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  treatment: z.string().min(1, "Selecione um tratamento"),
  professional: z.string().optional(),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const TIMES = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

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
  const [step, setStep] = useState<1 | 2>(1);

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
      setStep(1);
    }
  }, [open, presetTreatment]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: FormData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke("create-appointment", {
        body: data,
      });
      if (error) throw error;
      setSubmitted(data);
      toast({
        title: "Agendamento confirmado!",
        description: result?.whatsappSent
          ? "Enviamos a confirmação no seu WhatsApp."
          : "Recebemos sua solicitação. Em breve entraremos em contato.",
      });
    } catch (e: any) {
      console.error("Erro ao agendar:", e);
      toast({
        title: "Não foi possível agendar agora",
        description: "Tente novamente em alguns instantes ou fale conosco pelo WhatsApp.",
        variant: "destructive",
      });
    }
  };

  const treatmentName = (slug: string) => TREATMENTS.find(t => t.slug === slug)?.name ?? slug;
  const today = new Date(); today.setHours(0,0,0,0);

  const dateValue = form.watch("date") ? new Date(form.watch("date") + "T00:00:00") : undefined;

  const goNext = async () => {
    const ok = await form.trigger(["treatment", "date", "time"]);
    if (ok) setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-y-auto p-0 gap-0 border-border/60 rounded-2xl">
        {!submitted ? (
          <>
            {/* HEADER refinado */}
            <DialogHeader className="relative px-6 pt-6 pb-5 sm:px-8 sm:pt-8 border-b border-border/60 bg-gradient-to-br from-primary-soft/60 via-background to-background">
              <div className="flex items-start gap-3">
                <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary text-primary-foreground shadow-soft shrink-0">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    <Sparkles className="h-3 w-3" /> Avaliação sem compromisso
                  </span>
                  <DialogTitle className="font-display text-xl sm:text-2xl mt-1.5 text-balance leading-tight">
                    Agende sua consulta
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm mt-1">
                    {step === 1 ? "1 de 2 — Escolha o tratamento, data e horário." : "2 de 2 — Seus dados de contato."}
                  </DialogDescription>
                </div>
              </div>

              {/* progress bar */}
              <div className="mt-4 h-1 w-full rounded-full bg-border/70 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: step === 1 ? "50%" : "100%" }}
                />
              </div>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 pt-5 sm:px-8 sm:pb-8 grid gap-5">
              {step === 1 ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field icon={Stethoscope} label="Tratamento" error={form.formState.errors.treatment?.message}>
                      <Select
                        value={form.watch("treatment")}
                        onValueChange={(v) => form.setValue("treatment", v, { shouldValidate: true })}
                      >
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {TREATMENTS.map(t => (
                            <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field icon={User} label="Profissional (opcional)">
                      <Select
                        value={form.watch("professional")}
                        onValueChange={(v) => form.setValue("professional", v)}
                      >
                        <SelectTrigger className="h-11"><SelectValue placeholder="Sem preferência" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qualquer">Sem preferência</SelectItem>
                          {DENTISTS.map(d => (
                            <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field icon={CalendarIcon} label="Data preferida" error={form.formState.errors.date?.message}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !dateValue && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateValue ? format(dateValue, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={dateValue}
                          onSelect={(d) => {
                            if (d) form.setValue("date", format(d, "yyyy-MM-dd"), { shouldValidate: true });
                          }}
                          disabled={(date) => date < today}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field icon={Clock} label="Horário disponível" error={form.formState.errors.time?.message}>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {TIMES.map((t) => {
                        const active = form.watch("time") === t;
                        return (
                          <button
                            type="button"
                            key={t}
                            onClick={() => form.setValue("time", t, { shouldValidate: true })}
                            className={cn(
                              "h-10 rounded-lg text-sm font-medium border transition-smooth",
                              active
                                ? "bg-primary text-primary-foreground border-primary shadow-soft"
                                : "bg-background border-border/70 text-foreground/80 hover:border-primary/40 hover:text-primary"
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                      type="button"
                      onClick={goNext}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[180px]"
                    >
                      Continuar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Resumo da etapa 1 */}
                  <div className="rounded-xl border border-border/70 bg-muted/40 p-4 grid sm:grid-cols-3 gap-3 text-xs">
                    <Summary icon={Stethoscope} label="Tratamento" value={treatmentName(form.watch("treatment"))} />
                    <Summary icon={CalendarIcon} label="Data" value={dateValue ? format(dateValue, "dd 'de' MMM", { locale: ptBR }) : "-"} />
                    <Summary icon={Clock} label="Horário" value={form.watch("time")} />
                  </div>

                  <Field icon={User} label="Nome completo" error={form.formState.errors.name?.message}>
                    <Input className="h-11" placeholder="Seu nome" autoComplete="name" {...form.register("name")} />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="WhatsApp" error={form.formState.errors.phone?.message}>
                      <Input
                        className="h-11"
                        inputMode="tel"
                        placeholder="(27) 98112-0322"
                        autoComplete="tel"
                        value={form.watch("phone")}
                        onChange={(e) => form.setValue("phone", maskPhone(e.target.value), { shouldValidate: true })}
                      />
                    </Field>
                    <Field label="E-mail (opcional)" error={form.formState.errors.email?.message}>
                      <Input className="h-11" type="email" placeholder="voce@email.com" autoComplete="email" {...form.register("email")} />
                    </Field>
                  </div>

                  <Field label="Observações (opcional)">
                    <Textarea rows={3} placeholder="Conte um pouco sobre o que você procura..." {...form.register("notes")} />
                  </Field>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Voltar</Button>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={form.formState.isSubmitting}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft min-w-[200px]"
                    >
                      {form.formState.isSubmitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirmando…</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar agendamento</>
                      )}
                    </Button>
                  </div>

                  <p className="text-[11px] text-muted-foreground text-center sm:text-left">
                    Ao enviar, você concorda em ser contatado(a) pela LyneCloud.
                  </p>
                </>
              )}
            </form>
          </>
        ) : (
          <div className="relative overflow-hidden">
            {/* Cabeçalho de sucesso com gradient */}
            <div className="relative px-6 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10 text-center bg-gradient-to-br from-success/15 via-primary-soft/40 to-background overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-success/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative mx-auto grid place-items-center h-20 w-20 rounded-full bg-gradient-to-br from-success to-success/70 text-success-foreground shadow-[0_10px_40px_-10px_hsl(var(--success)/0.5)]">
                <CheckCircle2 className="h-10 w-10" strokeWidth={2.2} />
              </div>

              <h3 className="relative font-display text-2xl sm:text-3xl mt-6 text-balance">
                Pronto, {submitted.name.split(" ")[0]}! 🎉
              </h3>
              <p className="relative text-muted-foreground mt-2 text-sm sm:text-[15px] max-w-md mx-auto leading-relaxed">
                Seu agendamento foi <strong className="text-foreground">confirmado</strong> com sucesso.
                Em instantes você receberá os detalhes no WhatsApp.
              </p>
            </div>

            {/* Resumo do agendamento — destaque */}
            <div className="px-6 sm:px-10 -mt-4 relative">
              <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-5 grid sm:grid-cols-3 gap-4">
                <Summary icon={Stethoscope} label="Tratamento" value={treatmentName(submitted.treatment)} />
                <Summary icon={CalendarIcon} label="Data" value={format(new Date(submitted.date + "T00:00:00"), "dd 'de' MMM", { locale: ptBR })} />
                <Summary icon={Clock} label="Horário" value={submitted.time} />
              </div>
            </div>

            {/* Próximos passos */}
            <div className="px-6 sm:px-10 mt-6">
              <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-2.5">
                Próximos passos
              </p>
              <ol className="space-y-2 text-[13px] text-foreground/85">
                <Step n={1}>Você receberá a confirmação no WhatsApp em alguns segundos.</Step>
                <Step n={2}>Nossa equipe entrará em contato caso precise ajustar algum detalhe.</Step>
                <Step n={3}>Chegue 10 min antes para um cafezinho. Te esperamos! ☕</Step>
              </ol>
            </div>

            <div className="px-6 pb-6 pt-6 sm:px-10 sm:pb-8 mt-2 flex flex-col sm:flex-row gap-2.5">
              <Button variant="outline" size="lg" onClick={() => onOpenChange(false)} className="sm:flex-1">
                Fechar
              </Button>
              <Button
                asChild
                size="lg"
                className="sm:flex-[2] bg-[#25D366] hover:bg-[#1FBA5A] text-white shadow-soft"
              >
                <a
                  href={`https://wa.me/5527981120322?text=${encodeURIComponent(`Olá! Acabei de agendar uma consulta de ${treatmentName(submitted.treatment)} para ${submitted.date} às ${submitted.time}. Meu nome é ${submitted.name}.`)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children, icon: Icon }: { label: string; error?: string; children: React.ReactNode; icon?: any }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-foreground/80 inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        {label}
      </Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary-soft text-primary shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid place-items-center h-6 w-6 rounded-full bg-primary-soft text-primary text-[11px] font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <span className="leading-relaxed pt-0.5">{children}</span>
    </li>
  );
}
