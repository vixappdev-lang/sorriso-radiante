import { useMemo, useState } from "react";
import { Megaphone, Plus, MessageCircle, Pencil, Trash2, Phone, DollarSign, Filter } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  MouseSensor, TouchSensor, useDroppable, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import EmptyState from "@/admin/components/EmptyState";
import EntityModal from "@/admin/components/EntityModal";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import StatusPill from "@/admin/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads, useUpsertLead, useDeleteLead, type Lead } from "@/admin/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { key: "novo", label: "Novo", color: "sky" },
  { key: "contato", label: "Em contato", color: "violet" },
  { key: "orcamento", label: "Orçamento enviado", color: "amber" },
  { key: "negociacao", label: "Negociação", color: "blue" },
  { key: "fechado", label: "Fechado", color: "emerald" },
  { key: "perdido", label: "Perdido", color: "rose" },
] as const;

const COLOR_DOTS: Record<string, string> = {
  sky: "bg-sky-500", violet: "bg-violet-500", amber: "bg-amber-500",
  blue: "bg-blue-500", emerald: "bg-emerald-500", rose: "bg-rose-500",
};

function emptyForm() {
  return { id: "", name: "", phone: "", email: "", source: "site", status: "novo", treatment_interest: "", estimated_value: "", notes: "", owner: "" };
}

