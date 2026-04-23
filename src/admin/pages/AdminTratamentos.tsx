import { useMemo, useState } from "react";
import { Stethoscope, Plus, Pencil, Trash2, Eye, DollarSign, TrendingUp, Activity, CheckCircle2 } from "lucide-react";
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
import { TREATMENTS } from "@/data/clinic";
import { useAppointments } from "@/admin/hooks/useAppointments";
import { useProfessionals } from "@/admin/hooks/useProfessionals";
import { useTreatmentOverrides, useUpsertTreatment, useDeleteTreatment } from "@/admin/hooks/useTreatments";
import { toast } from "@/hooks/use-toast";

type Row = {
  slug: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  priceFrom: string;
  professional_slug: string | null;
  active: boolean;
  origin: "base" | "custom";
};

function emptyForm(): any {
  return { slug: "", name: "", category: "", description: "", duration: "", price_from: "", professional_slug: "", availability: [] as string[], active: true };
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

  const rows: Row[] = useMemo(() => {
    const ovMap = new Map(overrides.map((o: any) => [o.slug, o]));
    const base: Row[] = TREATMENTS.map((t) => {
      const ov: any = ovMap.get(t.slug);
      return {
        slug: t.slug,
        name: ov?.name || t.name,
        category: ov?.category || "Geral",
        description: ov?.description || t.description,
        duration: ov?.duration || t.duration,
        priceFrom: ov?.price_from || t.priceFrom,
        professional_slug: ov?.professional_slug ?? null,
        active: ov ? ov.active : true,
        origin: ov ? "custom" : "base",
      };
    });
    overrides.forEach((o: any) => {
      if (!TREATMENTS.find((t) => t.slug === o.slug)) {
        base.push({ slug: o.slug, name: o.name || o.slug, category: o.category || "Geral", description: o.description || "", duration: o.duration || "—", priceFrom: o.price_from || "—", professional_slug: o.professional_slug, active: o.active, origin: "custom" });
      }
    });
    return base;
  }, [overrides]);

  const treatCount: Record<string, number> = {};
  appts.forEach((a) => { treatCount[a.treatment] = (treatCount[a.treatment] || 0) + 1; });
  const topName = Object.entries(treatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const ticketAvg = Math.round(rows.filter(r => r.active).reduce((s, r) => s + (parseInt((r.priceFrom||"").replace(/\D/g, "")) || 0), 0) / Math.max(1, rows.filter(r => r.active).length));

  const kpis = {
    actives: rows.filter((r) => r.active).length,
    inactives: rows.filter((r) => !r.active).length,
    avg: ticketAvg.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
    top: topName,
  };

  function openCreate() { setForm(emptyForm()); setDrawer({ mode: "create" }); }
  function openEdit(r: Row) {
    setForm({ slug: r.slug, name: r.name, category: r.category, description: r.description, duration: r.duration, price_from: r.priceFrom, professional_slug: r.professional_slug ?? "", availability: [], active: r.active });
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
      } as any);
      toast({ title: "Tratamento salvo" });
      setDrawer(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  }

  const columns: Column<Row>[] = [
    { key: "name", header: "Tratamento", cell: (r) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><Stethoscope className="h-4 w-4" /></div>
        <div className="min-w-0">
          <p className="font-medium truncate">{r.name}</p>
          <p className="text-xs text-muted-foreground truncate">{r.category}</p>
        </div>
      </div>
    ) },
    { key: "duration", header: "Duração", cell: (r) => <span className="text-sm text-muted-foreground">{r.duration}</span>, className: "hidden md:table-cell" },
    { key: "priceFrom", header: "Valor", cell: (r) => <span className="font-medium tabular-nums">{r.priceFrom}</span> },
    { key: "professional_slug", header: "Responsável", cell: (r) => <span className="text-sm text-muted-foreground">{pros.find((p: any) => p.slug === r.professional_slug)?.name || "—"}</span>, className: "hidden lg:table-cell" },
    { key: "active", header: "Status", cell: (r) => <StatusPill status={r.active ? "active" : "inactive"} /> },
  ];

  return (
    <>
      <PageHeader title="Tratamentos" description="Gerencie o catálogo: valores, duração, disponibilidade e profissional responsável."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo tratamento</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Ativos" value={kpis.actives} icon={CheckCircle2} accent="emerald" />
        <KpiCard label="Inativos" value={kpis.inactives} icon={Activity} accent="amber" />
        <KpiCard label="Ticket médio" value={kpis.avg} icon={DollarSign} accent="violet" />
        <KpiCard label="Mais procurado" value={kpis.top} icon={TrendingUp} accent="blue" hint="por agendamentos" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Catálogo vazio" description="Cadastre seu primeiro tratamento." action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Cadastrar</Button>} />
      ) : (
        <DataTable rows={rows} columns={columns} pageSize={12} searchable searchKeys={["name", "category"] as any}
          onRowClick={openView}
          rowActions={(r) => (
            <>
              <Button size="sm" variant="ghost" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
              {r.origin === "custom" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(r.slug)}><Trash2 className="h-4 w-4" /></Button>}
            </>
          )} />
      )}

      <EntityDrawer open={!!drawer} onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer?.mode === "create" ? "Novo tratamento" : drawer?.mode === "edit" ? "Editar tratamento" : form.name || "Tratamento"}
        footer={drawer?.mode !== "view" ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div> : undefined}>
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
                  {["Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => {
                    const on = form.availability?.includes(d);
                    return <button key={d} type="button" disabled={drawer.mode === "view"}
                      onClick={() => setForm({ ...form, availability: on ? form.availability.filter((x: string) => x !== d) : [...(form.availability || []), d] })}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium ${on ? "bg-primary text-primary-foreground border-primary" : "bg-white"}`}>{d}</button>;
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Edits locais sobrescrevem o catálogo padrão do site. Tratamentos novos (slug inédito) aparecem como adicionais.</p>
            </TabsContent>
          </Tabs>
        )}
      </EntityDrawer>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir tratamento?" description="A versão personalizada será removida; se o slug existe no catálogo base, ele volta ao padrão." destructive
        confirmLabel="Sim, excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }} />
    </>
  );
}
