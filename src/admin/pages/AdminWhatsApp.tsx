import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Settings, Activity, Send, Save, RefreshCw, ListChecks,
  MessageSquare, Megaphone, Server, CheckCircle2, XCircle, Plus, Trash2,
  Download, Power, QrCode as QrIcon, Wifi, WifiOff, AlertCircle, Copy as CopyIcon, Sparkles,
  Bot, Brain, MessageCircle, ChevronRight, UserCheck, Zap,
} from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityModal from "@/admin/components/EntityModal";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ProviderType = "chatpro" | "baileys_vps";
type Provider = {
  id: string;
  type: ProviderType;
  label: string;
  config: any;
  status: string;
  is_active: boolean;
  last_seen_at: string | null;
};

const EVENTS = [
  { key: "appointment_confirmed", label: "Agendamento confirmado", desc: "Disparado ao confirmar agendamento.", color: "emerald" },
  { key: "appointment_cancelled", label: "Agendamento cancelado", desc: "Disparado ao cancelar agendamento.", color: "rose" },
  { key: "appointment_reminder_24h", label: "Lembrete 24h", desc: "Enviado 24h antes da consulta.", color: "amber" },
  { key: "post_appointment", label: "Pós-consulta", desc: "Coleta feedback após a consulta.", color: "blue" },
];

function defaultTpl(key: string) {
  switch (key) {
    case "appointment_confirmed": return "Olá {{nome}}! 🎉\n\nSeu agendamento foi *confirmado*:\n📅 {{data}} às {{hora}}\n💼 {{tratamento}}\n\nQualquer dúvida, é só responder por aqui.";
    case "appointment_cancelled": return "Olá {{nome}}, informamos que sua consulta de {{data}} ({{hora}}) foi cancelada. Para reagendar, responda esta mensagem ou acesse nossa agenda online.";
    case "appointment_reminder_24h": return "Olá {{nome}}! 👋\n\nLembrete: sua consulta é *amanhã*, {{data}} às {{hora}} ({{tratamento}}).\n\nNos vemos lá!";
    case "post_appointment": return "Olá {{nome}}! Esperamos que sua consulta tenha corrido bem 💙\n\nSe puder, deixe sua avaliação — leva 30 segundos!";
    default: return "";
  }
}

export default function AdminWhatsApp() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vpsModalOpen, setVpsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data } = await supabase.from("whatsapp_providers").select("*").order("created_at");
    setProviders((data ?? []) as Provider[]);
  }

  useEffect(() => { load(); }, []);

  const activeProvider = providers.find((p) => p.is_active) ?? null;
  const vpsProvider = providers.find((p) => p.type === "baileys_vps") ?? null;

  // Refresh status do provider ativo
  async function refreshActiveStatus() {
    if (!activeProvider) return;
    setRefreshing(true);
    try {
      if (activeProvider.type === "baileys_vps") {
        await supabase.functions.invoke("whatsapp-vps-proxy", {
          body: { action: "status", provider_id: activeProvider.id },
        });
      }
      await load();
    } finally { setRefreshing(false); }
  }

  async function setActive(type: ProviderType) {
    // Garante que existe row
    const existing = providers.find((p) => p.type === type);
    if (!existing) {
      await supabase.from("whatsapp_providers").insert({
        type, label: type === "chatpro" ? "ChatPro" : "VPS Própria (Baileys)",
        is_active: true, config: {},
      });
    } else {
      // Desativa todos e ativa esse
      await supabase.from("whatsapp_providers").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("whatsapp_providers").update({ is_active: true }).eq("id", existing.id);
    }
    toast({ title: `${type === "chatpro" ? "ChatPro" : "VPS"} ativado` });
    load();
  }

  const statusBadge = (() => {
    if (!activeProvider) return { label: "Nenhum provedor", color: "slate", icon: WifiOff };
    if (activeProvider.status === "connected") return { label: "Conectado", color: "emerald", icon: Wifi };
    if (activeProvider.status === "waiting_qr" || activeProvider.status === "qr") return { label: "Aguardando QR", color: "amber", icon: QrIcon };
    if (activeProvider.status === "connecting") return { label: "Conectando…", color: "blue", icon: Loader2 };
    return { label: "Desconectado", color: "slate", icon: WifiOff };
  })();

  const StatusIcon = statusBadge.icon;

  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Eventos automáticos, campanhas e provedores em um só lugar."
        actions={
          <>
            <Badge
              variant="outline"
              className={cn(
                "h-8 gap-1.5 px-2.5 text-xs font-semibold",
                statusBadge.color === "emerald" && "border-emerald-300 bg-emerald-50 text-emerald-700",
                statusBadge.color === "amber" && "border-amber-300 bg-amber-50 text-amber-700",
                statusBadge.color === "blue" && "border-blue-300 bg-blue-50 text-blue-700",
                statusBadge.color === "slate" && "border-slate-300 bg-slate-50 text-slate-600",
              )}
            >
              <StatusIcon className={cn("h-3.5 w-3.5", statusBadge.color === "blue" && "animate-spin")} />
              {statusBadge.label}
            </Badge>
            <Button variant="outline" size="sm" onClick={refreshActiveStatus} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} /> Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVpsModalOpen(true)}>
              <Settings className="h-4 w-4 mr-2" /> Configurar VPS
            </Button>
          </>
        }
      />

      {/* Provider switcher (cards lado a lado) */}
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <ProviderTile
          type="chatpro"
          title="ChatPro"
          subtitle="Plataforma SaaS — pague por mensagem."
          icon={Sparkles}
          accent="blue"
          active={activeProvider?.type === "chatpro"}
          status={providers.find((p) => p.type === "chatpro")?.status}
          onActivate={() => setActive("chatpro")}
        />
        <ProviderTile
          type="baileys_vps"
          title="VPS Própria"
          subtitle="100% gratuita · Hospedada no seu servidor."
          icon={Server}
          accent="emerald"
          active={activeProvider?.type === "baileys_vps"}
          status={vpsProvider?.status}
          onActivate={() => setActive("baileys_vps")}
          configured={!!vpsProvider?.config?.url && !!vpsProvider?.config?.token}
          onConfigure={() => setVpsModalOpen(true)}
        />
      </div>

      <Tabs defaultValue="bot">
        <TabsList className="bg-white border h-10 p-1">
          <TabsTrigger value="bot" className="text-[13px] gap-1.5"><Bot className="h-3.5 w-3.5" /> Bot/Atendimento</TabsTrigger>
          <TabsTrigger value="events" className="text-[13px] gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Eventos</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-[13px] gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Campanhas</TabsTrigger>
          <TabsTrigger value="logs" className="text-[13px] gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="bot" className="mt-5">
          <BotTab />
        </TabsContent>
        <TabsContent value="events" className="mt-5">
          <EventsTab />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-5">
          <CampaignsTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-5">
          <LogsTab />
        </TabsContent>
      </Tabs>

      <VpsConfigModal open={vpsModalOpen} onOpenChange={setVpsModalOpen} provider={vpsProvider} reload={load} />
    </>
  );
}