export default function AdminLeads() {
  const { data: leads = [] } = useLeads();
  const upsert = useUpsertLead();
  const del = useDeleteLead();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"new" | Lead | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sensores separados: mouse responde rápido, touch precisa de delay para não conflitar com scroll vertical do mobile
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    COLUMNS.forEach((c) => map[c.key] = []);
    leads
      .filter((l) => !search || `${l.name} ${l.phone} ${l.email} ${l.treatment_interest}`.toLowerCase().includes(search.toLowerCase()))
      .forEach((l) => {
        const k = COLUMNS.find((c) => c.key === l.status)?.key ?? "novo";
        (map[k] ||= []).push(l);
      });
    return map;
  }, [leads, search]);

  const stats = useMemo(() => {
    const total = leads.length;
    const won = leads.filter((l) => l.status === "fechado").length;
    const lost = leads.filter((l) => l.status === "perdido").length;
    const open = total - won - lost;
    const conversion = total ? Math.round((won / total) * 100) : 0;
    const value = leads.filter((l) => l.status !== "perdido").reduce((s, l) => s + (l.estimated_value_cents || 0), 0);
    return { total, open, won, conversion, value };
  }, [leads]);

  function openNew() { setForm(emptyForm()); setModal("new"); }
  function openEdit(l: Lead) {
    setForm({
      id: l.id, name: l.name, phone: l.phone ?? "", email: l.email ?? "",
      source: l.source ?? "site", status: l.status, treatment_interest: l.treatment_interest ?? "",
      estimated_value: l.estimated_value_cents ? (l.estimated_value_cents / 100).toFixed(2) : "",
      notes: l.notes ?? "", owner: l.owner ?? "",
    });
    setModal(l);
  }
  async function save() {
    if (!form.name) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    const cents = form.estimated_value ? Math.round(parseFloat(String(form.estimated_value).replace(",", ".")) * 100) : null;
    try {
      await upsert.mutateAsync({
        id: form.id || undefined, name: form.name, phone: form.phone || null, email: form.email || null,
        source: form.source || null, status: form.status, treatment_interest: form.treatment_interest || null,
        estimated_value_cents: cents, notes: form.notes || null, owner: form.owner || null,
        last_touch_at: new Date().toISOString(),
      } as any);
      toast({ title: "Lead salvo" });
      setModal(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  function handleDragStart(e: DragStartEvent) { setDraggingId(String(e.active.id)); }

  // Drag end com update otimista (evita o "card volta") + persistência sem reenviar campos do lead
  async function handleDragEnd(e: DragEndEvent) {
    const id = draggingId;
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const newStatus = String(over.id);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Otimista: atualiza cache imediatamente
    const prev = qc.getQueryData<Lead[]>(["admin", "leads"]);
    qc.setQueryData<Lead[]>(["admin", "leads"], (old) =>
      (old ?? []).map((l) => (l.id === leadId ? { ...l, status: newStatus, last_touch_at: new Date().toISOString() } : l))
    );

    // Persiste apenas o status (não sobrescreve outros campos)
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus, last_touch_at: new Date().toISOString() })
      .eq("id", leadId);

    if (error) {
      qc.setQueryData(["admin", "leads"], prev);
      toast({ title: "Erro ao mover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Movido para "${COLUMNS.find((c) => c.key === newStatus)?.label}"` });
    // Refetch silencioso pra alinhar com servidor
    qc.invalidateQueries({ queryKey: ["admin", "leads"] });
  }

  function brl(cents: number | null) { return cents ? (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"; }

  const draggingLead = draggingId ? leads.find((l) => l.id === draggingId) : null;

  return (
    <>
      <PageHeader
        title="Leads & Captação"
        description="Funil comercial: arraste os cards entre colunas para atualizar o status."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo lead</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 mb-4">
        <KpiCard label="Total de leads" value={stats.total} icon={Megaphone} accent="blue" compact />
        <KpiCard label="Em aberto" value={stats.open} icon={Filter} accent="amber" compact />
        <KpiCard label="Convertidos" value={stats.won} icon={DollarSign} accent="emerald" compact />
        <KpiCard label="Taxa conversão" value={`${stats.conversion}%`} icon={DollarSign} accent="violet" compact />
        <KpiCard label="Pipeline" value={brl(stats.value)} icon={DollarSign} accent="sky" compact />
      </div>

      <div className="admin-card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-3.5">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, telefone, e-mail…" className="h-10 sm:max-w-md" />
        <div className="ml-auto">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="table">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nenhum lead ainda" description="Adicione contatos manualmente ou aguarde leads chegarem do site." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo lead</Button>} />
      ) : view === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.key} col={col} leads={grouped[col.key] ?? []} onCardClick={openEdit} brl={brl} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {draggingLead && <LeadCard lead={draggingLead} brl={brl} dragging />}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="admin-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(220_24%_98%)] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Contato</th>
                <th className="text-left px-4 py-3">Interesse</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-[hsl(var(--admin-border))] hover:bg-[hsl(220_24%_98%)] cursor-pointer" onClick={() => openEdit(l)}>
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.phone || l.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.treatment_interest || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{brl(l.estimated_value_cents)}</td>
                  <td className="px-4 py-3"><StatusPill status={l.status} /></td>
                  <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EntityModal
        open={!!modal} onOpenChange={(v) => !v && setModal(null)}
        title={modal === "new" ? "Novo lead" : "Editar lead"} size="md"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div><Label className="text-xs">Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Origem</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["site", "instagram", "indicação", "google", "facebook", "outro"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tratamento de interesse</Label><Input value={form.treatment_interest} onChange={(e) => setForm({ ...form, treatment_interest: e.target.value })} placeholder="Ex.: Implante" /></div>
            <div><Label className="text-xs">Valor estimado (R$)</Label><Input value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} placeholder="0,00" /></div>
          </div>
          <div><Label className="text-xs">Responsável</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
          <div><Label className="text-xs">Anotações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </EntityModal>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir lead?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}

function KanbanColumn({ col, leads, onCardClick, brl }: { col: typeof COLUMNS[number]; leads: Lead[]; onCardClick: (l: Lead) => void; brl: (c: number | null) => string }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "admin-card flex flex-col min-h-[420px] overflow-hidden transition-all duration-150",
        isOver && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.01]"
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-[hsl(var(--admin-border))] px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2 w-2 rounded-full", COLOR_DOTS[col.color])} />
          <h3 className="text-[13px] font-semibold truncate">{col.label}</h3>
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{leads.length}</span>
      </header>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leads.length === 0 ? (
          <div className="flex-1 grid place-items-center py-10 text-[11px] text-muted-foreground border border-dashed border-[hsl(var(--admin-border))] rounded-lg">
            Solte aqui
          </div>
        ) : leads.map((l) => (
          <DraggableLead key={l.id} lead={l} onClick={() => onCardClick(l)} brl={brl} />
        ))}
      </div>
    </div>
  );
}

function DraggableLead({ lead, onClick, brl }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    touchAction: "none",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("select-none", isDragging && "opacity-30")}
    >
      <LeadCard lead={lead} brl={brl} onClick={onClick} />
    </div>
  );
}

function LeadCard({ lead, brl, onClick, dragging }: any) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "rounded-lg border border-[hsl(var(--admin-border))] bg-white p-3 transition-all cursor-grab active:cursor-grabbing",
        dragging ? "shadow-2xl ring-2 ring-primary/60 rotate-[2deg] scale-105" : "hover:border-primary/40 hover:shadow-md"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate text-slate-900">{lead.name}</p>
        {lead.treatment_interest && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{lead.treatment_interest}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
          {lead.estimated_value_cents && <span className="font-semibold text-emerald-700 tabular-nums ml-auto">{brl(lead.estimated_value_cents)}</span>}
        </div>
        {lead.phone && (
          <div
            className="mt-2 flex justify-end"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e: any) => e.stopPropagation()}
          >
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="grid h-7 w-7 place-items-center rounded text-emerald-600 hover:bg-emerald-50"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
