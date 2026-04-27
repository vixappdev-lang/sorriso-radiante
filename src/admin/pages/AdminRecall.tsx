import { useMemo, useState } from "react";
import {
  Bell, Plus, MessageCircle, CheckCircle2, Clock, AlertTriangle,
  Calendar as CalIcon, Trash2, Phone, Send,
} from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import StatusPill from "@/admin/components/StatusPill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRecallTasks, useUpsertRecall, useDeleteRecall, type RecallTask } from "@/admin/hooks/useRecall";
import { useClinicBrand } from "@/hooks/useClinicBrand";
import { toast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviado",
  done: "Concluído",
  cancelled: "Cancelado",
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function diffDays(date: string) {
  const d = new Date(date + "T00:00:00").getTime();
  const t = new Date(todayStr() + "T00:00:00").getTime();
  return Math.round((d - t) / 86400000);
}

export default function AdminRecall() {
  const { data: tasks = [] } = useRecallTasks("all");
  const upsert = useUpsertRecall();
  const del = useDeleteRecall();
  const { brand } = useClinicBrand();

  const [open, setOpen] = useState<"new" | RecallTask | null>(null);
  const emptyForm = { id: "", patient_name: "", patient_phone: "", treatment: "", due_date: todayStr(), notes: "", status: "pending" };
  const [form, setForm] = useState<any>(emptyForm);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const stats = useMemo(() => {
    let pending = 0, overdue = 0, today = 0, done = 0;
    tasks.forEach((t) => {
      if (t.status === "done") return done++;
      if (t.status === "cancelled") return;
      const d = diffDays(t.due_date);
      if (d < 0) overdue++;
      else if (d === 0) today++;
      pending++;
    });
    return { pending, overdue, today, done };
  }, [tasks]);

  function openNew() { setForm({ ...emptyForm }); setOpen("new"); }
  function openEdit(t: RecallTask) {
    setForm({
      id: t.id, patient_name: t.patient_name, patient_phone: t.patient_phone,
      treatment: t.treatment ?? "", due_date: t.due_date, notes: t.notes ?? "", status: t.status,
    });
    setOpen(t);
  }

  async function save() {
    if (!form.patient_name || !form.patient_phone || !form.due_date) {
      return toast({ title: "Preencha nome, telefone e data", variant: "destructive" });
    }
    try {
      await upsert.mutateAsync({
        id: form.id || undefined,
        patient_name: form.patient_name,
        patient_phone: form.patient_phone,
        treatment: form.treatment || null,
        due_date: form.due_date,
        notes: form.notes || null,
        status: form.status,
      } as any);
      toast({ title: "Recall salvo" });
      setOpen(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  async function markSent(t: RecallTask) {
    await upsert.mutateAsync({ id: t.id, status: "sent", sent_at: new Date().toISOString(), patient_name: t.patient_name, patient_phone: t.patient_phone, due_date: t.due_date } as any);
    toast({ title: "Marcado como enviado" });
  }
  async function markDone(t: RecallTask) {
    await upsert.mutateAsync({ id: t.id, status: "done", patient_name: t.patient_name, patient_phone: t.patient_phone, due_date: t.due_date } as any);
    toast({ title: "Recall concluído" });
  }

  function whatsappLink(t: RecallTask) {
    const msg = encodeURIComponent(
      `Olá ${t.patient_name}! Aqui é da ${brand.name}. Faz um tempinho desde seu último cuidado${t.treatment ? ` (${t.treatment})` : ""}, que tal agendarmos seu retorno? 😊`
    );
    return `https://wa.me/55${t.patient_phone.replace(/\D/g, "")}?text=${msg}`;
  }

  const columns: Column<RecallTask>[] = [
    { key: "due_date", header: "Vencimento", cell: (r) => {
      const d = diffDays(r.due_date);
      const cls = d < 0 ? "text-rose-600" : d === 0 ? "text-amber-600" : "text-foreground";
      return (
        <div className="min-w-[110px]">
          <p className={`text-sm font-medium tabular-nums ${cls}`}>{new Date(r.due_date).toLocaleDateString("pt-BR")}</p>
          <p className="text-[11px] text-muted-foreground">{d < 0 ? `${Math.abs(d)}d em atraso` : d === 0 ? "hoje" : `em ${d}d`}</p>
        </div>
      );
    } },
    { key: "patient_name", header: "Paciente", cell: (r) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{r.patient_name}</p>
        <p className="text-xs text-muted-foreground truncate">{r.patient_phone}</p>
      </div>
    ) },
    { key: "treatment", header: "Tratamento", cell: (r) => <span className="text-sm text-muted-foreground">{r.treatment || "—"}</span>, className: "hidden md:table-cell" },
    { key: "notes", header: "Observação", cell: (r) => <span className="text-xs text-muted-foreground line-clamp-2">{r.notes || "—"}</span>, className: "hidden lg:table-cell" },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} label={STATUS_LABEL[r.status]} /> },
  ];

  const filterTab = (tab: string) => {
    if (tab === "all") return tasks;
    if (tab === "overdue") return tasks.filter((t) => t.status !== "done" && t.status !== "cancelled" && diffDays(t.due_date) < 0);
    if (tab === "today") return tasks.filter((t) => t.status !== "done" && t.status !== "cancelled" && diffDays(t.due_date) === 0);
    if (tab === "future") return tasks.filter((t) => t.status === "pending" && diffDays(t.due_date) > 0);
    return tasks.filter((t) => t.status === tab);
  };

  return (
    <>
      <PageHeader
        title="Recall de pacientes"
        description="Fila inteligente de retornos: avise pacientes na hora certa para retomar tratamentos, manutenção, limpeza ou pós-operatório."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo recall</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Pendentes" value={stats.pending} icon={Clock} accent="amber" compact />
        <KpiCard label="Atrasados" value={stats.overdue} icon={AlertTriangle} accent={stats.overdue > 0 ? "rose" : "emerald"} compact />
        <KpiCard label="Hoje" value={stats.today} icon={Bell} accent="blue" compact />
        <KpiCard label="Concluídos" value={stats.done} icon={CheckCircle2} accent="emerald" compact />
      </div>

      <Tabs defaultValue="overdue">
        <TabsList>
          <TabsTrigger value="overdue">Atrasados {stats.overdue > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">{stats.overdue}</Badge>}</TabsTrigger>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="future">Próximos</TabsTrigger>
          <TabsTrigger value="sent">Enviados</TabsTrigger>
          <TabsTrigger value="done">Concluídos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
        {(["overdue", "today", "future", "sent", "done", "all"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filterTab(tab).length === 0 ? (
              <EmptyState icon={Bell} title="Nenhum recall nessa lista" description="Quando houver pacientes para chamar de volta, eles aparecem aqui." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo recall</Button>} />
            ) : (
              <DataTable
                rows={filterTab(tab) as RecallTask[]}
                columns={columns}
                pageSize={15}
                searchable
                searchKeys={["patient_name", "patient_phone", "treatment"] as any}
                onRowClick={openEdit}
                rowActions={(r) => (
                  <>
                    <a href={whatsappLink(r)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" title="Enviar WhatsApp"><MessageCircle className="h-4 w-4 text-emerald-600" /></Button>
                    </a>
                    {r.status === "pending" && (
                      <Button size="sm" variant="ghost" title="Marcar como enviado" onClick={(e) => { e.stopPropagation(); markSent(r); }}>
                        <Send className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    {r.status !== "done" && (
                      <Button size="sm" variant="ghost" title="Concluir" onClick={(e) => { e.stopPropagation(); markDone(r); }}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDel(r.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <EntityModal
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open === "new" ? "Novo recall" : "Editar recall"}
        description="Crie um lembrete para chamar o paciente de volta."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome*</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} placeholder="Maria da Silva" /></div>
            <div><Label className="text-xs">Telefone*</Label><Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tratamento / motivo</Label><Input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} placeholder="Limpeza, manutenção…" /></div>
            <div><Label className="text-xs">Vencimento*</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes para o atendente lembrar do paciente…" /></div>
        </div>
      </EntityModal>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir recall?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}
