import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENTS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
};

export default function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  trend?: { value: number; positive?: boolean; label?: string };
  accent?: keyof typeof ACCENTS | string;
}) {
  return (
    <div className="admin-card p-5 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.10)]">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 grid place-items-center rounded-xl", ACCENTS[accent] || ACCENTS.blue)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--admin-text-muted))]">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
              trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            )}
          >
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
        {hint && <span className="text-[hsl(var(--admin-text-muted))]">{hint}</span>}
      </div>
    </div>
  );
}
