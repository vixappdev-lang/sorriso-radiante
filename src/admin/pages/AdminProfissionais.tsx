import { UserCog } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { DENTISTS } from "@/data/clinic";

export default function AdminProfissionais() {
  return (
    <>
      <PageHeader title="Profissionais" description="Equipe clínica da Clínica Levii." />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {DENTISTS.map((d) => (
          <div key={d.slug} className="rounded-2xl border bg-card overflow-hidden">
            <div className="aspect-[4/3] bg-muted overflow-hidden">
              <img src={d.photo} alt={d.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="font-display text-base leading-tight">{d.name}</p>
              <p className="text-xs text-primary mt-0.5">{d.specialty}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.cro}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
