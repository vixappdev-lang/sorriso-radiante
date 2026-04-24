import { useEffect, useMemo, useRef, useState } from "react";
import { UserCog, Plus, Pencil, Trash2, Eye, MessageCircle, Upload, Loader2 } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityModal from "@/admin/components/EntityModal";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import KpiCard from "@/admin/components/KpiCard";
import StatusPill from "@/admin/components/StatusPill";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useProfessionals, useUpsertProfessional, useDeleteProfessional, type Professional } from "@/admin/hooks/useProfessionals";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { DENTISTS } from "@/data/clinic";
import { toast } from "@/hooks/use-toast";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function emptyForm(): Partial<Professional> & { schedules?: any[] } {
  return { name: "", slug: "", specialty: "", cro: "", phone: "", email: "", photo_url: "", status: "active", weekly_hours: 40, notes_internal: "", schedules: [] };
}

export default function AdminProfissionais() {
  const { data: pros = [], isLoading } = useProfessionals();
  const upsert = useUpsertProfessional();
  const del = useDeleteProfessional();
  const { data: appts = [] } = useAppointments();

  const [drawer, setDrawer] = useState<{ mode: "create" | "edit" | "view"; data?: any } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [scheds, setScheds] = useState<{ weekday: number; start_time: string; end_time: string }[]>([]);

  // Auto-seed inicial a partir de DENTISTS na primeira carga (idempotente por slug)
  useEffect(() => {
    if (isLoading) return;
    if (pros.length === 0) {
      DENTISTS.forEach((d) => {
        upsert.mutate({ name: d.name, slug: d.slug, specialty: d.specialty, cro: d.cro, photo_url: d.photo, status: "active", weekly_hours: 40 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  function openCreate() { setForm(emptyForm()); setScheds([]); setDrawer({ mode: "create" }); }
  async function openEdit(p: Professional) {
    const { data } = await supabase.from("professional_schedules").select("*").eq("professional_id", p.id).order("weekday");
    setForm(p); setScheds(data ?? []); setDrawer({ mode: "edit", data: p });
  }
  async function openView(p: Professional) {
    const { data } = await supabase.from("professional_schedules").select("*").eq("professional_id", p.id).order("weekday");
    setForm(p); setScheds(data ?? []); setDrawer({ mode: "view", data: p });
  }

  async function save() {
    if (!form.name || !form.slug) { toast({ title: "Nome e slug são obrigatórios", variant: "destructive" }); return; }
    try {
      const saved = await upsert.mutateAsync({ ...form } as any);
      // sincroniza schedules
      await supabase.from("professional_schedules").delete().eq("professional_id", saved.id);
      if (scheds.length > 0) {
        await supabase.from("professional_schedules").insert(scheds.map((s) => ({ ...s, professional_id: saved.id })));
      }
      toast({ title: "Profissional salvo" });
      setDrawer(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  const productivity = useMemo(() => {
    const map: Record<string, number> = {};
    appts.forEach((a) => { if (a.professional && (a.status === "confirmed" || a.status === "done")) map[a.professional] = (map[a.professional] || 0) + 1; });
    return map;
  }, [appts]);

  const kpis = useMemo(() => ({
    total: pros.length,
    actives: pros.filter((p) => p.status === "active").length,
    inactives: pros.filter((p) => p.status !== "active").length,
    avgProd: pros.length ? Math.round(Object.values(productivity).reduce((a, b) => a + b, 0) / pros.length) : 0,
  }), [pros, productivity]);

  const columns: Column<Professional>[] = [
    { key: "name", header: "Profissional", cell: (p) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {p.photo_url && <AvatarImage src={p.photo_url} alt={p.name} />}
          <AvatarFallback className="bg-blue-50 text-blue-700 text-xs font-semibold">{p.name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium truncate">{p.name}</p>
          <p className="text-xs text-muted-foreground truncate">{p.specialty || "—"}</p>
        </div>
      </div>
    ) },
    { key: "cro", header: "CRO", cell: (p) => <span className="tabular-nums text-muted-foreground">{p.cro || "—"}</span>, className: "hidden md:table-cell" },
    { key: "phone", header: "Contato", cell: (p) => <span className="tabular-nums text-muted-foreground">{p.phone || p.email || "—"}</span>, className: "hidden lg:table-cell" },
    { key: "prod", header: "Produtividade", cell: (p) => <span className="tabular-nums">{productivity[p.name] || 0} <span className="text-muted-foreground text-xs">consultas</span></span> },
    { key: "status", header: "Status", cell: (p) => <StatusPill status={p.status === "active" ? "active" : "inactive"} /> },
  ];

  return (
    <>
      <PageHeader
        title="Profissionais"
        description="Cadastro completo, agenda, especialidades, produtividade e desempenho."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo profissional</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total" value={kpis.total} icon={UserCog} accent="blue" />
        <KpiCard label="Ativos" value={kpis.actives} icon={UserCog} accent="emerald" />
        <KpiCard label="Inativos" value={kpis.inactives} icon={UserCog} accent="amber" />
        <KpiCard label="Média de consultas" value={kpis.avgProd} hint="por profissional" icon={UserCog} accent="violet" />
      </div>

      {pros.length === 0 ? (
        <EmptyState icon={UserCog} title="Nenhum profissional cadastrado" description="Cadastre os dentistas da clínica para liberar agenda e relatórios." action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Cadastrar profissional</Button>} />
      ) : (
        <DataTable
          rows={pros} columns={columns} pageSize={10} searchable searchPlaceholder="Buscar nome, CRO, especialidade…"
          searchKeys={["name", "cro", "specialty", "email"] as any}
          onRowClick={openView}
          rowActions={(p) => (
            <>
              <Button size="sm" variant="ghost" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </>
          )}
        />
      )}

      {/* Drawer create/edit/view */}
      <EntityModal
        open={!!drawer} onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer?.mode === "create" ? "Novo profissional" : drawer?.mode === "edit" ? "Editar profissional" : form.name || "Profissional"}
        description={drawer?.mode === "view" ? "Detalhes, agenda e desempenho" : undefined}
        size="lg"
        footer={drawer?.mode !== "view" ? (
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>
        ) : undefined}
      >
        {drawer && (
          <Tabs defaultValue="dados">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
              <TabsTrigger value="obs">Obs.</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome*</Label><Input value={form.name || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label className="text-xs">Slug*</Label><Input value={form.slug || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Especialidade</Label><Input value={form.specialty || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
                <div><Label className="text-xs">CRO</Label><Input value={form.cro || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, cro: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Telefone</Label><Input value={form.phone || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label className="text-xs">E-mail</Label><Input type="email" value={form.email || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <PhotoUploader value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} disabled={drawer.mode === "view"} name={form.name || "P"} />
              <div className="grid grid-cols-2 gap-3 items-end">
                <div><Label className="text-xs">Carga horária semanal</Label><Input type="number" value={form.weekly_hours ?? 40} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, weekly_hours: parseInt(e.target.value || "0") })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.status === "active"} disabled={drawer.mode === "view"} onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} /><span className="text-sm">Ativo</span></div>
              </div>
              {drawer.mode !== "view" && (
                <div className="flex gap-2 pt-2">
                  {form.phone && (
                    <a href={`https://wa.me/55${form.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full" type="button"><MessageCircle className="h-4 w-4 mr-2 text-emerald-600" /> WhatsApp</Button>
                    </a>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="agenda" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">Defina os horários de atendimento por dia da semana.</p>
              <div className="space-y-2">
                {WEEKDAYS.map((label, idx) => {
                  const sched = scheds.find((s) => s.weekday === idx);
                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <span className="w-12 text-xs font-medium">{label}</span>
                      <Switch
                        checked={!!sched} disabled={drawer.mode === "view"}
                        onCheckedChange={(v) => {
                          if (v) setScheds([...scheds.filter((s) => s.weekday !== idx), { weekday: idx, start_time: "08:00", end_time: "18:00" }].sort((a,b)=>a.weekday-b.weekday));
                          else setScheds(scheds.filter((s) => s.weekday !== idx));
                        }}
                      />
                      {sched && (
                        <>
                          <Input type="time" className="h-8 w-28" value={sched.start_time} disabled={drawer.mode === "view"} onChange={(e) => setScheds(scheds.map((s) => s.weekday === idx ? { ...s, start_time: e.target.value } : s))} />
                          <span className="text-xs text-muted-foreground">até</span>
                          <Input type="time" className="h-8 w-28" value={sched.end_time} disabled={drawer.mode === "view"} onChange={(e) => setScheds(scheds.map((s) => s.weekday === idx ? { ...s, end_time: e.target.value } : s))} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="desempenho" className="mt-4 space-y-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Consultas confirmadas + concluídas</p>
                <p className="mt-1 text-3xl font-semibold">{productivity[form.name] || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Acumulado em todos os períodos</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Próximos atendimentos</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {appts.filter((a) => a.professional === form.name && a.appointment_date >= new Date().toISOString().slice(0, 10)).slice(0, 5).map((a) => (
                    <li key={a.id} className="flex justify-between border-b py-1.5 last:border-0">
                      <span>{a.name}</span>
                      <span className="text-muted-foreground">{new Date(a.appointment_date).toLocaleDateString("pt-BR")} · {a.appointment_time}</span>
                    </li>
                  ))}
                  {appts.filter((a) => a.professional === form.name && a.appointment_date >= new Date().toISOString().slice(0, 10)).length === 0 && (
                    <li className="text-xs text-muted-foreground">Nenhum agendamento futuro.</li>
                  )}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="obs" className="mt-4">
              <Label className="text-xs">Observações internas</Label>
              <Textarea rows={6} value={form.notes_internal || ""} disabled={drawer.mode === "view"} onChange={(e) => setForm({ ...form, notes_internal: e.target.value })} />
            </TabsContent>
          </Tabs>
        )}
      </EntityModal>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir profissional?" description="Essa ação remove o cadastro permanentemente." destructive
        confirmLabel="Sim, excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}
