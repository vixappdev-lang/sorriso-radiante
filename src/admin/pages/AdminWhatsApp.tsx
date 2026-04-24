import { useEffect, useState } from "react";
import {
  Loader2, Settings, QrCode, Activity, Send, Save, RefreshCw, ListChecks, KeyRound,
  Plug, MessageSquare, Megaphone, Server, CheckCircle2, XCircle, Plus, Sparkles, Trash2,
} from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "disconnected" | "waiting_qr" | "connected";
const PWD_KEY = "levii_chatpro_pwd";

export default function AdminWhatsApp() {
  const [pwd, setPwd] = useState<string | null>(() => sessionStorage.getItem(PWD_KEY));
  const [pwdInput, setPwdInput] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  if (!pwd) {
    return (
      <>
        <PageHeader title="WhatsApp" description="Integração com ChatPro e/ou VPS própria para automações." />
        <div className="max-w-md rounded-2xl border bg-card p-6">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg">Senha de integração</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para acessar credenciais e templates, informe a senha de integração.
          </p>
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setPwdLoading(true);
              const { data, error } = await supabase.functions.invoke("chatpro-admin", {
                body: { action: "get_config", password: pwdInput },
              });
              setPwdLoading(false);
              if (error || (data && data.error)) {
                toast({ title: "Senha incorreta", description: "Tente novamente.", variant: "destructive" });
                return;
              }
              sessionStorage.setItem(PWD_KEY, pwdInput);
              setPwd(pwdInput);
            }}
          >
            <Label className="text-xs">Senha</Label>
            <Input type="password" value={pwdInput} onChange={(e) => setPwdInput(e.target.value)} autoFocus />
            <Button disabled={pwdLoading}>
              {pwdLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validando…</> : "Continuar"}
            </Button>
            <p className="text-[11px] text-muted-foreground">Padrão: <code className="bg-muted px-1.5 py-0.5 rounded">levii2025</code></p>
          </form>
        </div>
      </>
    );
  }

  return <Panel password={pwd} />;
}

