import { useMemo, useState } from "react";
import { Boxes, Plus, AlertTriangle, DollarSign, Package, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2, History } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import DataTable, { type Column } from "@/admin/components/DataTable";
import EntityDrawer from "@/admin/components/EntityDrawer";
import EntityModal from "@/admin/components/EntityModal";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import EmptyState from "@/admin/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockItems, useStockMovements, useUpsertStockItem, useDeleteStockItem, useCreateMovement, type StockItem } from "@/admin/hooks/useStock";
import { toast } from "@/hooks/use-toast";

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function AdminEstoque() {
  const { data: items = [] } = useStockItems();
  const upsert = useUpsertStockItem();
  const del = useDeleteStockItem();
  const move = useCreateMovement();

  const [drawer, setDrawer] = useState<"new" | StockItem | null>(null);
  const [form, setForm] = useState<any>({ id: "", name: "", sku: "", unit: "un", min_qty: 0, current_qty: 0, cost_cents: 0, category: "", active: true });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [movItem, setMovItem] = useState<{ item: StockItem; type: "in" | "out" | "adjust" } | null>(null);
  const [movQty, setMovQty] = useState<string>("");
  const [movReason, setMovReason] = useState("");
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  const stats = useMemo(() => {
    const low = items.filter((i) => Number(i.current_qty) <= Number(i.min_qty) && i.active);
    const totalValue = items.reduce((s, i) => s + Number(i.current_qty) * Number(i.cost_cents), 0);
    return { total: items.length, low: low.length, value: totalValue };
  }, [items]);

  function openNew() {
    setForm({ id: "", name: "", sku: "", unit: "un", min_qty: 0, current_qty: 0, cost_cents: 0, category: "", active: true });
    setDrawer("new");
  }
  function openEdit(i: StockItem) {
    setForm({ id: i.id, name: i.name, sku: i.sku ?? "", unit: i.unit ?? "un", min_qty: Number(i.min_qty), current_qty: Number(i.current_qty), cost_cents: i.cost_cents, category: i.category ?? "", active: i.active });
    setDrawer(i);
  }

  async function save() {
    if (!form.name) return toast({ title: "Nome obrigatório", variant: "destructive" });
    try {
      await upsert.mutateAsync({
        id: form.id || undefined,
        name: form.name,
        sku: form.sku || null,
        unit: form.unit || "un",
        min_qty: Number(form.min_qty) || 0,
        current_qty: Number(form.current_qty) || 0,
        cost_cents: Math.round(Number(form.cost_cents) * 100) || 0,
        category: form.category || null,
        active: form.active,
      } as any);
      toast({ title: "Item salvo" });
      setDrawer(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  async function submitMovement() {
    if (!movItem) return;
    const qty = Number(movQty.replace(",", "."));
    if (!qty || qty <= 0) return toast({ title: "Informe a quantidade", variant: "destructive" });
    try {
      await move.mutateAsync({ item_id: movItem.item.id, type: movItem.type, qty, reason: movReason || null });
      toast({ title: movItem.type === "in" ? "Entrada registrada" : movItem.type === "out" ? "Saída registrada" : "Ajuste registrado" });
      setMovItem(null); setMovQty(""); setMovReason("");
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  const columns: Column<StockItem>[] = [
    { key: "name", header: "Item", cell: (r) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-700"><Package className="h-4 w-4" /></div>
        <div className="min-w-0">
          <p className="font-medium truncate">{r.name}</p>
          <p className="text-xs text-muted-foreground truncate">{r.category || "—"} {r.sku ? `· ${r.sku}` : ""}</p>
        </div>
      </div>
    ) },
    { key: "current_qty", header: "Estoque", cell: (r) => {
      const qty = Number(r.current_qty); const min = Number(r.min_qty);
      const low = qty <= min;
      return (
        <div className="flex items-center gap-2">
          <span className={`tabular-nums font-semibold ${low ? "text-rose-600" : "text-slate-900"}`}>{qty} {r.unit}</span>
          {low && <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 text-[10px]">Baixo</Badge>}
        </div>
      );
    } },
    { key: "min_qty", header: "Mínimo", cell: (r) => <span className="text-sm tabular-nums text-muted-foreground">{Number(r.min_qty)} {r.unit}</span>, className: "hidden md:table-cell" },
    { key: "cost_cents", header: "Custo unit.", cell: (r) => <span className="text-sm tabular-nums">{brl(r.cost_cents)}</span>, className: "hidden lg:table-cell" },
    { key: "active", header: "Total", cell: (r) => <span className="text-sm font-medium tabular-nums text-emerald-700">{brl(Math.round(Number(r.current_qty) * r.cost_cents))}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Controle de insumos, mínimos e movimentações."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo item</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 mb-4">
        <KpiCard label="Itens cadastrados" value={stats.total} icon={Boxes} accent="blue" compact />
        <KpiCard label="Abaixo do mínimo" value={stats.low} icon={AlertTriangle} accent={stats.low > 0 ? "rose" : "emerald"} compact />
        <KpiCard label="Valor em estoque" value={brl(stats.value)} icon={DollarSign} accent="emerald" compact />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Boxes} title="Estoque vazio" description="Cadastre seu primeiro insumo para começar." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo item</Button>} />
      ) : (
        <DataTable
          rows={items}
          columns={columns}
          pageSize={15}
          searchable
          searchKeys={["name", "sku", "category"] as any}
          onRowClick={openEdit}
          rowActions={(r) => (
            <>
              <Button size="sm" variant="ghost" title="Entrada" onClick={() => { setMovItem({ item: r, type: "in" }); setMovQty(""); setMovReason(""); }}><ArrowDownToLine className="h-4 w-4 text-emerald-600" /></Button>
              <Button size="sm" variant="ghost" title="Saída" onClick={() => { setMovItem({ item: r, type: "out" }); setMovQty(""); setMovReason(""); }}><ArrowUpFromLine className="h-4 w-4 text-rose-600" /></Button>
              <Button size="sm" variant="ghost" title="Histórico" onClick={() => setHistoryItem(r)}><History className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </>
          )}
        />
      )}

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer === "new" ? "Novo item de estoque" : "Editar item"}
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div><Label className="text-xs">Nome*</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Anestésico tópico" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="ANES-01" /></div>
            <div><Label className="text-xs">Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Anestésico" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["un", "cx", "ml", "g", "kit", "par"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Qtd. atual</Label><Input type="number" value={form.current_qty} onChange={(e) => setForm({ ...form, current_qty: e.target.value })} /></div>
            <div><Label className="text-xs">Mínimo</Label><Input type="number" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Custo unitário (R$)</Label><Input type="number" step="0.01" value={Number(form.cost_cents) / 100 || ""} onChange={(e) => setForm({ ...form, cost_cents: e.target.value })} placeholder="0,00" /></div>
        </div>
      </EntityDrawer>

      {/* Modal de movimentação */}
      <EntityModal
        open={!!movItem}
        onOpenChange={(v) => !v && setMovItem(null)}
        title={movItem ? `${movItem.type === "in" ? "Entrada" : movItem.type === "out" ? "Saída" : "Ajuste"} — ${movItem.item.name}` : ""}
        description={movItem ? `Estoque atual: ${Number(movItem.item.current_qty)} ${movItem.item.unit}` : ""}
      >
        <div className="space-y-3">
          <div><Label className="text-xs">{movItem?.type === "adjust" ? "Quantidade final" : "Quantidade"}</Label>
            <Input type="number" step="0.01" value={movQty} onChange={(e) => setMovQty(e.target.value)} placeholder="0" autoFocus /></div>
          <div><Label className="text-xs">Motivo / observação</Label>
            <Textarea rows={2} value={movReason} onChange={(e) => setMovReason(e.target.value)} placeholder="Compra fornecedor X, uso paciente, perda…" /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMovItem(null)}>Cancelar</Button><Button onClick={submitMovement}>Confirmar</Button></div>
        </div>
      </EntityModal>

      <HistoryDrawer item={historyItem} onClose={() => setHistoryItem(null)} />

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir item?"
        description="O histórico de movimentações também será removido."
        destructive
        confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removido" }); setConfirmDel(null); } }}
      />
    </>
  );
}

function HistoryDrawer({ item, onClose }: { item: StockItem | null; onClose: () => void }) {
  const { data: movs = [] } = useStockMovements(item?.id);
  return (
    <EntityDrawer open={!!item} onOpenChange={(v) => !v && onClose()} title={item ? `Histórico — ${item.name}` : ""}>
      <ul className="space-y-2">
        {movs.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma movimentação ainda.</li>}
        {movs.map((m) => (
          <li key={m.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={
                m.type === "in" ? "border-emerald-300 bg-emerald-50 text-emerald-700" :
                m.type === "out" ? "border-rose-300 bg-rose-50 text-rose-700" :
                "border-blue-300 bg-blue-50 text-blue-700"
              }>
                {m.type === "in" ? "Entrada" : m.type === "out" ? "Saída" : "Ajuste"}
              </Badge>
              <span className="text-sm font-semibold tabular-nums">{Number(m.qty)} {item?.unit}</span>
            </div>
            {m.reason && <p className="text-xs text-muted-foreground mt-1">{m.reason}</p>}
            <p className="text-[11px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
          </li>
        ))}
      </ul>
    </EntityDrawer>
  );
}
