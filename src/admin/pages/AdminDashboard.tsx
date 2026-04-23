import { useMemo } from "react";
import {
  Calendar,
  Users,
  Activity,
  Wallet,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import EmptyState from "@/admin/components/EmptyState";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { TREATMENTS, TESTIMONIALS } from "@/data/clinic";
import { Badge } from "@/components/ui/badge";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function priceForTreatment(name: string): number {
  const t = TREATMENTS.find((x) => x.name === name);
  if (!t) return 0;
  const num = Number((t.priceFrom || "").replace(/[^\d]/g, "")) || 0;
  return num;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(35, 90%, 55%)",
  confirmed: "hsl(215, 75%, 50%)",
  done: "hsl(145, 55%, 42%)",
  cancelled: "hsl(0, 70%, 55%)",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  done: "Concluído",
  cancelled: "Cancelado",
};

export default function AdminDashboard() {
  const { data: appts = [], isLoading } = useAppointments();

  const today = todayISO();
  const stats = useMemo(() => {
    const last30Start = new Date();
    last30Start.setDate(last30Start.getDate() - 29);
    const start = last30Start.toISOString().slice(0, 10);

    const inWindow = appts.filter((a) => a.appointment_date >= start);
    const todays = appts.filter((a) => a.appointment_date === today);
    const newPatients = new Set(inWindow.map((a) => a.phone)).size;
    const inProgress = appts.filter((a) => a.status === "confirmed").length;
    const revenue = appts
      .filter((a) => a.status === "confirmed" || a.status === "done")
      .reduce((sum, a) => sum + priceForTreatment(a.treatment), 0);

    // Série diária (últimos 30 dias)
    const days: { date: string; label: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        date: iso,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        total: appts.filter((a) => a.appointment_date === iso).length,
      });
    }

    // Donut por status
    const statusTotals: Record<string, number> = {};
    for (const a of appts) statusTotals[a.status] = (statusTotals[a.status] || 0) + 1;
    const statusData = Object.entries(statusTotals).map(([k, v]) => ({
      name: STATUS_LABEL[k] || k,
      value: v,
      key: k,
    }));

    // Próximos 7 dias
    const upcoming = appts
      .filter((a) => a.appointment_date >= today)
      .sort((a, b) => (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time))
      .slice(0, 8);

    return { todays, newPatients, inProgress, revenue, days, statusData, upcoming };
  }, [appts, today]);

  const noData = !isLoading && appts.length === 0;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Acompanhe agendamentos, novos pacientes e a saúde da clínica em tempo real."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Agendamentos hoje"
          value={stats.todays.length}
          hint={stats.todays.length === 0 ? "Sem consultas marcadas" : `${stats.todays.length} compromisso(s)`}
          icon={Calendar}
          accent="primary"
        />
        <KpiCard
          label="Novos pacientes (30d)"
          value={stats.newPatients}
          hint="Únicos por telefone"
          icon={Users}
          accent="success"
        />
        <KpiCard
          label="Em andamento"
          value={stats.inProgress}
          hint="Confirmados aguardando atendimento"
          icon={Activity}
          accent="warning"
        />
        <KpiCard
          label="Faturamento estimado"
          value={stats.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          hint="Soma de tabelas (confirmados + concluídos)"
          icon={Wallet}
          accent="muted"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg">Agendamentos por dia</h3>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </div>
            <Badge variant="outline" className="text-xs">total: {appts.length}</Badge>
          </div>
          {noData ? (
            <EmptyState
              icon={Calendar}
              title="Sem agendamentos ainda"
              description="Os agendamentos enviados pelo site aparecerão aqui automaticamente."
            />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={stats.days} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(215, 75%, 50%)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(215, 75%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 92%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={3} stroke="hsl(220, 10%, 60%)" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 60%)" />
                  <ReTooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid hsl(220, 18%, 86%)", fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(215, 75%, 38%)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-display text-lg">Status dos agendamentos</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição</p>
          {noData ? (
            <EmptyState icon={Activity} title="Sem dados" description="Aguardando primeiros registros." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {stats.statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || "hsl(220, 10%, 60%)"} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(220, 18%, 86%)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Próximos + Avaliações */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2 rounded-2xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg">Próximos agendamentos</h3>
              <p className="text-xs text-muted-foreground">Os 8 mais próximos</p>
            </div>
          </div>
          {stats.upcoming.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Clock} title="Nada agendado" description="Quando houver novos agendamentos, eles aparecerão aqui." />
            </div>
          ) : (
            <div className="divide-y">
              {stats.upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40">
                  <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary text-xs font-semibold">
                    {a.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.treatment}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">
                      {new Date(a.appointment_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.appointment_time}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">Avaliações recentes</h3>
            <Badge variant="outline" className="text-xs">
              <Star className="h-3 w-3 mr-1 fill-current" /> 4.9
            </Badge>
          </div>
          <ul className="space-y-4">
            {TESTIMONIALS.slice(0, 3).map((t) => (
              <li key={t.name} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm leading-relaxed line-clamp-3">"{t.text}"</p>
                <p className="text-xs text-muted-foreground mt-1.5">— {t.name}, {t.city}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
    pending: { label: "Pendente", className: "bg-amber-50 text-amber-700 border-amber-200", Icon: AlertCircle },
    confirmed: { label: "Confirmado", className: "bg-blue-50 text-blue-700 border-blue-200", Icon: CheckCircle2 },
    done: { label: "Concluído", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    cancelled: { label: "Cancelado", className: "bg-red-50 text-red-700 border-red-200", Icon: XCircle },
  };
  const m = map[status] || { label: status, className: "bg-muted text-foreground border-border", Icon: AlertCircle };
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.className}`}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}
