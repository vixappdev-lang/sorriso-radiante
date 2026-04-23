import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  novo: "bg-sky-50 text-sky-700 ring-sky-200",
  contato: "bg-violet-50 text-violet-700 ring-violet-200",
  orcamento: "bg-amber-50 text-amber-700 ring-amber-200",
  fechado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  perdido: "bg-rose-50 text-rose-700 ring-rose-200",
};

const LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  done: "Concluído",
  cancelled: "Cancelado",
  active: "Ativo",
  inactive: "Inativo",
  paid: "Pago",
  overdue: "Atrasado",
  novo: "Novo",
  contato: "Em contato",
  orcamento: "Orçamento",
  fechado: "Fechado",
  perdido: "Perdido",
};

export default function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? LABELS[status] ?? status}
    </span>
  );
}
