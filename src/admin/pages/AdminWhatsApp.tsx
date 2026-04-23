import { useEffect, useState } from "react";
import { Loader2, Settings, QrCode, Activity, Send, Save, RefreshCw, ListChecks, KeyRound } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "disconnected" | "waiting_qr" | "connected";
const PWD_KEY = "levii_chatpro_pwd";

export default function AdminWhatsApp() {
  const [pwd, setPwd] = useState<string | null>(() => sessionStorage.getItem(PWD_KEY));
  const [pwdInput, setPwdInput] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  if (!pwd) {
    return (
      <>
        <PageHeader title="WhatsApp" description="Integração com ChatPro para confirmações automáticas." />
        <div className="max-w-md rounded-2xl border bg-card p-6">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg">Senha de integração</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para alterar credenciais ChatPro, informe a senha de integração.
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
  const [qr, setQr] = useState<string | null>(null);
  const [config, setConfig] = useState({ instance_code: "", token: "", endpoint: "", message_template: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Teste de integração — Clínica Levii ✅");

  const call = async (action: string, payload?: any) => {
    const { data, error } = await supabase.functions.invoke("chatpro-admin", { body: { action, password, payload } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadConfig = async () => {
    try {
      const data = await call("get_config");
      if (data?.config) setConfig({
        instance_code: data.config.instance_code ?? "",
        token: data.config.token ?? "",
        endpoint: data.config.endpoint ?? "",
        message_template: data.config.message_template ?? "",
      });
    } catch (e: any) {
      toast({ title: "Erro ao carregar", description: e.message, variant: "destructive" });
    }
  };

  const checkStatus = async () => {
    setBusy("status");
    try {
      const data = await call("get_status");
      const raw = data?.data;
      const connected = raw?.status === "connected" || raw?.connected === true || String(raw?.state ?? "").toLowerCase().includes("connect");
      setStatus(connected ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => { loadConfig(); checkStatus(); }, []); // eslint-disable-line

  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="Configure a conexão ChatPro e gerencie envios automáticos."
        actions={
          <Badge variant="outline" className={
            status === "connected" ? "border-emerald-500 text-emerald-700 bg-emerald-50" :
            status === "waiting_qr" ? "border-amber-500 text-amber-700 bg-amber-50" :
            "border-red-400 text-red-700 bg-red-50"
          }>
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {status === "connected" ? "Conectado" : status === "waiting_qr" ? "Aguardando QR" : "Desconectado"}
          </Badge>
        }
      />

      <Tabs defaultValue="config">
        <TabsList className="grid w-full sm:w-auto grid-cols-4 sm:inline-grid">
          <TabsTrigger value="config"><Settings className="h-4 w-4 mr-2" />Config</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-2" />QR Code</TabsTrigger>
          <TabsTrigger value="test"><Send className="h-4 w-4 mr-2" />Teste</TabsTrigger>
          <TabsTrigger value="list"><ListChecks className="h-4 w-4 mr-2" />Envios</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-5">
          <div className="rounded-2xl border bg-card p-5 grid gap-4 max-w-3xl">
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
              <Label className="text-xs font-semibold">Template (variáveis: {"{{nome}} {{tratamento}} {{data}} {{hora}}"})</Label>
              <Textarea rows={8} value={config.message_template} onChange={(e) => setConfig({ ...config, message_template: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  setBusy("save");
                  try { await call("save_config", config); toast({ title: "Configuração salva" }); }
                  catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
                  finally { setBusy(null); }
                }}
                disabled={busy === "save"}
              >
                {busy === "save" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={checkStatus} disabled={busy === "status"}>
                {busy === "status" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Verificar status
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="qr" className="mt-5">
          <div className="rounded-2xl border bg-card p-8 grid place-items-center gap-4 max-w-3xl">
            <div className="grid place-items-center h-64 w-64 rounded-2xl border-2 border-dashed border-border bg-muted/40 overflow-hidden">
              {qr ? <img src={qr} alt="QR Code ChatPro" className="h-60 w-60 object-contain" /> : (
                <div className="text-center px-4">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Clique para gerar</p>
                </div>
              )}
            </div>
            <Button
              onClick={async () => {
                setBusy("qr");
                try {
                  const data = await call("get_qr");
                  const raw = data?.data;
                  const src = raw?.qrcode || raw?.qrCode || raw?.qr || (raw?.base64 ? `data:image/png;base64,${raw.base64}` : null) || raw?.url || null;
                  if (src) { setQr(src); setStatus("waiting_qr"); toast({ title: "QR gerado" }); }
                  else toast({ title: "Sem QR", description: "Talvez já esteja conectado.", variant: "destructive" });
                } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
                finally { setBusy(null); }
              }}
              disabled={busy === "qr"}
            >
              {busy === "qr" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              Gerar QR Code
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="test" className="mt-5">
          <div className="rounded-2xl border bg-card p-5 grid gap-4 max-w-2xl">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Número (com DDD)</Label>
              <Input placeholder="(27) 99999-0000" value={testNumber} onChange={(e) => setTestNumber(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Mensagem</Label>
              <Textarea rows={4} value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
            </div>
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
              className="w-fit"
            >
              {busy === "send" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar teste
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-5">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-display text-base">Últimos envios</h3>
                <p className="text-xs text-muted-foreground">50 mais recentes</p>
              </div>
              <Button
                variant="outline" size="sm"
                onClick={async () => {
                  setBusy("list");
                  try { const data = await call("list_appointments"); setAppointments(data?.appointments ?? []); }
                  catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
                  finally { setBusy(null); }
                }}
              >
                {busy === "list" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Atualizar
              </Button>
            </div>
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Clique em "Atualizar" para carregar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-5 py-3">Data</th>
                      <th className="text-left px-5 py-3">Nome</th>
                      <th className="text-left px-5 py-3">WhatsApp</th>
                      <th className="text-left px-5 py-3">Tratamento</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Quando</th>
                      <th className="text-left px-5 py-3">Envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-t hover:bg-muted/30">
                        <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</td>
                        <td className="px-5 py-3 font-medium">{a.name}</td>
                        <td className="px-5 py-3">{a.phone}</td>
                        <td className="px-5 py-3">{a.treatment}</td>
                        <td className="px-5 py-3 hidden md:table-cell">{a.appointment_date} {a.appointment_time}</td>
                        <td className="px-5 py-3">
                          {a.whatsapp_sent
                            ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Enviado</Badge>
                            : <Badge variant="outline" className="border-amber-300 text-amber-700">Pendente</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
