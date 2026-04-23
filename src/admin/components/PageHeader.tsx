import { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[24px] leading-tight">{title}</h1>
        {description && (
          <p className="mt-0.5 max-w-2xl text-[13px] text-[hsl(var(--admin-text-muted))]">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
