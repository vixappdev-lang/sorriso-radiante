import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import SignaturePad from "@/admin/components/SignaturePad";
import { useClinicBrand } from "@/hooks/useClinicBrand";
import { toast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

type Question = { id: string; label: string; type: "text" | "textarea" | "select"; options?: string[]; required?: boolean };

export default function PublicAnamnesis() {
  const { token } = useParams();
  const brand = useClinicBrand();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doc, setDoc] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("patient_anamnesis")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      setLoading(false);
      if (error || !data) {
        toast({ title: "Anamnese inválida ou expirada", variant: "destructive" });
        return;
      }
      setDoc(data);
      if (data.status === "signed") setDone(true);
      if (data.answers) setAnswers(data.answers as any);
    })();
  }, [token]);

  const tpl = doc?.template_snapshot ?? {};
  const questions: Question[] = (tpl.questions ?? []) as Question[];

  function setAnswer(id: string, v: string) {
    setAnswers((s) => ({ ...s, [id]: v }));
  }

  async function submit() {
    const missing = questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length) {
      return toast({ title: "Campos obrigatórios faltando", description: missing.map((m) => m.label).join(", "), variant: "destructive" });
    }
    if (!signature) return toast({ title: "Por favor, assine a anamnese", variant: "destructive" });
    setSubmitting(true);
    try {
      const ip = await fetch("https://api.ipify.org?format=json").then((r) => r.json()).then((d) => d.ip).catch(() => null);
      const { error } = await supabase.rpc("submit_anamnesis_with_token", {
        _token: token!,
        _answers: answers as any,
        _signature_data: signature,
        _signature_ip: ip,
      });
      if (error) throw error;
      setDone(true);
      toast({ title: "Anamnese enviada!", description: "Obrigado, recebemos suas respostas." });
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--admin-bg))]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--admin-bg))] p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold">Anamnese não encontrada</h1>
          <p className="text-sm text-muted-foreground mt-2">O link pode ter expirado. Entre em contato com a clínica.</p>
        </div>
      </div>
    );
  }
  if (done) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--admin-bg))] p-6">
        <SEO title="Anamnese concluída" description="Anamnese enviada com sucesso" />
        <div className="text-center max-w-md">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 grid place-items-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold">Anamnese enviada!</h1>
          <p className="text-sm text-muted-foreground mt-2">Obrigado, {doc.patient_name}. Suas respostas chegaram à clínica.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--admin-bg))] py-8 px-4">
      <SEO title={`Anamnese · ${brand.name}`} description="Preencha sua anamnese" />
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <FileText className="h-3.5 w-3.5" /> {tpl.specialty?.toUpperCase() ?? "ANAMNESE"}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{tpl.name ?? "Anamnese"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Olá, <strong>{doc.patient_name}</strong>. Responda com calma.</p>
        </header>

        <div className="bg-card rounded-2xl border shadow-sm p-5 sm:p-7 space-y-5">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <Label className="text-sm">
                {q.label}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {q.type === "select" ? (
                <Select value={answers[q.id] ?? ""} onValueChange={(v) => setAnswer(q.id, v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{q.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              ) : q.type === "textarea" ? (
                <Textarea rows={3} value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
              ) : (
                <Input value={answers[q.id] ?? ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
              )}
            </div>
          ))}

          <div className="pt-2 border-t">
            <Label className="text-sm flex items-center gap-1.5 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Assinatura digital <span className="text-destructive">*</span>
            </Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Ao assinar, você confirma que as informações são verdadeiras. Validade jurídica conforme Lei 14.063/2020.
            </p>
            <SignaturePad onChange={setSignature} />
          </div>

          <Button className="w-full h-11" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar anamnese
          </Button>
        </div>
      </div>
    </div>
  );
}
