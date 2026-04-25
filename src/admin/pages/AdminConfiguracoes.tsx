import { useState, useEffect } from "react";
import { Building2, Clock, Plug, Users as UsersIcon, Palette, Webhook, Key, UserCircle2, Plus, Copy, Trash2, Send, CheckCircle2, XCircle, Eye, EyeOff, CreditCard } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useClinicSettings, useUpsertSetting, useApiKeys, useDeleteApiKey, useWebhooks, useUpsertWebhook, useDeleteWebhook } from "@/admin/hooks/useSettings";
import { useClinicHours, useUpsertClinicHours, WEEKDAY_LABELS } from "@/admin/hooks/useClinicHours";
import { useStaffUsers, useCreateStaffUser, useUpdateStaffPermissions, useDeleteStaffUser, PERMISSION_MODULES } from "@/admin/hooks/useUsers";
import EntityModal from "@/admin/components/EntityModal";
import ConfirmDialog from "@/admin/components/ConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const SECTIONS = [
  { key: "general", label: "Geral", icon: Building2 },
  { key: "hours", label: "Horários", icon: Clock },
  { key: "payments", label: "Pagamentos", icon: CreditCard },
  { key: "integrations", label: "Integrações", icon: Plug },
  { key: "client_area", label: "Área do Cliente", icon: UserCircle2 },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "users", label: "Usuários", icon: UsersIcon },
  { key: "webhooks", label: "Webhooks", icon: Webhook },
  { key: "api", label: "API & chaves", icon: Key },
] as const;

export default function AdminConfiguracoes() {
  const { data: settings = {} } = useClinicSettings();
  const upsert = useUpsertSetting();
  const [section, setSection] = useState<typeof SECTIONS[number]["key"]>("general");

  function get(key: string): any { return (settings as any)[key] ?? {}; }
  async function save(key: string, value: Record<string, any>) {
    try { await upsert.mutateAsync({ key, value }); toast({ title: "Configurações salvas" }); }
    catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  return (
    <>
      <PageHeader title="Configurações" description="Gerencie preferências, integrações e usuários da clínica." />

      <div className="admin-card mb-4 p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <Icon className="h-4 w-4" />{s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {section === "general" && <SectionGeneral initial={get("general")} onSave={(v: any) => save("general", v)} />}
        {section === "hours" && <SectionHours />}
        {section === "integrations" && <SectionIntegrations initial={get("integrations")} onSave={(v: any) => save("integrations", v)} />}
        {section === "client_area" && <SectionClientArea initial={get("client_area")} onSave={(v: any) => save("client_area", v)} />}
        {section === "branding" && <SectionBranding initial={get("branding")} onSave={(v: any) => save("branding", v)} />}
        {section === "users" && <SectionUsers />}
        {section === "webhooks" && <SectionWebhooks />}
        {section === "api" && <SectionApiKeys />}
      </div>
    </>
  );
}

function SectionCard({ title, description, children, footer }: any) {
  return (
    <section className="admin-card overflow-hidden">
      <header className="border-b border-[hsl(var(--admin-border))] px-5 py-4">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </header>
      <div className="p-5 space-y-3">{children}</div>
      {footer && <div className="border-t border-[hsl(var(--admin-border))] px-5 py-3 bg-muted/30 flex justify-end">{footer}</div>}
    </section>
  );
}

function SectionGeneral({ initial, onSave }: any) {
  const [v, setV] = useState({ name: "", phone: "", email: "", address: "", cep: "", ...initial });
  return (
    <SectionCard title="Dados da clínica" description="Informações exibidas no site público e em comunicações." footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label className="text-xs">Nome da clínica</Label><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div><Label className="text-xs">Telefone</Label><Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></div>
        <div><Label className="text-xs">E-mail</Label><Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} /></div>
        <div><Label className="text-xs">CEP</Label><Input value={v.cep ?? ""} onChange={(e) => setV({ ...v, cep: e.target.value })} /></div>
      </div>
      <div><Label className="text-xs">Endereço completo</Label><Textarea rows={2} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} /></div>
    </SectionCard>
  );
}

