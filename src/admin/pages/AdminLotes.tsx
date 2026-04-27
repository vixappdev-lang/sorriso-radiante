import { useMemo, useState } from "react";
import { Layers, Plus, AlertTriangle, Calendar as CalIcon, Trash2, Pencil, Boxes, Clock } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockItems } from "@/admin/hooks/useStock";
import { useStockLots, useUpsertLot, useDeleteLot, type StockLot } from "@/admin/hooks/useStockLots";
import { toast } from "@/hooks/use-toast";

function brl(c: number) { return ((c ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function diffDays(date?: string | null) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00").getTime();
  const t = new Date(todayStr() + "T00:00:00").getTime();
  return Math.round((d - t) / 86400000);
}

export default function AdminLotes() {
  const { data: items = [] } = useStockItems();
  const { data: lots = [] } = useStockLots();
  const upsert = useUpsertLot();
  const del = useDeleteLot();

  const [open, setOpen] = useState<"new" | StockLot | null>(null);
  const empty = { id: "", item_id: "", lot_code: "", expiry_date: "", qty: "", cost_cents: "", notes: "" };
  const [form, setForm] = useState<any>(empty);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const itemMap = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const enriched = lots.map((l) => ({ ...l, item: itemMap[l.item_id] }));

  const stats = useMemo(() => {
    let expired = 0, expiring = 0, ok = 0, totalValue = 0;
    enriched.forEach((l) => {
      const d = diffDays(l.expiry_date);
      if (d !== null) {
        if (d < 0) expired++;
        else if (d <= 30) expiring++;
        else ok++;
      } else ok++;
      totalValue += Number(l.qty) * (l.cost_cents ?? 0);
    });
    return { total: lots.length, expired, expiring, ok, totalValue };
  }, [enriched, lots]);

  function openNew() { setForm({ ...empty }); setOpen("new"); }
  function openEdit(l: StockLot) {
    setForm({
      id: l.id, item_id: l.item_id, lot_code: l.lot_code ?? "",
      expiry_date: l.expiry_date ?? "", qty: String(l.qty),
      cost_cents: l.cost_cents ? (l.cost_cents / 100).toFixed(2) : "",
      notes: l.notes ?? "",
    });
    setOpen(l);
  }

  async function save() {
    if (!form.item_id) return toast({ title: "Selecione o item", variant: "destructive" });
    const qty = parseFloat(String(form.qty).replace(",", ".")) || 0;
    if (qty <= 0) return toast({ title: "Informe a quantidade", variant: "destructive" });
    try {
      await upsert.mutateAsync({
        id: form.id || undefined,
        item_id: form.item_id,
        lot_code: form.lot_code || null,
        expiry_date: form.expiry_date || null,
        qty,
        cost_cents: form.cost_cents ? Math.round(parseFloat(String(form.cost_cents).replace(",", ".")) * 100) : null,
        notes: form.notes || null,
      } as any);
      toast({ title: "Lote salvo" });
      setOpen(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  const columns: Column<typeof enriched[number]>[] = [
    { key: "item", header: "Item", cell: (l) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{l.item?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{l.lot_code ? `Lote ${l.lot_code}` : "Sem código"}</p>
      </div>
    ) },
    { key: "qty", header: "Qtd", cell: (l) => <span className="tabular-nums font-semibold">{Number(l.qty)} {l.item?.unit ?? ""}</span> },
    { key: "expiry_date", header: "Validade", cell: (l) => {
      const d = diffDays(l.expiry_date);
      if (!l.expiry_date) return <span className="text-xs text-muted-foreground">—</span>;
      const cls = d! < 0 ? "text-rose-600" : d! <= 30 ? "text-amber-600" : "text-emerald-700";
      return (
        <div>
          <p className={`text-sm font-medium tabular-nums ${cls}`}>{new Date(l.expiry_date).toLocaleDateString("pt-BR")}</p>
          <p className="text-[11px] text-muted-foreground">{d! < 0 ? `vencido ${Math.abs(d!)}d` : d === 0 ? "vence hoje" : `em ${d}d`}</p>
        </div>
      );
    } },
    { key: "cost_cents", header: "Custo unit.", cell: (l) => <span className="text-sm tabular-nums">{l.cost_cents ? brl(l.cost_cents) : "—"}</span>, className: "hidden md:table-cell" },
    { key: "total", header: "Total lote", cell: (l) => <span className="text-sm font-medium tabular-nums text-emerald-700">{brl(Number(l.qty) * (l.cost_cents ?? 0))}</span>, className: "hidden lg:table-cell" },
    { key: "status", header: "Status", cell: (l) => {
      const d = diffDays(l.expiry_date);
      if (d === null) return <Badge variant="outline">Sem validade</Badge>;
      if (d < 0) return <Badge variant="outline" className="border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">Vencido</Badge>;
      if (d <= 30) return <Badge variant="outline" className="border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">Vencendo</Badge>;
      return <Badge variant="outline" className="border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">OK</Badge>;
    } },
  ];

  function filterTab(tab: string) {
    return enriched.filter((l) => {
      const d = diffDays(l.expiry_date);
      if (tab === "all") return true;
      if (tab === "expired") return d !== null && d < 0;
      if (tab === "expiring") return d !== null && d >= 0 && d <= 30;
      if (tab === "ok") return d === null || d > 30;
      return true;
    });
  }

  return (
    <>
      <PageHeader
        title="Lotes & validades"
        description="Controle por lote (FEFO — First Expired, First Out). Gerencie validades, custos por entrada e evite perdas por vencimento."
        actions={<Button onClick={openNew} disabled={items.length === 0}><Plus className="h-4 w-4 mr-2" /> Novo lote</Button>}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Cadastre itens primeiro"
          description="Você precisa ter itens no estoque para criar lotes. Vá em Estoque → Novo item."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard label="Total de lotes" value={stats.total} icon={Layers} accent="blue" compact />
            <KpiCard label="Vencidos" value={stats.expired} icon={AlertTriangle} accent={stats.expired > 0 ? "rose" : "emerald"} compact />
            <KpiCard label="Vencem em 30 dias" value={stats.expiring} icon={Clock} accent={stats.expiring > 0 ? "amber" : "emerald"} compact />
            <KpiCard label="Valor em lotes" value={brl(stats.totalValue)} icon={CalIcon} accent="emerald" compact />
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="expired">Vencidos {stats.expired > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">{stats.expired}</Badge>}</TabsTrigger>
              <TabsTrigger value="expiring">Vencendo</TabsTrigger>
              <TabsTrigger value="ok">OK</TabsTrigger>
            </TabsList>
            {(["all", "expired", "expiring", "ok"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                {filterTab(tab).length === 0 ? (
                  <EmptyState icon={Layers} title="Nenhum lote nessa lista" description="Cadastre lotes ao receber novos pedidos com data de validade." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo lote</Button>} />
                ) : (
                  <DataTable
                    rows={filterTab(tab) as any}
                    columns={columns as any}
                    pageSize={20}
                    searchable
                    searchKeys={["lot_code"] as any}
                    onRowClick={openEdit as any}
                    rowActions={(r: any) => (
                      <>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDel(r.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      <EntityModal
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open === "new" ? "Novo lote" : "Editar lote"}
        description="Cada lote representa uma entrada de estoque com sua própria validade e custo."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Item*</Label>
            <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} {i.sku ? `· ${i.sku}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Código do lote</Label><Input value={form.lot_code} onChange={(e) => setForm({ ...form, lot_code: e.target.value })} placeholder="L23-0451" /></div>
            <div><Label className="text-xs">Validade</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Quantidade*</Label><Input type="number" step="0.01" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
            <div><Label className="text-xs">Custo unitário (R$)</Label><Input type="number" step="0.01" value={form.cost_cents} onChange={(e) => setForm({ ...form, cost_cents: e.target.value })} placeholder="0,00" /></div>
          </div>
          <div><Label className="text-xs">Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Fornecedor, NF, condição de armazenamento…" /></div>
        </div>
      </EntityModal>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir lote?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}
