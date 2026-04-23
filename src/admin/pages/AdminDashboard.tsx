import { useMemo, useState } from "react";
import {
  Calendar, Users, Activity, Wallet, Star, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import EmptyState from "@/admin/components/EmptyState";
import ChartFrame from "@/admin/components/ChartFrame";
import StatusPill from "@/admin/components/StatusPill";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { TREATMENTS, TESTIMONIALS } from "@/data/clinic";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function priceForTreatment(name: string): number {
  const t = TREATMENTS.find((x) => x.name === name);
  if (!t) return 0;
  return Number((t.priceFrom || "").replace(/[^\d]/g, "")) || 0;
}
const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(var(--chart-amber))",
  confirmed: "hsl(var(--chart-blue))",
  done: "hsl(var(--chart-emerald))",
  cancelled: "hsl(var(--chart-rose))",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", done: "Concluído", cancelled: "Cancelado",
};

export default function AdminDashboard() {
  const { data: appts = [], isLoading } = useAppointments();
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const days = parseInt(period, 10);
  const today = todayISO();

  const stats = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const startISO = start.toISOString().slice(0, 10);

    const prevStart = new Date(); prevStart.setDate(prevStart.getDate() - (days * 2 - 1));
    const prevEnd = new Date(); prevEnd.setDate(prevEnd.getDate() - days);
    const prevStartISO = prevStart.toISOString().slice(0, 10);
    const prevEndISO = prevEnd.toISOString().slice(0, 10);

    const inWindow = appts.filter((a) => a.appointment_date >= startISO);
    const inPrev = appts.filter((a) => a.appointment_date >= prevStartISO && a.appointment_date <= prevEndISO);
    const todays = appts.filter((a) => a.appointment_date === today);
    const newPatients = new Set(inWindow.map((a) => a.phone)).size;
    const prevPatients = new Set(inPrev.map((a) => a.phone)).size;
    const inProgress = appts.filter((a) => a.status === "confirmed").length;
    const revenue = appts
      .filter((a) => (a.status === "confirmed" || a.status === "done") && a.appointment_date >= startISO)
      .reduce((s, a) => s + priceForTreatment(a.treatment), 0);
    const prevRevenue = inPrev
      .filter((a) => a.status === "confirmed" || a.status === "done")
      .reduce((s, a) => s + priceForTreatment(a.treatment), 0);
    const totalForRate = inWindow.length;
    const confirmedRate = totalForRate ? Math.round((inWindow.filter((a) => a.status === "confirmed" || a.status === "done").length / totalForRate) * 100) : 0;

    const dailySeries: { date: string; label: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      dailySeries.push({
        date: iso,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: appts.filter((a) => a.appointment_date === iso).length,
      });
    }

    const statusTotals: Record<string, number> = {};
    for (const a of inWindow) statusTotals[a.status] = (statusTotals[a.status] || 0) + 1;
    const statusData = Object.entries(statusTotals).map(([k, v]) => ({ name: STATUS_LABEL[k] || k, value: v, key: k }));

    const upcoming = appts
      .filter((a) => a.appointment_date >= today)
      .sort((a, b) => (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time))
      .slice(0, 6);

    // procedimentos mais realizados
    const treatTotals: Record<string, number> = {};
    for (const a of inWindow) treatTotals[a.treatment] = (treatTotals[a.treatment] || 0) + 1;
    const topTreatments = Object.entries(treatTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    function delta(curr: number, prev: number) {
      if (prev === 0) return curr === 0 ? 0 : 100;
      return Math.round(((curr - prev) / prev) * 100);
    }

    return {
      todays, newPatients, inProgress, revenue, confirmedRate,
      dailySeries, statusData, upcoming, topTreatments,
      deltas: {
        appts: delta(inWindow.length, inPrev.length),
        patients: delta(newPatients, prevPatients),
        revenue: delta(revenue, prevRevenue),
      },
      total: inWindow.length,
      pending: appts.filter((a) => a.status === "pending").length,
    };
  }, [appts, today, days]);

  const noData = !isLoading && appts.length === 0;
  const subtitle = `Visão geral da sua clínica · ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={subtitle}
        actions={
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList className="bg-white border h-9">
              <TabsTrigger value="7" className="text-xs px-3">7 dias</TabsTrigger>
              <TabsTrigger value="30" className="text-xs px-3">30 dias</TabsTrigger>
              <TabsTrigger value="90" className="text-xs px-3">90 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Agendamentos hoje" value={stats.todays.length} hint="vs ontem" icon={Calendar} accent="blue"
          trend={{ value: stats.deltas.appts, positive: stats.deltas.appts >= 0 }} />
        <KpiCard label={`Novos pacientes (${days}d)`} value={stats.newPatients} hint="únicos por telefone" icon={Users} accent="emerald"
          trend={{ value: stats.deltas.patients, positive: stats.deltas.patients >= 0 }} />
        <KpiCard label="Em andamento" value={stats.inProgress} hint="confirmados aguardando" icon={Activity} accent="amber" />
        <KpiCard
          label="Faturamento estimado"
          value={stats.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          hint={`período de ${days} dias`} icon={Wallet} accent="violet"
          trend={{ value: stats.deltas.revenue, positive: stats.deltas.revenue >= 0 }}
        />
        <KpiCard label="Taxa de confirmação" value={`${stats.confirmedRate}%`} hint="confirmados + concluídos" icon={CheckCircle2} accent="sky" />
      </div>

      {/* Linha 1: Área + Donut */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartFrame
          className="xl:col-span-2"
          title={`Agendamentos dos últimos ${days} dias`}
          hint={`Total no período: ${stats.total}`}
          actions={<Badge variant="outline" className="text-xs font-normal">tempo real</Badge>}
        >
          {noData ? (
            <EmptyState icon={Calendar} title="Sem agendamentos ainda" description="Os agendamentos enviados pelo site aparecerão aqui automaticamente." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.dailySeries} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="dashG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(220 18% 92%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.ceil(days / 8))} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <ReTooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12, padding: "8px 12px", boxShadow: "0 8px 24px -10px rgba(15,23,42,.18)" }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: any) => [`${v} agendamento(s)`, "Total"]}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--chart-blue))" strokeWidth={2.4} fill="url(#dashG)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartFrame>

        <ChartFrame title="Status dos agendamentos" hint="Distribuição no período">
          {noData ? (
            <EmptyState icon={Activity} title="Sem dados" description="Aguardando primeiros registros." />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-[200px] w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none">
                      {stats.statusData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "hsl(220 10% 60%)"} />
                      ))}
                    </Pie>
                    <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                </div>
              </div>
              <ul className="w-full space-y-1.5 text-xs">
                {stats.statusData.map((s) => {
                  const pct = stats.total ? Math.round((s.value / stats.total) * 100) : 0;
                  return (
                    <li key={s.key} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.key] }} />
                        {s.name}
                      </span>
                      <span className="font-medium tabular-nums">{s.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </ChartFrame>
      </div>

      {/* Linha 2: Próximos + Procedimentos + Reviews */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartFrame title="Próximos agendamentos" hint="Os 6 mais próximos" actions={<a href="/admin/agenda" className="text-xs font-medium text-primary hover:underline">Ver agenda →</a>}>
          {stats.upcoming.length === 0 ? (
            <EmptyState icon={Clock} title="Nada agendado" description="Quando houver novos agendamentos, eles aparecerão aqui." />
          ) : (
            <ul className="-m-2 divide-y divide-[hsl(var(--admin-border))]">
              {stats.upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-2 py-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 text-[11px] font-semibold">
                    {a.appointment_time.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.treatment}</p>
                  </div>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </ChartFrame>

        <ChartFrame title="Procedimentos mais realizados" hint={`Top 5 nos últimos ${days} dias`}>
          {stats.topTreatments.length === 0 ? (
            <EmptyState icon={Activity} title="Sem dados" description="Após os primeiros atendimentos." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.topTreatments} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(220 18% 92%)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "hsl(220 12% 35%)" }} tickLine={false} axisLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12 }} formatter={(v: any) => [`${v} atendimento(s)`, "Total"]} />
                <Bar dataKey="total" fill="hsl(var(--chart-blue))" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartFrame>

        <ChartFrame title="Avaliações recentes" hint="Depoimentos de pacientes" actions={<Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1 fill-current" /> 4.9</Badge>}>
          <ul className="space-y-4">
            {TESTIMONIALS.slice(0, 3).map((t) => (
              <li key={t.name} className="border-l-2 border-primary/40 pl-3">
                <div className="flex items-center gap-1 mb-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
                <p className="text-sm leading-relaxed line-clamp-3">"{t.text}"</p>
                <p className="text-xs text-muted-foreground mt-1.5">— {t.name}, {t.city}</p>
              </li>
            ))}
          </ul>
        </ChartFrame>
      </div>

    </>
  );
}
