import { useState } from "react";
import { Globe, Plus, Pencil, Trash2, ExternalLink, Megaphone, FileText } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import EmptyState from "@/admin/components/EmptyState";
import EntityDrawer from "@/admin/components/EntityDrawer";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import StatusPill from "@/admin/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePromotions, useUpsertPromotion, useDeletePromotion, type Promotion } from "@/admin/hooks/usePromotions";
import { useSiteContent, useUpsertSiteContent } from "@/admin/hooks/useSiteContent";
import { toast } from "@/hooks/use-toast";

const SECTIONS = [
  { key: "hero", label: "Hero (topo do site)", fields: [{ k: "title", t: "Título principal" }, { k: "subtitle", t: "Subtítulo" }, { k: "cta", t: "Texto do botão" }] },
  { key: "about", label: "Sobre a clínica", fields: [{ k: "title", t: "Título" }, { k: "body", t: "Texto", multiline: true }] },
  { key: "contact", label: "Contato", fields: [{ k: "phone", t: "Telefone" }, { k: "email", t: "E-mail" }, { k: "address", t: "Endereço" }] },
  { key: "footer", label: "Rodapé", fields: [{ k: "text", t: "Texto", multiline: true }] },
];

function emptyPromo() { return { id: "", title: "", description: "", cta_label: "", cta_url: "", slug: "", active: true }; }

export default function AdminSite() {
  const { data: promos = [] } = usePromotions();
  const { data: siteContent = [] } = useSiteContent();
  const upsertPromo = useUpsertPromotion();
  const delPromo = useDeletePromotion();
  const upsertContent = useUpsertSiteContent();

  const [drawer, setDrawer] = useState<"new" | Promotion | null>(null);
  const [form, setForm] = useState<any>(emptyPromo());
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  function openNew() { setForm(emptyPromo()); setDrawer("new"); }
  function openEdit(p: Promotion) {
    setForm({
      id: p.id, title: p.title, description: p.description ?? "",
      cta_label: p.cta_label ?? "", cta_url: p.cta_url ?? "", slug: p.slug ?? "", active: p.active,
    });
    setDrawer(p);
  }
  async function savePromo() {
    if (!form.title) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    try {
      await upsertPromo.mutateAsync({
        id: form.id || undefined, title: form.title, description: form.description || null,
        cta_label: form.cta_label || null, cta_url: form.cta_url || null, slug: form.slug || null, active: form.active,
      } as any);
      toast({ title: "Promoção salva" });
      setDrawer(null);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  function getContent(key: string): Record<string, any> {
    const row = siteContent.find((c: any) => c.key === key);
    return (row?.value as any) || {};
  }
  async function saveSection(sectionKey: string, value: Record<string, any>) {
    try {
      await upsertContent.mutateAsync({ key: sectionKey, value });
      toast({ title: "Seção salva" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  return (
    <>
      <PageHeader
        title="Site & Landing Pages"
        description="Edite seções do site, gerencie promoções e visualize as alterações."
        actions={<Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" /> Ver site</a></Button>}
      />

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content"><FileText className="h-3.5 w-3.5 mr-1.5" /> Conteúdo</TabsTrigger>
          <TabsTrigger value="promos"><Megaphone className="h-3.5 w-3.5 mr-1.5" /> Promoções</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {SECTIONS.map((sec) => (
              <SectionEditor key={sec.key} section={sec} initial={getContent(sec.key)} onSave={(v) => saveSection(sec.key, v)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova promoção</Button>
          </div>
          {promos.length === 0 ? (
            <EmptyState icon={Megaphone} title="Sem promoções" description="Crie uma promoção para destacar no site." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova promoção</Button>} />
          ) : (
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {promos.map((p) => (
                <article key={p.id} className="admin-card admin-card-hover p-5 cursor-pointer" onClick={() => openEdit(p)}>
                  <header className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      {p.slug && <p className="text-[11px] text-muted-foreground mt-0.5">/{p.slug}</p>}
                    </div>
                    <StatusPill status={p.active ? "active" : "inactive"} />
                  </header>
                  {p.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="mt-4 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    {p.cta_label && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{p.cta_label}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EntityDrawer
        open={!!drawer}
        onOpenChange={(v) => !v && setDrawer(null)}
        title={drawer === "new" ? "Nova promoção" : "Editar promoção"}
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDrawer(null)}>Cancelar</Button><Button onClick={savePromo}>Salvar</Button></div>}
      >
        <div className="space-y-3">
          <div><Label className="text-xs">Título*</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label className="text-xs">Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Texto do botão</Label><Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} /></div>
            <div><Label className="text-xs">Link do botão</Label><Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="ex.: black-friday" /></div>
          <div className="flex items-center gap-2 pt-1"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><span className="text-sm">{form.active ? "Ativa" : "Inativa"}</span></div>
        </div>
      </EntityDrawer>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir promoção?" description="Essa ação não pode ser desfeita." destructive confirmLabel="Excluir"
        onConfirm={async () => { if (confirmDel) { await delPromo.mutateAsync(confirmDel); toast({ title: "Removida" }); setConfirmDel(null); } }}
      />
    </>
  );
}

function SectionEditor({ section, initial, onSave }: { section: typeof SECTIONS[number]; initial: Record<string, any>; onSave: (v: Record<string, any>) => void; }) {
  const [v, setV] = useState<Record<string, any>>(initial);
  return (
    <div className="admin-card p-5">
      <h3 className="text-[15px] font-semibold mb-3">{section.label}</h3>
      <div className="space-y-3">
        {section.fields.map((f: any) => (
          <div key={f.k}>
            <Label className="text-xs">{f.t}</Label>
            {f.multiline ? (
              <Textarea rows={3} value={v[f.k] ?? ""} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />
            ) : (
              <Input value={v[f.k] ?? ""} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => onSave(v)}>Salvar seção</Button>
      </div>
    </div>
  );
}
