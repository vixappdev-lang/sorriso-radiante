import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Users, Eye, MessageCircle, Phone, Mail, FileText, Calendar as CalIcon } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityDrawer from "@/admin/components/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import StatusPill from "@/admin/components/StatusPill";

type Patient = { phone: string; name: string; email: string | null; visits: number; last: string; lastTreatment: string };

export default function AdminPacientes() {
  const { data: appts = [] } = useAppointments();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [drawer, setDrawer] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => { setQ(params.get("q") ?? ""); }, [params]);

  const patients: Patient[] = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const a of appts) {
      const cur = map.get(a.phone);
      if (!cur) map.set(a.phone, { phone: a.phone, name: a.name, email: a.email, visits: 1, last: a.appointment_date, lastTreatment: a.treatment });
      else {
        cur.visits += 1;
        if (a.appointment_date > cur.last) { cur.last = a.appointment_date; cur.lastTreatment = a.treatment; cur.name = a.name; }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
  }, [appts]);

  async function loadNotes(phone: string) {
    const { data } = await supabase.from("patient_notes").select("*").eq("patient_phone", phone).order("created_at", { ascending: false });
    setNotes(data ?? []);
  }

  async function addNote() {
    if (!drawer || !newNote.trim()) return;
    const { data: ures } = await supabase.auth.getUser();
    const { error } = await supabase.from("patient_notes").insert({ patient_phone: drawer.phone, note: newNote.trim(), created_by: ures.user?.id });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewNote("");
    await loadNotes(drawer.phone);
    toast({ title: "Observação adicionada" });
  }

  function openDrawer(p: Patient) { setDrawer(p); loadNotes(p.phone); }

  const history = drawer ? appts.filter((a) => a.phone === drawer.phone).sort((a, b) => (b.appointment_date + b.appointment_time).localeCompare(a.appointment_date + a.appointment_time)) : [];

  const columns: Column<Patient>[] = [
    { key: "name", header: "Paciente", cell: (p) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{p.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>
        <div className="min-w-0">
          <p className="font-medium truncate">{p.name}</p>
          <p className="text-xs text-muted-foreground truncate">{p.email || "—"}</p>
        </div>
      </div>
    ) },
    { key: "phone", header: "Telefone", cell: (p) => <span className="tabular-nums">{p.phone}</span> },
    { key: "visits", header: "Visitas", cell: (p) => <Badge variant="secondary">{p.visits}</Badge> },
    { key: "lastTreatment", header: "Último tratamento", cell: (p) => <span className="text-muted-foreground">{p.lastTreatment}</span>, className: "hidden md:table-cell" },
    { key: "last", header: "Última visita", cell: (p) => <span className="text-muted-foreground">{new Date(p.last).toLocaleDateString("pt-BR")}</span>, className: "hidden sm:table-cell" },
  ];

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Lista derivada dos agendamentos. Adicione observações internas e veja o histórico."
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}); }} placeholder="Buscar nome, telefone, e-mail…" className="pl-9 h-10 bg-white" />
          </div>
        }
      />

      {patients.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum paciente ainda" description="Os pacientes aparecerão aqui assim que houver agendamentos pelo site." />
      ) : (
        <DataTable
          rows={patients.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q) || (p.email ?? "").toLowerCase().includes(q.toLowerCase()))}
          columns={columns}
          pageSize={12}
          onRowClick={openDrawer}
          rowActions={(p) => (
            <>
              <Button size="sm" variant="ghost" onClick={() => openDrawer(p)}><Eye className="h-4 w-4" /></Button>
              <a href={`https://wa.me/55${p.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost"><MessageCircle className="h-4 w-4 text-emerald-600" /></Button>
              </a>
            </>
          )}
        />
      )}

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => { if (!v) setDrawer(null); }}
        title={drawer?.name ?? ""}
        description={`${drawer?.visits ?? 0} visita(s) · última em ${drawer ? new Date(drawer.last).toLocaleDateString("pt-BR") : ""}`}
      >
        {drawer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {drawer.phone}</div>
              <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {drawer.email || "—"}</div>
              <a href={`https://wa.me/55${drawer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700"><MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp</Button>
              </a>
            </div>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><CalIcon className="h-3.5 w-3.5" /> Histórico de agendamentos</h4>
              <ul className="space-y-2">
                {history.map((a) => (
                  <li key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{a.treatment}</p>
                      <StatusPill status={a.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(a.appointment_date).toLocaleDateString("pt-BR")} · {a.appointment_time}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Observações internas</h4>
              <div className="space-y-2 mb-3">
                {notes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma observação ainda.</p>}
                {notes.map((n) => (
                  <div key={n.id} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
              <Textarea rows={3} placeholder="Anotação clínica, alergia, preferências…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              <Button size="sm" className="mt-2" onClick={addNote} disabled={!newNote.trim()}>Adicionar observação</Button>
            </section>
          </div>
        )}
      </EntityDrawer>
    </>
  );
}
