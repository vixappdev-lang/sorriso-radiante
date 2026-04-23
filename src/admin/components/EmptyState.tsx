import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-[hsl(var(--admin-border-strong))] bg-[hsl(var(--admin-bg))] p-10 text-center", className)}>
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-[hsl(var(--admin-text-muted))]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