function Panel({ password }: { password: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [providers, setProviders] = useState<any[]>([]);
  const [activeProvider, setActiveProvider] = useState<"chatpro" | "vps" | null>(null);

  const call = async (action: string, payload?: any) => {
    const { data, error } = await supabase.functions.invoke("chatpro-admin", { body: { action, password, payload } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const checkStatus = async () => {
    try {
      const data = await call("get_status");
      const raw = data?.data;
      const connected = raw?.status === "connected" || raw?.connected === true || String(raw?.state ?? "").toLowerCase().includes("connect");
      setStatus(connected ? "connected" : "disconnected");
    } catch { setStatus("disconnected"); }
  };

  const loadProviders = async () => {
    const { data } = await supabase.from("whatsapp_providers").select("*").order("created_at");
    setProviders(data ?? []);
    const active = (data ?? []).find((p: any) => p.is_active);
    if (active) setActiveProvider(active.type as "chatpro" | "vps");
  };

  useEffect(() => { checkStatus(); loadProviders(); }, []); // eslint-disable-line

  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Provedores, configuração e campanhas — tudo em um só lugar."
        actions={
          <Badge variant="outline" className={
            status === "connected" ? "border-emerald-500 text-emerald-700 bg-emerald-50" :
            "border-red-400 text-red-700 bg-red-50"
          }>
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {status === "connected" ? "ChatPro Conectado" : "ChatPro Desconectado"}
          </Badge>
        }
      />

      <Tabs defaultValue="connection">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid">
          <TabsTrigger value="connection"><Plug className="h-4 w-4 mr-2" />Conexão</TabsTrigger>
          <TabsTrigger value="config"><MessageSquare className="h-4 w-4 mr-2" />Configuração</TabsTrigger>
          <TabsTrigger value="campaigns"><Megaphone className="h-4 w-4 mr-2" />Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="mt-5">
          <ConnectionTab
            call={call}
            status={status}
            checkStatus={checkStatus}
            providers={providers}
            activeProvider={activeProvider}
            reload={loadProviders}
          />
        </TabsContent>

        <TabsContent value="config" className="mt-5">
          <ConfigTab call={call} />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-5">
          <CampaignsTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ============ CONEXÃO ============ */

function ConnectionTab({ call, status, checkStatus, providers, activeProvider, reload }: any) {
  const chatpro = providers.find((p: any) => p.type === "chatpro");
  const vps = providers.find((p: any) => p.type === "vps");

  async function setActive(type: "chatpro" | "vps") {
    await supabase.from("whatsapp_providers").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    const existing = providers.find((p: any) => p.type === type);
    if (existing) {
      await supabase.from("whatsapp_providers").update({ is_active: true }).eq("id", existing.id);
    } else {
      await supabase.from("whatsapp_providers").insert({ type, label: type === "chatpro" ? "ChatPro" : "VPS Própria", is_active: true });
    }
    toast({ title: "Provedor ativo atualizado" });
    reload();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* ChatPro card */}
      <ProviderCard
        title="ChatPro (oficial)"
        subtitle="Plataforma SaaS estável, ideal para começar."
        icon={Sparkles}
        accent="blue"
        active={activeProvider === "chatpro"}
        connected={status === "connected"}
        onActivate={() => setActive("chatpro")}
      >
        <div className="grid gap-2.5">
          <Button
            variant="outline" className="justify-start"
            onClick={async () => {
              try {
                const data = await call("get_qr");
                const raw = data?.data;
                const src = raw?.qrcode || raw?.qrCode || raw?.qr || (raw?.base64 ? `data:image/png;base64,${raw.base64}` : null) || raw?.url || null;
                if (src) {
                  const w = window.open("", "_blank", "width=400,height=480");
                  w?.document.write(`<title>QR ChatPro</title><body style="margin:0;display:grid;place-items:center;height:100vh;background:#0f172a"><img src="${src}" style="max-width:90%;border-radius:16px;background:white;padding:16px"/></body>`);
                } else toast({ title: "Sem QR", description: "Talvez já esteja conectado.", variant: "destructive" });
              } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
            }}
          >
            <QrCode className="h-4 w-4 mr-2" /> Gerar QR Code
          </Button>
          <Button variant="outline" className="justify-start" onClick={checkStatus}>
            <RefreshCw className="h-4 w-4 mr-2" /> Verificar status
          </Button>
        </div>
      </ProviderCard>

      {/* VPS card */}
      <ProviderCard
        title="VPS Própria (Baileys)"
        subtitle="100% gratuita, hospedada no seu servidor."
        icon={Server}
        accent="emerald"
        active={activeProvider === "vps"}
        connected={vps?.status === "connected"}
        onActivate={() => setActive("vps")}
      >
        <VpsConfig provider={vps} reload={reload} />
      </ProviderCard>
    </div>
  );
}

function ProviderCard({ title, subtitle, icon: Icon, accent, active, connected, onActivate, children }: any) {
  const accents: any = {
    blue: "from-blue-500 to-blue-700",
    emerald: "from-emerald-500 to-emerald-700",
  };
  return (
    <div className={cn(
      "rounded-2xl border-2 bg-card p-5 transition relative overflow-hidden",
      active ? "border-slate-900 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)]" : "border-slate-200"
    )}>
      {active && <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn("h-11 w-11 rounded-xl grid place-items-center text-white bg-gradient-to-br flex-shrink-0", accents[accent])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            <div className="flex items-center gap-2 mt-2">
              {connected ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>
              )}
              {active && <Badge className="bg-slate-900 text-white text-[10px]">Ativo</Badge>}
            </div>
          </div>
        </div>
        {!active && (
          <Button size="sm" variant="outline" onClick={onActivate}>Ativar</Button>
        )}
      </div>
      <div className="mt-5 pt-5 border-t border-slate-100">{children}</div>
    </div>
  );
}

function VpsConfig({ provider, reload }: any) {
  const [url, setUrl] = useState(provider?.config?.url ?? "");
  const [token, setToken] = useState(provider?.config?.token ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUrl(provider?.config?.url ?? "");
    setToken(provider?.config?.token ?? "");
  }, [provider?.id]);

  async function save() {
    setBusy(true);
    try {
      if (provider) {
        await supabase.from("whatsapp_providers").update({ config: { url, token } }).eq("id", provider.id);
      } else {
        await supabase.from("whatsapp_providers").insert({ type: "vps", label: "VPS Própria", config: { url, token }, is_active: false });
      }
      toast({ title: "VPS salva" });
      reload();
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  }

  async function testConnection() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-vps-proxy", { body: { action: "status" } });
      if (error) throw error;
      toast({ title: "VPS respondeu", description: JSON.stringify(data).slice(0, 100) });
    } catch (e: any) {
      toast({ title: "Sem resposta", description: "Verifique URL e token. Veja /vps-whatsapp/README.md", variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">URL da VPS</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://wa.suaclinica.com" className="h-10" />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Token</Label>
        <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••" className="h-10" />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={busy} size="sm">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar
        </Button>
        <Button onClick={testConnection} disabled={busy || !url} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />Testar
        </Button>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
        Setup completo em <code className="bg-slate-100 px-1 rounded">/vps-whatsapp/README.md</code> — Ubuntu 22.04 + Baileys + PM2 + Nginx (5 minutos).
      </p>
    </div>
  );
}

/* ============ CONFIGURAÇÃO ============ */

function ConfigTab({ call }: any) {
  const [config, setConfig] = useState({ instance_code: "", token: "", endpoint: "", message_template: "" });
  const [events, setEvents] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Teste de integração — Clínica Levii ✅");

  async function loadAll() {
    try {
      const data = await call("get_config");
      if (data?.config) setConfig({
        instance_code: data.config.instance_code ?? "",
        token: data.config.token ?? "",
        endpoint: data.config.endpoint ?? "",
        message_template: data.config.message_template ?? "",
      });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }

    const { data: evs } = await supabase.from("whatsapp_event_settings").select("*").order("event_key");
    setEvents(evs ?? []);
  }
  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  async function toggleEvent(key: string, current: any) {
    if (current) {
      await supabase.from("whatsapp_event_settings").update({ enabled: !current.enabled }).eq("event_key", key);
    } else {
      await supabase.from("whatsapp_event_settings").insert({ event_key: key, enabled: true, template: defaultTpl(key) });
    }
    loadAll();
  }
  async function updateTemplate(key: string, template: string) {
    await supabase.from("whatsapp_event_settings").update({ template }).eq("event_key", key);
  }

  const eventList = [
    { key: "appointment_confirmed", label: "Agendamento confirmado", desc: "Enviado quando um agendamento é confirmado pelo admin." },
    { key: "appointment_cancelled", label: "Agendamento cancelado", desc: "Enviado quando um agendamento é cancelado." },
    { key: "appointment_reminder_24h", label: "Lembrete 24h", desc: "Enviado 24 horas antes da consulta." },
    { key: "post_appointment", label: "Pós-consulta", desc: "Enviado após a consulta para coletar feedback." },
  ];

  return (
    <div className="grid gap-5">
      {/* ChatPro credentials */}
      <section className="rounded-2xl border bg-card p-5 grid gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">Credenciais ChatPro</h3>
          <p className="text-xs text-slate-500 mt-0.5">Endpoint, instância e token. Não interfere na conexão até salvar.</p>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Endpoint base</Label>
          <Input value={config.endpoint} onChange={(e) => setConfig({ ...config, endpoint: e.target.value })} placeholder="https://v5.chatpro.com.br/chatpro-xxxx" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Código da instância</Label>
            <Input value={config.instance_code} onChange={(e) => setConfig({ ...config, instance_code: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Token</Label>
            <Input type="password" value={config.token} onChange={(e) => setConfig({ ...config, token: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Template padrão (variáveis: {"{{nome}} {{tratamento}} {{data}} {{hora}}"})</Label>
          <Textarea rows={6} value={config.message_template} onChange={(e) => setConfig({ ...config, message_template: e.target.value })} />
        </div>
        <div>
          <Button
            onClick={async () => {
              setBusy("save");
              try { await call("save_config", config); toast({ title: "Configuração salva" }); }
              catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
              finally { setBusy(null); }
            }}
            disabled={busy === "save"}
          >
            {busy === "save" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar credenciais
          </Button>
        </div>
      </section>

      {/* Eventos automáticos */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900">Eventos automáticos</h3>
          <p className="text-xs text-slate-500 mt-0.5">Defina templates e ative cada gatilho. Disparos usam o provedor ativo.</p>
        </div>
        <div className="space-y-3">
          {eventList.map((e) => {
            const current = events.find((x) => x.event_key === e.key);
            return (
              <div key={e.key} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{e.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.desc}</p>
                  </div>
                  <Switch checked={!!current?.enabled} onCheckedChange={() => toggleEvent(e.key, current)} />
                </div>
                {current?.enabled && (
                  <Textarea
                    rows={3}
                    defaultValue={current.template || defaultTpl(e.key)}
                    onBlur={(ev) => updateTemplate(e.key, ev.target.value)}
                    className="mt-3 text-sm"
                    placeholder="Use {{nome}}, {{data}}, {{hora}}, {{tratamento}}…"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Teste rápido */}
      <section className="rounded-2xl border bg-card p-5 grid gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Teste rápido</h3>
          <p className="text-xs text-slate-500 mt-0.5">Envia via ChatPro (credencial salva).</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="(27) 99999-0000" value={testNumber} onChange={(e) => setTestNumber(e.target.value)} />
          <Button
            onClick={async () => {
              setBusy("send");
              try {
                const data = await call("send_test", { number: testNumber, message: testMessage });
                if (data?.ok) toast({ title: "Enviado!" });
                else toast({ title: "Falhou", variant: "destructive" });
              } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
              finally { setBusy(null); }
            }}
            disabled={busy === "send" || !testNumber}
          >
            {busy === "send" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Enviar
          </Button>
        </div>
        <Textarea rows={3} value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
      </section>
    </div>
  );
}

function defaultTpl(key: string) {
  switch (key) {
    case "appointment_confirmed": return "Olá {{nome}}! 🎉\n\nSeu agendamento foi *confirmado*:\n📅 {{data}} às {{hora}}\n💼 {{tratamento}}\n\nQualquer dúvida, é só responder por aqui.";
    case "appointment_cancelled": return "Olá {{nome}}, informamos que sua consulta de {{data}} ({{hora}}) foi cancelada. Para reagendar, responda esta mensagem ou acesse nossa agenda online.";
    case "appointment_reminder_24h": return "Olá {{nome}}! 👋\n\nLembrete: sua consulta é *amanhã*, {{data}} às {{hora}} ({{tratamento}}).\n\nNos vemos lá!";
    case "post_appointment": return "Olá {{nome}}! Esperamos que sua consulta tenha corrido bem 💙\n\nSe puder, deixe sua avaliação — leva 30 segundos!";
    default: return "";
  }
}

/* ============ CAMPANHAS ============ */

function CampaignsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", type: "billing", template: "", schedule_cron: "" });

  async function load() {
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from("whatsapp_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("whatsapp_messages_log").select("*").order("sent_at", { ascending: false }).limit(20),
    ]);
    setItems(c ?? []); setLogs(l ?? []);
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

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Campanhas</h3>
            <p className="text-xs text-slate-500">Cobranças, aniversários, reativação de pacientes inativos.</p>
          </div>
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Nova
          </Button>
        </div>

        {creating && (
          <div className="p-5 bg-slate-50/50 border-b grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Cobrança 7 dias" />
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
              <Label className="text-xs">Template</Label>
              <Textarea rows={3} value={draft.template} onChange={(e) => setDraft({ ...draft, template: e.target.value })} placeholder="Olá {{nome}}, …" />
            </div>
            <div className="flex gap-2">
              <Button onClick={create} size="sm"><Save className="h-4 w-4 mr-2" />Criar</Button>
              <Button onClick={() => setCreating(false)} size="sm" variant="outline">Cancelar</Button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Nenhuma campanha criada ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((c) => (
              <li key={c.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/40">
                <div className={cn("h-10 w-10 rounded-xl grid place-items-center text-white",
                  c.type === "billing" ? "bg-amber-500" :
                  c.type === "birthday" ? "bg-pink-500" :
                  c.type === "reactivation" ? "bg-violet-500" : "bg-slate-500"
                )}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{c.type} · enviadas: {c.stats?.sent ?? 0}</p>
                </div>
                <Switch checked={c.active} onCheckedChange={() => toggle(c.id, c.active)} />
                <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-slate-900">Últimos envios</h3>
          <p className="text-xs text-slate-500">{logs.length} mensagens recentes</p>
        </div>
        {logs.length === 0 ? (
          <div className="py-12 text-center">
            <ListChecks className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Sem envios registrados.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {logs.map((l) => (
              <li key={l.id} className="px-5 py-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900 truncate">{l.to_number}</span>
                  <Badge variant="outline" className={cn("text-[10px]",
                    l.status === "sent" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                    l.status === "failed" ? "border-rose-200 text-rose-700 bg-rose-50" :
                    "border-slate-200 text-slate-600"
                  )}>{l.status}</Badge>
                </div>
                <p className="text-slate-500 mt-0.5 truncate">{l.template_key || l.message?.slice(0, 60)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(l.sent_at).toLocaleString("pt-BR")}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
