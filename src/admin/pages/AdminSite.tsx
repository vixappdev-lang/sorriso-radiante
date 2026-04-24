import { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, ExternalLink, Megaphone, FileText, Search,
  Layers, Calendar as CalendarIcon, Link2, Tag, Eye, Globe,
} from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import EntityModal from "@/admin/components/EntityModal";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import StatusPill from "@/admin/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePromotions, useUpsertPromotion, useDeletePromotion, type Promotion } from "@/admin/hooks/usePromotions";
import { useSiteContent, useUpsertSiteContent } from "@/admin/hooks/useSiteContent";
import { toast } from "@/hooks/use-toast";

const SECTIONS = [
  {
    key: "hero",
    label: "Hero — topo do site",
    icon: Layers,
    description: "Primeira coisa que o visitante vê. Capriche no impacto.",
    fields: [
      { k: "eyebrow", t: "Eyebrow (texto pequeno superior)", placeholder: "Clínica odontológica premium" },
      { k: "title", t: "Título principal", placeholder: "Sorrisos que transformam vidas" },
      { k: "subtitle", t: "Subtítulo", multiline: true, placeholder: "Atendimento humanizado, tecnologia de ponta e equipe especializada." },
      { k: "cta", t: "Texto do botão principal", placeholder: "Agendar avaliação" },
      { k: "cta_secondary", t: "Texto do botão secundário", placeholder: "Conhecer tratamentos" },
    ],
  },
  {
    key: "about",
    label: "Sobre a clínica",
    icon: FileText,
    description: "Conte sua história e diferenciais. Texto rico, sem clichês.",
    fields: [
      { k: "title", t: "Título da seção", placeholder: "Sobre a LyneCloud" },
      { k: "subtitle", t: "Subtítulo", placeholder: "Excelência em odontologia desde 2010" },
      { k: "body", t: "Texto principal", multiline: true, rows: 6, placeholder: "Há mais de uma década oferecendo…" },
      { k: "stats_label_1", t: "Estatística 1 — rótulo", placeholder: "Pacientes atendidos" },
      { k: "stats_value_1", t: "Estatística 1 — valor", placeholder: "+ 5.000" },
    ],
  },
  {
    key: "contact",
    label: "Contato",
    icon: Link2,
    description: "Dados de contato exibidos no site público.",
    fields: [
      { k: "phone", t: "Telefone principal", placeholder: "(11) 99999-9999" },
      { k: "whatsapp", t: "WhatsApp", placeholder: "5511999999999" },
      { k: "email", t: "E-mail", placeholder: "contato@lynecloud.com.br" },
      { k: "address", t: "Endereço completo", multiline: true, placeholder: "Rua Exemplo, 123 — Jardins, São Paulo / SP" },
      { k: "instagram", t: "Instagram", placeholder: "@lynecloud" },
    ],
  },
  {
    key: "footer",
    label: "Rodapé",
    icon: Globe,
    description: "Texto institucional e links no rodapé do site.",
    fields: [
      { k: "tagline", t: "Frase do rodapé", placeholder: "Cuidado odontológico que você merece." },
      { k: "copyright", t: "Texto de copyright", placeholder: "© 2026 LyneCloud. Todos os direitos reservados." },
    ],
  },
] as const;

function emptyPromo() {
  return { id: "", title: "", description: "", cta_label: "", cta_url: "", slug: "", active: true };
}

