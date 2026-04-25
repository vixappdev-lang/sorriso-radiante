import { useMemo, useState } from "react";
import {
  Wallet, Plus, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  Pencil, Trash2, DollarSign,
} from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import ChartFrame from "@/admin/components/ChartFrame";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityDrawer from "@/admin/components/EntityDrawer";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import StatusPill from "@/admin/components/StatusPill";
import EmptyState from "@/admin/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance, useUpsertFinance, useDeleteFinance, type FinanceEntry } from "@/admin/hooks/useFinance";
import { toast } from "@/hooks/use-toast";
import CommissionsPanel from "@/admin/components/CommissionsPanel";

const TYPE_LABEL: Record<string, string> = { income: "Entrada", expense: "Saída", budget: "Orçamento" };
const STATUS_OPTIONS = ["pending", "paid", "overdue", "cancelled"] as const;

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function emptyForm() {
  return { id: "" as string | "", type: "income", amount: "", description: "", patient_name: "", method: "pix", status: "pending", due_date: new Date().toISOString().slice(0, 10) };
}

export default function AdminFinanceiro() {
  const { data: entries = [] } = useFinance();
  const upsert = useUpsertFinance();
  const del = useDeleteFinance();
  const [drawer, setDrawer] = useState<"new" | FinanceEntry | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);

    let toReceive = 0, receivedMonth = 0, overdue = 0, prevReceived = 0;
    const ticketArr: number[] = [];
    const monthlySeries: Record<string, { in: number; out: number }> = {};

    entries.forEach((e) => {
      const due = e.due_date || e.created_at.slice(0, 10);
      const monthKey = due.slice(0, 7);
      monthlySeries[monthKey] = monthlySeries[monthKey] || { in: 0, out: 0 };
      if (e.type === "income") {
        if (e.status === "pending" || e.status === "overdue") toReceive += e.amount_cents;
        if (e.status === "paid") {
          if (due >= monthStart) receivedMonth += e.amount_cents;
          else if (due >= lastMonthStart && due < monthStart) prevReceived += e.amount_cents;
          ticketArr.push(e.amount_cents);
          monthlySeries[monthKey].in += e.amount_cents;
        }
        if (e.status === "overdue") overdue += e.amount_cents;
      }
      if (e.type === "expense" && e.status === "paid") monthlySeries[monthKey].out += e.amount_cents;
    });

    const ticketAvg = ticketArr.length ? ticketArr.reduce((s, n) => s + n, 0) / ticketArr.length : 0;
    const growth = prevReceived === 0 ? (receivedMonth > 0 ? 100 : 0) : Math.round(((receivedMonth - prevReceived) / prevReceived) * 100);

    const series = Object.entries(monthlySeries)
      .sort()
      .slice(-6)
      .map(([k, v]) => ({ label: k.slice(5) + "/" + k.slice(2, 4), Entradas: v.in / 100, Saídas: v.out / 100 }));

    return { toReceive, receivedMonth, overdue, ticketAvg, growth, series };
  }, [entries]);

  function openNew() { setForm(emptyForm()); setDrawer("new"); }
  function openEdit(e: FinanceEntry) {
    setForm({
      id: e.id, type: e.type, amount: (e.amount_cents / 100).toFixed(2),
      description: e.description ?? "", patient_name: e.patient_name ?? "",
      method: e.method ?? "pix", status: e.status, due_date: e.due_date ?? new Date().toISOString().slice(0, 10),
    });
    setDrawer(e);
  }

  async function save() {
    const cents = Math.round(parseFloat(String(form.amount).replace(",", ".")) * 100) || 0;
    if (!cents) { toast({ title: "Informe um valor", variant: "destructive" }); return; }
    try {
      await upsert.mutateAsync({
        id: form.id || undefined, type: form.type, amount_cents: cents,
        description: form.description || null, patient_name: form.patient_name || null,
        method: form.method || null, status: form.status, due_date: form.due_date || null,
        paid_at: form.status === "paid" ? new Date().toISOString() : null,
      } as any);
      toast({ title: "Lançamento salvo" });
      setDrawer(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  const columns: Column<FinanceEntry>[] = [
    { key: "due_date", header: "Vencimento", cell: (r) => <span className="text-sm tabular-nums">{r.due_date ? new Date(r.due_date).toLocaleDateString("pt-BR") : "—"}</span> },
    {
      key: "description", header: "Descrição", cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{r.description || "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{r.patient_name || TYPE_LABEL[r.type]}</p>
        </div>
      ),
    },
    { key: "type", header: "Tipo", cell: (r) => <span className="text-sm">{TYPE_LABEL[r.type] || r.type}</span>, className: "hidden md:table-cell" },
    { key: "method", header: "Método", cell: (r) => <span className="text-sm text-muted-foreground capitalize">{r.method || "—"}</span>, className: "hidden lg:table-cell" },
    {
      key: "amount_cents", header: "Valor", cell: (r) => (
        <span className={`font-semibold tabular-nums ${r.type === "expense" ? "text-rose-600" : "text-emerald-700"}`}>
          {r.type === "expense" ? "-" : ""}{brl(r.amount_cents)}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Lançamentos, recebimentos, pendências e fluxo financeiro."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo lançamento</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 mb-4">
        <KpiCard label="A receber" value={brl(stats.toReceive)} icon={Wallet} accent="amber" compact />
        <KpiCard label="Recebido no mês" value={brl(stats.receivedMonth)} icon={CheckCircle2} accent="emerald" compact
          trend={{ value: stats.growth, positive: stats.growth >= 0 }} />
        <KpiCard label="Atrasado" value={brl(stats.overdue)} icon={AlertCircle} accent="rose" compact />
        <KpiCard label="Ticket médio" value={brl(stats.ticketAvg)} icon={DollarSign} accent="violet" compact />
        <KpiCard label="Crescimento MoM" value={`${stats.growth >= 0 ? "+" : ""}${stats.growth}%`} icon={stats.growth >= 0 ? TrendingUp : TrendingDown} accent="blue" compact />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <ChartFrame className="xl:col-span-2" title="Fluxo financeiro" hint="Últimos 6 meses (entradas vs saídas)">
          {stats.series.length === 0 ? (
            <EmptyState icon={Wallet} title="Sem lançamentos" description="Cadastre seu primeiro lançamento para visualizar o fluxo." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.series} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="finIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-emerald))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--chart-emerald))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="finOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-rose))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--chart-rose))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(220 18% 92%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12 }} formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                <Area type="monotone" dataKey="Entradas" stroke="hsl(var(--chart-emerald))" strokeWidth={2.4} fill="url(#finIn)" />
                <Area type="monotone" dataKey="Saídas" stroke="hsl(var(--chart-rose))" strokeWidth={2.4} fill="url(#finOut)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartFrame>

        <ChartFrame title="Top tratamentos lucrativos" hint="Receita total por tratamento">
          {entries.filter((e) => e.type === "income" && e.status === "paid").length === 0 ? (
            <EmptyState icon={DollarSign} title="Sem dados" description="Após o primeiro recebimento." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={topByDescription(entries)} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(220 18% 92%)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(220 12% 35%)" }} tickLine={false} axisLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12 }} formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`} />
                <Bar dataKey="total" fill="hsl(var(--chart-blue))" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartFrame>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Recebidos</TabsTrigger>
          <TabsTrigger value="overdue">Atrasados</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>
        {(["all", "pending", "paid", "overdue"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {entries.length === 0 ? (
              <EmptyState icon={Wallet} title="Nenhum lançamento" description="Comece criando uma entrada ou saída." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo</Button>} />
            ) : (
              <DataTable
                rows={tab === "all" ? entries : entries.filter((e) => e.status === tab)}
                columns={columns}
                pageSize={12}
                searchable
                searchKeys={["description", "patient_name"] as any}
                onRowClick={openEdit}
                rowActions={(r) => (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              />
            )}
          </TabsContent>
        ))}
        <TabsContent value="commissions" className="mt-4">
          <CommissionsPanel />
        </TabsContent>
      </Tabs>

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer === "new" ? "Novo lançamento" : "Editar lançamento"}
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                  <SelectItem value="budget">Orçamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Valor (R$)</Label><Input type="text" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></div>
          </div>
          <div><Label className="text-xs">Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Clareamento dental — sessão única" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Paciente</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} /></div>
            <div><Label className="text-xs">Método</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pix", "dinheiro", "débito", "crédito", "boleto", "transferência"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
        </div>
      </EntityDrawer>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir lançamento?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}

function topByDescription(entries: FinanceEntry[]) {
  const map: Record<string, number> = {};
  entries.filter((e) => e.type === "income" && e.status === "paid").forEach((e) => {
    const key = (e.description || "Sem descrição").slice(0, 20);
    map[key] = (map[key] || 0) + e.amount_cents / 100;
  });
  return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);
}
