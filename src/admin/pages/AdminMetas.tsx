import { useMemo, useState } from "react";
import { Target, Plus, TrendingUp, Trash2, Pencil, Trophy, Users } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals, useUpsertGoal, useDeleteGoal, type Goal } from "@/admin/hooks/useGoals";
import { useFinance } from "@/admin/hooks/useFinance";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { useProfessionals } from "@/admin/hooks/useProfessionals";
import { toast } from "@/hooks/use-toast";

const METRIC_LABEL: Record<string, string> = {
  revenue: "Receita (R$)",
  appointments: "Agendamentos",
  new_patients: "Novos pacientes",
  treatments_done: "Tratamentos concluídos",
};

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function currentMonth() { return new Date().toISOString().slice(0, 7) + "-01"; }
function monthLabel(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); }

export default function AdminMetas() {
  const [refMonth, setRefMonth] = useState<string>(currentMonth());
  const { data: goals = [] } = useGoals(refMonth);
  const { data: entries = [] } = useFinance();
  const { data: appts = [] } = useAppointments();
  const { data: pros = [] } = useProfessionals();
  const upsert = useUpsertGoal();
  const del = useDeleteGoal();

  const [open, setOpen] = useState<"new" | Goal | null>(null);
  const empty = { id: "", scope: "clinic", professional_slug: "", metric: "revenue", target_value: "", reference_month: refMonth, period: "monthly", notes: "" };
  const [form, setForm] = useState<any>(empty);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // Cálculos de progresso
  const monthStart = refMonth;
  const monthEnd = new Date(new Date(refMonth + "T00:00:00").getFullYear(), new Date(refMonth + "T00:00:00").getMonth() + 1, 0).toISOString().slice(0, 10);

  function actualValue(g: Goal): number {
    const inMonth = (date: string | null) => !!date && date >= monthStart && date <= monthEnd;
    if (g.metric === "revenue") {
      return entries
        .filter((e) => e.type === "income" && e.status === "paid" && inMonth(e.due_date || e.created_at.slice(0, 10)))
        .reduce((s, e) => s + e.amount_cents, 0) / 100;
    }
    if (g.metric === "appointments") {
      return appts.filter((a) => inMonth(a.appointment_date) && (g.scope === "clinic" || a.professional === g.professional_slug)).length;
    }
    if (g.metric === "new_patients") {
      const seen = new Set<string>();
      const beforeMonth = appts.filter((a) => a.appointment_date < monthStart);
      beforeMonth.forEach((a) => seen.add(a.phone));
      const newOnes = appts.filter((a) => inMonth(a.appointment_date) && !seen.has(a.phone));
      return new Set(newOnes.map((a) => a.phone)).size;
    }
    if (g.metric === "treatments_done") {
      return appts.filter((a) => inMonth(a.appointment_date) && a.status === "done" && (g.scope === "clinic" || a.professional === g.professional_slug)).length;
    }
    return 0;
  }

  const totalProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const sum = goals.reduce((s, g) => {
      const target = g.metric === "revenue" ? Number(g.target_value) / 100 : Number(g.target_value);
      const actual = actualValue(g);
      return s + Math.min(100, target > 0 ? (actual / target) * 100 : 0);
    }, 0);
    return Math.round(sum / goals.length);
  }, [goals, entries, appts]);

  const achieved = goals.filter((g) => {
    const target = g.metric === "revenue" ? Number(g.target_value) / 100 : Number(g.target_value);
    return target > 0 && actualValue(g) >= target;
  }).length;

  function openNew() { setForm({ ...empty, reference_month: refMonth }); setOpen("new"); }
  function openEdit(g: Goal) {
    setForm({
      id: g.id, scope: g.scope, professional_slug: g.professional_slug ?? "",
      metric: g.metric, target_value: g.metric === "revenue" ? (Number(g.target_value) / 100).toString() : String(g.target_value),
      reference_month: g.reference_month, period: g.period, notes: g.notes ?? "",
    });
    setOpen(g);
  }
  async function save() {
    const tv = parseFloat(String(form.target_value).replace(",", "."));
    if (!tv || tv <= 0) return toast({ title: "Informe a meta", variant: "destructive" });
    try {
      await upsert.mutateAsync({
        id: form.id || undefined,
        scope: form.scope,
        professional_slug: form.scope === "professional" ? (form.professional_slug || null) : null,
        metric: form.metric,
        target_value: form.metric === "revenue" ? Math.round(tv * 100) : tv,
        reference_month: form.reference_month,
        period: form.period,
        notes: form.notes || null,
      } as any);
      toast({ title: "Meta salva" });
      setOpen(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  return (
    <>
      <PageHeader
        title="Metas & KPIs"
        description="Defina metas mensais por clínica ou por profissional. O progresso é calculado em tempo real com base em recebimentos, agendamentos e tratamentos."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="month"
              className="h-9 w-[160px]"
              value={refMonth.slice(0, 7)}
              onChange={(e) => setRefMonth(e.target.value + "-01")}
            />
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova meta</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Metas ativas" value={goals.length} icon={Target} accent="blue" compact />
        <KpiCard label="Conquistadas" value={achieved} icon={Trophy} accent="emerald" compact />
        <KpiCard label="Progresso médio" value={`${totalProgress}%`} icon={TrendingUp} accent={totalProgress >= 70 ? "emerald" : totalProgress >= 40 ? "amber" : "rose"} compact />
        <KpiCard label="Mês de referência" value={monthLabel(refMonth)} icon={Users} accent="violet" compact />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta para esse mês"
          description="Crie metas de receita, agendamentos, novos pacientes ou tratamentos concluídos — para a clínica inteira ou por profissional."
          action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Criar primeira meta</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {goals.map((g) => {
            const target = g.metric === "revenue" ? Number(g.target_value) / 100 : Number(g.target_value);
            const actual = actualValue(g);
            const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
            const reached = actual >= target;
            const proName = g.scope === "professional" ? (pros.find((p: any) => p.slug === g.professional_slug)?.name ?? g.professional_slug ?? "—") : "Clínica inteira";
            return (
              <div key={g.id} className="admin-card p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[15px] tracking-tight">{METRIC_LABEL[g.metric]}</h3>
                      {reached && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-emerald-200 dark:ring-emerald-900"><Trophy className="h-3 w-3" />Atingida</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{proName}</p>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(g.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Realizado</p>
                      <p className="text-2xl font-semibold tabular-nums">
                        {g.metric === "revenue" ? brl(Math.round(actual * 100)) : actual}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Meta</p>
                      <p className="text-sm font-medium text-muted-foreground tabular-nums">
                        {g.metric === "revenue" ? brl(Math.round(target * 100)) : target}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${reached ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{Math.round(pct)}% concluído</span>
                    <span>{g.period === "monthly" ? "Mensal" : g.period}</span>
                  </div>
                </div>

                {g.notes && <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-[hsl(var(--admin-border))]">{g.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <EntityModal
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open === "new" ? "Nova meta" : "Editar meta"}
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Escopo</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">Clínica inteira</SelectItem>
                  <SelectItem value="professional">Por profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Métrica</Label>
              <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METRIC_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.scope === "professional" && (
            <div>
              <Label className="text-xs">Profissional</Label>
              <Select value={form.professional_slug} onValueChange={(v) => setForm({ ...form, professional_slug: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {pros.map((p: any) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Meta {form.metric === "revenue" ? "(R$)" : "(quantidade)"}</Label>
              <Input type="text" inputMode="decimal" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} placeholder={form.metric === "revenue" ? "10000" : "30"} />
            </div>
            <div>
              <Label className="text-xs">Mês de referência</Label>
              <Input type="month" value={form.reference_month.slice(0, 7)} onChange={(e) => setForm({ ...form, reference_month: e.target.value + "-01" })} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Observações</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Comentário interno…" />
          </div>
        </div>
      </EntityModal>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir meta?" description="A meta será removida permanentemente." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removida" }); setConfirmDel(null); } }}
      />
    </>
  );
}
