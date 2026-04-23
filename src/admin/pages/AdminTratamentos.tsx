import { Stethoscope, Clock, Tag } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { TREATMENTS } from "@/data/clinic";
import { Badge } from "@/components/ui/badge";

export default function AdminTratamentos() {
  return (
    <>
      <PageHeader
        title="Tratamentos"
        description="Catálogo de procedimentos oferecidos. Edição em DB chegará em breve."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TREATMENTS.map((t) => (
          <div key={t.slug} className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <Stethoscope className="h-5 w-5" />
              </div>
              <Badge variant="outline">{t.priceFrom}</Badge>
            </div>
            <h3 className="font-display text-lg leading-tight">{t.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.short}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.duration}</span>
              <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {t.highlights.length} diferenciais</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
