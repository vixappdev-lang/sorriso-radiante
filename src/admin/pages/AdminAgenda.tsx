import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, RefreshCw, Loader2, Plus, MoreHorizontal, MessageCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ptBR } from "date-fns/locale";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import KpiCard from "@/admin/components/KpiCard";
import StatusPill from "@/admin/components/StatusPill";
import EntityDrawer from "@/admin/components/EntityDrawer";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, Activity } from "lucide-react";

function iso(d: Date) { return d.toISOString().slice(0, 10); }

export default function AdminAgenda() {
  const { data: appts = [], isLoading, refetch } = useAppointments();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Date>(new Date());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", treatment: TREATMENTS[0]?.name ?? "", professional: DENTISTS[0]?.name ?? "", date: iso(new Date()), time: "09:00", notes: "" });

  const dayKey = iso(selected);
  const dayAppts = useMemo(
    () => appts.filter((a) => a.appointment_date === dayKey).sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appts, dayKey],
  );
  const datesWith = useMemo(() => new Set(appts.map((a) => a.appointment_date)), [appts]);

  const dayKpis = useMemo(() => ({
    total: dayAppts.length,
    confirmed: dayAppts.filter((a) => a.status === "confirmed" || a.status === "done").length,
    pending: dayAppts.filter((a) => a.status === "pending").length,
    cancelled: dayAppts.filter((a) => a.status === "cancelled").length,
  }), [dayAppts]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Atualizado" });
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
  }

  async function reschedule() {
    if (!drawer) return;
    const { error } = await supabase.from("appointments").update({ appointment_date: drawer.appointment_date, appointment_time: drawer.appointment_time }).eq("id", drawer.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Agendamento atualizado" });
    setDrawer(null);
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
  }

  async function createEncaixe() {
    const { error } = await supabase.from("appointments").insert({
      name: form.name, phone: form.phone, email: form.email || null, treatment: form.treatment,
      professional: form.professional, appointment_date: form.date, appointment_time: form.time,
      notes: form.notes || null, status: "confirmed",
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Encaixe criado" });
    setCreating(false);
    setForm({ ...form, name: "", phone: "", email: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Calendário completo, encaixes, confirmações, reagendamentos e cancelamentos."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> Novo encaixe</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Agendamentos do dia" value={dayKpis.total} icon={CalendarIcon} accent="blue" />
        <KpiCard label="Confirmados" value={dayKpis.confirmed} icon={CheckCircle2} accent="emerald" />
        <KpiCard label="Pendentes" value={dayKpis.pending} icon={Clock} accent="amber" />
        <KpiCard label="Cancelados" value={dayKpis.cancelled} icon={XCircle} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <div className="admin-card p-4">
          <Calendar
            mode="single" selected={selected} onSelect={(d) => d && setSelected(d)} locale={ptBR} className="rounded-md"
            modifiers={{ hasAppt: (d) => datesWith.has(iso(d)) }}
            modifiersClassNames={{ hasAppt: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
          />
          <div className="mt-3 px-2 text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> dias com agendamento
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[hsl(var(--admin-border))] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold capitalize">
                {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </h3>
              <p className="text-xs text-muted-foreground">{dayAppts.length} agendamento(s)</p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 grid place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : dayAppts.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarIcon} title="Sem agendamentos neste dia" description="Selecione outro dia ou crie um encaixe." action={<Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> Criar encaixe</Button>} />
            </div>
          ) : (
            <ul className="divide-y divide-[hsl(var(--admin-border))]">
              {dayAppts.map((a) => (
                <li key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="text-center min-w-[68px]">
                    <p className="text-lg font-semibold tabular-nums">{a.appointment_time}</p>
                    <StatusPill status={a.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.treatment} {a.professional && `· ${a.professional}`} · {a.phone}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{a.notes}"</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === a.id || a.status === "confirmed"} onClick={() => setStatus(a.id, "confirmed")}>Confirmar</Button>
                    <Button size="sm" variant="outline" disabled={busyId === a.id || a.status === "done"} onClick={() => setStatus(a.id, "done")}>Concluir</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDrawer({ ...a })}><MoreHorizontal className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmCancel(a.id)}>Cancelar</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Drawer reagendar */}
      <EntityDrawer
        open={!!drawer} onOpenChange={(v) => !v && setDrawer(null)}
        title="Reagendar / detalhes"
        footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setDrawer(null)}>Fechar</Button><Button onClick={reschedule}>Salvar</Button></div>}
      >
        {drawer && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Paciente</Label>
              <p className="text-sm font-medium">{drawer.name} · {drawer.phone}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data</Label><Input type="date" value={drawer.appointment_date} onChange={(e) => setDrawer({ ...drawer, appointment_date: e.target.value })} /></div>
              <div><Label className="text-xs">Horário</Label><Input type="time" value={drawer.appointment_time} onChange={(e) => setDrawer({ ...drawer, appointment_time: e.target.value })} /></div>
            </div>
            <div>
              <a href={`https://wa.me/55${(drawer.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full"><MessageCircle className="h-4 w-4 mr-2 text-emerald-600" /> Avisar paciente no WhatsApp</Button>
              </a>
            </div>
          </div>
        )}
      </EntityDrawer>

      {/* Drawer criar encaixe */}
      <EntityDrawer
        open={creating} onOpenChange={setCreating}
        title="Novo encaixe" description="Cria um agendamento já confirmado"
        footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button><Button onClick={createEncaixe} disabled={!form.name || !form.phone}>Criar</Button></div>}
      >
        <div className="grid gap-3">
          <div><Label className="text-xs">Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Telefone*</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tratamento</Label>
              <Select value={form.treatment} onValueChange={(v) => setForm({ ...form, treatment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TREATMENTS.map((t) => <SelectItem key={t.slug} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Profissional</Label>
              <Select value={form.professional} onValueChange={(v) => setForm({ ...form, professional: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DENTISTS.map((d) => <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label className="text-xs">Hora</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </EntityDrawer>

      <ConfirmDialog
        open={!!confirmCancel} onOpenChange={(v) => !v && setConfirmCancel(null)}
        title="Cancelar agendamento?" description="Essa ação não pode ser desfeita pelo painel." destructive
        confirmLabel="Sim, cancelar"
        onConfirm={async () => { if (confirmCancel) { await setStatus(confirmCancel, "cancelled"); setConfirmCancel(null); } }}
      />
    </>
  );
}
