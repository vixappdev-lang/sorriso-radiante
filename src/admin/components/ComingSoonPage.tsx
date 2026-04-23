import { LucideIcon } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";

export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
  modules,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  modules: { label: string; hint: string }[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 mb-5 flex items-start gap-4">
        <div className="h-12 w-12 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display text-lg">Módulo em construção</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Esta área está sendo preparada com cuidado. Abaixo, os submódulos previstos — sem dados fictícios, só estrutura real à medida que a clínica precisar.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((m) => (
          <div key={m.label} className="rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors">
            <p className="font-medium">{m.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.hint}</p>
          </div>
        ))}
      </div>
    </>
  );
}
