import { useMemo, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import ChartFrame from "@/admin/components/ChartFrame";
import EmptyState from "@/admin/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { useFinance } from "@/admin/hooks/useFinance";
import { useLeads } from "@/admin/hooks/useLeads";
import Papa from "papaparse";

const REPORTS = [
  { value: "performance", label: "Performance mensal" },
  { value: "conversion", label: "Conversão de leads" },
  { value: "noshows", label: "Faltas e cancelamentos" },
  { value: "treatments", label: "Tratamentos mais realizados" },
] as const;

const PERIODS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "60", label: "Últimos 60 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
] as const;

export default function AdminRelatorios() {
  const { data: appts = [] } = useAppointments();
  const { data: finance = [] } = useFinance();
  const { data: leads = [] } = useLeads();
  const [report, setReport] = useState<typeof REPORTS[number]["value"]>("performance");
  const [period, setPeriod] = useState<typeof PERIODS[number]["value"]>("30");

  const data = useMemo(() => {
    const days = parseInt(period, 10);
    const start = new Date(); start.setDate(start.getDate() - days);
    const startISO = start.toISOString().slice(0, 10);

    if (report === "performance") {
      const series: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        series[d.toISOString().slice(0, 10)] = 0;
      }
      appts.filter((a) => a.appointment_date >= startISO).forEach((a) => {
        if (series[a.appointment_date] !== undefined) series[a.appointment_date]++;
      });
      const chart = Object.entries(series).map(([d, v]) => ({ label: d.slice(5), total: v }));
      const total = appts.filter((a) => a.appointment_date >= startISO).length;
      const done = appts.filter((a) => a.appointment_date >= startISO && a.status === "done").length;
      return { kpis: [{ label: "Total agendamentos", value: total }, { label: "Concluídos", value: done }], chart, type: "area" as const };
    }
    if (report === "conversion") {
      const total = leads.length;
      const won = leads.filter((l) => l.status === "fechado").length;
      const lost = leads.filter((l) => l.status === "perdido").length;
      const open = total - won - lost;
      const chart = [
        { label: "Em aberto", total: open },
        { label: "Fechados", total: won },
        { label: "Perdidos", total: lost },
      ];
      return { kpis: [{ label: "Total leads", value: total }, { label: "Conversão", value: total ? `${Math.round((won / total) * 100)}%` : "0%" }], chart, type: "bar" as const };
    }
    if (report === "noshows") {
      const cancelled = appts.filter((a) => a.appointment_date >= startISO && a.status === "cancelled").length;
      const total = appts.filter((a) => a.appointment_date >= startISO).length;
      const chart: any[] = [];
      const byDate: Record<string, number> = {};
      appts.filter((a) => a.appointment_date >= startISO && a.status === "cancelled").forEach((a) => {
        byDate[a.appointment_date] = (byDate[a.appointment_date] || 0) + 1;
      });
      Object.entries(byDate).sort().forEach(([d, v]) => chart.push({ label: d.slice(5), total: v }));
      return { kpis: [{ label: "Cancelamentos", value: cancelled }, { label: "Taxa", value: total ? `${Math.round((cancelled / total) * 100)}%` : "0%" }], chart, type: "bar" as const };
    }
    // treatments
    const counts: Record<string, number> = {};
    appts.filter((a) => a.appointment_date >= startISO).forEach((a) => { counts[a.treatment] = (counts[a.treatment] || 0) + 1; });
    const chart = Object.entries(counts).map(([name, total]) => ({ label: name.slice(0, 18), total })).sort((a, b) => b.total - a.total).slice(0, 8);
    return { kpis: [{ label: "Tratamentos distintos", value: Object.keys(counts).length }, { label: "Top", value: chart[0]?.label ?? "—" }], chart, type: "bar" as const };
  }, [report, period, appts, finance, leads]);

  function exportCSV() {
    const csv = Papa.unparse(data.chart);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${report}-${period}d.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Métricas operacionais, financeiras e comerciais."
        actions={<Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Exportar CSV</Button>}
      />

      <div className="admin-card mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-3.5">
        <Select value={report} onValueChange={(v) => setReport(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>{REPORTS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="h-10 w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>{PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {data.kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={BarChart3} accent="blue" compact />
        ))}
      </div>

      <ChartFrame title={REPORTS.find((r) => r.value === report)?.label ?? ""} hint={PERIODS.find((p) => p.value === period)?.label}>
        {data.chart.length === 0 ? (
          <EmptyState icon={BarChart3} title="Sem dados no período" description="Quando houver registros, o relatório aparecerá aqui." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {data.type === "area" ? (
              <AreaChart data={data.chart} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="rep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(220 18% 92%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--chart-blue))" strokeWidth={2.4} fill="url(#rep)" />
              </AreaChart>
            ) : (
              <BarChart data={data.chart} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(220 18% 92%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(220 10% 50%)" }} tickLine={false} axisLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 18% 86%)", fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(var(--chart-blue))" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </ChartFrame>
    </>
  );
}
