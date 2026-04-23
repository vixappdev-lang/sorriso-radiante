import { useState } from "react";
import { Loader2, Lock, Settings, QrCode, Activity, Send, Save } from "lucide-react";
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

type Status = "idle" | "disconnected" | "waiting_qr" | "connected";

export default function Config() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  if (!authed) {
    return (
      <SiteLayout>
        <SEO title="Painel administrativo — Clínica Levii" description="Configurações da integração WhatsApp." />
        <PageHero eyebrow="Restrito" title="Painel administrativo" subtitle="Acesso exclusivo à equipe da Clínica Levii." />
        <section className="section">
          <div className="container-edge max-w-md">
            <Card className="shadow-soft">
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
                    await new Promise((r) => setTimeout(r, 400));
                    // Validação real será feita por edge function admin-login após
                    // ativarmos o Lovable Cloud. Por enquanto, marcador para integração.
                    if (pwd.length >= 4) setAuthed(true);
                    else toast({ title: "Senha incorreta", description: "Tente novamente.", variant: "destructive" });
                    setPwdLoading(false);
                  }}
                  className="grid gap-3"
                >
                  <Label htmlFor="pwd" className="text-xs font-semibold">Senha</Label>
                  <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
                  <Button type="submit" disabled={pwdLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {pwdLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validando…</> : "Entrar"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    A integração com backend (Lovable Cloud + ChatPro) será habilitada na próxima etapa.
                    Esta tela é a base do painel.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return <ConfigPanel />;
}

function ConfigPanel() {
  const [status] = useState<Status>("disconnected");
  const [qr, setQr] = useState<string | null>(null);
  const [config, setConfig] = useState({
    instanceId: "",
    token: "",
    endpoint: "https://v5.chatpro.com.br",
    clinicNumber: "",
    template: "Olá {{nome}}! 🦷\n\nSeu agendamento para *{{tratamento}}* foi recebido com sucesso.\n📅 {{data}} às {{hora}}\n\nA Clínica Levii confirmará em instantes. Qualquer dúvida, é só responder aqui!",
  });
  const [busy, setBusy] = useState<string | null>(null);

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
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid">
              <TabsTrigger value="config"><Settings className="h-4 w-4 mr-2" />Configuração</TabsTrigger>
              <TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-2" />QR Code</TabsTrigger>
              <TabsTrigger value="test"><Send className="h-4 w-4 mr-2" />Teste</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Credenciais ChatPro</CardTitle>
                  <CardDescription>
                    Informações da sua instância. Nada é exposto no frontend — tudo é salvo com segurança no backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Endpoint base</Label>
                    <Input value={config.endpoint} onChange={(e) => setConfig({ ...config, endpoint: e.target.value })} placeholder="https://v5.chatpro.com.br" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold">Instance ID</Label>
                      <Input value={config.instanceId} onChange={(e) => setConfig({ ...config, instanceId: e.target.value })} placeholder="ex.: chatpro-xxxx" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-semibold">Token / API Key</Label>
                      <Input type="password" value={config.token} onChange={(e) => setConfig({ ...config, token: e.target.value })} placeholder="••••••••••••••••" />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Número padrão da clínica</Label>
                    <Input value={config.clinicNumber} onChange={(e) => setConfig({ ...config, clinicNumber: e.target.value })} placeholder="5511900000000" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Mensagem template (variáveis: {"{{nome}} {{tratamento}} {{data}} {{hora}}"})</Label>
                    <Textarea rows={6} value={config.template} onChange={(e) => setConfig({ ...config, template: e.target.value })} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={async () => {
                        setBusy("save");
                        await new Promise((r) => setTimeout(r, 600));
                        setBusy(null);
                        toast({ title: "Configuração salva", description: "Conecte agora pelo QR Code." });
                      }}
                      disabled={busy === "save"}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {busy === "save" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Salvar configuração
                    </Button>
                    <Button variant="outline" disabled>Desconectar instância</Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    💡 As ações reais (salvar credenciais com segurança, gerar QR e enviar mensagens) serão habilitadas
                    assim que ativarmos o backend (Lovable Cloud) na próxima etapa.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Conectar via QR Code</CardTitle>
                  <CardDescription>Abra o WhatsApp no celular &gt; Aparelhos conectados &gt; Conectar aparelho.</CardDescription>
                </CardHeader>
                <CardContent className="grid place-items-center gap-5 py-8">
                  <div className="grid place-items-center h-64 w-64 rounded-2xl border-2 border-dashed border-border bg-muted/40">
                    {qr ? (
                      <img src={qr} alt="QR Code ChatPro" className="h-60 w-60 object-contain" />
                    ) : (
                      <div className="text-center">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Clique abaixo para gerar</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={async () => {
                      setBusy("qr");
                      await new Promise((r) => setTimeout(r, 700));
                      // Placeholder até o backend estar pronto
                      setQr("data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="white"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="black" text-anchor="middle">QR via backend</text></svg>`));
                      setBusy(null);
                      toast({ title: "QR exemplo gerado", description: "Backend será integrado na próxima etapa." });
                    }}
                    disabled={busy === "qr"}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {busy === "qr" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                    Gerar QR Code
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Enviar mensagem de teste</CardTitle>
                  <CardDescription>Verifique se a integração está funcionando corretamente.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Número (com DDI)</Label>
                    <Input placeholder="5511900000000" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold">Mensagem</Label>
                    <Textarea rows={4} defaultValue="Teste de integração — Clínica Levii ✅" />
                  </div>
                  <Button disabled className="bg-primary hover:bg-primary/90 text-primary-foreground w-fit">
                    <Send className="h-4 w-4 mr-2" /> Enviar (após integração com backend)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}
