import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Users, Eye, MessageCircle, Phone, Mail, FileText, Calendar as CalIcon,
  DollarSign, User as UserIcon, History, StickyNote, Plus, Smile, ClipboardList,
  Trash2, ExternalLink, Copy, Check,
} from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityModal from "@/admin/components/EntityModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { useTreatmentOverrides } from "@/admin/hooks/useTreatments";
import { TREATMENTS } from "@/data/clinic";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import StatusPill from "@/admin/components/StatusPill";
import { cn } from "@/lib/utils";
import PatientAnamnesisTab from "@/admin/components/patient/PatientAnamnesisTab";
import PatientRecordsTab from "@/admin/components/patient/PatientRecordsTab";
import PatientImagesTab from "@/admin/components/patient/PatientImagesTab";
import { FileSignature, ClipboardEdit, ImagePlus } from "lucide-react";

type Patient = {
  phone: string;
  name: string;
  email: string | null;
  visits: number;
  last: string;
  lastTreatment: string;
  registered: boolean;
  account?: any;
};

const TOOTH_STATUS = {
  healthy: { label: "Hígido", color: "fill-emerald-300" },
  caries: { label: "Cariado", color: "fill-rose-400" },
  restored: { label: "Restaurado", color: "fill-blue-400" },
  extracted: { label: "Extraído", color: "fill-slate-700" },
  todo: { label: "A tratar", color: "fill-amber-400" },
} as const;
type ToothStatus = keyof typeof TOOTH_STATUS;

