import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Users, Eye, MessageCircle, Phone, Mail, FileText, Calendar as CalIcon, DollarSign, User as UserIcon, History, StickyNote } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityDrawer from "@/admin/components/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [account, setAccount] = useState<any | null>(null);
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

  async function loadPatientData(phone: string) {
    const [n, i, acc] = await Promise.all([
      supabase.from("patient_notes").select("*").eq("patient_phone", phone).order("created_at", { ascending: false }),
      supabase.from("patient_invoices").select("*").eq("patient_phone", phone).order("created_at", { ascending: false }),
      supabase.from("patient_accounts").select("*").eq("phone", phone).maybeSingle(),
    ]);
    setNotes(n.data ?? []);
    setInvoices(i.data ?? []);
    setAccount(acc.data ?? null);
  }

  async function addNote() {
    if (!drawer || !newNote.trim()) return;
    const { data: ures } = await supabase.auth.getUser();
    const { error } = await supabase.from("patient_notes").insert({ patient_phone: drawer.phone, note: newNote.trim(), created_by: ures.user?.id });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewNote("");
    await loadPatientData(drawer.phone);
    toast({ title: "Observação adicionada" });
  }

  function openDrawer(p: Patient) { setDrawer(p); loadPatientData(p.phone); }

  const history = drawer ? appts.filter((a) => a.phone === drawer.phone).sort((a, b) => (b.appointment_date + b.appointment_time).localeCompare(a.appointment_date + a.appointment_time)) : [];
  const totalSpent = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_cents || 0), 0);
  const pending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount_cents || 0), 0);
  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const columns: Column<Patient>[] = [
    { key: "name", header: "Paciente", cell: (p) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{p.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>
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
        description="Lista derivada dos agendamentos. Gerencie histórico, finanças e observações clínicas."
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}); }} placeholder="Buscar nome, telefone, e-mail…" className="pl-9 h-10 bg-card" />
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
          <div className="space-y-5">
            {/* Header com contatos */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {drawer.phone}</div>
              <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {drawer.email || "—"}</div>
              <a href={`https://wa.me/55${drawer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp</Button>
              </a>
            </div>

            <Tabs defaultValue="resumo">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="resumo" className="text-xs"><UserIcon className="h-3.5 w-3.5 mr-1" />Resumo</TabsTrigger>
                <TabsTrigger value="historico" className="text-xs"><History className="h-3.5 w-3.5 mr-1" />Histórico</TabsTrigger>
                <TabsTrigger value="financeiro" className="text-xs"><DollarSign className="h-3.5 w-3.5 mr-1" />Financeiro</TabsTrigger>
                <TabsTrigger value="obs" className="text-xs"><StickyNote className="h-3.5 w-3.5 mr-1" />Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Visitas totais</p>
                    <p className="text-2xl font-semibold mt-1">{drawer.visits}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tratamentos únicos</p>
                    <p className="text-2xl font-semibold mt-1">{new Set(history.map(h => h.treatment)).size}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total pago</p>
                    <p className="text-lg font-semibold mt-1 text-emerald-700">{fmt(totalSpent)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">A receber</p>
                    <p className="text-lg font-semibold mt-1 text-amber-700">{fmt(pending)}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Conta no portal</p>
                  {account ? (
                    <div className="text-sm">
                      <p className="font-medium">{account.full_name}</p>
                      <p className="text-xs text-muted-foreground">Criada em {new Date(account.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Paciente ainda não criou conta no portal.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <ul className="space-y-2">
                  {history.length === 0 && <li className="text-xs text-muted-foreground">Nenhum agendamento.</li>}
                  {history.map((a) => (
                    <li key={a.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{a.treatment}</p>
                        <StatusPill status={a.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5"><CalIcon className="h-3 w-3" />{new Date(a.appointment_date).toLocaleDateString("pt-BR")} · {a.appointment_time} {a.professional && `· ${a.professional}`}</p>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="financeiro" className="mt-4 space-y-2">
                {invoices.length === 0 && <p className="text-xs text-muted-foreground">Nenhum lançamento financeiro.</p>}
                {invoices.map((i) => (
                  <div key={i.id} className="rounded-lg border p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.description}</p>
                      <p className="text-xs text-muted-foreground">{i.due_date && `Venc. ${new Date(i.due_date).toLocaleDateString("pt-BR")}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{fmt(i.amount_cents)}</p>
                      <Badge variant="outline" className={i.status === "paid" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"}>
                        {i.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="obs" className="mt-4">
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
                <Button size="sm" className="mt-2" onClick={addNote} disabled={!newNote.trim()}><FileText className="h-3.5 w-3.5 mr-1.5" />Adicionar observação</Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </EntityDrawer>
    </>
  );
}
