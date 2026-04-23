import { useEffect, useState } from "react";
import { Loader2, Lock, Settings, QrCode, Activity, Send, Save, RefreshCw, ListChecks } from "lucide-react";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/layout/SiteLayout";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "disconnected" | "waiting_qr" | "connected";

const ADMIN_KEY = "levii_admin_pwd";

export default function Config() {
  const [pwd, setPwd] = useState<string | null>(() => sessionStorage.getItem(ADMIN_KEY));
  const [pwdInput, setPwdInput] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  if (!pwd) {
    return (
      <SiteLayout>
        <SEO title="Painel administrativo — Clínica Levii" description="Configurações da integração WhatsApp." />
        <PageHero eyebrow="Restrito" title="Painel administrativo" subtitle="Acesso exclusivo à equipe da Clínica Levii." />
        <section className="section">
          <div className="container-edge max-w-md">
            <Card className="card-elevated">
              <CardHeader>
                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary-soft text-primary mb-3">
                  <Lock className="h-5 w-5" />
                </div>
                <CardTitle className="font-display">Acesso restrito</CardTitle>
                <CardDescription>Informe a senha de administrador para continuar.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setPwdLoading(true);
                    // Tenta uma chamada de validação (get_config)
                    const { data, error } = await supabase.functions.invoke("chatpro-admin", {
                      body: { action: "get_config", password: pwdInput },
                    });
                    setPwdLoading(false);
                    if (error || (data && data.error)) {
                      toast({ title: "Senha incorreta", description: "Tente novamente.", variant: "destructive" });
                      return;
                    }
                    sessionStorage.setItem(ADMIN_KEY, pwdInput);
                    setPwd(pwdInput);
                  }}
                  className="grid gap-3"
                >
                  <Label htmlFor="pwd" className="text-xs font-semibold">Senha</Label>
                  <Input id="pwd" type="password" value={pwdInput} onChange={(e) => setPwdInput(e.target.value)} autoFocus />
                  <Button type="submit" disabled={pwdLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {pwdLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validando…</> : "Entrar"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Senha inicial: <code className="bg-muted px-1.5 py-0.5 rounded">levii2025</code> — pode ser alterada via secret <code>ADMIN_PASSWORD</code>.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return <ConfigPanel password={pwd} />;
}

function ConfigPanel({ password }: { password: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [statusDetail, setStatusDetail] = useState<string>("");
  const [qr, setQr] = useState<string | null>(null);
  const [config, setConfig] = useState({
    instance_code: "",
    token: "",
    endpoint: "",
    message_template: "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Teste de integração — Clínica Levii ✅");

  const call = async (action: string, payload?: any) => {
    const { data, error } = await supabase.functions.invoke("chatpro-admin", {
      body: { action, password, payload },
    });
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
      const connected =
        raw?.status === "connected" ||
        raw?.connected === true ||
        String(raw?.state ?? "").toLowerCase().includes("connect");
      setStatus(connected ? "connected" : "disconnected");
      setStatusDetail(JSON.stringify(raw, null, 2));
    } catch (e: any) {
      setStatus("disconnected");
      toast({ title: "Status indisponível", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => { loadConfig(); checkStatus(); }, []); // eslint-disable-line

  return (
    <SiteLayout>
      <SEO title="Configuração ChatPro — Clínica Levii" description="Painel administrativo." />
      <PageHero
        eyebrow="Painel administrativo"
        title="Integração WhatsApp (ChatPro)"
        subtitle="Configure a conexão, escaneie o QR Code e gerencie o envio automático de confirmações."
      >
        <Badge
          variant="outline"
          className={
            status === "connected" ? "border-success text-success bg-success/10" :
            status === "waiting_qr" ? "border-warning text-warning bg-warning/10" :
            "border-destructive text-destructive bg-destructive/10"
          }
        >
          <Activity className="h-3.5 w-3.5 mr-1.5" />
          {status === "connected" ? "Conectado" : status === "waiting_qr" ? "Aguardando QR" : "Desconectado"}
        </Badge>
      </PageHero>

      <section className="section">
        <div className="container-edge max-w-5xl">
          <Tabs defaultValue="config">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 sm:inline-grid">
              <TabsTrigger value="config"><Settings className="h-4 w-4 mr-2" />Config</TabsTrigger>
              <TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-2" />QR Code</TabsTrigger>
              <TabsTrigger value="test"><Send className="h-4 w-4 mr-2" />Teste</TabsTrigger>
              <TabsTrigger value="list"><ListChecks className="h-4 w-4 mr-2" />Agendamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="mt-6">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-display">Credenciais ChatPro</CardTitle>
                  <CardDescription>Salve com segurança. Nada é exposto no frontend.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Endpoint base</Label>
                    <Input value={config.endpoint} onChange={(e) => setConfig({ ...config, endpoint: e.target.value })} placeholder="https://v5.chatpro.com.br/chatpro-xxxx" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold">Código da instância</Label>
                      <Input value={config.instance_code} onChange={(e) => setConfig({ ...config, instance_code: e.target.value })} placeholder="chatpro-xxxxxxx" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold">Token</Label>
                      <Input type="password" value={config.token} onChange={(e) => setConfig({ ...config, token: e.target.value })} placeholder="••••••••••••" />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Template da mensagem (variáveis: {"{{nome}} {{tratamento}} {{data}} {{hora}}"})</Label>
                    <Textarea rows={8} value={config.message_template} onChange={(e) => setConfig({ ...config, message_template: e.target.value })} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={async () => {
                        setBusy("save");
                        try {
                          await call("save_config", config);
                          toast({ title: "Configuração salva", description: "Agora gere o QR e escaneie." });
                        } catch (e: any) {
                          toast({ title: "Erro", description: e.message, variant: "destructive" });
                        } finally { setBusy(null); }
                      }}
                      disabled={busy === "save"}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {busy === "save" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar configuração
                    </Button>
                    <Button variant="outline" onClick={checkStatus} disabled={busy === "status"}>
                      {busy === "status" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Verificar status
                    </Button>
                  </div>

                  {statusDetail && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Resposta crua do ChatPro</summary>
                      <pre className="mt-2 bg-muted/60 rounded-lg p-3 overflow-auto">{statusDetail}</pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr" className="mt-6">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-display">Conectar via QR Code</CardTitle>
                  <CardDescription>WhatsApp do celular &gt; Aparelhos conectados &gt; Conectar aparelho.</CardDescription>
                </CardHeader>
                <CardContent className="grid place-items-center gap-5 py-8">
                  <div className="grid place-items-center h-64 w-64 rounded-2xl border-2 border-dashed border-border bg-muted/40 overflow-hidden">
                    {qr ? (
                      <img src={qr} alt="QR Code ChatPro" className="h-60 w-60 object-contain" />
                    ) : (
                      <div className="text-center px-4">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Clique abaixo para gerar</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={async () => {
                      setBusy("qr");
                      try {
                        const data = await call("get_qr");
                        const raw = data?.data;
                        // ChatPro pode retornar { qrcode: "data:image..." } ou { base64: "..." } ou { url: "..." }
                        const src =
                          raw?.qrcode ||
                          raw?.qrCode ||
                          raw?.qr ||
                          (raw?.base64 ? `data:image/png;base64,${raw.base64}` : null) ||
                          raw?.url || null;
                        if (src) {
                          setQr(src);
                          setStatus("waiting_qr");
                          toast({ title: "QR gerado", description: "Escaneie em até 60s." });
                        } else {
                          toast({ title: "Sem QR", description: "Talvez já esteja conectado. Verifique o status.", variant: "destructive" });
                          console.log("Resposta QR:", raw);
                        }
                      } catch (e: any) {
                        toast({ title: "Erro", description: e.message, variant: "destructive" });
                      } finally { setBusy(null); }
                    }}
                    disabled={busy === "qr"}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {busy === "qr" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                    Gerar QR Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={checkStatus}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Verificar conexão
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="font-display">Enviar mensagem de teste</CardTitle>
                  <CardDescription>Verifique se a integração está funcionando.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
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
                        if (data?.ok) toast({ title: "Mensagem enviada!", description: "Confira o WhatsApp do destinatário." });
                        else toast({ title: "Falhou", description: JSON.stringify(data?.data ?? {}), variant: "destructive" });
                      } catch (e: any) {
                        toast({ title: "Erro", description: e.message, variant: "destructive" });
                      } finally { setBusy(null); }
                    }}
                    disabled={busy === "send" || !testNumber}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-fit"
                  >
                    {busy === "send" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar teste
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <Card className="card-elevated">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-display">Últimos agendamentos</CardTitle>
                    <CardDescription>50 mais recentes</CardDescription>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={async () => {
                      setBusy("list");
                      try {
                        const data = await call("list_appointments");
                        setAppointments(data?.appointments ?? []);
                      } catch (e: any) {
                        toast({ title: "Erro", description: e.message, variant: "destructive" });
                      } finally { setBusy(null); }
                    }}
                  >
                    {busy === "list" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Atualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Clique em "Atualizar" para carregar.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground border-b">
                            <th className="py-2 pr-3">Data</th>
                            <th className="py-2 pr-3">Nome</th>
                            <th className="py-2 pr-3">WhatsApp</th>
                            <th className="py-2 pr-3">Tratamento</th>
                            <th className="py-2 pr-3">Quando</th>
                            <th className="py-2">WhatsApp ✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((a) => (
                            <tr key={a.id} className="border-b border-border/50">
                              <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</td>
                              <td className="py-2 pr-3 font-medium">{a.name}</td>
                              <td className="py-2 pr-3">{a.phone}</td>
                              <td className="py-2 pr-3">{a.treatment}</td>
                              <td className="py-2 pr-3">{a.appointment_date} {a.appointment_time}</td>
                              <td className="py-2">
                                {a.whatsapp_sent
                                  ? <Badge className="bg-success/15 text-success border-success/30">Enviado</Badge>
                                  : <Badge variant="outline" className="border-warning text-warning">Pendente</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}
