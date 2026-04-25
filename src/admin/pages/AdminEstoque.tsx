import { useMemo, useState } from "react";
import { Boxes, Plus, AlertTriangle, DollarSign, Package, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2, History, HelpCircle, Search, Check, Sparkles, Wand2 } from "lucide-react";
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
import { STOCK_CATALOG, generateItemImageDataUrl, type StockCatalogItem } from "@/admin/data/stockCatalog";
import { cn } from "@/lib/utils";

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function AdminEstoque() {
  const { data: items = [] } = useStockItems();
  const upsert = useUpsertStockItem();
  const del = useDeleteStockItem();
  const move = useCreateMovement();

  const [drawer, setDrawer] = useState<"new" | StockItem | null>(null);
  const [form, setForm] = useState<any>({ id: "", name: "", sku: "", unit: "un", min_qty: 0, current_qty: 0, cost_cents: 0, category: "", active: true, image_url: "" });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [movItem, setMovItem] = useState<{ item: StockItem; type: "in" | "out" | "adjust" } | null>(null);
  const [movQty, setMovQty] = useState<string>("");
  const [movReason, setMovReason] = useState("");
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const stats = useMemo(() => {
    const low = items.filter((i) => Number(i.current_qty) <= Number(i.min_qty) && i.active);
    const totalValue = items.reduce((s, i) => s + Number(i.current_qty) * Number(i.cost_cents), 0);
    return { total: items.length, low: low.length, value: totalValue };
  }, [items]);

  function openNew() {
    setForm({ id: "", name: "", sku: "", unit: "un", min_qty: 0, current_qty: 0, cost_cents: 0, category: "", active: true, image_url: "" });
    setDrawer("new");
  }
  function openEdit(i: StockItem) {
    setForm({ id: i.id, name: i.name, sku: i.sku ?? "", unit: i.unit ?? "un", min_qty: Number(i.min_qty), current_qty: Number(i.current_qty), cost_cents: i.cost_cents, category: i.category ?? "", active: i.active, image_url: (i as any).image_url ?? "" });
    setDrawer(i);
  }

  function applyCatalogItem(c: StockCatalogItem) {
    setForm((f: any) => ({
      ...f,
      name: c.name,
      sku: c.key.toUpperCase().slice(0, 12),
      unit: c.unit,
      min_qty: c.min_qty,
      cost_cents: c.cost_cents,
      category: c.category,
      image_url: generateItemImageDataUrl(c.emoji, c.hue),
    }));
    setCatalogOpen(false);
    toast({ title: "Item do catálogo carregado", description: c.name });
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
        image_url: form.image_url || null,
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
    { key: "name", header: "Item", cell: (r) => {
      const img = (r as any).image_url as string | null;
      return (
        <div className="flex items-center gap-3">
          {img ? (
            <img src={img} alt={r.name} className="h-10 w-10 rounded-lg object-cover border bg-white flex-shrink-0" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-700 flex-shrink-0"><Package className="h-4 w-4" /></div>
          )}
          <div className="min-w-0">
            <p className="font-medium truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.category || "—"} {r.sku ? `· ${r.sku}` : ""}</p>
          </div>
        </div>
      );
    } },
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
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)} title="Como funciona o estoque">
              <HelpCircle className="h-4 w-4 mr-1.5" /> Como funciona
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo item</Button>
          </>
        }
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
        {/* Banner com a imagem horizontal no topo */}
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden mb-4">
          {form.image_url ? (
            <img src={form.image_url} alt={form.name || "Item"} className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-32 grid place-items-center text-slate-400 text-xs">
              <div className="text-center">
                <Package className="h-8 w-8 mx-auto mb-1 opacity-50" />
                <p>Sem imagem — escolha do catálogo abaixo</p>
              </div>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mb-4 border-dashed"
          onClick={() => setCatalogOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-2 text-violet-600" />
          Escolher do catálogo ({STOCK_CATALOG.length} itens prontos)
        </Button>

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
                  {["un", "cx", "ml", "g", "kit", "par", "pct"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Qtd. atual</Label><Input type="number" value={form.current_qty} onChange={(e) => setForm({ ...form, current_qty: e.target.value })} /></div>
            <div><Label className="text-xs">Mínimo</Label><Input type="number" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Custo unitário (R$)</Label><Input type="number" step="0.01" value={Number(form.cost_cents) / 100 || ""} onChange={(e) => setForm({ ...form, cost_cents: e.target.value })} placeholder="0,00" /></div>
          <div>
            <Label className="text-xs">URL da imagem (opcional)</Label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="data:image/svg+xml... ou https://..." />
          </div>
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

      {/* Modal Catálogo */}
      <CatalogPickerModal open={catalogOpen} onClose={() => setCatalogOpen(false)} onPick={applyCatalogItem} />

      {/* Modal Como funciona */}
      <HowItWorksModal open={helpOpen} onClose={() => setHelpOpen(false)} />

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

function CatalogPickerModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: StockCatalogItem) => void }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");
  const categories = useMemo(() => Array.from(new Set(STOCK_CATALOG.map((c) => c.category))), []);
  const filtered = useMemo(() => {
    return STOCK_CATALOG.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (!search.trim()) return true;
      return c.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, cat]);

  return (
    <EntityModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Catálogo de itens odontológicos"
      description="Escolha um item pra preencher tudo automaticamente (com imagem)."
      size="lg"
    >
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar item..." className="pl-9" />
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        <button onClick={() => setCat("all")} className={cn("flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium", cat === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200")}>Todas</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium", cat === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200")}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[55vh] overflow-y-auto pr-1">
        {filtered.map((c) => {
          const img = generateItemImageDataUrl(c.emoji, c.hue);
          return (
            <button
              key={c.key}
              onClick={() => onPick(c)}
              className="text-left rounded-xl border-2 border-slate-200 hover:border-violet-400 bg-white overflow-hidden transition group"
            >
              <img src={img} alt={c.name} className="w-full h-20 object-cover group-hover:scale-105 transition" />
              <div className="p-2.5">
                <p className="text-[12px] font-semibold text-slate-900 line-clamp-2 leading-tight">{c.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{c.category}</Badge>
                  <span className="text-[10px] tabular-nums text-emerald-700 font-medium">{brl(c.cost_cents)}/{c.unit}</span>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-slate-500">Nenhum item encontrado.</div>
        )}
      </div>
    </EntityModal>
  );
}

function HowItWorksModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    {
      icon: Plus,
      color: "from-blue-500 to-blue-600",
      title: "1. Cadastre o item",
      desc: "Use o catálogo pronto (35+ itens odontológicos) ou crie do zero. Defina quantidade atual, mínimo de alerta e custo unitário.",
    },
    {
      icon: ArrowDownToLine,
      color: "from-emerald-500 to-emerald-600",
      title: "2. Registre entradas",
      desc: "Toda compra de fornecedor é uma 'entrada'. O sistema soma na quantidade atual automaticamente.",
    },
    {
      icon: ArrowUpFromLine,
      color: "from-rose-500 to-rose-600",
      title: "3. Registre saídas",
      desc: "Cada uso em paciente, perda ou descarte é uma 'saída'. O estoque diminui na hora.",
    },
    {
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-600",
      title: "4. Alerta de mínimo",
      desc: "Quando a quantidade cai abaixo do mínimo, o item é marcado como 'Baixo' (vermelho). Ideal pra repor antes de faltar.",
    },
    {
      icon: DollarSign,
      color: "from-violet-500 to-violet-600",
      title: "5. Valor em estoque",
      desc: "O painel mostra o valor financeiro total parado em estoque (qtd × custo unitário) — útil pro fluxo de caixa.",
    },
    {
      icon: History,
      color: "from-slate-600 to-slate-800",
      title: "6. Histórico completo",
      desc: "Cada movimentação fica registrada com data, motivo e quem fez. Auditoria e controle total.",
    },
  ];

  return (
    <EntityModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Como funciona o estoque"
      description="Um guia rápido de tudo que esse módulo faz por você."
      size="lg"
    >
      <div className="space-y-3">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="flex items-start gap-3 rounded-2xl border bg-white p-4 hover:shadow-sm transition animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
            >
              <div className={cn("h-12 w-12 rounded-xl grid place-items-center text-white bg-gradient-to-br flex-shrink-0 shadow-lg", s.color)}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-[14px]">{s.title}</h4>
                <p className="text-[12.5px] text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Wand2 className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Dica de uso</p>
            <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
              Ao criar um item, clique em <b>"Escolher do catálogo"</b>. Tudo é preenchido automaticamente:
              nome, unidade, mínimo sugerido, custo médio e até a imagem do produto. Você só ajusta a quantidade que tem hoje.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5 pt-4 border-t">
        <Button onClick={onClose}><Check className="h-4 w-4 mr-1.5" /> Entendi</Button>
      </div>
    </EntityModal>
  );
}