export default function AdminSite() {
  const { data: promos = [] } = usePromotions();
  const { data: siteContent = {} } = useSiteContent();
  const upsertPromo = useUpsertPromotion();
  const delPromo = useDeletePromotion();
  const upsertContent = useUpsertSiteContent();

  // Modais
  const [promoModal, setPromoModal] = useState<{ open: boolean; mode: "new" | "edit" }>({ open: false, mode: "new" });
  const [promoForm, setPromoForm] = useState<any>(emptyPromo());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const [sectionModal, setSectionModal] = useState<{ open: boolean; key: string | null }>({ open: false, key: null });
  const [sectionForm, setSectionForm] = useState<Record<string, any>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const matchesSearch = !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.slug ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && p.active) ||
        (statusFilter === "inactive" && !p.active);
      return matchesSearch && matchesStatus;
    });
  }, [promos, search, statusFilter]);

  function openNewPromo() { setPromoForm(emptyPromo()); setPromoModal({ open: true, mode: "new" }); }
  function openEditPromo(p: Promotion) {
    setPromoForm({
      id: p.id, title: p.title, description: p.description ?? "",
      cta_label: p.cta_label ?? "", cta_url: p.cta_url ?? "", slug: p.slug ?? "", active: p.active,
    });
    setPromoModal({ open: true, mode: "edit" });
  }
  async function savePromo() {
    if (!promoForm.title) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    try {
      await upsertPromo.mutateAsync({
        id: promoForm.id || undefined,
        title: promoForm.title,
        description: promoForm.description || null,
        cta_label: promoForm.cta_label || null,
        cta_url: promoForm.cta_url || null,
        slug: promoForm.slug || null,
        active: promoForm.active,
      } as any);
      toast({ title: "Promoção salva" });
      setPromoModal({ open: false, mode: "new" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  function getContent(key: string): Record<string, any> {
    return ((siteContent as Record<string, any>)[key] as any) || {};
  }
  function openEditSection(key: string) {
    setSectionForm(getContent(key));
    setSectionModal({ open: true, key });
  }
  async function saveSection() {
    if (!sectionModal.key) return;
    try {
      await upsertContent.mutateAsync({ key: sectionModal.key, value: sectionForm });
      toast({ title: "Seção salva" });
      setSectionModal({ open: false, key: null });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  const currentSection = SECTIONS.find((s) => s.key === sectionModal.key);

  return (
    <>
      <PageHeader
        title="Site & Landing Pages"
        description="Edite seções do site, gerencie promoções e visualize as alterações."
        actions={<Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" /> Ver site ao vivo</a></Button>}
      />

      <Tabs defaultValue="content">
        <TabsList className="bg-card border border-[hsl(var(--admin-border))] p-1 h-auto">
          <TabsTrigger value="content" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Conteúdo do site</TabsTrigger>
          <TabsTrigger value="promos" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Promoções</TabsTrigger>
        </TabsList>

        {/* ====== CONTEÚDO DO SITE ====== */}
        <TabsContent value="content" className="mt-4">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const data = getContent(sec.key);
              const filledCount = Object.values(data).filter((v) => v && String(v).trim()).length;
              return (
                <article key={sec.key} className="admin-card admin-card-hover p-5 cursor-pointer group" onClick={() => openEditSection(sec.key)}>
                  <header className="flex items-start gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{sec.label}</h3>
                        <Badge variant={filledCount > 0 ? "secondary" : "outline"} className="shrink-0 text-[10px]">
                          {filledCount > 0 ? `${filledCount} campos` : "Vazio"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sec.description}</p>
                    </div>
                  </header>
                  <div className="mt-4 pt-4 border-t border-[hsl(var(--admin-border))] flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {sec.fields.length} campos disponíveis
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); openEditSection(sec.key); }}>
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </TabsContent>

        {/* ====== PROMOÇÕES ====== */}
        <TabsContent value="promos" className="mt-4 space-y-3">
          {/* Toolbar */}
          <div className="admin-card p-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar promoções por título, descrição ou slug…"
                className="pl-9 h-10 bg-background border-[hsl(var(--admin-border))]"
              />
            </div>
            <div className="flex items-center gap-1 admin-card p-1 shadow-none border-0 bg-muted/50">
              {(["all", "active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "Todas" : s === "active" ? "Ativas" : "Inativas"}
                </button>
              ))}
            </div>
            <Button onClick={openNewPromo} className="shrink-0"><Plus className="h-4 w-4 mr-2" /> Nova promoção</Button>
          </div>

          {filteredPromos.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title={promos.length === 0 ? "Nenhuma promoção cadastrada" : "Nenhuma promoção encontrada"}
              description={promos.length === 0 ? "Crie campanhas, descontos ou destaques para aparecer no site." : "Tente ajustar os filtros ou a busca."}
              action={promos.length === 0 ? <Button onClick={openNewPromo}><Plus className="h-4 w-4 mr-2" /> Criar primeira promoção</Button> : undefined}
            />
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredPromos.map((p) => (
                <article key={p.id} className="admin-card admin-card-hover p-5 cursor-pointer flex flex-col" onClick={() => openEditPromo(p)}>
                  <header className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      {p.slug && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Tag className="h-3 w-3" /> /{p.slug}
                        </p>
                      )}
                    </div>
                    <StatusPill status={p.active ? "active" : "inactive"} />
                  </header>
                  {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2 flex-1">{p.description}</p>}
                  {p.cta_label && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{p.cta_label}</span>
                      {p.cta_url && <span className="text-[11px] text-muted-foreground truncate">→ {p.cta_url}</span>}
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-[hsl(var(--admin-border))] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {p.cta_url && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                          <a href={p.cta_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><Eye className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditPromo(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDel(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ====== MODAL: PROMOÇÃO ====== */}
      <EntityModal
        open={promoModal.open}
        onOpenChange={(v) => setPromoModal({ ...promoModal, open: v })}
        title={promoModal.mode === "new" ? "Nova promoção" : "Editar promoção"}
        description="Promoções podem aparecer em destaque no site público da clínica."
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPromoModal({ ...promoModal, open: false })}>Cancelar</Button>
            <Button onClick={savePromo}>{promoModal.mode === "new" ? "Criar promoção" : "Salvar alterações"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Título da promoção *</Label>
            <Input value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} placeholder="Ex: Black Friday — 30% OFF" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={3} value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} placeholder="Descreva os detalhes da promoção exibida ao visitante." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Texto do botão (CTA)</Label>
              <Input value={promoForm.cta_label} onChange={(e) => setPromoForm({ ...promoForm, cta_label: e.target.value })} placeholder="Agendar agora" />
            </div>
            <div>
              <Label className="text-xs">Link do botão</Label>
              <Input value={promoForm.cta_url} onChange={(e) => setPromoForm({ ...promoForm, cta_url: e.target.value })} placeholder="/contato" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Slug (URL amigável)</Label>
            <Input value={promoForm.slug} onChange={(e) => setPromoForm({ ...promoForm, slug: e.target.value })} placeholder="black-friday-2025" />
            <p className="text-[11px] text-muted-foreground mt-1">Use letras minúsculas e hífens. Ex: <code className="bg-muted px-1 rounded">black-friday</code></p>
          </div>
          <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-[11px] text-muted-foreground">Promoções inativas não aparecem no site público.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={promoForm.active} onCheckedChange={(v) => setPromoForm({ ...promoForm, active: v })} />
              <span className="text-sm font-medium">{promoForm.active ? "Ativa" : "Inativa"}</span>
            </div>
          </div>
        </div>
      </EntityModal>

      {/* ====== MODAL: SEÇÃO DO SITE ====== */}
      <EntityModal
        open={sectionModal.open}
        onOpenChange={(v) => setSectionModal({ ...sectionModal, open: v })}
        title={currentSection ? `Editar — ${currentSection.label}` : "Editar seção"}
        description={currentSection?.description}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSectionModal({ open: false, key: null })}>Cancelar</Button>
            <Button onClick={saveSection}>Salvar seção</Button>
          </div>
        }
      >
        {currentSection && (
          <div className="space-y-3">
            {currentSection.fields.map((f: any) => (
              <div key={f.k}>
                <Label className="text-xs">{f.t}</Label>
                {f.multiline ? (
                  <Textarea
                    rows={f.rows ?? 3}
                    value={sectionForm[f.k] ?? ""}
                    onChange={(e) => setSectionForm({ ...sectionForm, [f.k]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    value={sectionForm[f.k] ?? ""}
                    onChange={(e) => setSectionForm({ ...sectionForm, [f.k]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </EntityModal>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir promoção?"
        description="Essa ação não pode ser desfeita e a promoção será removida do site imediatamente."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={async () => { if (confirmDel) { await delPromo.mutateAsync(confirmDel); toast({ title: "Promoção removida" }); setConfirmDel(null); } }}
      />
    </>
  );
}
