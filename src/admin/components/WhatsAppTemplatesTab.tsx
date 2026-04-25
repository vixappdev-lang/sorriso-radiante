import { useEffect, useMemo, useState } from "react";
import { Search, Settings2, Copy, Check, Send, ChevronRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import EntityModal from "@/admin/components/EntityModal";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  WHATSAPP_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type WhatsAppTemplate,
} from "@/admin/data/whatsappTemplates";

/**
 * Aba "Templates" do WhatsApp.
 * Lista a biblioteca de mensagens prontas, permite configurar variáveis,
 * editar conteúdo, ativar/desativar e enviar teste.
 *
 * Persistência: tabela `whatsapp_templates` (key, content, enabled, config jsonb, trigger_keywords).
 */
export default function WhatsAppTemplatesTab() {
  const [stored, setStored] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [editing, setEditing] = useState<WhatsAppTemplate | null>(null);
  const [testNumber, setTestNumber] = useState("");

  async function load() {
    const { data } = await supabase.from("whatsapp_templates").select("*");
    const map: Record<string, any> = {};
    (data ?? []).forEach((r: any) => { map[r.key] = r; });
    setStored(map);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return WHATSAPP_TEMPLATES.filter((t) => {
      if (activeCat !== "all" && t.category !== activeCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.trigger_keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search, activeCat]);

  function buildBaseRow(t: WhatsAppTemplate) {
    return {
      key: t.key,
      category: t.category,
      title: t.title,
      description: t.description,
      content: t.content,
      variables: t.variables,
      trigger_keywords: t.trigger_keywords,
      requires_config: !!t.requires_config,
      config_fields: (t.config_fields ?? []) as any,
      built_in: true,
    };
  }

  async function toggle(t: WhatsAppTemplate, enabled: boolean) {
    const cur = stored[t.key];
    if (cur) {
      await supabase.from("whatsapp_templates").update({ enabled }).eq("key", t.key);
    } else {
      await supabase.from("whatsapp_templates").insert({
        ...buildBaseRow(t),
        config_values: {},
        enabled,
      } as any);
    }
    load();
  }

  async function saveTemplate(t: WhatsAppTemplate, patch: { content?: string; config?: Record<string, string>; trigger_keywords?: string[] }) {
    const cur = stored[t.key];
    const dbPatch: any = {};
    if (patch.content !== undefined) dbPatch.content = patch.content;
    if (patch.config !== undefined) dbPatch.config_values = patch.config;
    if (patch.trigger_keywords !== undefined) dbPatch.trigger_keywords = patch.trigger_keywords;
    if (cur) {
      await supabase.from("whatsapp_templates").update(dbPatch).eq("key", t.key);
    } else {
      await supabase.from("whatsapp_templates").insert({
        ...buildBaseRow(t),
        content: patch.content ?? t.content,
        trigger_keywords: patch.trigger_keywords ?? t.trigger_keywords,
        config_values: patch.config ?? {},
        enabled: true,
      } as any);
    }
    load();
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado!" });
    } catch {
      toast({ title: "Não consegui copiar", variant: "destructive" });
    }
  }

  async function sendTest(t: WhatsAppTemplate) {
    const phone = testNumber.replace(/\D/g, "");
    if (!phone) return toast({ title: "Informe um número (com DDD) acima", variant: "destructive" });
    const cur = stored[t.key];
    const content: string = cur?.content ?? t.content;
    const config: Record<string, string> = cur?.config_values ?? {};
    // Substitui variáveis
    let final = content.replace(/\{\{nome\}\}/g, "Cliente Teste");
    for (const v of t.variables) {
      const val = config[v] ?? `{{${v}}}`;
      final = final.replace(new RegExp(`\\{\\{${v}\\}\\}`, "g"), val);
    }
    const { data, error } = await supabase.functions.invoke("whatsapp-gateway", {
      body: { to: phone, message: final },
    });
    if (error || !data?.ok) {
      toast({ title: "Falha ao enviar", description: error?.message ?? data?.error ?? "Verifique o provedor ativo", variant: "destructive" });
    } else {
      toast({ title: "Enviado!", description: `Via ${data.provider ?? "gateway"}` });
    }
  }

  const enabledCount = Object.values(stored).filter((s: any) => s.enabled).length;
  const needsConfigCount = WHATSAPP_TEMPLATES.filter((t) => {
    if (!t.requires_config) return false;
    const cur = stored[t.key];
    const cfg: Record<string, string> = cur?.config_values ?? {};
    return (t.config_fields ?? []).some((f) => f.required && !cfg[f.key]);
  }).length;

  return (
    <div className="space-y-4">
      {/* Header / KPIs */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="admin-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Total na biblioteca</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{WHATSAPP_TEMPLATES.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{TEMPLATE_CATEGORIES.length} categorias prontas</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Ativos hoje</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{enabledCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Respondendo automaticamente quando casar palavra-chave</p>
        </div>
        <div className={cn("admin-card p-4", needsConfigCount > 0 && "border-amber-300 bg-amber-50/40")}>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Precisam configurar</p>
          <p className={cn("text-2xl font-bold mt-1 tabular-nums", needsConfigCount > 0 ? "text-amber-700" : "text-slate-900")}>{needsConfigCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Faltam variáveis (ex.: link, endereço, chave PIX)</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card p-3 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar template, palavra-chave..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Label className="text-xs text-slate-500 hidden md:inline-flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Nº teste</Label>
          <Input
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            placeholder="11999999999"
            className="w-44"
          />
        </div>
      </div>

      {/* Categorias chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <CatChip label="Todas" emoji="🗂️" active={activeCat === "all"} onClick={() => setActiveCat("all")} count={WHATSAPP_TEMPLATES.length} />
        {TEMPLATE_CATEGORIES.map((c) => (
          <CatChip
            key={c.key}
            label={c.label}
            emoji={c.emoji}
            active={activeCat === c.key}
            onClick={() => setActiveCat(c.key)}
            count={WHATSAPP_TEMPLATES.filter((t) => t.category === c.key).length}
          />
        ))}
      </div>

      {/* Lista de templates */}
      <div className="grid lg:grid-cols-2 gap-3">
        {filtered.map((t) => {
          const cur = stored[t.key];
          const enabled = !!cur?.enabled;
          const cfg: Record<string, string> = cur?.config_values ?? {};
          const needsCfg = t.requires_config && (t.config_fields ?? []).some((f) => f.required && !cfg[f.key]);
          const cat = TEMPLATE_CATEGORIES.find((c) => c.key === t.category);
          return (
            <div
              key={t.key}
              className={cn(
                "rounded-2xl border-2 bg-card p-4 transition relative",
                enabled ? "border-emerald-300" : "border-slate-200 hover:border-slate-300",
                needsCfg && "border-amber-300 bg-amber-50/30",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl grid place-items-center bg-slate-50 text-xl flex-shrink-0">
                  {cat?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 text-[14px]">{t.title}</h4>
                    {enabled && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-5">Ativo</Badge>}
                    {needsCfg && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] h-5">Configurar</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
                </div>
                <Switch checked={enabled} onCheckedChange={(v) => toggle(t, v)} />
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 border p-2.5 text-[12px] leading-relaxed text-slate-700 whitespace-pre-line line-clamp-4">
                {(cur?.content ?? t.content)}
              </div>

              {t.trigger_keywords.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {t.trigger_keywords.slice(0, 5).map((k) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border">{k}</span>
                  ))}
                  {t.trigger_keywords.length > 5 && (
                    <span className="text-[10px] text-slate-400">+{t.trigger_keywords.length - 5}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing(t)}>
                  <Settings2 className="h-3.5 w-3.5 mr-1" /> Configurar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => copyToClipboard(cur?.content ?? t.content)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => sendTest(t)}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Testar
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full admin-card p-10 text-center text-sm text-slate-500">
            Nenhum template encontrado para essa busca.
          </div>
        )}
      </div>

      {/* Modal de configuração */}
      <ConfigModal
        template={editing}
        stored={editing ? stored[editing.key] : null}
        onClose={() => setEditing(null)}
        onSave={async (patch) => { if (editing) await saveTemplate(editing, patch); }}
      />
    </div>
  );
}

function CatChip({ label, emoji, active, onClick, count }: { label: string; emoji: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span className={cn("text-[10px] tabular-nums px-1.5 rounded-full", active ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{count}</span>
    </button>
  );
}

function ConfigModal({ template, stored, onClose, onSave }: {
  template: WhatsAppTemplate | null;
  stored: any;
  onClose: () => void;
  onSave: (patch: { content?: string; config?: Record<string, string>; trigger_keywords?: string[] }) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [keywords, setKeywords] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!template) return;
    setContent(stored?.content ?? template.content);
    setConfig(stored?.config_values ?? {});
    setKeywords((stored?.trigger_keywords ?? template.trigger_keywords).join(", "));
  }, [template, stored]);

  if (!template) return null;

  const preview = (() => {
    let txt = content.replace(/\{\{nome\}\}/g, "Cliente Teste");
    for (const v of template.variables) {
      txt = txt.replace(new RegExp(`\\{\\{${v}\\}\\}`, "g"), config[v] || `[${v}]`);
    }
    return txt;
  })();

  async function handleSave() {
    setSaving(true);
    await onSave({
      content,
      config,
      trigger_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    });
    setSaving(false);
    toast({ title: "Template salvo" });
    onClose();
  }

  return (
    <EntityModal
      open={!!template}
      onOpenChange={(v) => !v && onClose()}
      title={`Configurar — ${template.title}`}
      description={template.description}
      size="lg"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {(template.config_fields ?? []).length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-slate-700">Variáveis a preencher</Label>
              <div className="space-y-2 mt-2">
                {template.config_fields!.map((f) => (
                  <div key={f.key}>
                    <Label className="text-[11px] text-slate-500">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <Input
                      type={f.type === "url" ? "url" : "text"}
                      value={config[f.key] ?? ""}
                      onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-slate-700">Conteúdo da mensagem</Label>
            <Textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1.5 font-mono text-[12px]"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Variáveis: {template.variables.map((v) => `{{${v}}}`).join(" ")}
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Palavras-chave (separe por vírgula)</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="agendar, marcar, horário"
              className="mt-1.5"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Quando o paciente escrever uma destas palavras, este template é disparado automaticamente.
            </p>
          </div>
        </div>

        {/* Preview WhatsApp */}
        <div>
          <Label className="text-xs font-semibold text-slate-700">Pré-visualização</Label>
          <div className="mt-1.5 rounded-2xl border-2 border-emerald-200 bg-[#e5ddd5] p-4 min-h-[280px] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,#000_1px,transparent_1px)] bg-[size:18px_18px]" />
            <div className="relative max-w-[85%] ml-auto rounded-lg bg-[#dcf8c6] px-3 py-2 shadow text-[13px] text-slate-800 whitespace-pre-line leading-relaxed">
              {preview}
              <span className="block text-right text-[10px] text-slate-500 mt-1">12:34 ✓✓</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 mr-1.5" /> Salvar template
        </Button>
      </div>
    </EntityModal>
  );
}
