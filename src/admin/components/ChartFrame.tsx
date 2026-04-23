import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function ChartFrame({
  title,
  hint,
  actions,
  children,
  className,
  height = 280,
}: {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  height?: number;
}) {
  return (
    <div className={cn("admin-card flex flex-col overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--admin-border))] px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-[hsl(var(--admin-text-muted))]">{hint}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4 sm:p-5" style={{ minHeight: height }}>
        {children}
      </div>
    </div>
  );
}
