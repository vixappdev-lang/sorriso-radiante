import { useState } from "react";
import { FileSignature, Plus, Copy, ExternalLink, Check, Trash2, ShieldCheck, Clock, Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import PdfPreviewModal from "@/admin/components/PdfPreviewModal";
import {
  useAnamnesisTemplates,
  usePatientAnamnesis,
  useCreateAnamnesis,
  useDeleteAnamnesis,
  type PatientAnamnesis,
} from "@/admin/hooks/useAnamnesis";
import { useClinicBrand } from "@/hooks/useClinicBrand";
import { generateAnamnesisPdf } from "@/admin/lib/pdf";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = { patientPhone: string; patientName: string; patientEmail?: string | null };

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Aguardando", cls: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" },
  completed: { label: "Preenchida", cls: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30" },
  signed: { label: "Assinada", cls: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30" },
};

export default function PatientAnamnesisTab({ patientPhone, patientName, patientEmail }: Props) {
  const { data: templates = [] } = useAnamnesisTemplates();
  const { data: forms = [], refetch } = usePatientAnamnesis(patientPhone);
  const create = useCreateAnamnesis();
  const del = useDeleteAnamnesis();
  const brand = useClinicBrand();
  const [open, setOpen] = useState(false);
  const [tplId, setTplId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfTarget, setPdfTarget] = useState<PatientAnamnesis | null>(null);

  async function handleCreate() {
    if (!tplId) return toast({ title: "Escolha um template", variant: "destructive" });
    try {
      await create.mutateAsync({ patient_phone: patientPhone, patient_name: patientName, template_id: tplId });
      toast({ title: "Anamnese criada", description: "Copie o link e envie ao paciente." });
      setOpen(false);
      setTplId("");
      refetch();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/anamnese/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 1800);
    toast({ title: "Link copiado" });
  }

  function viewSignature(f: PatientAnamnesis) {
    setPdfTarget(f);
    setPdfOpen(true);
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setOpen(true)} size="sm" className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova anamnese
      </Button>

      {forms.length === 0 ? (
        <EmptyState icon={FileSignature} title="Nenhuma anamnese ainda" description="Crie e envie por link público para o paciente preencher e assinar." />
      ) : (
        <ul className="space-y-2">
          {forms.map((f) => {
            const st = STATUS[f.status] ?? STATUS.pending;
            const url = `${window.location.origin}/anamnese/${f.token}`;
            const tplName = (f.template_snapshot as any)?.name ?? "Anamnese";
            const isSigned = f.status === "signed" || f.status === "completed";
            return (
              <li key={f.id} className="rounded-xl border border-[hsl(var(--admin-border))] bg-card p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tplName}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {new Date(f.created_at).toLocaleDateString("pt-BR")}
                      {f.signed_at && (
                        <>
                          <span className="mx-1">·</span>
                          <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          assinada {new Date(f.signed_at).toLocaleDateString("pt-BR")}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", st.cls)}>{st.label}</Badge>
                </div>

                {isSigned ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => viewSignature(f)}
                    >
                      <Eye className="h-3 w-3 mr-1.5" /> Ver assinatura · PDF
                    </Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => copyLink(f.token)} title="Copiar link público">
                      {copied === f.token ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    {f.status !== "signed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm("Excluir esta anamnese?")) return;
                          await del.mutateAsync(f.id);
                          refetch();
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-rose-500" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => copyLink(f.token)}>
                      {copied === f.token ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copiar link
                    </Button>
                    <a href={url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="h-8"><ExternalLink className="h-3 w-3" /></Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Excluir esta anamnese?")) return;
                        await del.mutateAsync(f.id);
                        refetch();
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-rose-500" />
                    </Button>
                  </div>
                )}

                {f.signature_hash && (
                  <p className="mt-2 text-[10px] text-muted-foreground font-mono break-all opacity-70">
                    Hash: {f.signature_hash.slice(0, 32)}…
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <EntityModal
        open={open}
        onOpenChange={setOpen}
        title="Nova anamnese"
        description="Selecione o template; o link público será gerado para envio ao paciente."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!tplId || create.isPending}>
              Criar e gerar link
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Template</Label>
            <Select value={tplId} onValueChange={setTplId}>
              <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}{t.specialty ? ` — ${t.specialty}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground">
            O paciente recebe um link público (válido por 60 dias), preenche pelo celular e assina digitalmente. A assinatura recebe hash SHA-256 + IP + timestamp para validade legal (Lei 14.063/2020).
          </p>
        </div>
      </EntityModal>

      {pdfTarget && (
        <PdfPreviewModal
          open={pdfOpen}
          onOpenChange={(v) => { setPdfOpen(v); if (!v) setPdfTarget(null); }}
          title={`Anamnese assinada · ${patientName}`}
          description={`${(pdfTarget.template_snapshot as any)?.name ?? "Anamnese"} · documento eletrônico com validade jurídica`}
          filename={`anamnese-${patientName.replace(/\s+/g, "_")}-${pdfTarget.id.slice(0, 8)}.pdf`}
          buildDoc={() => generateAnamnesisPdf({
            clinic: {
              name: brand.name,
              phone: brand.phone,
              email: brand.email,
              address: brand.address,
              cep: brand.cep,
            },
            patient: { name: patientName, phone: patientPhone, email: patientEmail ?? null },
            template: {
              name: (pdfTarget.template_snapshot as any)?.name ?? "Anamnese",
              specialty: (pdfTarget.template_snapshot as any)?.specialty,
            },
            questions: ((pdfTarget.template_snapshot as any)?.questions ?? []) as any,
            answers: (pdfTarget.answers as any) ?? {},
            signature: {
              dataUrl: pdfTarget.signature_data,
              signedAt: pdfTarget.signed_at,
              ip: pdfTarget.signature_ip,
              hash: pdfTarget.signature_hash,
            },
            createdAt: pdfTarget.created_at,
          })}
        />
      )}
    </div>
  );
}
