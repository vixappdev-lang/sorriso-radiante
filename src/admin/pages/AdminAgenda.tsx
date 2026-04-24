import { useMemo, useState } from "react";
import { Plus, RefreshCw, Loader2, Calendar as CalIcon, MessageCircle, Lock, Link as LinkIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import KpiCard from "@/admin/components/KpiCard";
import StatusPill from "@/admin/components/StatusPill";
import EntityDrawer from "@/admin/components/EntityDrawer";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { useAppointments } from "@/admin/hooks/useAppointments";
import PublicLinkModal from "@/admin/components/PublicLinkModal";
import { useBookingLinks } from "@/admin/hooks/useBookingLinks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { TREATMENTS, DENTISTS } from "@/data/clinic";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d: Date) { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day); return x; }

const STATUS_BG: Record<string, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-900",
  confirmed: "bg-blue-50 border-blue-200 text-blue-900",
  done: "bg-emerald-50 border-emerald-200 text-emerald-900",
  cancelled: "bg-rose-50 border-rose-200 text-rose-900 opacity-70",
};

const HOURS = Array.from({ length: 14 }).map((_, i) => 7 + i); // 07h-20h

export default function AdminAgenda() {
  const { data: appts = [], isLoading, refetch } = useAppointments();
  const qc = useQueryClient();
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [selected, setSelected] = useState<Date>(new Date());
  const [filterPro, setFilterPro] = useState<string>("__all");
  const [filterStatus, setFilterStatus] = useState<string>("__all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [drawer, setDrawer] = useState<any | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { data: bookingLinks = [] } = useBookingLinks();
  const defaultLink = bookingLinks.find((l) => l.slug === "geral") || bookingLinks[0];

  const [form, setForm] = useState({ name: "", phone: "", email: "", treatment: TREATMENTS[0]?.name ?? "", professional: DENTISTS[0]?.name ?? "", date: iso(new Date()), time: "09:00", notes: "" });
  const [block, setBlock] = useState({ block_date: iso(new Date()), start_time: "12:00", end_time: "13:00", professional_slug: "", reason: "" });

  const filteredAll = useMemo(() => appts.filter((a) => {
    if (filterPro !== "__all" && a.professional !== filterPro) return false;
    if (filterStatus !== "__all" && a.status !== filterStatus) return false;
    if (search && !`${a.name} ${a.phone} ${a.treatment}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [appts, filterPro, filterStatus, search]);

  const dayKey = iso(selected);
  const dayAppts = useMemo(() => filteredAll.filter((a) => a.appointment_date === dayKey).sort((a,b)=>a.appointment_time.localeCompare(b.appointment_time)), [filteredAll, dayKey]);

  const dayKpis = {
    total: dayAppts.length,
    confirmed: dayAppts.filter((a) => a.status === "confirmed" || a.status === "done").length,
    pending: dayAppts.filter((a) => a.status === "pending").length,
    cancelled: dayAppts.filter((a) => a.status === "cancelled").length,
  };

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    // Busca dados para WhatsApp antes de atualizar
    const appt = appts.find((a) => a.id === id);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Atualizado" });
    qc.invalidateQueries({ queryKey: ["admin", "appointments"] });

    // Auto-WhatsApp em eventos chave (cancelamento + confirmação)
    if (appt && (status === "cancelled" || status === "confirmed")) {
      const eventKey = status === "cancelled" ? "appointment_cancelled" : "appointment_confirmed";
      const dateBR = new Date(appt.appointment_date + "T00:00:00").toLocaleDateString("pt-BR");
      try {
        await supabase.functions.invoke("whatsapp-gateway", {
          body: {
            event_key: eventKey,
            to: appt.phone,
            appointment_id: appt.id,
            vars: {
              nome: (appt.name || "").split(" ")[0] || "paciente",
              tratamento: appt.treatment || "consulta",
              data: dateBR,
              hora: appt.appointment_time || "",
              profissional: appt.professional || "",
            },
          },
        });
      } catch (e) { /* silencioso — log já registrado server-side */ }
    }
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

  async function createBlock() {
    const { error } = await supabase.from("schedule_blocks").insert(block as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Horário bloqueado" });
    setBlocking(false);
    setBlock({ block_date: iso(new Date()), start_time: "12:00", end_time: "13:00", professional_slug: "", reason: "" });
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Gerencie agendamentos, encaixes e bloqueios em uma visão profissional."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setLinkModalOpen(true)}><LinkIcon className="h-4 w-4 mr-2" /> Link de agendamento</Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" /> Atualizar</Button>
            <Button variant="outline" size="sm" onClick={() => setBlocking(true)}><Lock className="h-4 w-4 mr-2" /> Bloquear horário</Button>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> Novo encaixe</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Agendamentos do dia" value={dayKpis.total} icon={CalIcon} accent="blue" />
        <KpiCard label="Confirmados" value={dayKpis.confirmed} icon={CheckCircle2} accent="emerald" />
        <KpiCard label="Pendentes" value={dayKpis.pending} icon={Clock} accent="amber" />
        <KpiCard label="Cancelados" value={dayKpis.cancelled} icon={XCircle} accent="rose" />
      </div>

      {/* Toolbar */}
      <div className="admin-card p-4 mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="bg-white border h-9">
              <TabsTrigger value="day" className="text-xs px-3">Dia</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-9" onClick={() => setSelected(addDays(selected, view === "month" ? -30 : view === "week" ? -7 : -1))}>‹</Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setSelected(new Date())}>Hoje</Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setSelected(addDays(selected, view === "month" ? 30 : view === "week" ? 7 : 1))}>›</Button>
          </div>
          <p className="text-sm font-medium capitalize">
            {view === "month"
              ? selected.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
              : selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterPro} onValueChange={setFilterPro}>
            <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos profissionais</SelectItem>
              {DENTISTS.map((d) => <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="done">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente…" className="h-9 w-full sm:w-56" />
        </div>
      </div>

      {/* Visões */}
      {view === "day" && (
        <DayTimeline appts={dayAppts} isLoading={isLoading} onOpen={(a) => setDrawer({ ...a })} onSetStatus={setStatus} onCancel={(id) => setConfirmCancel(id)} busyId={busyId} />
      )}
      {view === "week" && (
        <WeekGrid base={selected} appts={filteredAll} onOpen={(a) => setDrawer({ ...a })} />
      )}
      {view === "month" && (
        <MonthCalendar selected={selected} setSelected={setSelected} appts={filteredAll} />
      )}

      {/* Drawer reagendar */}
      <EntityDrawer open={!!drawer} onOpenChange={(v) => !v && setDrawer(null)} title="Reagendar / detalhes"
        footer={drawer ? <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setDrawer(null)}>Fechar</Button><Button onClick={reschedule}>Salvar</Button></div> : undefined}>
        {drawer && (
          <div className="space-y-4">
            <div><Label className="text-xs">Paciente</Label><p className="text-sm font-medium">{drawer.name} · {drawer.phone}</p><p className="text-xs text-muted-foreground">{drawer.treatment} · {drawer.professional}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data</Label><Input type="date" value={drawer.appointment_date} onChange={(e) => setDrawer({ ...drawer, appointment_date: e.target.value })} /></div>
              <div><Label className="text-xs">Horário</Label><Input type="time" value={drawer.appointment_time} onChange={(e) => setDrawer({ ...drawer, appointment_time: e.target.value })} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {drawer.status === "pending" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(drawer.id, "confirmed")} disabled={busyId === drawer.id}>Confirmar</Button>
              )}
              {drawer.status === "confirmed" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(drawer.id, "done")} disabled={busyId === drawer.id}>Concluir</Button>
              )}
              {(drawer.status === "pending" || drawer.status === "confirmed") && (
                <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => setConfirmCancel(drawer.id)}>Cancelar</Button>
              )}
              {(drawer.status === "done" || drawer.status === "cancelled") && (
                <span className="text-xs text-slate-500 italic ml-auto">Status final · sem ações</span>
              )}
            </div>
            <a href={`https://wa.me/55${(drawer.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full"><MessageCircle className="h-4 w-4 mr-2 text-emerald-600" /> Avisar paciente no WhatsApp</Button>
            </a>
          </div>
        )}
      </EntityDrawer>

      {/* Drawer encaixe */}
      <EntityDrawer open={creating} onOpenChange={setCreating} title="Novo encaixe" description="Cria um agendamento já confirmado"
        footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button><Button onClick={createEncaixe} disabled={!form.name || !form.phone}>Criar</Button></div>}>
        <div className="grid gap-3">
          <div><Label className="text-xs">Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Telefone*</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tratamento</Label>
              <Select value={form.treatment} onValueChange={(v) => setForm({ ...form, treatment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TREATMENTS.map((t) => <SelectItem key={t.slug} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Profissional</Label>
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

      {/* Drawer bloqueio */}
      <EntityDrawer open={blocking} onOpenChange={setBlocking} title="Bloquear horário" description="Bloqueia um intervalo na agenda."
        footer={<div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setBlocking(false)}>Cancelar</Button><Button onClick={createBlock}>Bloquear</Button></div>}>
        <div className="grid gap-3">
          <div><Label className="text-xs">Data</Label><Input type="date" value={block.block_date} onChange={(e) => setBlock({ ...block, block_date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Início</Label><Input type="time" value={block.start_time} onChange={(e) => setBlock({ ...block, start_time: e.target.value })} /></div>
            <div><Label className="text-xs">Fim</Label><Input type="time" value={block.end_time} onChange={(e) => setBlock({ ...block, end_time: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Profissional (opcional)</Label>
            <Select value={block.professional_slug} onValueChange={(v) => setBlock({ ...block, professional_slug: v })}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>{DENTISTS.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Motivo</Label><Input value={block.reason} onChange={(e) => setBlock({ ...block, reason: e.target.value })} placeholder="Almoço, reunião…" /></div>
        </div>
      </EntityDrawer>

      <ConfirmDialog open={!!confirmCancel} onOpenChange={(v) => !v && setConfirmCancel(null)}
        title="Cancelar agendamento?" description="Essa ação não pode ser desfeita pelo painel." destructive confirmLabel="Sim, cancelar"
        onConfirm={async () => { if (confirmCancel) { await setStatus(confirmCancel, "cancelled"); setConfirmCancel(null); } }} />

      <PublicLinkModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        title="Link público de agendamento"
        description="Compartilhe para receber agendamentos automáticos"
        path={defaultLink ? `/agendar/${defaultLink.access_token || defaultLink.slug}` : "/agendar/geral"}
        helper="Este link permite que qualquer pessoa agende uma consulta diretamente. Os horários ocupados (incluindo os sincronizados da Clinicorp) aparecem bloqueados automaticamente. Domínio captado da hospedagem atual."
      />
    </>
  );
}

function DayTimeline({ appts, isLoading, onOpen, onSetStatus, onCancel, busyId }: any) {
  if (isLoading) return <div className="admin-card p-10 grid place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (appts.length === 0) return <div className="admin-card p-5"><EmptyState icon={CalIcon} title="Sem agendamentos neste dia" description="Selecione outro dia, crie um encaixe ou ajuste os filtros." /></div>;

  const map: Record<number, any[]> = {};
  appts.forEach((a: any) => { const h = parseInt(a.appointment_time.slice(0, 2), 10); (map[h] = map[h] || []).push(a); });

  return (
    <div className="admin-card overflow-hidden">
      <div className="relative">
        {/* Rail vertical */}
        <div className="absolute left-[78px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[hsl(var(--admin-border))] to-transparent pointer-events-none" />
        <div className="divide-y divide-[hsl(var(--admin-border))]/60">
          {HOURS.map((h) => {
            const items = map[h] ?? [];
            return (
              <div key={h} className="grid grid-cols-[72px_1fr] gap-4 px-3 sm:px-5 py-3 min-h-[72px] hover:bg-slate-50/40 transition-colors">
                <div className="relative flex items-start pt-1.5">
                  <span className="text-[11px] font-bold text-slate-400 tabular-nums tracking-wide">{String(h).padStart(2, "0")}:00</span>
                  <span className={cn("absolute right-[-9px] top-2.5 h-2 w-2 rounded-full ring-4 ring-white", items.length > 0 ? "bg-blue-500" : "bg-slate-200")} />
                </div>
                <div className="flex flex-col gap-2">
                  {items.length === 0 ? (
                    <div className="h-full min-h-[40px] border border-dashed border-slate-200/70 rounded-lg opacity-0 hover:opacity-100 transition" />
                  ) : items.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onOpen(a)}
                      className={cn(
                        "group text-left rounded-xl border px-3.5 py-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden",
                        STATUS_BG[a.status] || "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-30" />
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold tabular-nums">{a.appointment_time}</span>
                        <span className="text-sm font-semibold truncate">{a.name}</span>
                        <StatusPill status={a.status} />
                        {a.status === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                      </div>
                      <p className="text-[12px] mt-1 opacity-75 truncate font-medium">{a.treatment}{a.professional ? ` · ${a.professional}` : ""} · {a.phone}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {a.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs bg-white" disabled={busyId === a.id} onClick={() => onSetStatus(a.id, "confirmed")}>Confirmar</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto hover:bg-red-50" onClick={() => onCancel(a.id)}>Cancelar</Button>
                          </>
                        )}
                        {a.status === "confirmed" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs bg-white" disabled={busyId === a.id} onClick={() => onSetStatus(a.id, "done")}>Concluir</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto hover:bg-red-50" onClick={() => onCancel(a.id)}>Cancelar</Button>
                          </>
                        )}
                        {(a.status === "done" || a.status === "cancelled") && (
                          <span className="text-[11px] text-slate-500 italic">Sem ações disponíveis</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekGrid({ base, appts, onOpen }: any) {
  const start = startOfWeek(base);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  return (
    <div className="admin-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[hsl(var(--admin-border))]">
        {days.map((d) => (
          <div key={iso(d)} className="px-3 py-3 text-center border-r last:border-r-0 border-[hsl(var(--admin-border))]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</p>
            <p className="text-lg font-semibold tabular-nums">{d.getDate()}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[420px]">
        {days.map((d) => {
          const list = appts.filter((a: any) => a.appointment_date === iso(d)).sort((a: any, b: any) => a.appointment_time.localeCompare(b.appointment_time));
          return (
            <div key={iso(d)} className="border-r last:border-r-0 border-[hsl(var(--admin-border))] p-2 space-y-1.5">
              {list.length === 0 && <p className="text-[11px] text-muted-foreground text-center mt-2">—</p>}
              {list.map((a: any) => (
                <button key={a.id} onClick={() => onOpen(a)} className={cn("w-full text-left rounded-lg border px-2 py-1.5", STATUS_BG[a.status] || "bg-slate-50 border-slate-200")}>
                  <p className="text-[11px] font-semibold tabular-nums">{a.appointment_time}</p>
                  <p className="text-[11px] truncate font-medium">{a.name}</p>
                  <p className="text-[10px] truncate opacity-75">{a.treatment}</p>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthCalendar({ selected, setSelected, appts }: any) {
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    appts.forEach((a: any) => { m[a.appointment_date] = (m[a.appointment_date] || 0) + 1; });
    return m;
  }, [appts]);
  return (
    <div className="admin-card p-5 grid lg:grid-cols-[420px_1fr] gap-6">
      <Calendar mode="single" selected={selected} onSelect={(d) => d && setSelected(d)} locale={ptBR}
        modifiers={{ hasAppt: (d) => !!counts[iso(d)] }}
        modifiersClassNames={{ hasAppt: "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-primary" }} />
      <div>
        <p className="text-sm font-medium mb-3">Agendamentos em {selected.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</p>
        <ul className="space-y-2">
          {appts.filter((a: any) => a.appointment_date === iso(selected)).map((a: any) => (
            <li key={a.id} className={cn("rounded-lg border px-3 py-2 flex items-center gap-3", STATUS_BG[a.status])}>
              <span className="text-sm font-semibold tabular-nums w-14">{a.appointment_time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <p className="text-xs opacity-80 truncate">{a.treatment} · {a.professional}</p>
              </div>
              <StatusPill status={a.status} />
            </li>
          ))}
          {!appts.some((a: any) => a.appointment_date === iso(selected)) && <p className="text-xs text-muted-foreground">Sem agendamentos.</p>}
        </ul>
      </div>
    </div>
  );
}