// Numeração padrão FDI (32 dentes adultos)
const TEETH_LAYOUT = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
};

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function AdminPacientes() {
  const { data: appts = [] } = useAppointments();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [drawer, setDrawer] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [account, setAccount] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [odontogram, setOdontogram] = useState<Record<string, ToothStatus>>({});
  const [quotes, setQuotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const emptyPatient = {
    full_name: "", phone: "", email: "", cpf: "", rg: "", birth_date: "",
    gender: "", marital_status: "", profession: "",
    address_zip: "", address_street: "", address_number: "", address_complement: "", address_neighborhood: "", address_city: "", address_state: "",
    emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relation: "",
    allergies: "", medical_conditions: "", current_medications: "",
    insurance_name: "", insurance_number: "",
    source_channel: "recepcao", how_found_us: "",
    responsible_name: "", responsible_cpf: "",
    allow_whatsapp: true, allow_email: true,
    notes: "",
  };
  const [newPatient, setNewPatient] = useState<typeof emptyPatient>(emptyPatient);
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);

  useEffect(() => { setQ(params.get("q") ?? ""); }, [params]);

  useEffect(() => {
    supabase.from("patient_accounts").select("*").then(({ data }) => setAccounts(data ?? []));
  }, []);

  const patients: Patient[] = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const a of appts) {
      const cur = map.get(a.phone);
      if (!cur) map.set(a.phone, { phone: a.phone, name: a.name, email: a.email, visits: 1, last: a.appointment_date, lastTreatment: a.treatment, registered: false });
      else {
        cur.visits += 1;
        if (a.appointment_date > cur.last) { cur.last = a.appointment_date; cur.lastTreatment = a.treatment; cur.name = a.name; }
      }
    }
    // merge accounts
    for (const acc of accounts) {
      const existing = map.get(acc.phone);
      if (existing) {
        existing.registered = true;
        existing.account = acc;
        existing.email = existing.email || acc.email;
      } else {
        map.set(acc.phone, {
          phone: acc.phone, name: acc.full_name, email: acc.email,
          visits: 0, last: acc.created_at.slice(0, 10), lastTreatment: "—",
          registered: true, account: acc,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
  }, [appts, accounts]);

  async function loadPatientData(phone: string) {
    const [n, i, acc, od, qs] = await Promise.all([
      supabase.from("patient_notes").select("*").eq("patient_phone", phone).order("created_at", { ascending: false }),
      supabase.from("patient_invoices").select("*").eq("patient_phone", phone).order("created_at", { ascending: false }),
      supabase.from("patient_accounts").select("*").eq("phone", phone).maybeSingle(),
      supabase.from("patient_odontogram").select("*").eq("patient_phone", phone).maybeSingle(),
      supabase.from("patient_quotes").select("*").eq("patient_phone", phone).order("created_at", { ascending: false }),
    ]);
    setNotes(n.data ?? []);
    setInvoices(i.data ?? []);
    setAccount(acc.data ?? null);
    setOdontogram((od.data?.teeth as any) ?? {});
    setQuotes(qs.data ?? []);
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

  async function saveTooth(num: number, status: ToothStatus) {
    if (!drawer) return;
    const next = { ...odontogram, [String(num)]: status };
    setOdontogram(next);
    const { data: ures } = await supabase.auth.getUser();
    await supabase.from("patient_odontogram").upsert({
      patient_phone: drawer.phone, teeth: next, updated_by: ures.user?.id,
    } as any, { onConflict: "patient_phone" });
  }

  async function createPatient() {
    if (!newPatient.full_name || !newPatient.phone) return toast({ title: "Nome e telefone são obrigatórios", variant: "destructive" });
    const cleanPhone = newPatient.phone.replace(/\D/g, "");
    const address = (newPatient.address_zip || newPatient.address_street) ? {
      zip: newPatient.address_zip, street: newPatient.address_street, number: newPatient.address_number,
      complement: newPatient.address_complement, neighborhood: newPatient.address_neighborhood,
      city: newPatient.address_city, state: newPatient.address_state,
    } : null;
    const payload: any = {
      full_name: newPatient.full_name.trim(),
      phone: cleanPhone,
      email: newPatient.email?.trim() || `${cleanPhone}@sem-email.local`,
      cpf: newPatient.cpf || null,
      rg: newPatient.rg || null,
      birth_date: newPatient.birth_date || null,
      gender: newPatient.gender || null,
      marital_status: newPatient.marital_status || null,
      profession: newPatient.profession || null,
      address,
      emergency_contact_name: newPatient.emergency_contact_name || null,
      emergency_contact_phone: newPatient.emergency_contact_phone?.replace(/\D/g, "") || null,
      emergency_contact_relation: newPatient.emergency_contact_relation || null,
      allergies: newPatient.allergies || null,
      medical_conditions: newPatient.medical_conditions || null,
      current_medications: newPatient.current_medications || null,
      insurance_name: newPatient.insurance_name || null,
      insurance_number: newPatient.insurance_number || null,
      source_channel: newPatient.source_channel || null,
      how_found_us: newPatient.how_found_us || null,
      responsible_name: newPatient.responsible_name || null,
      responsible_cpf: newPatient.responsible_cpf || null,
      allow_whatsapp: newPatient.allow_whatsapp,
      allow_email: newPatient.allow_email,
      notes: newPatient.notes || null,
    };
    const { error } = await supabase.from("patient_accounts").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Paciente cadastrado com sucesso" });
    setNewPatientOpen(false);
    setNewPatient(emptyPatient);
    const { data } = await supabase.from("patient_accounts").select("*");
    setAccounts(data ?? []);
  }

  function openDrawer(p: Patient) { setDrawer(p); loadPatientData(p.phone); }

  const history = drawer ? appts.filter((a) => a.phone === drawer.phone).sort((a, b) => (b.appointment_date + b.appointment_time).localeCompare(a.appointment_date + a.appointment_time)) : [];
  const totalSpent = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount_cents || 0), 0);
  const pending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.amount_cents || 0), 0);

  const columns: Column<Patient>[] = [
    { key: "name", header: "Paciente", cell: (p) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{p.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium truncate">{p.name}</p>
            {p.registered && <Badge variant="outline" className="text-[9px] h-4 border-blue-300 bg-blue-50 text-blue-700">Cadastrado</Badge>}
          </div>
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
        description="CRUD completo + odontograma digital + orçamentos rápidos com aceite via link público."
        actions={
          <div className="flex gap-2 items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}); }} placeholder="Buscar…" className="pl-9 h-10 bg-card" />
            </div>
            <Button onClick={() => setNewPatientOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo paciente</Button>
          </div>
        }
      />

      {patients.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum paciente ainda" description="Comece cadastrando ou aguarde o primeiro agendamento." action={<Button onClick={() => setNewPatientOpen(true)}><Plus className="h-4 w-4 mr-2" /> Cadastrar</Button>} />
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

      <EntityModal
        open={!!drawer}
        onOpenChange={(v) => { if (!v) setDrawer(null); }}
        title={drawer?.name ?? ""}
        description={drawer ? `${drawer.visits} visita(s) · última em ${new Date(drawer.last).toLocaleDateString("pt-BR")}` : ""}
        size="xl"
      >
        {drawer && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-muted/30 p-4 grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3 items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {drawer.phone}</div>
                <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {drawer.email || "—"}</div>
              </div>
              <a href={`https://wa.me/55${drawer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</Button>
              </a>
            </div>

            <Tabs defaultValue="resumo">
              <TabsList className="grid grid-cols-3 sm:grid-cols-9 w-full bg-muted/60 p-1 h-auto gap-1">
                <TabsTrigger value="resumo" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><UserIcon className="h-3 w-3" /> Resumo</TabsTrigger>
                <TabsTrigger value="anamnese" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><FileSignature className="h-3 w-3" /> Anamn.</TabsTrigger>
                <TabsTrigger value="prontuario" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><ClipboardEdit className="h-3 w-3" /> Prontu.</TabsTrigger>
                <TabsTrigger value="imagens" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><ImagePlus className="h-3 w-3" /> Imagens</TabsTrigger>
                <TabsTrigger value="odontograma" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><Smile className="h-3 w-3" /> Dentes</TabsTrigger>
                <TabsTrigger value="orcamento" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><ClipboardList className="h-3 w-3" /> Orçam.</TabsTrigger>
                <TabsTrigger value="historico" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><History className="h-3 w-3" /> Histór.</TabsTrigger>
                <TabsTrigger value="financeiro" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><DollarSign className="h-3 w-3" /> Financ.</TabsTrigger>
                <TabsTrigger value="obs" className="text-[10px] gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"><StickyNote className="h-3 w-3" /> Obs</TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Visitas</p>
                    <p className="text-2xl font-semibold mt-1">{drawer.visits}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tratamentos únicos</p>
                    <p className="text-2xl font-semibold mt-1">{new Set(history.map(h => h.treatment)).size}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total pago</p>
                    <p className="text-lg font-semibold mt-1 text-emerald-700 dark:text-emerald-400">{brl(totalSpent)}</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">A receber</p>
                    <p className="text-lg font-semibold mt-1 text-amber-700 dark:text-amber-400">{brl(pending)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Conta no portal</p>
                  {account ? (
                    <div className="text-sm">
                      <p className="font-medium">{account.full_name}</p>
                      <p className="text-xs text-muted-foreground">Cadastrado em {new Date(account.created_at).toLocaleDateString("pt-BR")}</p>
                      {account.cpf && <p className="text-xs text-muted-foreground">CPF: {account.cpf}</p>}
                      {account.birth_date && <p className="text-xs text-muted-foreground">Nasc.: {new Date(account.birth_date).toLocaleDateString("pt-BR")}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Paciente derivado de agendamentos. Sem cadastro no portal.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="anamnese" className="mt-4">
                <PatientAnamnesisTab patientPhone={drawer.phone} patientName={drawer.name} patientEmail={drawer.email} />
              </TabsContent>

              <TabsContent value="prontuario" className="mt-4">
                <PatientRecordsTab patientPhone={drawer.phone} patientName={drawer.name} />
              </TabsContent>

              <TabsContent value="imagens" className="mt-4">
                <PatientImagesTab patientPhone={drawer.phone} />
              </TabsContent>

              <TabsContent value="odontograma" className="mt-4">
                <Odontogram teeth={odontogram} onChange={saveTooth} />
              </TabsContent>

              <TabsContent value="orcamento" className="mt-4 space-y-3">
                <Button onClick={() => setNewQuoteOpen(true)} size="sm" className="w-full"><Plus className="h-3.5 w-3.5 mr-1.5" /> Novo orçamento</Button>
                {quotes.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhum orçamento ainda.</p>}
                {quotes.map((q) => <QuoteCard key={q.id} quote={q} patient={drawer} onChange={() => loadPatientData(drawer.phone)} />)}
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <ul className="space-y-2">
                  {history.length === 0 && <li className="text-xs text-muted-foreground">Nenhum agendamento.</li>}
                  {history.map((a) => (
                    <li key={a.id} className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
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
                  <div key={i.id} className="rounded-lg border border-[hsl(var(--admin-border))] p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.description}</p>
                      <p className="text-xs text-muted-foreground">{i.due_date && `Venc. ${new Date(i.due_date).toLocaleDateString("pt-BR")}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{brl(i.amount_cents)}</p>
                      <Badge variant="outline" className={i.status === "paid" ? "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40" : "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"}>
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
                    <div key={n.id} className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 p-3">
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
      </EntityModal>

      {/* Modal: novo paciente — cadastro completo (recepção / WhatsApp) */}
      <EntityModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        title="Cadastrar paciente"
        size="lg"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setNewPatientOpen(false)}>Cancelar</Button><Button onClick={createPatient}>Cadastrar paciente</Button></div>}
      >
        <Tabs defaultValue="pessoal">
          <TabsList className="grid grid-cols-4 w-full bg-muted/60 p-1 h-auto">
            <TabsTrigger value="pessoal" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">Pessoal</TabsTrigger>
            <TabsTrigger value="endereco" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">Endereço</TabsTrigger>
            <TabsTrigger value="clinico" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">Clínico</TabsTrigger>
            <TabsTrigger value="extra" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-medium">Extras</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoal" className="mt-4 space-y-3">
            <div><Label className="text-xs">Nome completo*</Label><Input value={newPatient.full_name} onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })} placeholder="Maria da Silva" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Telefone (WhatsApp)*</Label><Input value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
              <div><Label className="text-xs">E-mail</Label><Input type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="paciente@email.com" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">CPF</Label><Input value={newPatient.cpf} onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              <div><Label className="text-xs">RG</Label><Input value={newPatient.rg} onChange={(e) => setNewPatient({ ...newPatient, rg: e.target.value })} /></div>
              <div><Label className="text-xs">Nascimento</Label><Input type="date" value={newPatient.birth_date} onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Gênero</Label>
                <Select value={newPatient.gender} onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="prefere_nao_dizer">Prefere não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Estado civil</Label>
                <Select value={newPatient.marital_status} onValueChange={(v) => setNewPatient({ ...newPatient, marital_status: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União estável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Profissão</Label><Input value={newPatient.profession} onChange={(e) => setNewPatient({ ...newPatient, profession: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div><Label className="text-xs">Responsável (se menor)</Label><Input value={newPatient.responsible_name} onChange={(e) => setNewPatient({ ...newPatient, responsible_name: e.target.value })} placeholder="Nome do responsável" /></div>
              <div><Label className="text-xs">CPF do responsável</Label><Input value={newPatient.responsible_cpf} onChange={(e) => setNewPatient({ ...newPatient, responsible_cpf: e.target.value })} /></div>
            </div>
          </TabsContent>

          <TabsContent value="endereco" className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">CEP</Label><Input value={newPatient.address_zip} onChange={(e) => setNewPatient({ ...newPatient, address_zip: e.target.value })} placeholder="00000-000" /></div>
              <div className="col-span-2"><Label className="text-xs">Rua/Avenida</Label><Input value={newPatient.address_street} onChange={(e) => setNewPatient({ ...newPatient, address_street: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Número</Label><Input value={newPatient.address_number} onChange={(e) => setNewPatient({ ...newPatient, address_number: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Complemento</Label><Input value={newPatient.address_complement} onChange={(e) => setNewPatient({ ...newPatient, address_complement: e.target.value })} placeholder="Apto, bloco, referência…" /></div>
            </div>
            <div><Label className="text-xs">Bairro</Label><Input value={newPatient.address_neighborhood} onChange={(e) => setNewPatient({ ...newPatient, address_neighborhood: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label className="text-xs">Cidade</Label><Input value={newPatient.address_city} onChange={(e) => setNewPatient({ ...newPatient, address_city: e.target.value })} /></div>
              <div><Label className="text-xs">UF</Label><Input value={newPatient.address_state} maxLength={2} onChange={(e) => setNewPatient({ ...newPatient, address_state: e.target.value.toUpperCase() })} /></div>
            </div>
          </TabsContent>

          <TabsContent value="clinico" className="mt-4 space-y-3">
            <div className="rounded-lg border bg-amber-50/40 p-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-amber-800 font-semibold">Anamnese rápida</p>
              <div><Label className="text-xs">Alergias (medicamentos, anestésicos, materiais)</Label><Textarea rows={2} value={newPatient.allergies} onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })} placeholder="Ex.: penicilina, látex…" /></div>
              <div><Label className="text-xs">Condições médicas relevantes</Label><Textarea rows={2} value={newPatient.medical_conditions} onChange={(e) => setNewPatient({ ...newPatient, medical_conditions: e.target.value })} placeholder="Diabetes, hipertensão, gestante, cardíaco…" /></div>
              <div><Label className="text-xs">Medicamentos em uso</Label><Textarea rows={2} value={newPatient.current_medications} onChange={(e) => setNewPatient({ ...newPatient, current_medications: e.target.value })} placeholder="Anticoagulantes, antidepressivos…" /></div>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Convênio / Plano</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Operadora</Label><Input value={newPatient.insurance_name} onChange={(e) => setNewPatient({ ...newPatient, insurance_name: e.target.value })} placeholder="Particular, Amil Dental…" /></div>
                <div><Label className="text-xs">Nº carteirinha</Label><Input value={newPatient.insurance_number} onChange={(e) => setNewPatient({ ...newPatient, insurance_number: e.target.value })} /></div>
              </div>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Contato de emergência</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={newPatient.emergency_contact_name} onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_name: e.target.value })} /></div>
                <div><Label className="text-xs">Telefone</Label><Input value={newPatient.emergency_contact_phone} onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
              </div>
              <div><Label className="text-xs">Grau de parentesco</Label><Input value={newPatient.emergency_contact_relation} onChange={(e) => setNewPatient({ ...newPatient, emergency_contact_relation: e.target.value })} placeholder="Cônjuge, mãe, irmão…" /></div>
            </div>
          </TabsContent>

          <TabsContent value="extra" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Origem do cadastro</Label>
                <Select value={newPatient.source_channel} onValueChange={(v) => setNewPatient({ ...newPatient, source_channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="anuncio">Anúncio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Como nos conheceu?</Label><Input value={newPatient.how_found_us} onChange={(e) => setNewPatient({ ...newPatient, how_found_us: e.target.value })} placeholder="Instagram, Google, amigo…" /></div>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Permissões de comunicação (LGPD)</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newPatient.allow_whatsapp} onChange={(e) => setNewPatient({ ...newPatient, allow_whatsapp: e.target.checked })} className="rounded" />
                Aceita receber lembretes e novidades por WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={newPatient.allow_email} onChange={(e) => setNewPatient({ ...newPatient, allow_email: e.target.checked })} className="rounded" />
                Aceita receber comunicações por e-mail
              </label>
            </div>
            <div><Label className="text-xs">Observações gerais</Label><Textarea rows={4} value={newPatient.notes} onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })} placeholder="Qualquer informação adicional relevante…" /></div>
          </TabsContent>
        </Tabs>
      </EntityModal>

      {/* Modal: novo orçamento */}
      {drawer && (
        <NewQuoteModal
          open={newQuoteOpen}
          onOpenChange={setNewQuoteOpen}
          patient={drawer}
          onCreated={() => loadPatientData(drawer.phone)}
        />
      )}
    </>
  );
}

/* ============ ODONTOGRAMA ============ */

function Odontogram({ teeth, onChange }: { teeth: Record<string, ToothStatus>; onChange: (n: number, s: ToothStatus) => void }) {
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>("caries");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TOOTH_STATUS) as ToothStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition",
              selectedStatus === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", TOOTH_STATUS[s].color.replace("fill-", "bg-"))} />
            {TOOTH_STATUS[s].label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-slate-50/40 p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Superior</p>
        <div className="flex justify-center gap-1">
          {[...TEETH_LAYOUT.upperRight, ...TEETH_LAYOUT.upperLeft].map((n) => (
            <Tooth key={n} num={n} status={teeth[n]} selectedStatus={selectedStatus} onClick={() => onChange(n, selectedStatus)} />
          ))}
        </div>
        <div className="border-t border-slate-300 my-2" />
        <div className="flex justify-center gap-1">
          {[...TEETH_LAYOUT.lowerRight, ...TEETH_LAYOUT.lowerLeft].map((n) => (
            <Tooth key={n} num={n} status={teeth[n]} selectedStatus={selectedStatus} onClick={() => onChange(n, selectedStatus)} />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Inferior</p>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Clique em um dente para aplicar o status selecionado.</p>
    </div>
  );
}

function Tooth({ num, status, selectedStatus, onClick }: { num: number; status?: ToothStatus; selectedStatus: ToothStatus; onClick: () => void }) {
  const fillClass = status ? TOOTH_STATUS[status].color : "fill-white stroke-slate-300";
  return (
    <button onClick={onClick} className="group flex flex-col items-center" title={`Dente ${num}${status ? ` — ${TOOTH_STATUS[status].label}` : ""}`}>
      <svg width="22" height="28" viewBox="0 0 22 28" className="transition group-hover:scale-110">
        <path d="M11 2 C5 2, 2 6, 2 12 C2 18, 4 24, 7 26 C8 27, 9 27, 11 24 C13 27, 14 27, 15 26 C18 24, 20 18, 20 12 C20 6, 17 2, 11 2 Z" className={cn("stroke-slate-400 stroke-1", fillClass)} />
      </svg>
      <span className="text-[8px] text-slate-500 tabular-nums">{num}</span>
    </button>
  );
}

/* ============ ORÇAMENTO ============ */

function NewQuoteModal({ open, onOpenChange, patient, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; patient: Patient; onCreated: () => void }) {
  const { data: overrides = [] } = useTreatmentOverrides();
  const [items, setItems] = useState<Array<{ name: string; qty: number; price_cents: number }>>([]);
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [picker, setPicker] = useState("");

  const treatments = useMemo(() => {
    const base = TREATMENTS.map((t) => ({ slug: t.slug, name: t.name, price: parseInt((t.priceFrom || "").replace(/\D/g, "")) || 0 }));
    overrides.forEach((o: any) => {
      const idx = base.findIndex((b) => b.slug === o.slug);
      const price = parseInt((o.price_from || "").replace(/\D/g, "")) || 0;
      if (idx >= 0) { base[idx] = { slug: o.slug, name: o.name || base[idx].name, price: price || base[idx].price }; }
      else base.push({ slug: o.slug, name: o.name || o.slug, price });
    });
    return base.sort((a, b) => a.name.localeCompare(b.name));
  }, [overrides]);

  function addItem() {
    const t = treatments.find((tr) => tr.slug === picker);
    if (!t) return;
    setItems([...items, { name: t.name, qty: 1, price_cents: t.price * 100 }]);
    setPicker("");
  }

  const subtotal = items.reduce((s, i) => s + i.qty * i.price_cents, 0);
  const discountCents = Math.round(parseFloat(discount.replace(",", ".")) * 100) || 0;
  const total = Math.max(0, subtotal - discountCents);

  async function save() {
    if (items.length === 0) return toast({ title: "Adicione ao menos um item", variant: "destructive" });
    const { data: ures } = await supabase.auth.getUser();
    const { error } = await supabase.from("patient_quotes").insert({
      patient_name: patient.name, patient_phone: patient.phone,
      items: items as any, subtotal_cents: subtotal, discount_cents: discountCents, total_cents: total,
      notes: notes || null, status: "sent", created_by: ures.user?.id ?? null,
    } as any);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Orçamento criado e enviado!" });
    onOpenChange(false);
    setItems([]); setDiscount("0"); setNotes("");
    onCreated();
  }

  return (
    <EntityModal open={open} onOpenChange={onOpenChange} title="Novo orçamento" size="lg">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Select value={picker} onValueChange={setPicker}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Escolha um tratamento…" /></SelectTrigger>
            <SelectContent>
              {treatments.map((t) => <SelectItem key={t.slug} value={t.slug}>{t.name} — {t.price > 0 ? brl(t.price * 100) : "valor a definir"}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={addItem} disabled={!picker}><Plus className="h-4 w-4" /></Button>
        </div>

        <div className="rounded-lg border divide-y">
          {items.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">Nenhum item adicionado.</p>}
          {items.map((it, i) => (
            <div key={i} className="p-3 grid grid-cols-[1fr,80px,110px,40px] gap-2 items-center">
              <p className="text-sm font-medium truncate">{it.name}</p>
              <Input type="number" value={it.qty} onChange={(e) => { const ni = [...items]; ni[i].qty = parseInt(e.target.value) || 1; setItems(ni); }} className="h-8" />
              <Input type="number" step="0.01" value={it.price_cents / 100} onChange={(e) => { const ni = [...items]; ni[i].price_cents = Math.round(parseFloat(e.target.value) * 100) || 0; setItems(ni); }} className="h-8" />
              <Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, ix) => ix !== i))}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Subtotal</p>
            <p className="font-semibold tabular-nums mt-1">{brl(subtotal)}</p>
          </div>
          <div>
            <Label className="text-xs">Desconto (R$)</Label>
            <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="mt-1" />
          </div>
          <div className="rounded-lg border p-3 bg-emerald-50/50">
            <p className="text-[10px] uppercase text-emerald-700">Total</p>
            <p className="font-bold tabular-nums mt-1 text-emerald-800">{brl(total)}</p>
          </div>
        </div>

        <div>
          <Label className="text-xs">Observações</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Plano de tratamento, parcelamento, observações…" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Criar e gerar link</Button>
        </div>
      </div>
    </EntityModal>
  );
}

function QuoteCard({ quote, onChange }: { quote: any; onChange: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/orcamento/${quote.token}`;
  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado" });
  }
  async function remove() {
    if (!confirm("Excluir este orçamento?")) return;
    await supabase.from("patient_quotes").delete().eq("id", quote.id);
    onChange();
  }
  const statusMap: any = {
    draft: { label: "Rascunho", cls: "bg-slate-100 text-slate-700" },
    sent: { label: "Enviado", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    accepted: { label: "Aceito", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    expired: { label: "Expirado", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const st = statusMap[quote.status] || statusMap.draft;
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge variant="outline" className={cn("text-[10px]", st.cls)}>{st.label}</Badge>
        <p className="text-sm font-bold tabular-nums">{brl(quote.total_cents)}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{quote.items.length} item(s) · criado em {new Date(quote.created_at).toLocaleDateString("pt-BR")}</p>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="flex-1 h-8" onClick={copyLink}>
          {copied ? <Check className="h-3 w-3 mr-1 text-emerald-600" /> : <Copy className="h-3 w-3 mr-1" />} Copiar link
        </Button>
        <a href={url} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline" className="h-8"><ExternalLink className="h-3 w-3" /></Button>
        </a>
        <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="h-3 w-3 text-rose-500" /></Button>
      </div>
    </div>
  );
}
