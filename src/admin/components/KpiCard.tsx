import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENTS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  slate: "bg-slate-50 text-slate-600 ring-slate-100",
};

export default function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "blue",
  compact,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: { value: number; positive?: boolean; label?: string };
  accent?: keyof typeof ACCENTS | string;
  compact?: boolean;
}) {
  const accentCls = ACCENTS[accent] || ACCENTS.blue;
  const trendIsZero = trend && trend.value === 0;
  const trendUp = trend && (trend.positive ?? trend.value >= 0);

  return (
    <div className={cn("admin-card admin-card-hover relative overflow-hidden", compact ? "p-4" : "p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid place-items-center rounded-xl ring-4 ring-inset", accentCls, compact ? "h-9 w-9" : "h-11 w-11")}>
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              trendIsZero
                ? "bg-slate-100 text-slate-600"
                : trendUp
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {trendIsZero ? <Minus className="h-3 w-3" /> : trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>

      <div className={cn("mt-4", compact && "mt-3")}>
        <p className={cn("font-semibold tracking-[-0.02em] tabular-nums leading-none", compact ? "text-2xl" : "text-[28px] sm:text-[32px]")}>{value}</p>
        <p className={cn("mt-2 text-[13px] font-medium text-[hsl(var(--admin-text))]", compact && "text-xs")}>{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-[hsl(var(--admin-text-muted))]">{hint}</p>}
      </div>
    </div>
  );
}
