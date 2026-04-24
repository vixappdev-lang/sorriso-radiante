import { useMemo, useState } from "react";
import { Star, Plus, MessageCircle, Trash2, Reply, Link as LinkIcon, Send } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import KpiCard from "@/admin/components/KpiCard";
import EmptyState from "@/admin/components/EmptyState";
import EntityDrawer from "@/admin/components/EntityDrawer";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import PublicLinkModal from "@/admin/components/PublicLinkModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useReviews, useCreateReview, useReplyReview, useDeleteReview, type Review } from "@/admin/hooks/useReviews";
import { useReviewInvites, useCreateReviewInvite, useDeleteReviewInvite } from "@/admin/hooks/useReviewInvites";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function StarsRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size }} className={cn(i < value ? "fill-current" : "fill-none stroke-amber-300")} />
      ))}
    </div>
  );
}

export default function AdminAvaliacoes() {
  const { data: reviews = [] } = useReviews();
  const { data: invites = [] } = useReviewInvites();
  const createInvite = useCreateReviewInvite();
  const deleteInvite = useDeleteReviewInvite();
  const create = useCreateReview();
  const reply = useReplyReview();
  const del = useDeleteReview();
  const [drawer, setDrawer] = useState<{ mode: "new" | "reply" | "invite"; review?: Review } | null>(null);
  const [form, setForm] = useState<any>({ patient_name: "", rating: 5, comment: "", source: "manual" });
  const [inviteForm, setInviteForm] = useState<any>({ patient_name: "", patient_phone: "", treatment: "", professional: "" });
  const [linkModal, setLinkModal] = useState<{ token: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const avg = total ? sum / total : 0;
    const replied = reviews.filter((r) => r.reply).length;
    const replyRate = total ? Math.round((replied / total) * 100) : 0;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
    const promoters = reviews.filter((r) => r.rating >= 4).length;
    const detractors = reviews.filter((r) => r.rating <= 2).length;
    const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
    return { total, avg, replied, replyRate, dist, nps };
  }, [reviews]);

  function openNew() {
    setForm({ patient_name: "", rating: 5, comment: "", source: "manual" });
    setDrawer({ mode: "new" });
  }
  function openReply(r: Review) {
    setReplyText(r.reply ?? "");
    setDrawer({ mode: "reply", review: r });
  }
  async function save() {
    if (!form.patient_name) { toast({ title: "Nome do paciente obrigatório", variant: "destructive" }); return; }
    try {
      await create.mutateAsync({ patient_name: form.patient_name, rating: form.rating, comment: form.comment || null, source: form.source } as any);
      toast({ title: "Avaliação criada" });
      setDrawer(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }
  async function sendReply() {
    if (!drawer || drawer.mode !== "reply" || !drawer.review) return;
    try {
      await reply.mutateAsync({ id: drawer.review.id, reply: replyText });
      toast({ title: "Resposta enviada" });
      setDrawer(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  function filterFor(tab: string) {
    if (tab === "all") return reviews;
    if (tab === "pending") return reviews.filter((r) => !r.reply);
    return reviews.filter((r) => r.source === tab);
  }

  return (
    <>
      <PageHeader
        title="Avaliações & Reputação"
        description="Acompanhe avaliações, responda pacientes e envie convites de avaliação."
        actions={
          <>
            <Button variant="outline" onClick={() => setDrawer({ mode: "invite" })}>
              <Send className="h-4 w-4 mr-2" /> Convidar para avaliar
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Adicionar avaliação</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 mb-4">
        <KpiCard label="Média geral" value={stats.avg.toFixed(1)} icon={Star} accent="amber" compact hint="de 5,0" />
        <KpiCard label="Total" value={stats.total} icon={Star} accent="blue" compact />
        <KpiCard label="Respondidas" value={stats.replied} icon={Reply} accent="emerald" compact />
        <KpiCard label="Taxa de resposta" value={`${stats.replyRate}%`} icon={Reply} accent="violet" compact />
        <KpiCard label="NPS" value={`${stats.nps > 0 ? "+" : ""}${stats.nps}`} icon={Star} accent="sky" compact />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="admin-card xl:col-span-1 p-5">
          <h3 className="text-[15px] font-semibold mb-4">Distribuição de notas</h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const v = stats.dist[n] || 0;
              const pct = stats.total ? (v / stats.total) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 text-sm tabular-nums">
                    {n} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums w-8 text-right text-muted-foreground">{v}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="admin-card xl:col-span-2 p-5">
          <h3 className="text-[15px] font-semibold mb-3">Resumo de reputação</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stats.total === 0
              ? "Sem avaliações ainda. Quando os pacientes começarem a avaliar a clínica, o resumo aparecerá aqui."
              : `A clínica possui ${stats.total} avaliação${stats.total > 1 ? "ões" : ""}, com média ${stats.avg.toFixed(1)} de 5 estrelas. ${stats.replyRate}% das avaliações foram respondidas. NPS atual: ${stats.nps > 0 ? "+" : ""}${stats.nps}.`}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Promotores</p>
              <p className="text-lg font-semibold tabular-nums mt-1">{reviews.filter((r) => r.rating >= 4).length}</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Neutros</p>
              <p className="text-lg font-semibold tabular-nums mt-1">{reviews.filter((r) => r.rating === 3).length}</p>
            </div>
            <div className="rounded-lg border border-[hsl(var(--admin-border))] p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Detratores</p>
              <p className="text-lg font-semibold tabular-nums mt-1">{reviews.filter((r) => r.rating <= 2).length}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="manual">Manuais</TabsTrigger>
        </TabsList>
        {(["all", "pending", "google", "manual"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filterFor(tab).length === 0 ? (
              <EmptyState icon={Star} title="Sem avaliações" description="Quando houver avaliações nesta categoria, elas aparecerão aqui." />
            ) : (
              <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                {filterFor(tab).map((r) => (
                  <article key={r.id} className="admin-card p-5">
                    <header className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{r.patient_name}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{r.source}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StarsRow value={r.rating} />
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openReply(r)}><Reply className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </header>
                    {r.comment && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>}
                    {r.reply && (
                      <div className="mt-3 rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                        <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Resposta da clínica</p>
                        <p className="text-sm text-blue-900/80 leading-relaxed">{r.reply}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer?.mode === "new" ? "Nova avaliação" : "Responder avaliação"}
        footer={
          drawer?.mode === "new"
            ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>
            : <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={sendReply}>Enviar resposta</Button></div>
        }
      >
        {drawer?.mode === "new" && (
          <div className="space-y-3">
            <div><Label className="text-xs">Paciente*</Label><Input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Nota</Label>
                <Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} estrelas</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Origem</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["manual", "google", "doctoralia", "instagram"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Comentário</Label><Textarea rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></div>
          </div>
        )}
        {drawer?.mode === "reply" && drawer.review && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm font-semibold">{drawer.review.patient_name}</p>
              <StarsRow value={drawer.review.rating} />
              {drawer.review.comment && <p className="mt-2 text-sm text-muted-foreground">{drawer.review.comment}</p>}
            </div>
            <div><Label className="text-xs">Sua resposta</Label><Textarea rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Olá! Agradecemos imensamente seu feedback…" /></div>
          </div>
        )}
      </EntityDrawer>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir avaliação?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removida" }); setConfirmDel(null); } }}
      />
    </>
  );
}