/* ============ PROVIDER TILES ============ */

function ProviderTile({ title, subtitle, icon: Icon, accent, active, status, onActivate, configured, onConfigure }: any) {
  const accents: any = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
  };
  const isConnected = status === "connected";

  return (
    <div className={cn(
      "rounded-2xl border-2 bg-card p-4 transition relative",
      active ? "border-slate-900 shadow-[0_4px_18px_-6px_rgba(15,23,42,0.18)]" : "border-slate-200 hover:border-slate-300"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("h-11 w-11 rounded-xl grid place-items-center text-white bg-gradient-to-br flex-shrink-0", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-[15px]">{title}</h3>
            {active && <Badge className="bg-slate-900 text-white text-[10px] h-5">Ativo</Badge>}
            {isConnected && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-5"><CheckCircle2 className="h-3 w-3 mr-0.5" />Conectado</Badge>}
            {configured === false && <Badge variant="outline" className="text-[10px] h-5 border-amber-300 text-amber-700 bg-amber-50"><AlertCircle className="h-3 w-3 mr-0.5" />Sem credenciais</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {!active && (
          <Button size="sm" variant="outline" onClick={onActivate} className="flex-1">
            <Power className="h-3.5 w-3.5 mr-1.5" /> Ativar
          </Button>
        )}
        {onConfigure && (
          <Button size="sm" variant={active ? "default" : "outline"} onClick={onConfigure} className="flex-1">
            <Settings className="h-3.5 w-3.5 mr-1.5" /> Configurar
          </Button>
        )}
        {!onConfigure && active && (
          <p className="text-[11px] text-slate-500 leading-relaxed flex-1 self-center">
            Credenciais ChatPro em <code className="bg-slate-100 px-1.5 py-0.5 rounded">/admin/configuracoes</code>
          </p>
        )}
      </div>
    </div>
  );
}

/* ============ EVENTOS ============ */

function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [testNumber, setTestNumber] = useState("");

  async function load() {
    const { data } = await supabase.from("whatsapp_event_settings").select("*").order("event_key");
    setEvents(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggleEvent(key: string, current: any) {
    if (current) {
      await supabase.from("whatsapp_event_settings").update({ enabled: !current.enabled }).eq("event_key", key);
    } else {
      await supabase.from("whatsapp_event_settings").insert({ event_key: key, enabled: true, template: defaultTpl(key) });
    }
    load();
  }
  async function updateTemplate(key: string, template: string) {
    const cur = events.find((e) => e.event_key === key);
    if (cur) await supabase.from("whatsapp_event_settings").update({ template }).eq("event_key", key);
    else await supabase.from("whatsapp_event_settings").insert({ event_key: key, enabled: false, template });
    load();
  }

  async function sendTest(eventKey: string) {
    const phone = testNumber.replace(/\D/g, "");
    if (!phone) { toast({ title: "Informe um número para teste", variant: "destructive" }); return; }
    const { data, error } = await supabase.functions.invoke("whatsapp-gateway", {
      body: {
        event_key: eventKey, to: phone,
        vars: { nome: "Teste", data: "amanhã", hora: "15:00", tratamento: "Avaliação", profissional: "Dr. LyneCloud" },
      },
    });
    if (error || !data?.ok) toast({ title: "Falhou", description: error?.message ?? data?.result?.error ?? "Sem resposta", variant: "destructive" });
    else toast({ title: "Mensagem enviada!", description: `Via ${data.provider}` });
  }

  return (
    <div className="space-y-4">
      {/* Campo de número para teste */}
      <div className="admin-card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <Label className="text-xs">Número para testes (com DDD)</Label>
          <Input value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="11999999999" className="mt-1.5" />
        </div>
        <p className="text-[11px] text-slate-500 sm:max-w-xs">
          Use o botão "Testar" em cada evento para disparar uma mensagem real com variáveis fictícias.
        </p>
      </div>

      {/* Grid de eventos */}
      <div className="grid lg:grid-cols-2 gap-4">
        {EVENTS.map((e) => {
          const current = events.find((x) => x.event_key === e.key);
          const enabled = !!current?.enabled;
          const template = current?.template ?? defaultTpl(e.key);
          return (
            <div
              key={e.key}
              className={cn(
                "rounded-2xl border-2 bg-card p-5 transition relative overflow-hidden",
                enabled ? "border-slate-300" : "border-slate-200 bg-slate-50/30"
              )}
            >
              {enabled && (
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1",
                  e.color === "emerald" && "bg-emerald-500",
                  e.color === "rose" && "bg-rose-500",
                  e.color === "amber" && "bg-amber-500",
                  e.color === "blue" && "bg-blue-500",
                )} />
              )}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-[14px]">{e.label}</h4>
                    {enabled && <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] h-5">Ativo</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{e.desc}</p>
                </div>
                <Switch checked={enabled} onCheckedChange={() => toggleEvent(e.key, current)} />
              </div>

              {enabled && (
                <>
                  <Textarea
                    rows={5}
                    defaultValue={template}
                    onBlur={(ev) => updateTemplate(e.key, ev.target.value)}
                    className="text-[13px] font-mono leading-relaxed bg-slate-50 border-slate-200"
                    placeholder="Use {{nome}}, {{data}}, {{hora}}, {{tratamento}}, {{profissional}}"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-slate-400">
                      Vars: {"{{nome}} {{data}} {{hora}} {{tratamento}} {{profissional}}"}
                    </p>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => sendTest(e.key)}>
                      <Send className="h-3 w-3 mr-1.5" /> Testar
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ CAMPANHAS ============ */

function CampaignsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", type: "billing", template: "", schedule_cron: "" });

  async function load() {
    const { data } = await supabase.from("whatsapp_campaigns").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.name || !draft.template) return toast({ title: "Preencha nome e template", variant: "destructive" });
    await supabase.from("whatsapp_campaigns").insert({ ...draft, audience_filter: {}, active: false });
    setCreating(false); setDraft({ name: "", type: "billing", template: "", schedule_cron: "" });
    load();
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("whatsapp_campaigns").update({ active: !active }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir esta campanha?")) return;
    await supabase.from("whatsapp_campaigns").delete().eq("id", id);
    load();
  }

  const typeMeta: Record<string, { label: string; color: string }> = {
    billing: { label: "Cobrança", color: "bg-amber-500" },
    birthday: { label: "Aniversário", color: "bg-pink-500" },
    reactivation: { label: "Reativação", color: "bg-violet-500" },
    custom: { label: "Personalizada", color: "bg-slate-500" },
  };

  return (
    <div className="space-y-4">
      <div className="admin-card p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Campanhas em massa</h3>
          <p className="text-xs text-slate-500">Cobranças, aniversários e reativação de pacientes inativos.</p>
        </div>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> {creating ? "Cancelar" : "Nova campanha"}
        </Button>
      </div>

      {creating && (
        <div className="admin-card p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Cobrança 7 dias antes" />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                <option value="billing">Cobrança de fatura</option>
                <option value="birthday">Aniversário</option>
                <option value="reactivation">Reativação inativos</option>
                <option value="custom">Personalizada</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Template da mensagem</Label>
            <Textarea rows={4} value={draft.template} onChange={(e) => setDraft({ ...draft, template: e.target.value })}
              placeholder="Olá {{nome}}, …" className="font-mono text-[13px]" />
          </div>
          <div className="flex gap-2">
            <Button onClick={create} size="sm"><Save className="h-4 w-4 mr-2" /> Criar campanha</Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nenhuma campanha criada ainda.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {items.map((c) => {
            const meta = typeMeta[c.type] ?? typeMeta.custom;
            return (
              <div key={c.id} className="admin-card p-4 flex items-center gap-4">
                <div className={cn("h-11 w-11 rounded-xl grid place-items-center text-white flex-shrink-0", meta.color)}>
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">{c.name}</p>
                    {c.active && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-5">Ativa</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{meta.label} · enviadas: {c.stats?.sent ?? 0}</p>
                </div>
                <Switch checked={c.active} onCheckedChange={() => toggle(c.id, c.active)} />
                <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ LOGS ============ */

function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "sent" | "failed">("all");

  async function load() {
    const { data } = await supabase.from("whatsapp_messages_log").select("*").order("sent_at", { ascending: false }).limit(200);
    setLogs(data ?? []);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((l) => l.status === filter);
  }, [logs, filter]);

  return (
    <div className="admin-card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Histórico de mensagens</h3>
          <p className="text-xs text-slate-500">Últimas {logs.length} mensagens enviadas pelo gateway.</p>
        </div>
        <div className="flex gap-1">
          {(["all", "sent", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition",
                filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {f === "all" ? "Todas" : f === "sent" ? "Enviadas" : "Falhas"}
            </button>
          ))}
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ListChecks className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Sem mensagens registradas.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filtered.map((l) => (
            <li key={l.id} className="px-5 py-3 flex items-start gap-3 text-sm hover:bg-slate-50/50">
              <div className={cn(
                "h-9 w-9 rounded-lg grid place-items-center flex-shrink-0",
                l.status === "sent" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {l.status === "sent" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 tabular-nums">{l.to_number}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{l.template_key || "manual"}</Badge>
                  <Badge variant="outline" className="text-[10px] h-5 capitalize">{l.provider_type}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{l.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(l.sent_at).toLocaleString("pt-BR")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============ MODAL CONFIG VPS ============ */

function VpsConfigModal({ open, onOpenChange, provider, reload }: any) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>("idle");
  const [downloading, setDownloading] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(provider?.config?.url ?? "");
      setToken(provider?.config?.token ?? "");
      setQrData(null);
      setQrStatus(provider?.status || "idle");
    }
  }, [open, provider?.id]);

  // Polling de status quando aguardando QR
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(async () => {
      if (!url || !token) return;
      const { data } = await supabase.functions.invoke("whatsapp-vps-proxy", {
        body: { action: "status", vps_config: { url, token } },
      });
      const s = data?.data?.status;
      if (s === "connected") {
        setQrStatus("connected");
        setQrData(null);
        setPolling(false);
        toast({ title: "✓ WhatsApp conectado!", description: data?.data?.phone ? `Número: ${data.data.phone}` : "" });
        if (provider) await supabase.from("whatsapp_providers").update({ status: "connected", last_seen_at: new Date().toISOString() }).eq("id", provider.id);
        reload();
      }
    }, 3000);
    return () => clearInterval(id);
  }, [polling, url, token, provider]);

  async function save() {
    if (!url) return toast({ title: "Informe a URL", variant: "destructive" });
    setBusy("save");
    try {
      if (provider) {
        await supabase.from("whatsapp_providers").update({ config: { url, token } }).eq("id", provider.id);
      } else {
        await supabase.from("whatsapp_providers").insert({
          type: "baileys_vps", label: "VPS Própria (Baileys)",
          config: { url, token }, is_active: false,
        });
      }
      toast({ title: "Credenciais salvas" });
      reload();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  async function testConnection() {
    if (!url || !token) return toast({ title: "Preencha URL e Token", variant: "destructive" });
    setBusy("test");
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-vps-proxy", {
        body: { action: "status", vps_config: { url, token } },
      });
      if (error || !data?.ok) throw new Error(data?.data?.raw || data?.error || error?.message || "Sem resposta");
      toast({ title: "✓ VPS respondendo", description: `Estado: ${data.data?.status ?? "desconhecido"}` });
      setQrStatus(data.data?.status || "disconnected");
    } catch (e: any) {
      toast({ title: "Falhou", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  async function generateQR() {
    if (!url || !token) return toast({ title: "Preencha URL e Token", variant: "destructive" });
    setBusy("qr");
    setQrData(null);
    try {
      // Salva primeiro para criar provider se não existir
      await save();
      const { data, error } = await supabase.functions.invoke("whatsapp-vps-proxy", {
        body: { action: "qr", vps_config: { url, token } },
      });
      if (error) throw error;
      const result = data?.data;
      if (result?.status === "connected") {
        setQrStatus("connected");
        toast({ title: "Já está conectado!" });
      } else if (result?.qr) {
        setQrData(result.qr);
        setQrStatus("waiting_qr");
        setPolling(true);
        toast({ title: "QR Code gerado", description: "Escaneie com o WhatsApp" });
      } else {
        toast({ title: "Aguardando…", description: result?.message || "Tente novamente em alguns segundos." });
        setPolling(true);
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  async function disconnect() {
    if (!url || !token) return;
    if (!confirm("Desconectar a sessão atual? Será necessário escanear novo QR.")) return;
    setBusy("logout");
    try {
      await supabase.functions.invoke("whatsapp-vps-proxy", {
        body: { action: "logout", vps_config: { url, token } },
      });
      toast({ title: "Desconectado" });
      setQrData(null);
      setQrStatus("disconnected");
      if (provider) await supabase.from("whatsapp_providers").update({ status: "disconnected" }).eq("id", provider.id);
      reload();
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setBusy(null); }
  }

  async function downloadScript() {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-vps-package`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "lynecloud-whatsapp-vps.zip";
      document.body.appendChild(link); link.click(); link.remove();
      toast({ title: "✓ Download iniciado", description: "Extraia o ZIP na sua VPS e rode install.sh" });
    } catch (e: any) {
      toast({ title: "Erro ao baixar", description: e.message, variant: "destructive" });
    } finally { setDownloading(false); }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado` });
  }

  const isConnected = qrStatus === "connected";

  return (
    <EntityModal
      open={open}
      onOpenChange={onOpenChange}
      title="Configurar VPS Própria (Baileys)"
      description="Hospedagem própria, gratuita, sem limites de envio."
      size="lg"
    >
      <div className="space-y-5">
        {/* Status atual */}
        <div className={cn(
          "rounded-xl border-2 p-4 flex items-center gap-3",
          isConnected ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-slate-50/40"
        )}>
          <div className={cn(
            "h-10 w-10 rounded-xl grid place-items-center flex-shrink-0",
            isConnected ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
          )}>
            {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">
              {isConnected ? "Conectado e operacional" : qrStatus === "waiting_qr" ? "Aguardando escaneamento" : "Desconectado"}
            </p>
            <p className="text-xs text-slate-500">
              {isConnected ? "Pronto para enviar mensagens automaticamente." : "Configure URL/Token e gere o QR Code para conectar."}
            </p>
          </div>
          {isConnected && (
            <Button size="sm" variant="outline" onClick={disconnect} disabled={busy === "logout"}>
              {busy === "logout" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Desconectar"}
            </Button>
          )}
        </div>

        {/* Passo 1: Download do script */}
        <section className="rounded-xl border border-slate-200 p-4 bg-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 grid place-items-center flex-shrink-0 font-bold text-sm">1</div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Baixe o instalador da VPS</h4>
              <p className="text-xs text-slate-500 mt-0.5">ZIP completo com servidor, install.sh e README.</p>
            </div>
          </div>
          <Button onClick={downloadScript} disabled={downloading} className="w-full sm:w-auto">
            {downloading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando…</> : <><Download className="h-4 w-4 mr-2" /> Baixar lynecloud-whatsapp-vps.zip</>}
          </Button>
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[12px] text-slate-700 font-mono leading-relaxed">
            <p className="font-semibold text-slate-900 mb-1.5 font-sans text-xs">Na sua VPS Ubuntu, execute:</p>
            <code className="block">scp lynecloud-whatsapp-vps.zip root@SEU_IP:/opt/</code>
            <code className="block">ssh root@SEU_IP</code>
            <code className="block">cd /opt && unzip lynecloud-whatsapp-vps.zip -d lynecloud-wa</code>
            <code className="block">cd lynecloud-wa && chmod +x install.sh && sudo bash install.sh</code>
          </div>
        </section>

        {/* Passo 2: Credenciais */}
        <section className="rounded-xl border border-slate-200 p-4 bg-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 grid place-items-center flex-shrink-0 font-bold text-sm">2</div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Cole URL e Token da VPS</h4>
              <p className="text-xs text-slate-500 mt-0.5">Os valores aparecem no terminal ao final do install.sh.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">URL da VPS</Label>
              <div className="flex gap-2 mt-1">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://wa.suaclinica.com" className="font-mono text-sm" />
                {url && <Button size="sm" variant="outline" onClick={() => copy(url, "URL")}><CopyIcon className="h-3.5 w-3.5" /></Button>}
              </div>
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Token</Label>
              <div className="flex gap-2 mt-1">
                <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••••••••••" className="font-mono text-sm" />
                {token && <Button size="sm" variant="outline" onClick={() => copy(token, "Token")}><CopyIcon className="h-3.5 w-3.5" /></Button>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={busy === "save" || !url} size="sm">
                {busy === "save" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
              </Button>
              <Button onClick={testConnection} disabled={busy === "test" || !url || !token} size="sm" variant="outline">
                {busy === "test" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />} Testar
              </Button>
            </div>
          </div>
        </section>

        {/* Passo 3: QR */}
        <section className="rounded-xl border border-slate-200 p-4 bg-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 grid place-items-center flex-shrink-0 font-bold text-sm">3</div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Conecte o WhatsApp via QR</h4>
              <p className="text-xs text-slate-500 mt-0.5">Escaneie com o número da clínica.</p>
            </div>
          </div>

          {!qrData && !isConnected && (
            <Button onClick={generateQR} disabled={busy === "qr" || !url || !token} className="w-full sm:w-auto">
              {busy === "qr" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando QR…</> : <><QrIcon className="h-4 w-4 mr-2" /> Gerar QR Code</>}
            </Button>
          )}

          {qrData && (
            <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-center">
              <div className="rounded-2xl border-2 border-slate-200 p-3 bg-white shadow-sm mx-auto">
                <img src={qrData} alt="QR Code WhatsApp" className="h-56 w-56 block" />
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">Como escanear:</p>
                <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
                  <li>Abra o WhatsApp no celular da clínica</li>
                  <li>Vá em <strong>Configurações → Dispositivos conectados</strong></li>
                  <li>Toque em <strong>Conectar dispositivo</strong></li>
                  <li>Aponte a câmera para este QR</li>
                </ol>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Aguardando conexão…
                </div>
                <Button size="sm" variant="ghost" onClick={generateQR} className="mt-2">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar QR
                </Button>
              </div>
            </div>
          )}

          {isConnected && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900 text-sm">WhatsApp conectado!</p>
                <p className="text-xs text-emerald-700 mt-0.5">Já pode usar nos eventos automáticos e campanhas.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </EntityModal>
  );
}

/* ============ BOT / ATENDIMENTO IA ============ */

const BOT_TEMPLATES = [
  {
    key: "humanizada",
    label: "Atendente humanizada (recomendado)",
    persona: "Atendente humanizada de clínica odontológica",
    prompt: `Você é a recepcionista virtual de uma clínica odontológica de alto padrão. Seu nome é Lyne.

REGRAS DE COMPORTAMENTO:
- Sempre responda em português brasileiro, de forma natural, gentil e calorosa.
- Use no máximo 2 frases curtas por mensagem (igual conversa real no WhatsApp).
- Use emojis com moderação (1 por resposta no máximo).
- Se a pessoa cumprimentar (oi, olá, bom dia, boa tarde, boa noite, tudo bem), retribua com naturalidade e pergunte como pode ajudar.
- Se perguntarem sobre PREÇOS, diga que cada caso é avaliado em consulta gratuita e ofereça agendar.
- Se perguntarem sobre HORÁRIO/ENDEREÇO, responda objetivamente.
- Se a mensagem for COMPLEXA, urgência médica, reclamação séria ou pedido específico que você não tem informação, encaminhe para a equipe humana dizendo "Vou chamar uma de nossas atendentes pra te ajudar melhor 💙".
- NUNCA invente preços, datas ou nomes de profissionais.
- NUNCA prometa horários sem confirmação.
- Sempre tente, com sutileza, levar a conversa para o agendamento de uma avaliação.`,
  },
  {
    key: "comercial",
    label: "Recepcionista comercial (foco em conversão)",
    persona: "Recepcionista comercial de clínica",
    prompt: `Você é uma recepcionista comercial de clínica odontológica. Seu objetivo é AGENDAR avaliações.

- Responda em português brasileiro, breve e direto (1-2 frases).
- Toda resposta termina com uma proposta de agendamento ou pergunta que avance pra agendar.
- Use gatilhos como "vagas limitadas essa semana", "avaliação cortesia", "sem compromisso".
- Se perguntarem preço, diga que depende do caso e que a avaliação é gratuita.
- Se a pessoa demonstrar dúvida, ofereça a avaliação como solução.
- Use 1 emoji por mensagem.
- Para pedidos fora do escopo, encaminhe para humano.`,
  },
  {
    key: "posvenda",
    label: "Pós-venda gentil",
    persona: "Atendente de pós-atendimento",
    prompt: `Você é responsável por contato pós-atendimento na clínica. Seu papel é confirmar bem-estar e coletar feedback.

- Tom carinhoso e empático, em português brasileiro.
- 1-2 frases curtas.
- Pergunte como o paciente está se sentindo, se há dúvidas sobre cuidados pós-procedimento.
- Se houver QUALQUER queixa de dor, sangramento ou desconforto incomum, encaminhe imediatamente para humano.
- Convide a pessoa a deixar uma avaliação se tudo correu bem.
- Use emojis com moderação.`,
  },
];

const DEFAULT_INTENTS = [
  { key: "saudacao", label: "Saudação", trigger_examples: ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "tudo bem", "tudo bom"], action: "reply", response_template: "Olá! 👋 Aqui é a Lyne, recepcionista da clínica. Como posso te ajudar hoje?", position: 1 },
  { key: "agendamento", label: "Quer agendar", trigger_examples: ["agendar", "marcar", "consulta", "agendamento", "horário", "horario disponivel"], action: "reply", response_template: "Que bom! 😊 Você pode agendar agora mesmo no nosso site, é rapidinho. Posso te enviar o link?", position: 2 },
  { key: "preco", label: "Preço", trigger_examples: ["preço", "preco", "valor", "quanto custa", "quanto fica"], action: "reply", response_template: "Cada tratamento é avaliado individualmente. A primeira consulta é cortesia 💙 Quer agendar pra ver o seu caso?", position: 3 },
  { key: "endereco", label: "Endereço/Localização", trigger_examples: ["endereço", "endereco", "localização", "localizacao", "onde fica", "como chego"], action: "reply", response_template: "Estamos no centro da cidade, posso te enviar a localização exata pelo Google Maps. Confirma?", position: 4 },
  { key: "horario", label: "Horário de atendimento", trigger_examples: ["horario funcionamento", "que horas abre", "que horas fecha", "atendem"], action: "reply", response_template: "Atendemos de segunda a sexta das 8h às 19h e sábados das 8h às 13h 🕐", position: 5 },
  { key: "urgencia", label: "Urgência → humano", trigger_examples: ["urgência", "urgencia", "dor forte", "sangramento", "emergência", "emergencia", "socorro"], action: "handoff", response_template: "Entendi. Vou chamar imediatamente uma atendente humana pra te ajudar 🚑", position: 6 },
  { key: "reclamacao", label: "Reclamação → humano", trigger_examples: ["reclamação", "reclamacao", "péssimo", "pessimo", "horrivel", "ruim demais"], action: "handoff", response_template: "Sinto muito por isso. Vou te transferir agora pra equipe humana resolver 💙", position: 7 },
  { key: "cancelar", label: "Cancelar consulta", trigger_examples: ["cancelar", "desmarcar", "remarcar"], action: "reply", response_template: "Sem problemas! Pode me dizer a data e horário que estava marcado pra eu encaminhar pro time da agenda?", position: 8 },
];

function BotTab() {
  const [config, setConfig] = useState<any>(null);
  const [intents, setIntents] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [savingCfg, setSavingCfg] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingIntent, setEditingIntent] = useState<any | null>(null);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  async function load() {
    const [c, i, cv] = await Promise.all([
      supabase.from("whatsapp_bot_config").select("*").limit(1).maybeSingle(),
      supabase.from("whatsapp_bot_intents").select("*").order("position"),
      supabase.from("whatsapp_conversations").select("*").order("last_message_at", { ascending: false }).limit(50),
    ]);
    if (!c.data) {
      const { data: created } = await supabase.from("whatsapp_bot_config").insert({
        enabled: false,
        persona: BOT_TEMPLATES[0].persona,
        system_prompt: BOT_TEMPLATES[0].prompt,
      }).select().single();
      setConfig(created);
    } else setConfig(c.data);
    setIntents(i.data ?? []);
    setConversations(cv.data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function loadMessages(conv: any) {
    setActiveConv(conv);
    const { data } = await supabase.from("whatsapp_messages")
      .select("*").eq("conversation_id", conv.id).order("created_at");
    setMessages(data ?? []);
    if (conv.unread_count > 0) {
      await supabase.from("whatsapp_conversations").update({ unread_count: 0 }).eq("id", conv.id);
    }
  }

  async function toggleConvAi(conv: any) {
    await supabase.from("whatsapp_conversations").update({ ai_enabled: !conv.ai_enabled, status: conv.ai_enabled ? "handed_off" : "active" }).eq("id", conv.id);
    toast({ title: conv.ai_enabled ? "Assumido por humano" : "IA reativada" });
    load();
    if (activeConv?.id === conv.id) setActiveConv({ ...conv, ai_enabled: !conv.ai_enabled });
  }

  async function saveConfig(patch: any) {
    if (!config) return;
    setSavingCfg(true);
    const { error } = await supabase.from("whatsapp_bot_config").update(patch).eq("id", config.id);
    setSavingCfg(false);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setConfig({ ...config, ...patch });
    toast({ title: "Configuração salva" });
  }

  async function applyTemplate(tpl: any) {
    await saveConfig({ persona: tpl.persona, system_prompt: tpl.prompt });
  }

  async function seedDefaultIntents() {
    setSeeding(true);
    // remove existing intents with same keys
    const keys = DEFAULT_INTENTS.map((d) => d.key);
    await supabase.from("whatsapp_bot_intents").delete().in("key", keys);
    await supabase.from("whatsapp_bot_intents").insert(DEFAULT_INTENTS.map((d) => ({ ...d, enabled: true })));
    setSeeding(false);
    toast({ title: "Templates de intents restaurados" });
    load();
  }

  async function saveIntent(intent: any) {
    if (intent.id) {
      await supabase.from("whatsapp_bot_intents").update({
        label: intent.label, trigger_examples: intent.trigger_examples, response_template: intent.response_template, action: intent.action, enabled: intent.enabled, position: intent.position,
      }).eq("id", intent.id);
    } else {
      await supabase.from("whatsapp_bot_intents").insert({
        key: intent.key, label: intent.label, trigger_examples: intent.trigger_examples, response_template: intent.response_template, action: intent.action, enabled: intent.enabled, position: intent.position ?? intents.length + 1,
      });
    }
    setEditingIntent(null);
    load();
    toast({ title: "Intent salva" });
  }

  async function deleteIntent(id: string) {
    if (!confirm("Excluir esta intent?")) return;
    await supabase.from("whatsapp_bot_intents").delete().eq("id", id);
    load();
  }

  if (!config) return <div className="py-10 text-center text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {/* Card status do bot */}
      <div className={cn(
        "admin-card p-5 flex items-start gap-4",
        config.enabled ? "border-emerald-300 bg-emerald-50/30" : ""
      )}>
        <div className={cn(
          "h-12 w-12 rounded-xl grid place-items-center flex-shrink-0",
          config.enabled ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white" : "bg-slate-100 text-slate-500"
        )}>
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900">Bot conversacional com IA</h3>
            <Badge className={cn("text-[10px] h-5", config.enabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
              {config.enabled ? "Ativo" : "Desligado"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quando ligado, mensagens recebidas no WhatsApp são respondidas automaticamente com IA + intents.
            Modelo: <code className="bg-slate-100 px-1.5 rounded">{config.model}</code>
          </p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(v) => saveConfig({ enabled: v })} disabled={savingCfg} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Persona / system prompt */}
        <div className="admin-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-violet-600" />
            <h4 className="font-semibold text-slate-900 text-sm">Personalidade do bot</h4>
          </div>
          <Label className="text-xs">Templates prontos</Label>
          <div className="grid sm:grid-cols-3 gap-2 mt-1.5 mb-4">
            {BOT_TEMPLATES.map((tpl) => (
              <button key={tpl.key} onClick={() => applyTemplate(tpl)} className="rounded-lg border bg-white p-2.5 text-left hover:border-violet-400 transition">
                <p className="text-[11px] font-semibold text-slate-900">{tpl.label.split(" (")[0]}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{tpl.prompt.split("\n")[0]}</p>
              </button>
            ))}
          </div>
          <Label className="text-xs">Persona (curta)</Label>
          <Input value={config.persona ?? ""} onChange={(e) => setConfig({ ...config, persona: e.target.value })} onBlur={(e) => saveConfig({ persona: e.target.value })} className="mt-1.5 mb-3" />
          <Label className="text-xs">System prompt completo</Label>
          <Textarea rows={10} value={config.system_prompt ?? ""} onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })} onBlur={(e) => saveConfig({ system_prompt: e.target.value })} className="mt-1.5 font-mono text-[12px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <Label className="text-xs">Provedor de IA</Label>
              <select
                className="mt-1.5 w-full h-9 rounded-md border bg-white px-3 text-sm"
                value={(config as any).ai_provider ?? "openai"}
                onChange={(e) => {
                  const prov = e.target.value;
                  const defaults: Record<string, string> = {
                    openai: "gpt-4o-mini",
                    gemini: "gemini-2.0-flash",
                    lovable: "google/gemini-2.5-flash",
                  };
                  saveConfig({ ai_provider: prov, ai_model: defaults[prov] });
                }}
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="gemini">Google Gemini</option>
                <option value="lovable">Lovable AI Gateway</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Modelo</Label>
              <select
                className="mt-1.5 w-full h-9 rounded-md border bg-white px-3 text-sm"
                value={(config as any).ai_model ?? "gpt-4o-mini"}
                onChange={(e) => saveConfig({ ai_model: e.target.value })}
              >
                {((config as any).ai_provider ?? "openai") === "openai" && (
                  <>
                    <option value="gpt-4o-mini">GPT-4o Mini (rápido e barato)</option>
                    <option value="gpt-4o">GPT-4o (premium)</option>
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                  </>
                )}
                {(config as any).ai_provider === "gemini" && (
                  <>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (rápido)</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (mais barato)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (premium)</option>
                  </>
                )}
                {(config as any).ai_provider === "lovable" && (
                  <>
                    <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                    <option value="openai/gpt-5-mini">GPT-5 Mini</option>
                    <option value="openai/gpt-5">GPT-5</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <Label className="text-xs">Mensagem fallback</Label>
              <Input value={config.fallback_message ?? ""} onChange={(e) => setConfig({ ...config, fallback_message: e.target.value })} onBlur={(e) => saveConfig({ fallback_message: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={(config as any).ai_fallback_enabled !== false} onCheckedChange={(v) => saveConfig({ ai_fallback_enabled: v })} />
              Fallback automático (tenta outro provedor se falhar)
            </label>
            <label className="flex items-center gap-2 text-xs"><Switch checked={config.human_like_delay} onCheckedChange={(v) => saveConfig({ human_like_delay: v })} /> Delay humano (digitando…)</label>
            <label className="flex items-center gap-2 text-xs"><Switch checked={config.business_hours_only} onCheckedChange={(v) => saveConfig({ business_hours_only: v })} /> Só em horário comercial</label>
          </div>
        </div>

        {/* Intents */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h4 className="font-semibold text-slate-900 text-sm">Intents (respostas rápidas)</h4>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={seedDefaultIntents} disabled={seeding}>
                {seeding ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />} Restaurar templates
              </Button>
              <Button size="sm" onClick={() => setEditingIntent({ key: "", label: "", trigger_examples: [], response_template: "", action: "reply", enabled: true })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Intents são respostas automáticas instantâneas. Se nenhuma intent casar com a mensagem, o bot usa IA.
          </p>
          {intents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Nenhuma intent cadastrada. Clique em "Restaurar templates" para criar 8 intents prontas.
            </div>
          ) : (
            <ul className="divide-y max-h-[420px] overflow-y-auto">
              {intents.map((it) => (
                <li key={it.id} className="py-2 flex items-start gap-2">
                  <Switch checked={it.enabled} onCheckedChange={async (v) => { await supabase.from("whatsapp_bot_intents").update({ enabled: v }).eq("id", it.id); load(); }} className="mt-1" />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingIntent(it)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">{it.label}</p>
                      <Badge variant="outline" className="text-[9px] h-4">{it.action}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{(it.trigger_examples || []).slice(0, 4).join(" · ")}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteIntent(it.id)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Conversas */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-blue-600" />
          <h4 className="font-semibold text-slate-900 text-sm">Conversas ao vivo</h4>
          <Badge variant="outline" className="ml-auto text-[10px]">{conversations.length}</Badge>
        </div>
        {conversations.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Nenhuma conversa ainda. Aparecerão aqui assim que pacientes mandarem mensagens.
          </div>
        ) : (
          <div className="grid md:grid-cols-[280px,1fr] divide-x">
            <ul className="divide-y max-h-[420px] overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button onClick={() => loadMessages(c)} className={cn("w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-start gap-2", activeConv?.id === c.id && "bg-blue-50/60")}>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white grid place-items-center text-xs font-semibold flex-shrink-0">{(c.contact_name || c.phone).slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{c.contact_name || c.phone}</p>
                        {c.unread_count > 0 && <Badge className="bg-rose-500 text-white text-[9px] h-4 px-1.5">{c.unread_count}</Badge>}
                      </div>
                      <p className="text-[10px] text-slate-500">{new Date(c.last_message_at).toLocaleString("pt-BR")}</p>
                      <Badge variant="outline" className="text-[9px] h-4 mt-0.5">{c.ai_enabled ? "🤖 IA" : "👤 Humano"}</Badge>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-400 mt-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col h-[420px]">
              {activeConv ? (
                <>
                  <div className="px-4 py-2 border-b flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{activeConv.contact_name || activeConv.phone}</p>
                      <p className="text-[10px] text-slate-500">{activeConv.phone}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toggleConvAi(activeConv)}>
                      <UserCheck className="h-3.5 w-3.5 mr-1" /> {activeConv.ai_enabled ? "Assumir" : "Devolver à IA"}
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/40">
                    {messages.map((m) => (
                      <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap", m.direction === "in" ? "bg-white border" : "ml-auto bg-emerald-500 text-white")}>
                        {m.body}
                        <p className={cn("text-[9px] mt-0.5", m.direction === "in" ? "text-slate-400" : "text-white/70")}>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {m.ai_used && " · IA"}
                          {m.intent_matched && ` · ${m.intent_matched}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 grid place-items-center text-xs text-slate-400">Selecione uma conversa</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de intent */}
      {editingIntent && (
        <EntityModal open={!!editingIntent} onOpenChange={(v) => !v && setEditingIntent(null)} title={editingIntent.id ? "Editar intent" : "Nova intent"}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Chave (slug)</Label><Input value={editingIntent.key} onChange={(e) => setEditingIntent({ ...editingIntent, key: e.target.value.replace(/\s/g, "_") })} disabled={!!editingIntent.id} /></div>
              <div><Label className="text-xs">Rótulo</Label><Input value={editingIntent.label} onChange={(e) => setEditingIntent({ ...editingIntent, label: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Triggers (palavras separadas por vírgula)</Label>
              <Textarea rows={2} value={(editingIntent.trigger_examples || []).join(", ")} onChange={(e) => setEditingIntent({ ...editingIntent, trigger_examples: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="oi, olá, bom dia" />
            </div>
            <div>
              <Label className="text-xs">Ação</Label>
              <select className="w-full h-9 rounded-md border bg-white px-3 text-sm" value={editingIntent.action} onChange={(e) => setEditingIntent({ ...editingIntent, action: e.target.value })}>
                <option value="reply">Responder com texto fixo</option>
                <option value="handoff">Transferir para humano</option>
                <option value="ai">Deixar IA responder</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Resposta (use {"{{nome}}"} para personalizar)</Label>
              <Textarea rows={4} value={editingIntent.response_template} onChange={(e) => setEditingIntent({ ...editingIntent, response_template: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingIntent(null)}>Cancelar</Button>
              <Button onClick={() => saveIntent(editingIntent)}>Salvar</Button>
            </div>
          </div>
        </EntityModal>
      )}
    </div>
  );
}
