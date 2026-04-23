import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AdminCard({
  title,
  description,
  actions,
  children,
  footer,
  className,
  bodyClassName,
  noPadding,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}) {
  return (
    <section className={cn("admin-card overflow-hidden", className)}>
      {(title || actions || description) && (
        <header className="flex flex-col gap-1 border-b border-[hsl(var(--admin-border))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-[hsl(var(--admin-text-muted))]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(noPadding ? "" : "p-5", bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-[hsl(var(--admin-border))] px-5 py-3 text-xs text-[hsl(var(--admin-text-muted))]">{footer}</footer>}
    </section>
  );
}
