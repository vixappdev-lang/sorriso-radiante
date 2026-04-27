import { useState } from "react";
import { ClipboardEdit, Plus, Trash2, Pencil, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import {
  useClinicalRecords,
  useUpsertClinicalRecord,
  useDeleteClinicalRecord,
  type ClinicalRecord,
} from "@/admin/hooks/useClinicalRecords";
import { useProfessionals } from "@/admin/hooks/useProfessionals";
import { toast } from "@/hooks/use-toast";

type Props = { patientPhone: string; patientName: string };

const SPECIALTIES = [
  "Clínica Geral", "Ortodontia", "Endodontia", "Periodontia",
  "Implantodontia", "Odontopediatria", "Estética", "Cirurgia",
  "Prótese", "Outro",
];

const emptyForm = (patientName: string) => ({
  id: "",
  record_date: new Date().toISOString().slice(0, 10),
  title: "",
  specialty: "",
  professional_slug: "",
  professional_name: "",
  content: "",
  patient_name: patientName,
});

export default function PatientRecordsTab({ patientPhone, patientName }: Props) {
  const { data: records = [], refetch } = useClinicalRecords(patientPhone);
  const { data: pros = [] } = useProfessionals();
  const upsert = useUpsertClinicalRecord();
  const del = useDeleteClinicalRecord();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm(patientName));

  function openNew() {
    setForm(emptyForm(patientName));
    setModal(true);
  }

  function openEdit(r: ClinicalRecord) {
    setForm({
      id: r.id,
      record_date: r.record_date,
      title: r.title ?? "",
      specialty: r.specialty ?? "",
      professional_slug: r.professional_slug ?? "",
      professional_name: r.professional_name ?? "",
      content: r.content ?? "",
      patient_name: r.patient_name,
    });
    setModal(true);
  }

  async function save() {
    if (!form.content.trim() && !form.title.trim()) {
      return toast({ title: "Adicione um título ou conteúdo", variant: "destructive" });
    }
    try {
      await upsert.mutateAsync({
        id: form.id || undefined,
        patient_phone: patientPhone,
        patient_name: form.patient_name,
        record_date: form.record_date,
        title: form.title || null,
        specialty: form.specialty || null,
        professional_slug: form.professional_slug || null,
        professional_name: form.professional_name || null,
        content: form.content || null,
      } as any);
      toast({ title: "Prontuário salvo" });
      setModal(false);
      refetch();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={openNew} size="sm" className="w-full">
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova evolução
      </Button>

      {records.length === 0 ? (
        <EmptyState
          icon={ClipboardEdit}
          title="Sem prontuário ainda"
          description="Registre evoluções clínicas: queixa, exame, diagnóstico, plano e conduta."
        />
      ) : (
        <ol className="relative border-l-2 border-[hsl(var(--admin-border))] ml-2 space-y-3">
          {records.map((r) => (
            <li key={r.id} className="ml-4">
              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-card p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.title || "Evolução"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <CalIcon className="h-3 w-3" />
                      {new Date(r.record_date).toLocaleDateString("pt-BR")}
                      {r.specialty && <span>· {r.specialty}</span>}
                      {r.professional_name && <span>· {r.professional_name}</span>}
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(r)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={async () => {
                        if (!confirm("Excluir esta evolução?")) return;
                        await del.mutateAsync(r.id);
                        refetch();
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-rose-500" />
                    </Button>
                  </div>
                </div>
                {r.content && <p className="text-[13px] whitespace-pre-wrap leading-relaxed text-foreground/90">{r.content}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <EntityModal
        open={modal}
        onOpenChange={setModal}
        title={form.id ? "Editar evolução" : "Nova evolução clínica"}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save} disabled={upsert.isPending}>Salvar evolução</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={form.record_date}
                onChange={(e) => setForm({ ...form, record_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Especialidade</Label>
              <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Profissional</Label>
            <Select
              value={form.professional_slug}
              onValueChange={(v) => {
                const p = pros.find((x: any) => x.slug === v);
                setForm({ ...form, professional_slug: v, professional_name: p?.name ?? "" });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {pros.map((p: any) => <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Avaliação inicial · Restauração 26 · Ajuste oclusal"
            />
          </div>

          <div>
            <Label className="text-xs">Evolução</Label>
            <Textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={`Queixa principal:
Exame clínico:
Diagnóstico:
Plano de tratamento:
Conduta:
Próximo retorno:`}
            />
          </div>
        </div>
      </EntityModal>
    </div>
  );
}
