import { useState } from "react";
import { Plus, CheckCircle2, ExternalLink, Copy, QrCode, FileText, Banknote, CreditCard } from "lucide-react";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import DataTable, { type Column } from "@/admin/components/DataTable";
import StatusPill from "@/admin/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePaymentCharges, useCreateCharge, useMarkChargePaid, type PaymentCharge } from "@/admin/hooks/usePaymentCharges";
import { toast } from "@/hooks/use-toast";

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function todayPlus(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

const TYPE_ICON: Record<string, any> = { pix: QrCode, boleto: FileText, credit_card: CreditCard };

export default function ChargesPanel() {
  const { data: charges = [] } = usePaymentCharges();
  const create = useCreateCharge();
  const markPaid = useMarkChargePaid();

  const [open, setOpen] = useState(false);
  const empty = { patient_name: "", patient_phone: "", amount: "", description: "", billing_type: "pix", due_date: todayPlus(3), provider: "manual" };
  const [form, setForm] = useState<any>(empty);
  const [view, setView] = useState<PaymentCharge | null>(null);

  async function save() {
    const cents = Math.round(parseFloat(String(form.amount).replace(",", ".")) * 100) || 0;
    if (!cents || !form.patient_name) return toast({ title: "Preencha nome e valor", variant: "destructive" });
    try {
      await create.mutateAsync({
        patient_name: form.patient_name,
        patient_phone: form.patient_phone || null,
        amount_cents: cents,
        description: form.description || null,
        billing_type: form.billing_type,
        due_date: form.due_date || null,
        provider: form.provider,
        status: "pending",
      } as any);
      toast({ title: "Cobrança criada", description: "Quando integrar Asaas/Pagar.me, será gerada online automaticamente." });
      setOpen(false);
      setForm({ ...empty });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  const columns: Column<PaymentCharge>[] = [
    { key: "due_date", header: "Vencimento", cell: (r) => <span className="text-sm tabular-nums">{r.due_date ? new Date(r.due_date).toLocaleDateString("pt-BR") : "—"}</span> },
    { key: "patient_name", header: "Paciente", cell: (r) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{r.patient_name ?? "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{r.description ?? "Cobrança"}</p>
      </div>
    ) },
    { key: "billing_type", header: "Tipo", cell: (r) => {
      const Icon = TYPE_ICON[r.billing_type] ?? Banknote;
      const label = r.billing_type === "pix" ? "PIX" : r.billing_type === "boleto" ? "Boleto" : r.billing_type === "credit_card" ? "Cartão" : r.billing_type;
      return <span className="inline-flex items-center gap-1.5 text-sm"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}</span>;
    } },
    { key: "amount_cents", header: "Valor", cell: (r) => <span className="font-semibold tabular-nums text-emerald-700">{brl(r.amount_cents)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status === "pending" ? "pending" : r.status === "paid" ? "paid" : r.status === "overdue" ? "overdue" : "cancelled"} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">Cobranças online</h3>
          <p className="text-xs text-muted-foreground mt-0.5">PIX, boleto e cartão. Pronto para integrar com Asaas/Pagar.me — por enquanto cria registros manuais.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova cobrança</Button>
      </div>

      {charges.length === 0 ? (
        <EmptyState icon={QrCode} title="Nenhuma cobrança ainda" description="Crie sua primeira cobrança PIX/boleto. Ao conectar provedor de pagamento, links serão gerados automaticamente." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova cobrança</Button>} />
      ) : (
        <DataTable
          rows={charges}
          columns={columns}
          pageSize={12}
          searchable
          searchKeys={["patient_name", "description", "patient_phone"] as any}
          onRowClick={(r) => setView(r)}
          rowActions={(r) => (
            <>
              {r.status !== "paid" && (
                <Button size="sm" variant="ghost" title="Marcar como paga" onClick={(e) => { e.stopPropagation(); markPaid.mutateAsync(r.id).then(() => toast({ title: "Marcada como paga" })); }}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </Button>
              )}
              {r.payment_url && (
                <a href={r.payment_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                </a>
              )}
            </>
          )}
        />
      )}

      <EntityModal
        open={open}
        onOpenChange={setOpen}
        title="Nova cobrança"
        description="Será criada como pendente. Conecte um provedor para gerar PIX/boleto reais."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Criar cobrança</Button></div>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Paciente*</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
          </div>
          <div><Label className="text-xs">Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Clareamento — sessão 1" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Valor (R$)*</Label><Input type="text" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></div>
            <div><Label className="text-xs">Tipo</Label>
              <Select value={form.billing_type} onValueChange={(v) => setForm({ ...form, billing_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Provedor</Label>
            <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="asaas">Asaas (em breve)</SelectItem>
                <SelectItem value="pagarme">Pagar.me (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </EntityModal>

      <EntityModal
        open={!!view}
        onOpenChange={(v) => !v && setView(null)}
        title={view ? `Cobrança — ${view.patient_name ?? "—"}` : ""}
        description={view ? `${brl(view.amount_cents)} · ${view.billing_type.toUpperCase()}` : ""}
      >
        {view && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3 bg-muted/20">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</p>
              <div className="mt-1"><StatusPill status={view.status} /></div>
            </div>
            {view.payment_url && (
              <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Link de pagamento</p>
                <div className="mt-1 flex items-center gap-2">
                  <a href={view.payment_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline truncate flex-1">{view.payment_url}</a>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(view.payment_url!); toast({ title: "Copiado" }); }}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
            {view.pix_payload && (
              <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Copia e cola PIX</p>
                <div className="mt-1 flex items-start gap-2">
                  <code className="text-[10px] flex-1 break-all bg-muted/40 p-2 rounded">{view.pix_payload}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(view.pix_payload!); toast({ title: "PIX copiado" }); }}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
            {view.description && <p className="text-xs text-muted-foreground"><b>Descrição:</b> {view.description}</p>}
            <p className="text-[11px] text-muted-foreground">Criada em {new Date(view.created_at).toLocaleString("pt-BR")}</p>
            {view.status !== "paid" && (
              <Button className="w-full" onClick={() => { markPaid.mutateAsync(view.id).then(() => { toast({ title: "Marcada como paga" }); setView(null); }); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" />Marcar como paga
              </Button>
            )}
          </div>
        )}
      </EntityModal>
    </div>
  );
}
