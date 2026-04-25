import { useMemo, useState } from "react";
import {
  Stethoscope, Plus, Pencil, Trash2, Eye, DollarSign, TrendingUp, Activity,
  CheckCircle2, Search, LayoutGrid, List as ListIcon, Clock, User as UserIcon,
} from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityDrawer from "@/admin/components/EntityDrawer";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import StatusPill from "@/admin/components/StatusPill";
import EmptyState from "@/admin/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TREATMENTS } from "@/data/clinic";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { useProfessionals } from "@/admin/hooks/useProfessionals";
import { useTreatmentOverrides, useUpsertTreatment, useDeleteTreatment } from "@/admin/hooks/useTreatments";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Row = {
  slug: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  priceFrom: string;
  priceNumber: number;
  professional_slug: string | null;
  active: boolean;
  origin: "base" | "custom";
  bookings: number;
};

function emptyForm(): any {
  return {
    slug: "", name: "", category: "", description: "", duration: "", price_from: "",
    professional_slug: "", availability: [] as string[], active: true,
    requires_prepayment: false, prepayment_amount_cents: 0,
  };
}

export default function AdminTratamentos() {
  const { data: overrides = [] } = useTreatmentOverrides();
  const { data: pros = [] } = useProfessionals();
  const { data: appts = [] } = useAppointments();
  const upsert = useUpsertTreatment();
  const del = useDeleteTreatment();

  const [drawer, setDrawer] = useState<{ mode: "create" | "edit" | "view"; row?: Row } | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const treatCount: Record<string, number> = {};
  appts.forEach((a) => { treatCount[a.treatment] = (treatCount[a.treatment] || 0) + 1; });

  const rows: Row[] = useMemo(() => {
    const ovMap = new Map(overrides.map((o: any) => [o.slug, o]));
    const base: Row[] = TREATMENTS.map((t) => {
      const ov: any = ovMap.get(t.slug);
      const name = ov?.name || t.name;
      const priceStr = ov?.price_from || t.priceFrom;
      return {
        slug: t.slug,
        name,
        category: ov?.category || "Geral",
        description: ov?.description || t.description,
        duration: ov?.duration || t.duration,
        priceFrom: priceStr,
        priceNumber: parseInt((priceStr || "").replace(/\D/g, "")) || 0,
        professional_slug: ov?.professional_slug ?? null,
        active: ov ? ov.active : true,
        origin: ov ? "custom" : "base",
        bookings: treatCount[name] || 0,
      };
    });
    overrides.forEach((o: any) => {
      if (!TREATMENTS.find((t) => t.slug === o.slug)) {
        const name = o.name || o.slug;
        base.push({
          slug: o.slug, name, category: o.category || "Geral", description: o.description || "",
          duration: o.duration || "—", priceFrom: o.price_from || "—",
          priceNumber: parseInt((o.price_from || "").replace(/\D/g, "")) || 0,
          professional_slug: o.professional_slug, active: o.active, origin: "custom",
          bookings: treatCount[name] || 0,
        });
      }
    });
    return base;
  }, [overrides, appts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !`${r.name} ${r.category} ${r.description}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (statusFilter === "active" && !r.active) return false;
      if (statusFilter === "inactive" && r.active) return false;
      return true;
    });
  }, [rows, search, categoryFilter, statusFilter]);

  const topName = Object.entries(treatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const activeRows = rows.filter((r) => r.active);
  const ticketAvg = activeRows.length
    ? Math.round(activeRows.reduce((s, r) => s + r.priceNumber, 0) / activeRows.length)
    : 0;

  const kpis = {
    actives: activeRows.length,
    inactives: rows.length - activeRows.length,
    avg: ticketAvg.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
    top: topName,
  };

  function openCreate() { setForm(emptyForm()); setDrawer({ mode: "create" }); }
  function openEdit(r: Row) {
    const ov: any = overrides.find((o: any) => o.slug === r.slug) || {};
    setForm({
      slug: r.slug, name: r.name, category: r.category, description: r.description,
      duration: r.duration, price_from: r.priceFrom,
      professional_slug: r.professional_slug ?? "", availability: ov.availability ?? [], active: r.active,
      requires_prepayment: !!ov.requires_prepayment,
      prepayment_amount_cents: ov.prepayment_amount_cents ?? 0,
    });
    setDrawer({ mode: "edit", row: r });
  }
  function openView(r: Row) { openEdit(r); setDrawer({ mode: "view", row: r }); }

  async function save() {
    if (!form.slug || !form.name) { toast({ title: "Slug e nome obrigatórios", variant: "destructive" }); return; }
    try {
      await upsert.mutateAsync({
        slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
        name: form.name, category: form.category || null, description: form.description || null,
        duration: form.duration || null, price_from: form.price_from || null,
        professional_slug: form.professional_slug || null, active: form.active,
        availability: form.availability,
        requires_prepayment: !!form.requires_prepayment,
        prepayment_amount_cents: form.requires_prepayment ? (Number(form.prepayment_amount_cents) || 0) : null,
      } as any);
      toast({ title: "Tratamento salvo" });
      setDrawer(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  const columns: Column<Row>[] = [
    {
      key: "name", header: "Tratamento", cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><Stethoscope className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="font-medium truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.category}</p>
          </div>
        </div>
      ),
    },
    { key: "duration", header: "Duração", cell: (r) => <span className="text-sm text-muted-foreground tabular-nums">{r.duration}</span>, className: "hidden md:table-cell" },
    { key: "priceFrom", header: "Valor", cell: (r) => <span className="font-medium tabular-nums">{r.priceFrom}</span> },
    { key: "professional_slug", header: "Responsável", cell: (r) => <span className="text-sm text-muted-foreground">{pros.find((p: any) => p.slug === r.professional_slug)?.name || "—"}</span>, className: "hidden lg:table-cell" },
    { key: "bookings", header: "Procura", cell: (r) => <span className="text-sm tabular-nums">{r.bookings}</span>, className: "hidden lg:table-cell" },
    { key: "active", header: "Status", cell: (r) => <StatusPill status={r.active ? "active" : "inactive"} /> },
  ];

  return (
    <>
      <PageHeader
        title="Tratamentos"
        description="Gerencie o catálogo: valores, duração, disponibilidade e profissional responsável."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo tratamento</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-4">
        <KpiCard label="Ativos" value={kpis.actives} icon={CheckCircle2} accent="emerald" compact />
        <KpiCard label="Inativos" value={kpis.inactives} icon={Activity} accent="amber" compact />
        <KpiCard label="Ticket médio" value={kpis.avg} icon={DollarSign} accent="violet" compact />
        <KpiCard label="Mais procurado" value={kpis.top} icon={TrendingUp} accent="blue" hint="por agendamentos" compact />
      </div>

      {/* Toolbar premium */}
      <div className="admin-card mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-3.5">
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tratamento, categoria…"
            className="h-10 pl-9 bg-[hsl(220_24%_98%)] border-transparent focus-visible:bg-background focus-visible:border-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex h-10 items-center rounded-md border bg-white p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("grid h-7 w-8 place-items-center rounded text-muted-foreground transition-colors", view === "grid" && "bg-muted text-foreground")}
              aria-label="Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("grid h-7 w-8 place-items-center rounded text-muted-foreground transition-colors", view === "list" && "bg-muted text-foreground")}
              aria-label="Lista"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={rows.length === 0 ? "Catálogo vazio" : "Nenhum resultado"}
          description={rows.length === 0 ? "Cadastre seu primeiro tratamento." : "Ajuste os filtros para ver outros tratamentos."}
          action={rows.length === 0 ? <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Cadastrar</Button> : undefined}
        />
      ) : view === "list" ? (
        <DataTable
          rows={filtered}
          columns={columns}
          pageSize={12}
          onRowClick={openView}
          rowActions={(r) => (
            <>
              <Button size="sm" variant="ghost" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
              {r.origin === "custom" && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(r.slug)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const pro = pros.find((p: any) => p.slug === r.professional_slug);
            return (
              <article
                key={r.slug}
                className="admin-card admin-card-hover group flex flex-col p-5 cursor-pointer"
                onClick={() => openView(r)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-4 ring-inset ring-blue-100">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em] truncate">{r.name}</h3>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{r.category}</p>
                    </div>
                  </div>
                  <StatusPill status={r.active ? "active" : "inactive"} />
                </div>

                {r.description && (
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">{r.description}</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[hsl(var(--admin-border))] pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Valor</p>
                    <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{r.priceFrom}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duração</p>
                    <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{r.duration}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    <UserIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{pro?.name || "Sem profissional fixo"}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium tabular-nums">
                    {r.bookings} agend.
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => openView(r)} className="h-8 px-2"><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)} className="h-8 px-2"><Pencil className="h-4 w-4" /></Button>
                  {r.origin === "custom" && (
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => setConfirmDel(r.slug)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer?.mode === "create" ? "Novo tratamento" : drawer?.mode === "edit" ? "Editar tratamento" : form.name || "Tratamento"}
        footer={drawer?.mode !== "view" ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawer(null)}>Fechar</Button>
            <Button onClick={() => drawer?.row && openEdit(drawer.row)}>Editar</Button>
          </div>
        )}
      >
        {drawer && (
          <Tabs defaultValue="dados">
            <TabsList className="grid grid-cols-2"><TabsTrigger value="dados">Dados</TabsTrigger><TabsTrigger value="marketing">Marketing</TabsTrigger></TabsList>
            <TabsContent value="dados" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome*</Label><Input disabled={drawer.mode === "view"} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
                <div><Label className="text-xs">Slug*</Label><Input disabled={drawer.mode !== "create"} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Categoria</Label><Input disabled={drawer.mode === "view"} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Estética, Cirurgia…" /></div>
                <div><Label className="text-xs">Profissional responsável</Label>
                  <Select value={form.professional_slug || "__none"} onValueChange={(v) => setForm({ ...form, professional_slug: v === "__none" ? "" : v })}>
                    <SelectTrigger disabled={drawer.mode === "view"}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Nenhum específico —</SelectItem>
                      {pros.map((p: any) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Valor (a partir de)</Label><Input disabled={drawer.mode === "view"} value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} placeholder="R$ 890" /></div>
                <div><Label className="text-xs">Duração</Label><Input disabled={drawer.mode === "view"} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="60 min" /></div>
              </div>
              <div><Label className="text-xs">Descrição</Label><Textarea rows={4} disabled={drawer.mode === "view"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex items-center gap-2 pt-2"><Switch checked={form.active} disabled={drawer.mode === "view"} onCheckedChange={(v) => setForm({ ...form, active: v })} /><span className="text-sm">{form.active ? "Ativo no catálogo" : "Inativo"}</span></div>
            </TabsContent>
            <TabsContent value="marketing" className="mt-4 space-y-3">
              <div><Label className="text-xs">Disponibilidade (dias)</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => {
                    const on = form.availability?.includes(d);
                    return <button key={d} type="button" disabled={drawer.mode === "view"}
                      onClick={() => setForm({ ...form, availability: on ? form.availability.filter((x: string) => x !== d) : [...(form.availability || []), d] })}
                      className={cn("px-3 py-1.5 rounded-md border text-xs font-medium", on ? "bg-primary text-primary-foreground border-primary" : "bg-white")}>{d}</button>;
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Edits locais sobrescrevem o catálogo padrão do site. Tratamentos novos (slug inédito) aparecem como adicionais.</p>
            </TabsContent>
          </Tabs>
        )}
      </EntityDrawer>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir tratamento?"
        description="A versão personalizada será removida; se o slug existe no catálogo base, ele volta ao padrão."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}
