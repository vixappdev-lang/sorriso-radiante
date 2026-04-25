import { useEffect, useMemo, useState } from "react";
import { Search, Settings2, Copy, Check, Send, Filter, ChevronDown, ChevronRight, ArrowDown, MessageSquare, Reply } from "lucide-react";
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
  WHATSAPP_FLOWS,
  FLOW_CATEGORIES,
  type WhatsAppFlow,
  type FlowStep,
} from "@/admin/data/whatsappTemplates";

/**
 * Aba "Templates" — Fluxos interligados.
 * Cada card representa um fluxo (ex.: "Cliente quer agendar") com TODOS
 * os passos encadeados (entrada → resposta sim → resposta não) num único
 * card. O bot resolve sequencialmente sem delay artificial.
 *
 * Persistência: tabela `whatsapp_templates` (key = flow.key) armazenando
 * { content (steps merged JSON em config_values.steps), config_values, enabled, trigger_keywords }.
 */
export default function WhatsAppTemplatesTab() {
  const [stored, setStored] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [editing, setEditing] = useState<WhatsAppFlow | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    const { data } = await supabase.from("whatsapp_templates").select("*");
    const map: Record<string, any> = {};
    (data ?? []).forEach((r: any) => { map[r.key] = r; });
    setStored(map);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return WHATSAPP_FLOWS.filter((f) => {
      if (activeCat !== "all" && f.category !== activeCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.steps.some((s) => s.content.toLowerCase().includes(q)) ||
        f.trigger_keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search, activeCat]);

  function buildBaseRow(f: WhatsAppFlow) {
    return {
      key: f.key,
      category: f.category,
      title: f.title,
      description: f.description,
      content: f.steps[0]?.content ?? "",
      variables: f.variables,
      trigger_keywords: f.trigger_keywords,
      requires_config: !!f.requires_config,
      config_fields: (f.config_fields ?? []) as any,
      built_in: true,
    };
  }

  async function toggle(f: WhatsAppFlow, enabled: boolean) {
    const cur = stored[f.key];
    if (cur) {
      await supabase.from("whatsapp_templates").update({ enabled }).eq("key", f.key);
    } else {
      await supabase.from("whatsapp_templates").insert({
        ...buildBaseRow(f),
        config_values: { steps: f.steps },
        enabled,
      } as any);
    }
    load();
  }

  async function saveFlow(f: WhatsAppFlow, patch: { steps?: FlowStep[]; config?: Record<string, string>; trigger_keywords?: string[] }) {
    const cur = stored[f.key];
    const newConfig = { ...(cur?.config_values ?? {}), ...(patch.config ?? {}) };
    if (patch.steps) newConfig.steps = patch.steps;

    const dbPatch: any = { config_values: newConfig };
    if (patch.steps) dbPatch.content = patch.steps[0]?.content ?? "";
    if (patch.trigger_keywords) dbPatch.trigger_keywords = patch.trigger_keywords;

    if (cur) {
      await supabase.from("whatsapp_templates").update(dbPatch).eq("key", f.key);
    } else {
      await supabase.from("whatsapp_templates").insert({
        ...buildBaseRow(f),
        ...dbPatch,
        enabled: true,
      } as any);
    }
    load();
  }

  function effectiveSteps(f: WhatsAppFlow): FlowStep[] {
    const overrides = stored[f.key]?.config_values?.steps as FlowStep[] | undefined;
    if (!overrides || overrides.length === 0) return f.steps;
    // Merge por id
    return f.steps.map((s) => overrides.find((o) => o.id === s.id) ?? s);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado!" });
    } catch {
      toast({ title: "Não consegui copiar", variant: "destructive" });
    }
  }

  async function sendTest(f: WhatsAppFlow) {
    const phone = testNumber.replace(/\D/g, "");
    if (!phone) return toast({ title: "Informe um número (com DDD) acima", variant: "destructive" });
    const cur = stored[f.key];
    const steps = effectiveSteps(f);
    const config: Record<string, string> = cur?.config_values ?? {};
    let final = steps[0].content.replace(/\{\{nome\}\}/g, "Cliente Teste");
    for (const v of f.variables) {
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
  const needsConfigCount = WHATSAPP_FLOWS.filter((f) => {
    if (!f.requires_config) return false;
    const cur = stored[f.key];
    const cfg: Record<string, string> = cur?.config_values ?? {};
    return (f.config_fields ?? []).some((cf) => cf.required && !cfg[cf.key]);
  }).length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-3">
        <KpiTile label="Fluxos disponíveis" value={WHATSAPP_FLOWS.length} hint={`${FLOW_CATEGORIES.length} categorias`} />
        <KpiTile label="Ativos hoje" value={enabledCount} hint="Respondendo automaticamente" tone="emerald" />
        <KpiTile label="Precisam configurar" value={needsConfigCount} hint="Faltam variáveis (link, PIX, etc.)" tone={needsConfigCount > 0 ? "amber" : "default"} />
      </div>

      {/* Toolbar */}
      <div className="admin-card p-3 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fluxo, palavra-chave..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Label className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Nº teste</Label>
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
        <CatChip label="Todos" emoji="🗂️" active={activeCat === "all"} onClick={() => setActiveCat("all")} count={WHATSAPP_FLOWS.length} />
        {FLOW_CATEGORIES.map((c) => (
          <CatChip
            key={c.key}
            label={c.label}
            emoji={c.emoji}
            active={activeCat === c.key}
            onClick={() => setActiveCat(c.key)}
            count={WHATSAPP_FLOWS.filter((t) => t.category === c.key).length}
          />
        ))}
      </div>

      {/* Lista de fluxos */}
      <div className="grid lg:grid-cols-2 gap-3">
        {filtered.map((f) => {
          const cur = stored[f.key];
          const enabled = !!cur?.enabled;
          const cfg: Record<string, string> = cur?.config_values ?? {};
          const needsCfg = !!f.requires_config && (f.config_fields ?? []).some((cf) => cf.required && !cfg[cf.key]);
          const cat = FLOW_CATEGORIES.find((c) => c.key === f.category);
          const steps = effectiveSteps(f);
          const isOpen = expanded[f.key] ?? false;
          const stepCount = steps.length;

          return (
            <div
              key={f.key}
              className={cn(
                "admin-card admin-card-hover relative p-4 transition",
                enabled && "ring-1 ring-emerald-400/40 border-emerald-300/60",
                needsCfg && "ring-1 ring-amber-400/50 border-amber-300/60",
              )}
            >
              {/* Header do card */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl grid place-items-center bg-muted text-xl flex-shrink-0">
                  {cat?.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground text-[14px]">{f.title}</h4>
                    {enabled && <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] h-5">Ativo</Badge>}
                    {needsCfg && <Badge variant="outline" className="border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] h-5">Configurar</Badge>}
                    <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                      {stepCount} {stepCount === 1 ? "passo" : "passos"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{f.description}</p>
                </div>
                <Switch checked={enabled} onCheckedChange={(v) => toggle(f, v)} />
              </div>

              {/* Trigger keywords (entrada) */}
              {f.trigger_keywords.length > 0 && (
                <div className="mt-3 flex items-start gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">Dispara com:</span>
                  {f.trigger_keywords.slice(0, 6).map((k) => (
                    <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{k}</span>
                  ))}
                  {f.trigger_keywords.length > 6 && (
                    <span className="text-[10px] text-muted-foreground">+{f.trigger_keywords.length - 6}</span>
                  )}
                </div>
              )}

              {/* Pré-visualização do primeiro passo */}
              <div className="mt-3 rounded-lg bg-muted/50 border border-border/60 p-2.5 text-[12px] leading-relaxed text-foreground/90 whitespace-pre-line line-clamp-4">
                {steps[0]?.content}
              </div>

              {/* Encadeamento (steps) */}
              {stepCount > 1 && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [f.key]: !isOpen }))}
                    className="w-full flex items-center justify-between text-[11px] font-medium text-muted-foreground hover:text-foreground transition px-2 py-1.5 rounded-md border border-dashed border-border/70 hover:border-border bg-background/50"
                  >
                    <span className="flex items-center gap-1.5">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Ver respostas encadeadas ({stepCount - 1})
                    </span>
                    <span className="text-[10px] opacity-60">conversa completa</span>
                  </button>

                  {isOpen && (
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-primary/30 ml-2">
                      {steps.slice(1).map((s) => (
                        <div key={s.id} className="space-y-1">
                          {/* Mensagem do paciente (gatilho) */}
                          {s.on_reply_keywords && s.on_reply_keywords.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Reply className="h-3 w-3 text-muted-foreground rotate-180 scale-y-[-1]" />
                              <span className="text-[10px] text-muted-foreground">Se cliente responder:</span>
                              {s.on_reply_keywords.slice(0, 4).map((k) => (
                                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground">{k}</span>
                              ))}
                              {s.on_reply_keywords.length > 4 && (
                                <span className="text-[9px] text-muted-foreground">+{s.on_reply_keywords.length - 4}</span>
                              )}
                            </div>
                          )}
                          {/* Resposta do bot */}
                          <div className="flex gap-1.5 items-start">
                            <ArrowDown className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1 rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2 text-[11px] leading-relaxed text-foreground/85 whitespace-pre-line">
                              <span className="text-[9px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 font-semibold mb-1 block">{s.title}</span>
                              {s.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing(f)}>
                  <Settings2 className="h-3.5 w-3.5 mr-1" /> Configurar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => copyToClipboard(steps[0]?.content ?? "")}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => sendTest(f)}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Testar
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full admin-card p-10 text-center text-sm text-muted-foreground">
            Nenhum fluxo encontrado para essa busca.
          </div>
        )}
      </div>

      {/* Modal de configuração */}
      <ConfigModal
        flow={editing}
        stored={editing ? stored[editing.key] : null}
        effectiveSteps={editing ? effectiveSteps(editing) : []}
        onClose={() => setEditing(null)}
        onSave={async (patch) => { if (editing) await saveFlow(editing, patch); }}
      />
    </div>
  );
}

function KpiTile({ label, value, hint, tone = "default" }: { label: string; value: number; hint: string; tone?: "default" | "emerald" | "amber" }) {
  return (
    <div className={cn(
      "admin-card p-4",
      tone === "amber" && "border-amber-400/60 bg-amber-500/5",
    )}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn(
        "text-2xl font-bold mt-1 tabular-nums",
        tone === "emerald" && "text-emerald-600 dark:text-emerald-400",
        tone === "amber" && "text-amber-700 dark:text-amber-300",
        tone === "default" && "text-foreground",
      )}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}

function CatChip({ label, emoji, active, onClick, count }: { label: string; emoji: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground/70 border-border hover:border-foreground/40",
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span className={cn("text-[10px] tabular-nums px-1.5 rounded-full", active ? "bg-background/20" : "bg-muted text-muted-foreground")}>{count}</span>
    </button>
  );
}

function ConfigModal({ flow, stored, effectiveSteps, onClose, onSave }: {
  flow: WhatsAppFlow | null;
  stored: any;
  effectiveSteps: FlowStep[];
  onClose: () => void;
  onSave: (patch: { steps?: FlowStep[]; config?: Record<string, string>; trigger_keywords?: string[] }) => Promise<void>;
}) {
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [keywords, setKeywords] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string>("");

  useEffect(() => {
    if (!flow) return;
    setSteps(effectiveSteps);
    setConfig(stored?.config_values ?? {});
    setKeywords((stored?.trigger_keywords ?? flow.trigger_keywords).join(", "));
    setActiveStepId(effectiveSteps[0]?.id ?? "");
  }, [flow, stored, effectiveSteps]);

  if (!flow) return null;

  const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0];

  function updateStep(id: string, patch: Partial<FlowStep>) {
    setSteps((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  const preview = (() => {
    if (!activeStep) return "";
    let txt = activeStep.content.replace(/\{\{nome\}\}/g, "Cliente Teste");
    for (const v of flow.variables) {
      txt = txt.replace(new RegExp(`\\{\\{${v}\\}\\}`, "g"), config[v] || `[${v}]`);
    }
    return txt;
  })();

  async function handleSave() {
    setSaving(true);
    // Filtrar config_values: NÃO incluir steps no objeto config raso
    const cleanConfig: Record<string, string> = {};
    Object.keys(config).forEach((k) => { if (k !== "steps") cleanConfig[k] = config[k]; });
    await onSave({
      steps,
      config: cleanConfig,
      trigger_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    });
    setSaving(false);
    toast({ title: "Fluxo salvo" });
    onClose();
  }

  return (
    <EntityModal
      open={!!flow}
      onOpenChange={(v) => !v && onClose()}
      title={`Configurar — ${flow.title}`}
      description={flow.description}
      size="xl"
    >
      <div className="grid lg:grid-cols-[260px_1fr_280px] gap-4">
        {/* Lista de passos */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Passos do fluxo</Label>
          <div className="space-y-1">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveStepId(s.id)}
                className={cn(
                  "w-full text-left rounded-md border px-2.5 py-2 text-[12px] transition",
                  activeStepId === s.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-foreground/30 text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold",
                    activeStepId === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}>{i + 1}</span>
                  <span className="font-medium truncate flex-1">{s.title}</span>
                </div>
                {s.on_reply_keywords && s.on_reply_keywords.length > 0 && (
                  <p className="text-[10px] mt-1 opacity-70 truncate">↩ {s.on_reply_keywords.join(", ")}</p>
                )}
              </button>
            ))}
          </div>

          {/* Variáveis a preencher */}
          {(flow.config_fields ?? []).length > 0 && (
            <div className="mt-4">
              <Label className="text-xs font-semibold">Variáveis</Label>
              <div className="space-y-2 mt-2">
                {flow.config_fields!.map((cf) => (
                  <div key={cf.key}>
                    <Label className="text-[10px] text-muted-foreground">
                      {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                    </Label>
                    {cf.type === "longtext" ? (
                      <Textarea
                        value={config[cf.key] ?? ""}
                        onChange={(e) => setConfig({ ...config, [cf.key]: e.target.value })}
                        placeholder={cf.placeholder}
                        rows={2}
                        className="mt-1 text-[12px]"
                      />
                    ) : (
                      <Input
                        type={cf.type === "url" ? "url" : "text"}
                        value={config[cf.key] ?? ""}
                        onChange={(e) => setConfig({ ...config, [cf.key]: e.target.value })}
                        placeholder={cf.placeholder}
                        className="mt-1 text-[12px]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor do passo ativo */}
        <div className="space-y-3">
          {activeStep && (
            <>
              <div>
                <Label className="text-xs font-semibold">Mensagem que o bot envia neste passo</Label>
                <Textarea
                  rows={9}
                  value={activeStep.content}
                  onChange={(e) => updateStep(activeStep.id, { content: e.target.value })}
                  className="mt-1.5 font-mono text-[12px]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Variáveis disponíveis: {flow.variables.map((v) => `{{${v}}}`).join(" ")}
                </p>
              </div>

              {activeStep.on_reply_keywords !== undefined && (
                <div>
                  <Label className="text-xs font-semibold">Quando o cliente responder com (separe por vírgula)</Label>
                  <Input
                    value={(activeStep.on_reply_keywords ?? []).join(", ")}
                    onChange={(e) => updateStep(activeStep.id, {
                      on_reply_keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                    })}
                    placeholder="sim, claro, manda"
                    className="mt-1.5 text-[12px]"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Estes gatilhos avançam o fluxo para este passo automaticamente.
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold">Palavras-chave de entrada do fluxo (vírgula)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="agendar, marcar"
                  className="mt-1.5 text-[12px]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Disparam o primeiro passo do fluxo quando aparecerem na mensagem inicial do paciente.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Preview WhatsApp */}
        <div>
          <Label className="text-xs font-semibold">Pré-visualização</Label>
          <div className="mt-1.5 rounded-2xl border-2 border-emerald-500/30 bg-[#e5ddd5] dark:bg-[#0b141a] p-4 min-h-[280px] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[radial-gradient(circle_at_50%_50%,#000_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_50%_50%,#fff_1px,transparent_1px)] bg-[size:18px_18px]" />
            <div className="relative max-w-[85%] ml-auto rounded-lg bg-[#dcf8c6] dark:bg-[#005c4b] px-3 py-2 shadow text-[13px] text-slate-800 dark:text-white whitespace-pre-line leading-relaxed">
              {preview}
              <span className="block text-right text-[10px] text-slate-500 dark:text-white/60 mt-1">12:34 ✓✓</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 mr-1.5" /> Salvar fluxo
        </Button>
      </div>
    </EntityModal>
  );
}
