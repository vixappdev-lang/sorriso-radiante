import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CheckCircle2, Percent, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import EntityModal from "@/admin/components/EntityModal";
import EmptyState from "@/admin/components/EmptyState";
import { toast } from "@/hooks/use-toast";

function brl(c: number) { return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function CommissionsPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("entries");
  const [ruleOpen, setRuleOpen] = useState(false);

  const { data: rules = [] } = useQuery({
    queryKey: ["commission_rules"],
    queryFn: async () => {
      const { data } = await supabase.from("commission_rules").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["commission_entries"],
    queryFn: async () => {
      const { data } = await supabase.from("commission_entries").select("*").order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: pros = [] } = useQuery({
    queryKey: ["commission_pros"],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("slug, name").eq("status", "active");
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const pending = entries.filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + (e.amount_cents || 0), 0);
    const paid = entries.filter((e: any) => e.status === "paid").reduce((s: number, e: any) => s + (e.amount_cents || 0), 0);
    const byPro: Record<string, number> = {};
    entries.forEach((e: any) => { byPro[e.professional_name || e.professional_slug] = (byPro[e.professional_name || e.professional_slug] || 0) + (e.amount_cents || 0); });
    return { pending, paid, byPro };
  }, [entries]);

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commission_entries").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commission_entries"] }); toast({ title: "Comissão paga" }); },
  });

  const delRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commission_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commission_rules"] }); toast({ title: "Regra removida" }); },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Pendente</div>
          <p className="text-xl font-bold mt-1 text-amber-700 tabular-nums">{brl(stats.pending)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Pago</div>
          <p className="text-xl font-bold mt-1 text-emerald-700 tabular-nums">{brl(stats.paid)}</p>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Profissionais ativos</div>
          <p className="text-xl font-bold mt-1 tabular-nums">{Object.keys(stats.byPro).length}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="entries">Comissões geradas</TabsTrigger>
          <TabsTrigger value="rules">Regras de comissão</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          {entries.length === 0 ? (
            <EmptyState icon={DollarSign} title="Nenhuma comissão gerada" description="Comissões são criadas automaticamente quando uma entrada de receita vinculada a um agendamento é marcada como paga." />
          ) : (
            <div className="rounded-xl border divide-y bg-card">
              {entries.map((e: any) => (
                <div key={e.id} className="p-3 grid grid-cols-[1fr,auto,auto,auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.professional_name || e.professional_slug}</p>
                    <p className="text-xs text-muted-foreground">Base {brl(e.base_amount_cents)} · {new Date(e.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant="outline" className={e.status === "paid" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700"}>
                    {e.status === "paid" ? "Pago" : "Pendente"}
                  </Badge>
                  <p className="font-bold tabular-nums text-emerald-700">{brl(e.amount_cents)}</p>
                  {e.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => markPaid.mutate(e.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar pago
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setRuleOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Nova regra</Button>
          </div>
          {rules.length === 0 ? (
            <EmptyState icon={Percent} title="Nenhuma regra cadastrada" description="Crie regras para que comissões sejam calculadas automaticamente quando um pagamento for confirmado." />
          ) : (
            <div className="rounded-xl border divide-y bg-card">
              {rules.map((r: any) => (
                <div key={r.id} className="p-3 grid grid-cols-[1fr,auto,auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.professional_slug}{r.treatment_slug ? ` · ${r.treatment_slug}` : " (todos tratamentos)"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.percent ? `${r.percent}%` : ""}{r.percent && r.fixed_cents ? " + " : ""}{r.fixed_cents ? brl(r.fixed_cents) : ""}
                    </p>
                  </div>
                  <Badge variant={r.active ? "secondary" : "outline"}>{r.active ? "Ativa" : "Inativa"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => delRule.mutate(r.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RuleModal open={ruleOpen} onOpenChange={setRuleOpen} pros={pros} onSaved={() => qc.invalidateQueries({ queryKey: ["commission_rules"] })} />
    </div>
  );
}

function RuleModal({ open, onOpenChange, pros, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; pros: any[]; onSaved: () => void }) {
  const [proSlug, setProSlug] = useState("");
  const [treatmentSlug, setTreatmentSlug] = useState("");
  const [percent, setPercent] = useState("");
  const [fixed, setFixed] = useState("");

  useEffect(() => { if (!open) { setProSlug(""); setTreatmentSlug(""); setPercent(""); setFixed(""); } }, [open]);

  async function save() {
    if (!proSlug) return toast({ title: "Selecione um profissional", variant: "destructive" });
    const pct = parseFloat(percent.replace(",", ".")) || null;
    const fix = fixed ? Math.round(parseFloat(fixed.replace(",", ".")) * 100) : null;
    if (!pct && !fix) return toast({ title: "Informe % ou valor fixo", variant: "destructive" });
    const { error } = await supabase.from("commission_rules").insert({
      professional_slug: proSlug,
      treatment_slug: treatmentSlug || null,
      percent: pct,
      fixed_cents: fix,
      active: true,
    } as any);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Regra criada" });
    onOpenChange(false);
    onSaved();
  }

  return (
    <EntityModal open={open} onOpenChange={onOpenChange} title="Nova regra de comissão"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save}>Criar regra</Button></div>}>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Profissional*</Label>
          <Select value={proSlug} onValueChange={setProSlug}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {pros.map((p: any) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tratamento (opcional — slug)</Label>
          <Input value={treatmentSlug} onChange={(e) => setTreatmentSlug(e.target.value)} placeholder="Deixe vazio para aplicar a todos" />
          <p className="text-[10px] text-muted-foreground mt-1">Regras com tratamento específico têm prioridade.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Percentual (%)</Label><Input type="number" step="0.1" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="Ex.: 30" /></div>
          <div><Label className="text-xs">Valor fixo (R$)</Label><Input type="number" step="0.01" value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="Ex.: 50,00" /></div>
        </div>
      </div>
    </EntityModal>
  );
}
