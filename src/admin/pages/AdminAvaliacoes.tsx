import { useMemo, useState } from "react";
import { Star, Plus, MessageCircle, Trash2, Reply, Link as LinkIcon, Send, ChevronLeft, ChevronRight } from "lucide-react";
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

      <ReviewsList
        reviews={reviews}
        filterFor={filterFor}
        openReply={openReply}
        setConfirmDel={setConfirmDel}
      />

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer?.mode === "new" ? "Nova avaliação" : drawer?.mode === "invite" ? "Convidar paciente para avaliar" : "Responder avaliação"}
        footer={
          drawer?.mode === "new"
            ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></div>
            : drawer?.mode === "invite"
            ? <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Fechar</Button><Button disabled={!inviteForm.patient_name} onClick={async () => {
                try {
                  const inv = await createInvite.mutateAsync(inviteForm);
                  setInviteForm({ patient_name: "", patient_phone: "", treatment: "", professional: "" });
                  setDrawer(null);
                  setLinkModal({ token: inv.token, name: inv.patient_name });
                  toast({ title: "Convite criado" });
                } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
              }}><LinkIcon className="h-4 w-4 mr-2" /> Gerar link</Button></div>
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
        {drawer?.mode === "invite" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Crie um link único para o paciente avaliar a clínica. O link é captado automaticamente do domínio atual.</p>
            <div><Label className="text-xs">Nome do paciente*</Label><Input value={inviteForm.patient_name} onChange={(e) => setInviteForm({ ...inviteForm, patient_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Telefone</Label><Input value={inviteForm.patient_phone} onChange={(e) => setInviteForm({ ...inviteForm, patient_phone: e.target.value })} /></div>
              <div><Label className="text-xs">Tratamento</Label><Input value={inviteForm.treatment} onChange={(e) => setInviteForm({ ...inviteForm, treatment: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Profissional</Label><Input value={inviteForm.professional} onChange={(e) => setInviteForm({ ...inviteForm, professional: e.target.value })} /></div>

            {invites.length > 0 && (
              <div className="pt-3 border-t border-dashed">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Convites recentes</p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {invites.slice(0, 10).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{inv.patient_name}</p>
                        <p className="text-[10px] text-muted-foreground">{inv.used_at ? "Avaliado" : "Pendente"}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setLinkModal({ token: inv.token, name: inv.patient_name })}><LinkIcon className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteInvite.mutate(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      <PublicLinkModal
        open={!!linkModal}
        onOpenChange={(v) => !v && setLinkModal(null)}
        title={`Link de avaliação${linkModal?.name ? ` — ${linkModal.name}` : ""}`}
        description="Compartilhe com o paciente para coletar a avaliação"
        path={linkModal ? `/avaliar/${linkModal.token}` : ""}
        helper="Cada link é único e expira em 60 dias. Após o paciente enviar a avaliação, o link não pode ser reutilizado. Compartilhe via WhatsApp, e-mail ou QR code."
      />

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir avaliação?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await del.mutateAsync(confirmDel); toast({ title: "Removida" }); setConfirmDel(null); } }}
      />
    </>
  );
}

/* ───────── Lista compacta full-width com paginação e tabs ───────── */
const PAGE_SIZE = 8;

function ReviewsList({ reviews, filterFor, openReply, setConfirmDel }: any) {
  const [tab, setTab] = useState<"all" | "pending" | "google" | "manual">("all");
  const [page, setPage] = useState(1);

  const list: Review[] = filterFor(tab);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function go(t: typeof tab) { setTab(t); setPage(1); }

  return (
    <div className="admin-card overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-[hsl(var(--admin-border))] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Avaliações recebidas</h3>
          <p className="text-xs text-muted-foreground">{list.length} {list.length === 1 ? "avaliação" : "avaliações"} nesta categoria</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => go(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="manual">Manuais</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {list.length === 0 ? (
        <div className="p-6">
          <EmptyState icon={Star} title="Sem avaliações" description="Quando houver avaliações nesta categoria, elas aparecerão aqui." />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[hsl(var(--admin-border))]">
            {slice.map((r) => (
              <li key={r.id} className="px-4 sm:px-5 py-4 hover:bg-muted/30 transition">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 grid place-items-center text-amber-700 font-semibold text-sm flex-shrink-0 ring-2 ring-white shadow-sm">
                    {r.patient_name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{r.patient_name}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">{r.source}</Badge>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="mt-1.5"><StarsRow value={r.rating} /></div>
                    {r.comment && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{r.comment}</p>}
                    {r.reply && (
                      <div className="mt-2.5 rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2">
                        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-0.5">Resposta da clínica</p>
                        <p className="text-xs text-blue-900/80 leading-relaxed line-clamp-2">{r.reply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openReply(r)} title="Responder"><Reply className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(r.id)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <div className="px-4 sm:px-5 py-3 border-t border-[hsl(var(--admin-border))] flex items-center justify-between">
              <p className="text-xs text-muted-foreground tabular-nums">
                Página {safePage} de {pages} · {list.length} no total
              </p>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: pages }).slice(0, 5).map((_, i) => {
                  const n = i + 1;
                  return (
                    <Button key={n} size="sm" variant={n === safePage ? "default" : "outline"} className="h-8 w-8 p-0 tabular-nums" onClick={() => setPage(n)}>
                      {n}
                    </Button>
                  );
                })}
                <Button size="sm" variant="outline" disabled={safePage === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