/* ========== HORÁRIOS — grid 2 colunas, aproveita espaço total ========== */
function SectionHours() {
  const { data: hours = [] } = useClinicHours();
  const upsertHours = useUpsertClinicHours();
  const [local, setLocal] = useState<typeof hours>([]);

  useEffect(() => { setLocal(hours); }, [hours]);

  function setDay(weekday: number, patch: any) {
    setLocal(local.map((d) => d.weekday === weekday ? { ...d, ...patch } : d));
  }

  async function saveAll() {
    try {
      await upsertHours.mutateAsync(local.map((d) => ({
        weekday: d.weekday, is_open: d.is_open,
        open_time: d.is_open ? (d.open_time ?? "08:00") : null,
        close_time: d.is_open ? (d.close_time ?? "18:00") : null,
      })));
      toast({ title: "Horários atualizados" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  return (
    <SectionCard
      title="Horário de funcionamento"
      description="Define a disponibilidade padrão da clínica. Estes horários alimentam a agenda pública."
      footer={<Button onClick={saveAll}>Salvar horários</Button>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {local.map((d) => (
          <div key={d.weekday} className={cn(
            "rounded-xl border bg-background p-4 transition-colors",
            d.is_open ? "border-[hsl(var(--admin-border))]" : "border-[hsl(var(--admin-border))] bg-muted/40 opacity-90"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-xs font-bold",
                  d.is_open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  {WEEKDAY_LABELS[d.weekday].slice(0, 3)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{WEEKDAY_LABELS[d.weekday]}</p>
                  <p className="text-[11px] text-muted-foreground">{d.is_open ? "Aberto" : "Fechado o dia todo"}</p>
                </div>
              </div>
              <Switch checked={d.is_open} onCheckedChange={(b) => setDay(d.weekday, { is_open: b })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Abre</Label>
                <Input type="time" disabled={!d.is_open} value={d.open_time ?? "08:00"}
                  onChange={(e) => setDay(d.weekday, { open_time: e.target.value })} className="h-9" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fecha</Label>
                <Input type="time" disabled={!d.is_open} value={d.close_time ?? "18:00"}
                  onChange={(e) => setDay(d.weekday, { close_time: e.target.value })} className="h-9" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SectionIntegrations({ initial, onSave }: any) {
  const [v, setV] = useState({ clinicorp_endpoint: "", clinicorp_clinic_id: "", auto_sync: false, sync_interval: "15", ...initial });
  const [syncing, setSyncing] = useState(false);

  async function runSync() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("clinicorp-sync", { body: { action: "sync" } });
      if (error) throw error;
      toast({ title: data?.ok ? "Sincronização executada" : "Sem credenciais", description: data?.message ?? "" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setSyncing(false); }
  }

  return (
    <div className="space-y-4">
      <ChatProIntegrationCard />
      <ChatProWebhookCard />

      <SectionCard
        title="Clinicorp"
        description="Sincronização bidirecional de agendamentos."
        footer={<div className="flex gap-2"><Button variant="outline" onClick={runSync} disabled={syncing}>{syncing ? "Sincronizando…" : "Testar sincronização"}</Button><Button onClick={() => onSave(v)}>Salvar</Button></div>}
      >
        <div className="rounded-xl border border-[hsl(var(--admin-border))] p-5 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Plug className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">Clinicorp</p>
                <p className="text-xs text-muted-foreground">Sincronização bidirecional de agendamentos.</p>
              </div>
            </div>
            <Badge variant="outline">Aguardando credenciais</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Endpoint da API</Label><Input value={v.clinicorp_endpoint} onChange={(e) => setV({ ...v, clinicorp_endpoint: e.target.value })} placeholder="https://api.clinicorp.com" /></div>
            <div><Label className="text-xs">ID da clínica</Label><Input value={v.clinicorp_clinic_id} onChange={(e) => setV({ ...v, clinicorp_clinic_id: e.target.value })} /></div>
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium">Sincronização automática</p>
                <p className="text-[11px] text-muted-foreground">Buscar agenda a cada {v.sync_interval} min e bloquear horários ocupados no site.</p>
              </div>
              <Switch checked={v.auto_sync} onCheckedChange={(b) => setV({ ...v, auto_sync: b })} />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ChatProIntegrationCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{ connected: boolean; message?: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [cfg, setCfg] = useState<any>({
    id: null,
    endpoint: "",
    instance_code: "",
    token: "",
    is_active: true,
    message_template: "",
  });
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do LyneCloud 🦷");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("chatpro_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setCfg({ ...data });
      setLoading(false);
    })();
  }, []);

  async function save() {
    if (!cfg.endpoint || !cfg.token || !cfg.instance_code) {
      toast({ title: "Preencha endpoint, instance code e token", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        endpoint: cfg.endpoint.trim().replace(/\/$/, ""),
        instance_code: cfg.instance_code.trim(),
        token: cfg.token.trim(),
        is_active: !!cfg.is_active,
        message_template: cfg.message_template || undefined,
        updated_at: new Date().toISOString(),
      };
      if (cfg.id) {
        const { error } = await supabase.from("chatpro_config").update(payload).eq("id", cfg.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("chatpro_config").insert(payload).select("id").single();
        if (error) throw error;
        setCfg((c: any) => ({ ...c, id: data.id }));
      }
      // ativa provider chatpro (manual upsert)
      const existingProvRes: any = await supabase.from("whatsapp_providers" as any).select("id").eq("type", "chatpro").maybeSingle();
      const existingProv = existingProvRes?.data as { id: string } | null;
      const provPayload: any = {
        type: "chatpro",
        label: "ChatPro",
        is_active: true,
        status: "configured",
        config: { endpoint: payload.endpoint, instance_code: payload.instance_code },
      };
      if (existingProv?.id) {
        await supabase.from("whatsapp_providers" as any).update(provPayload).eq("id", existingProv.id);
      } else {
        await supabase.from("whatsapp_providers" as any).insert(provPayload);
      }
      // desativa baileys
      await supabase.from("whatsapp_providers" as any).update({ is_active: false } as any).eq("type", "baileys_vps");
      toast({ title: "ChatPro salvo e ativado" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function checkStatus() {
    setTesting(true);
    try {
      const base = cfg.endpoint.replace(/\/$/, "");
      const resp = await fetch(`${base}/api/v1/status`, { headers: { Authorization: cfg.token } });
      const text = await resp.text();
      let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      const ok = resp.ok && (data?.status === "connected" || data?.connected === true || data?.state === "open" || resp.status === 200);
      setStatusInfo({ connected: ok, message: data?.message || data?.status || (ok ? "Conectado" : "Verifique credenciais") });
      toast({ title: ok ? "ChatPro conectado" : "Falha ao conectar", description: data?.message || data?.status || "" , variant: ok ? "default" : "destructive" });
    } catch (e: any) {
      setStatusInfo({ connected: false, message: e.message });
      toast({ title: "Erro de conexão", description: e.message, variant: "destructive" });
    } finally { setTesting(false); }
  }

  async function sendTest() {
    if (!testNumber) { toast({ title: "Informe um número" }); return; }
    setTesting(true);
    try {
      const digits = testNumber.replace(/\D/g, "");
      const e164 = digits.startsWith("55") ? digits : (digits.length === 10 || digits.length === 11 ? "55" + digits : digits);
      const base = cfg.endpoint.replace(/\/$/, "");
      const resp = await fetch(`${base}/api/v1/send_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: cfg.token },
        body: JSON.stringify({ number: e164, message: testMessage }),
      });
      const text = await resp.text();
      let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      toast({ title: resp.ok ? "Mensagem enviada ✅" : "Falha ao enviar", description: data?.message || JSON.stringify(data).slice(0, 120), variant: resp.ok ? "default" : "destructive" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setTesting(false); }
  }

  const isConfigured = !!(cfg.endpoint && cfg.token && cfg.instance_code && cfg.id);

  return (
    <SectionCard
      title="ChatPro · WhatsApp"
      description="Conecte sua conta ChatPro para enviar mensagens automáticas, lembretes e receber respostas."
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={checkStatus} disabled={testing || !cfg.endpoint || !cfg.token}>
            {testing ? "Verificando…" : "Verificar status"}
          </Button>
          <Button onClick={save} disabled={saving || loading}>{saving ? "Salvando…" : (cfg.id ? "Atualizar credenciais" : "Salvar e ativar")}</Button>
        </div>
      }
    >
      <div className="rounded-xl border border-[hsl(var(--admin-border))] p-5 bg-muted/30">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><Send className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold">ChatPro Gateway</p>
              <p className="text-xs text-muted-foreground">SaaS oficial — paga por mensagem, sem precisar de servidor.</p>
            </div>
          </div>
          {statusInfo ? (
            <Badge variant={statusInfo.connected ? "default" : "outline"} className={cn(statusInfo.connected ? "bg-emerald-600 text-white" : "border-amber-300 text-amber-700 bg-amber-50")}>
              {statusInfo.connected ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {statusInfo.connected ? "Conectado" : (statusInfo.message || "Desconectado")}
            </Badge>
          ) : (
            <Badge variant="outline">{isConfigured ? "Configurado" : "Aguardando credenciais"}</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label className="text-xs">Endpoint da API*</Label>
            <Input value={cfg.endpoint} onChange={(e) => setCfg({ ...cfg, endpoint: e.target.value })} placeholder="https://v5.chatpro.com.br" />
            <p className="text-[10px] text-muted-foreground mt-1">URL base do seu servidor ChatPro (sem barra no final).</p>
          </div>
          <div>
            <Label className="text-xs">Instance Code*</Label>
            <Input value={cfg.instance_code} onChange={(e) => setCfg({ ...cfg, instance_code: e.target.value })} placeholder="chatpro-XXXXXX" />
          </div>
          <div>
            <Label className="text-xs">Token*</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={cfg.token}
                onChange={(e) => setCfg({ ...cfg, token: e.target.value })}
                placeholder="seu-token-secreto"
                className="pr-9"
              />
              <button type="button" onClick={() => setShowToken((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Template padrão de confirmação</Label>
            <Textarea
              value={cfg.message_template || ""}
              onChange={(e) => setCfg({ ...cfg, message_template: e.target.value })}
              rows={4}
              placeholder="Use variáveis: {{nome}}, {{tratamento}}, {{data}}, {{hora}}"
            />
          </div>
        </div>

        {isConfigured && (
          <div className="mt-5 pt-5 border-t border-dashed">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Enviar mensagem de teste</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="(11) 99999-9999" />
              <Input className="md:col-span-2" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
            </div>
            <Button size="sm" className="mt-2" onClick={sendTest} disabled={testing}>
              {testing ? "Enviando…" : "Enviar teste"}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function ChatProWebhookCard() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [hasSecret, setHasSecret] = useState<boolean>(true);
  const [testing, setTesting] = useState(false);

  async function loadUrl() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-inbound-url");
      if (error) throw error;
      setUrl(data?.url || "");
      setHasSecret(!!data?.has_secret);
    } catch (e: any) {
      toast({ title: "Erro ao gerar URL", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUrl(); }, []);

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copiada ✅", description: "Cole no painel do ChatPro em Configurações → Webhooks." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  }

  async function testWebhook() {
    if (!url) return;
    setTesting(true);
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "received_message",
          message_data: {
            from_me: false,
            id: `test-${Date.now()}`,
            message: "oi",
            number: "5527999999999@s.whatsapp.net",
            type: "receveid_message",
            notify_name: "Teste Admin",
          },
        }),
      });
      const data = await resp.json();
      toast({
        title: resp.ok && data?.ok ? "Webhook OK ✅" : "Webhook respondeu mas com aviso",
        description: JSON.stringify(data).slice(0, 200),
        variant: resp.ok ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({ title: "Erro ao testar webhook", description: e.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <SectionCard
      title="Webhook de mensagens recebidas (Bot)"
      description="Cole esta URL no painel do ChatPro em Configurações → Webhooks. Toda mensagem recebida será enviada para o bot da LyneCloud responder automaticamente."
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadUrl} disabled={loading}>{loading ? "Gerando…" : "Recarregar URL"}</Button>
          <Button variant="outline" onClick={testWebhook} disabled={testing || !url}>{testing ? "Testando…" : "Testar webhook"}</Button>
          <Button onClick={copyUrl} disabled={!url}><Copy className="h-4 w-4 mr-2" />Copiar URL</Button>
        </div>
      }
    >
      <div className="rounded-xl border border-[hsl(var(--admin-border))] p-5 bg-muted/30 space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600"><Webhook className="h-5 w-5" /></div>
          <div>
            <p className="font-semibold">URL do Webhook ChatPro</p>
            <p className="text-xs text-muted-foreground">Cole no campo "Webhook" do seu painel ChatPro (método POST, formato JSON).</p>
          </div>
        </div>

        <div>
          <Label className="text-xs">URL completa (com token)</Label>
          <div className="flex gap-2">
            <Input readOnly value={url} placeholder={loading ? "Gerando URL…" : "Clique em Recarregar"} className="font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="outline" size="icon" onClick={copyUrl} disabled={!url}><Copy className="h-4 w-4" /></Button>
          </div>
          {!hasSecret && (
            <p className="text-[11px] text-amber-600 mt-1">⚠️ Nenhum secret configurado. A URL aceitará chamadas sem autenticação.</p>
          )}
        </div>

        <div className="rounded-lg border border-dashed bg-background p-3 space-y-1.5">
          <p className="text-xs font-semibold">📋 Passo a passo no ChatPro:</p>
          <ol className="text-[11px] text-muted-foreground list-decimal pl-4 space-y-0.5">
            <li>Acesse <span className="font-mono">app.chatpro.com.br</span> → sua instância → <strong>Configurações → Webhooks</strong>.</li>
            <li>Cole a URL acima no campo "URL do webhook".</li>
            <li>Marque o evento <strong>"received_message"</strong> (mensagem recebida).</li>
            <li>Salve. Use o botão <strong>"Testar webhook"</strong> acima para validar.</li>
          </ol>
        </div>
      </div>
    </SectionCard>
  );
}

function SectionClientArea({ initial, onSave }: any) {
  const [v, setV] = useState({
    enabled: false, require_email_verification: true, allow_self_registration: false,
    show_appointments: true, show_history: true, show_documents: false, show_invoices: true,
    allow_reschedule: true, allow_cancel: true, allow_booking: true,
    welcome_title: "Bem-vindo à sua área exclusiva",
    welcome_text: "Acompanhe seus agendamentos, histórico de tratamentos e mantenha seus dados sempre atualizados.",
    portal_color: "#1e40af", ...initial,
  });

  return (
    <div className="space-y-4">
      <SectionCard title="Ativação da Área do Cliente" description="Permite que pacientes acessem um portal exclusivo para acompanhar agendamentos e histórico." footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}>
        <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-muted/30 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm flex items-center gap-2">Portal do Paciente
              <Badge variant={v.enabled ? "default" : "outline"}>{v.enabled ? "Ativo" : "Desativado"}</Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-1">URL: <code className="text-[11px] bg-background px-1.5 py-0.5 rounded">/area-cliente</code></p>
          </div>
          <Switch checked={v.enabled} onCheckedChange={(b) => setV({ ...v, enabled: b })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <ToggleRow label="Verificação de e-mail obrigatória" desc="Paciente precisa confirmar o e-mail." checked={v.require_email_verification} onChange={(b) => setV({ ...v, require_email_verification: b })} />
          <ToggleRow label="Cadastro próprio" desc="Permitir que pacientes criem suas próprias contas." checked={v.allow_self_registration} onChange={(b) => setV({ ...v, allow_self_registration: b })} />
        </div>
      </SectionCard>

      <SectionCard title="Funcionalidades disponíveis" description="Selecione o que cada paciente pode fazer no portal." footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ToggleRow label="Meus agendamentos" desc="Lista de consultas futuras e passadas." checked={v.show_appointments} onChange={(b) => setV({ ...v, show_appointments: b })} />
          <ToggleRow label="Histórico de tratamentos" desc="Tratamentos já realizados e em andamento." checked={v.show_history} onChange={(b) => setV({ ...v, show_history: b })} />
          <ToggleRow label="Agendar nova consulta" desc="Permite ao paciente agendar diretamente pelo portal." checked={v.allow_booking} onChange={(b) => setV({ ...v, allow_booking: b })} />
          <ToggleRow label="Documentos e exames" desc="Upload e download de documentos." checked={v.show_documents} onChange={(b) => setV({ ...v, show_documents: b })} />
          <ToggleRow label="Financeiro / faturas" desc="Consultar pagamentos e boletos." checked={v.show_invoices} onChange={(b) => setV({ ...v, show_invoices: b })} />
          <ToggleRow label="Reagendar consulta" desc="Paciente pode propor novo horário." checked={v.allow_reschedule} onChange={(b) => setV({ ...v, allow_reschedule: b })} />
          <ToggleRow label="Cancelar consulta" desc="Paciente pode cancelar diretamente." checked={v.allow_cancel} onChange={(b) => setV({ ...v, allow_cancel: b })} />
        </div>
      </SectionCard>

      <SectionCard title="Personalização do portal" description="Mensagem de boas-vindas e cor principal exibida ao paciente." footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}>
        <div><Label className="text-xs">Título de boas-vindas</Label><Input value={v.welcome_title} onChange={(e) => setV({ ...v, welcome_title: e.target.value })} /></div>
        <div><Label className="text-xs">Texto de apresentação</Label><Textarea rows={3} value={v.welcome_text} onChange={(e) => setV({ ...v, welcome_text: e.target.value })} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Cor de destaque</Label><Input type="color" value={v.portal_color} onChange={(e) => setV({ ...v, portal_color: e.target.value })} className="h-10 w-full" /></div>
          <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center">
            URL: <code className="ml-2 bg-background px-1.5 py-0.5 rounded">/area-cliente</code>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: any) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[hsl(var(--admin-border))] bg-background px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SectionBranding({ initial, onSave }: any) {
  const [v, setV] = useState({ primary: "#1e40af", accent: "#c8a96a", logo_url: "", ...initial });
  return (
    <SectionCard title="Identidade visual" description="Logo e cores da marca utilizadas no site público." footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}>
      <div><Label className="text-xs">URL do logo</Label><Input value={v.logo_url} onChange={(e) => setV({ ...v, logo_url: e.target.value })} placeholder="https://…" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label className="text-xs">Cor primária</Label><Input type="color" value={v.primary} onChange={(e) => setV({ ...v, primary: e.target.value })} className="h-10" /></div>
        <div><Label className="text-xs">Cor de destaque</Label><Input type="color" value={v.accent} onChange={(e) => setV({ ...v, accent: e.target.value })} className="h-10" /></div>
      </div>
    </SectionCard>
  );
}

/* ========== USUÁRIOS — criação em modal + permissões granulares ========== */
function SectionUsers() {
  const { data: users = [], isLoading } = useStaffUsers();
  const create = useCreateStaffUser();
  const updatePerms = useUpdateStaffPermissions();
  const del = useDeleteStaffUser();
  const [open, setOpen] = useState(false);
  const [permsUser, setPermsUser] = useState<any | null>(null);
  const [delUser, setDelUser] = useState<string | null>(null);

  return (
    <SectionCard
      title="Usuários e permissões"
      description="Cadastre membros da equipe e defina o que cada um pode acessar no painel."
      footer={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo usuário</Button>}
    >
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--admin-border))] bg-background p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {u.full_name.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{u.full_name} {u.is_admin && <Badge className="ml-1.5 text-[10px]">Admin</Badge>}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email} · {u.job_title || "—"}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setPermsUser(u)}>Permissões</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelUser(u.user_id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <CreateUserModal open={open} onOpenChange={setOpen} onCreate={async (payload) => {
        try { await create.mutateAsync(payload); toast({ title: "Usuário criado" }); setOpen(false); }
        catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
      }} loading={create.isPending} />

      <PermissionsModal user={permsUser} onClose={() => setPermsUser(null)} onSave={async (payload) => {
        try { await updatePerms.mutateAsync(payload); toast({ title: "Permissões atualizadas" }); setPermsUser(null); }
        catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
      }} loading={updatePerms.isPending} />

      <ConfirmDialog open={!!delUser} onOpenChange={(v) => !v && setDelUser(null)}
        title="Excluir usuário?" description="O acesso ao painel será revogado imediatamente."
        destructive confirmLabel="Sim, excluir"
        onConfirm={async () => { if (delUser) { await del.mutateAsync(delUser); toast({ title: "Usuário excluído" }); setDelUser(null); } }} />
    </SectionCard>
  );
}

function CreateUserModal({ open, onOpenChange, onCreate, loading }: any) {
  const [f, setF] = useState({ email: "", password: "", full_name: "", job_title: "", is_admin: false });
  const [perms, setPerms] = useState<Record<string, { view: boolean; edit: boolean; delete: boolean }>>({});

  useEffect(() => {
    if (open) {
      setF({ email: "", password: "", full_name: "", job_title: "", is_admin: false });
      const def: any = {};
      PERMISSION_MODULES.forEach((m) => def[m.key] = { view: true, edit: false, delete: false });
      setPerms(def);
    }
  }, [open]);

  return (
    <EntityModal open={open} onOpenChange={onOpenChange} title="Novo usuário" description="Crie acesso para um membro da equipe." size="lg"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button disabled={loading} onClick={() => {
          if (!f.email || !f.password || !f.full_name) { toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return; }
          if (f.password.length < 6) { toast({ title: "Senha precisa ter pelo menos 6 caracteres", variant: "destructive" }); return; }
          onCreate({ ...f, permissions: perms });
        }}>{loading ? "Criando…" : "Criar usuário"}</Button></div>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Nome completo*</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><Label className="text-xs">Cargo</Label><Input value={f.job_title} onChange={(e) => setF({ ...f, job_title: e.target.value })} placeholder="Ex.: Recepcionista" /></div>
          <div><Label className="text-xs">E-mail*</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label className="text-xs">Senha provisória*</Label><Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="mín. 6 caracteres" /></div>
        </div>
        <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 p-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Acesso de administrador</p>
            <p className="text-[11px] text-muted-foreground">Concede acesso total a todos os módulos.</p>
          </div>
          <Switch checked={f.is_admin} onCheckedChange={(b) => setF({ ...f, is_admin: b })} />
        </div>
        {!f.is_admin && (
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Permissões por módulo</Label>
            <div className="mt-2 rounded-lg border border-[hsl(var(--admin-border))] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr><th className="text-left px-3 py-2">Módulo</th><th className="px-3 py-2">Ver</th><th className="px-3 py-2">Editar</th><th className="px-3 py-2">Excluir</th></tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((m) => (
                    <tr key={m.key} className="border-t border-[hsl(var(--admin-border))]">
                      <td className="px-3 py-2 font-medium">{m.label}</td>
                      {(["view", "edit", "delete"] as const).map((act) => (
                        <td key={act} className="text-center px-3 py-2">
                          <Checkbox checked={perms[m.key]?.[act] ?? false} onCheckedChange={(v) => setPerms({ ...perms, [m.key]: { ...perms[m.key], [act]: !!v } })} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </EntityModal>
  );
}

function PermissionsModal({ user, onClose, onSave, loading }: any) {
  const [is_admin, setIsAdmin] = useState(false);
  const [perms, setPerms] = useState<Record<string, any>>({});
  useEffect(() => {
    if (user) {
      setIsAdmin(user.is_admin);
      const def: any = {};
      PERMISSION_MODULES.forEach((m) => def[m.key] = user.permissions?.[m.key] ?? { view: true, edit: false, delete: false });
      setPerms(def);
    }
  }, [user]);
  return (
    <EntityModal open={!!user} onOpenChange={(v) => !v && onClose()} title={`Permissões — ${user?.full_name ?? ""}`} size="lg"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={loading} onClick={() => onSave({ user_id: user.user_id, is_admin, permissions: perms })}>{loading ? "Salvando…" : "Salvar"}</Button></div>}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 p-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Acesso de administrador</p>
            <p className="text-[11px] text-muted-foreground">Concede acesso total. Se ativo, ignora as permissões abaixo.</p>
          </div>
          <Switch checked={is_admin} onCheckedChange={setIsAdmin} />
        </div>
        <div className="rounded-lg border border-[hsl(var(--admin-border))] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left px-3 py-2">Módulo</th><th className="px-3 py-2">Ver</th><th className="px-3 py-2">Editar</th><th className="px-3 py-2">Excluir</th></tr>
            </thead>
            <tbody>
              {PERMISSION_MODULES.map((m) => (
                <tr key={m.key} className="border-t border-[hsl(var(--admin-border))]">
                  <td className="px-3 py-2 font-medium">{m.label}</td>
                  {(["view", "edit", "delete"] as const).map((act) => (
                    <td key={act} className="text-center px-3 py-2">
                      <Checkbox disabled={is_admin} checked={is_admin || (perms[m.key]?.[act] ?? false)} onCheckedChange={(v) => setPerms({ ...perms, [m.key]: { ...perms[m.key], [act]: !!v } })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EntityModal>
  );
}

/* ========== WEBHOOKS ========== */
const EVENTS = ["appointment.created", "appointment.updated", "appointment.cancelled", "lead.created", "review.created"];

function SectionWebhooks() {
  const { data: hooks = [] } = useWebhooks();
  const upsert = useUpsertWebhook();
  const del = useDeleteWebhook();
  const [open, setOpen] = useState<any>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<string | null>(null);

  function newSecret() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function testWebhook(id: string) {
    setTesting(id);
    try {
      const { data, error } = await supabase.functions.invoke("webhook-test", { body: { id } });
      if (error) throw error;
      toast({ title: data?.ok ? `OK — HTTP ${data.status}` : `Falhou — HTTP ${data?.status ?? 0}`, description: (data?.response ?? data?.error ?? "").slice(0, 120) });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setTesting(null); }
  }

  return (
    <SectionCard
      title="Webhooks"
      description="Receba notificações em tempo real quando eventos importantes acontecem na clínica. Cada disparo inclui assinatura HMAC SHA-256 no header X-LyneCloud-Signature."
      footer={<Button onClick={() => setOpen({ url: "", events: [], active: true, secret: newSecret() })}><Plus className="h-4 w-4 mr-2" />Novo webhook</Button>}
    >
      {hooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum webhook configurado.</p>
      ) : (
        <div className="space-y-2">
          {hooks.map((h) => (
            <div key={h.id} className="rounded-lg border border-[hsl(var(--admin-border))] bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[12px] font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-md">{h.url}</code>
                    <Badge variant={h.active ? "default" : "outline"} className="text-[10px]">{h.active ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {h.events.map((e: string) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>Secret:</span>
                    <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{showSecret === h.id ? h.secret : "•".repeat(24)}</code>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowSecret(showSecret === h.id ? null : h.id)}>{showSecret === h.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(h.secret); toast({ title: "Secret copiado" }); }}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={testing === h.id} onClick={() => testWebhook(h.id)}><Send className="h-3.5 w-3.5 mr-1" />{testing === h.id ? "…" : "Testar"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(h)}>Editar</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelId(h.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EntityModal open={!!open} onOpenChange={(v) => !v && setOpen(null)} title={open?.id ? "Editar webhook" : "Novo webhook"} size="md"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button>
          <Button onClick={async () => {
            if (!open?.url || !open?.events?.length) { toast({ title: "URL e eventos são obrigatórios", variant: "destructive" }); return; }
            try { await upsert.mutateAsync(open); toast({ title: "Webhook salvo" }); setOpen(null); }
            catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
          }}>Salvar</Button></div>}
      >
        {open && (
          <div className="space-y-3">
            <div><Label className="text-xs">URL de destino*</Label><Input value={open.url} onChange={(e) => setOpen({ ...open, url: e.target.value })} placeholder="https://meu-sistema.com/webhook" /></div>
            <div>
              <Label className="text-xs">Eventos*</Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 rounded-lg border border-[hsl(var(--admin-border))] bg-background px-3 py-2 cursor-pointer">
                    <Checkbox checked={open.events.includes(ev)} onCheckedChange={(v) => setOpen({ ...open, events: v ? [...open.events, ev] : open.events.filter((x: string) => x !== ev) })} />
                    <code className="text-[12px] font-mono">{ev}</code>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="text-sm">Ativo</span>
              <Switch checked={open.active} onCheckedChange={(b) => setOpen({ ...open, active: b })} />
            </div>
            <div>
              <Label className="text-xs">Secret HMAC</Label>
              <div className="flex gap-2">
                <Input value={open.secret} readOnly className="font-mono text-xs" />
                <Button variant="outline" type="button" onClick={() => setOpen({ ...open, secret: newSecret() })}>Regenerar</Button>
              </div>
            </div>
          </div>
        )}
      </EntityModal>

      <ConfirmDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)}
        title="Remover webhook?" description="Esta URL deixará de receber eventos imediatamente." destructive confirmLabel="Remover"
        onConfirm={async () => { if (delId) { await del.mutateAsync(delId); toast({ title: "Removido" }); setDelId(null); } }} />
    </SectionCard>
  );
}

/* ========== API KEYS ========== */
function SectionApiKeys() {
  const { data: keys = [] } = useApiKeys();
  const del = useDeleteApiKey();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", scopes: ["read"] as string[] });
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!form.label) { toast({ title: "Informe um rótulo", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("api-keys-create", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCreated(data.key);
      setOpen(false);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  return (
    <SectionCard
      title="API & chaves"
      description="Crie chaves de API para integrar sistemas externos com a clínica. Endpoint base: /functions/v1/public-api"
      footer={<Button onClick={() => { setForm({ label: "", scopes: ["read"] }); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Nova chave</Button>}
    >
      <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 p-3 text-xs space-y-1">
        <p className="font-semibold">Endpoints disponíveis:</p>
        <code className="block font-mono">GET  /public-api/appointments — lista agendamentos (escopo: read)</code>
        <code className="block font-mono">POST /public-api/leads — criar lead (escopo: write)</code>
        <code className="block font-mono">GET  /public-api/reviews — lista avaliações (escopo: read)</code>
        <p className="text-muted-foreground mt-1">Envie a chave no header <code>x-api-key</code> ou <code>Authorization: Bearer</code>.</p>
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma chave gerada ainda.</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-lg border border-[hsl(var(--admin-border))] bg-background p-3">
              <Key className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{k.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-[11px] font-mono text-muted-foreground">{k.key_prefix}…</code>
                  {k.scopes.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground hidden md:block">{k.last_used_at ? `Usada ${new Date(k.last_used_at).toLocaleDateString("pt-BR")}` : "Nunca usada"}</span>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDelId(k.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <EntityModal open={open} onOpenChange={setOpen} title="Nova chave de API" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={loading} onClick={generate}>{loading ? "Gerando…" : "Gerar chave"}</Button></div>}
      >
        <div className="space-y-3">
          <div><Label className="text-xs">Rótulo*</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex.: Integração CRM" /></div>
          <div>
            <Label className="text-xs">Escopos</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["read", "write"].map((s) => (
                <label key={s} className="flex items-center gap-2 rounded-lg border border-[hsl(var(--admin-border))] bg-background px-3 py-2 cursor-pointer">
                  <Checkbox checked={form.scopes.includes(s)} onCheckedChange={(v) => setForm({ ...form, scopes: v ? [...form.scopes, s] : form.scopes.filter((x) => x !== s) })} />
                  <code className="text-[12px] font-mono">{s}</code>
                </label>
              ))}
            </div>
          </div>
        </div>
      </EntityModal>

      <EntityModal open={!!created} onOpenChange={(v) => !v && setCreated(null)} title="Chave gerada com sucesso" description="Copie agora — esta é a única vez que você verá a chave completa.">
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Guarde esta chave em local seguro. Por segurança, não conseguiremos exibi-la novamente.</p>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={created ?? ""} className="font-mono text-xs" />
            <Button onClick={() => { navigator.clipboard.writeText(created ?? ""); toast({ title: "Copiado" }); }}><Copy className="h-4 w-4 mr-1" />Copiar</Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setCreated(null)}>Fechar</Button>
        </div>
      </EntityModal>

      <ConfirmDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)}
        title="Revogar chave?" description="Sistemas que usam esta chave perderão acesso imediatamente." destructive confirmLabel="Revogar"
        onConfirm={async () => { if (delId) { await del.mutateAsync(delId); toast({ title: "Chave revogada" }); setDelId(null); } }} />
    </SectionCard>
  );
}
