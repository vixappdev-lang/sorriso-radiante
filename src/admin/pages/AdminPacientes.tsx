import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import { Input } from "@/components/ui/input";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { Badge } from "@/components/ui/badge";

export default function AdminPacientes() {
  const { data: appts = [] } = useAppointments();
  const [q, setQ] = useState("");

  const patients = useMemo(() => {
    const map = new Map<string, { phone: string; name: string; email: string | null; visits: number; last: string }>();
    for (const a of appts) {
      const key = a.phone;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { phone: a.phone, name: a.name, email: a.email, visits: 1, last: a.appointment_date });
      } else {
        cur.visits += 1;
        if (a.appointment_date > cur.last) cur.last = a.appointment_date;
      }
    }
    let list = Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
    if (q) {
      const Q = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(Q) || p.phone.includes(Q));
    }
    return list;
  }, [appts, q]);

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Lista derivada dos agendamentos. O cadastro completo será habilitado em breve."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome ou telefone…" className="pl-9" />
          </div>
        }
      />

      {patients.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum paciente ainda" description="Os pacientes aparecerão aqui assim que houver agendamentos." />
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Nome</th>
                <th className="text-left px-5 py-3">Telefone</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">E-mail</th>
                <th className="text-left px-5 py-3">Visitas</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Última</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.phone} className="border-t hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3">{p.phone}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{p.email || "—"}</td>
                  <td className="px-5 py-3"><Badge variant="secondary">{p.visits}</Badge></td>
                  <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{new Date(p.last).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
