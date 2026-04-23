import { useState } from "react";
import { Building2, Clock, Plug, Users, Palette, Webhook, Key, UserCircle2 } from "lucide-react";
import PageHeader from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useClinicSettings as useSettings, useUpsertSetting } from "@/admin/hooks/useSettings";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "general", label: "Geral", icon: Building2 },
  { key: "hours", label: "Horários", icon: Clock },
  { key: "integrations", label: "Integrações", icon: Plug },
  { key: "client_area", label: "Área do Cliente", icon: UserCircle2 },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "users", label: "Usuários", icon: Users },
  { key: "webhooks", label: "Webhooks", icon: Webhook },
  { key: "api", label: "API & chaves", icon: Key },
] as const;

export default function AdminConfiguracoes() {
  const { data: settings = {} } = useSettings();
  const upsert = useUpsertSetting();
  const [section, setSection] = useState<typeof SECTIONS[number]["key"]>("general");

  function get(key: string): any { return (settings as any)[key] ?? {}; }
  async function save(key: string, value: Record<string, any>) {
    try {
      await upsert.mutateAsync({ key, value });
      toast({ title: "Configurações salvas" });
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
  }

  return (
    <>
      <PageHeader title="Configurações" description="Gerencie preferências, integrações e usuários da clínica." />

      {/* Tabs no topo (horizontal, scroll em mobile) */}
      <div className="admin-card mb-4 p-1.5 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {section === "general" && <SectionGeneral initial={get("general")} onSave={(v) => save("general", v)} />}
        {section === "hours" && <SectionHours initial={get("hours")} onSave={(v) => save("hours", v)} />}
        {section === "integrations" && <SectionIntegrations initial={get("integrations")} onSave={(v) => save("integrations", v)} />}
        {section === "client_area" && <SectionClientArea initial={get("client_area")} onSave={(v) => save("client_area", v)} />}
        {section === "branding" && <SectionBranding initial={get("branding")} onSave={(v) => save("branding", v)} />}
        {section === "users" && <SectionInfo title="Usuários & permissões" body="Gerencie usuários administradores. Para adicionar novos usuários, use o painel de autenticação na sua área de Cloud." />}
        {section === "webhooks" && <SectionInfo title="Webhooks" body="Em breve: cadastre URLs externas para receber eventos da clínica (agendamento criado, status atualizado, etc.) com assinatura HMAC." />}
        {section === "api" && <SectionInfo title="API & chaves" body="Em breve: gere chaves de API para integrações externas com a clínica." />}
      </div>
    </>
  );
}

function SectionCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; }) {
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

function SectionHours({ initial, onSave }: any) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const [v, setV] = useState<Record<string, { open: string; close: string; closed: boolean }>>(initial?.days || days.reduce((a: any, d) => ({ ...a, [d]: { open: "08:00", close: "18:00", closed: d === "Dom" } }), {}));
  return (
    <SectionCard title="Horário de funcionamento" description="Define disponibilidade padrão da agenda." footer={<Button onClick={() => onSave({ days: v })}>Salvar alterações</Button>}>
      {days.map((d) => (
        <div key={d} className="flex items-center gap-3 py-1">
          <span className="w-12 text-sm font-medium">{d}</span>
          <Switch checked={!v[d]?.closed} onCheckedChange={(on) => setV({ ...v, [d]: { ...v[d], closed: !on } })} />
          <Input type="time" disabled={v[d]?.closed} value={v[d]?.open ?? "08:00"} onChange={(e) => setV({ ...v, [d]: { ...v[d], open: e.target.value } })} className="h-9 w-32" />
          <span className="text-muted-foreground">—</span>
          <Input type="time" disabled={v[d]?.closed} value={v[d]?.close ?? "18:00"} onChange={(e) => setV({ ...v, [d]: { ...v[d], close: e.target.value } })} className="h-9 w-32" />
        </div>
      ))}
    </SectionCard>
  );
}

function SectionIntegrations({ initial, onSave }: any) {
  const [v, setV] = useState({ clinicorp_endpoint: "", clinicorp_clinic_id: "", auto_sync: false, ...initial });
  return (
    <SectionCard
      title="Integrações"
      description="Conecte-se a sistemas externos como Clinicorp."
      footer={<div className="flex gap-2"><Button variant="outline">Testar conexão</Button><Button onClick={() => onSave(v)}>Salvar</Button></div>}
    >
      <div className="rounded-xl border border-[hsl(var(--admin-border))] p-5 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold">Clinicorp</p>
            <p className="text-xs text-muted-foreground">Sincronização de agendamentos e pacientes.</p>
          </div>
          <Badge variant="outline">Aguardando credenciais</Badge>
        </div>
        <div className="space-y-3">
          <div><Label className="text-xs">Endpoint da API</Label><Input value={v.clinicorp_endpoint} onChange={(e) => setV({ ...v, clinicorp_endpoint: e.target.value })} placeholder="https://api.clinicorp.com" /></div>
          <div><Label className="text-xs">ID da clínica</Label><Input value={v.clinicorp_clinic_id} onChange={(e) => setV({ ...v, clinicorp_clinic_id: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={v.auto_sync} onCheckedChange={(b) => setV({ ...v, auto_sync: b })} /><span className="text-sm">Sincronização automática (a cada 15min)</span></div>
          <p className="text-[11px] text-muted-foreground">O token de acesso será solicitado de forma segura ao habilitar a integração.</p>
        </div>
      </div>
    </SectionCard>
  );
}

function SectionClientArea({ initial, onSave }: any) {
  const [v, setV] = useState({
    enabled: false,
    require_email_verification: true,
    allow_self_registration: false,
    show_appointments: true,
    show_history: true,
    show_documents: false,
    show_invoices: true,
    allow_reschedule: true,
    allow_cancel: true,
    welcome_title: "Bem-vindo à sua área exclusiva",
    welcome_text: "Acompanhe seus agendamentos, histórico de tratamentos e mantenha seus dados sempre atualizados.",
    portal_color: "#1e40af",
    ...initial,
  });

  return (
    <div className="space-y-4">
      <SectionCard
        title="Ativação da Área do Cliente"
        description="Permite que pacientes acessem um portal exclusivo para acompanhar agendamentos e histórico."
        footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}
      >
        <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-muted/30 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm flex items-center gap-2">
              Portal do Paciente
              <Badge variant={v.enabled ? "default" : "outline"}>{v.enabled ? "Ativo" : "Desativado"}</Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Quando ativo, pacientes podem fazer login em <code className="text-[11px] bg-background px-1.5 py-0.5 rounded">/area-cliente</code>.</p>
          </div>
          <Switch checked={v.enabled} onCheckedChange={(b) => setV({ ...v, enabled: b })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <ToggleRow label="Verificação de e-mail obrigatória" desc="Paciente precisa confirmar o e-mail antes de acessar." checked={v.require_email_verification} onChange={(b) => setV({ ...v, require_email_verification: b })} />
          <ToggleRow label="Cadastro próprio" desc="Permitir que pacientes criem suas próprias contas." checked={v.allow_self_registration} onChange={(b) => setV({ ...v, allow_self_registration: b })} />
        </div>
      </SectionCard>

      <SectionCard
        title="Funcionalidades disponíveis"
        description="Selecione o que cada paciente pode visualizar e fazer no portal."
        footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ToggleRow label="Meus agendamentos" desc="Lista de consultas futuras e passadas." checked={v.show_appointments} onChange={(b) => setV({ ...v, show_appointments: b })} />
          <ToggleRow label="Histórico de tratamentos" desc="Tratamentos já realizados e em andamento." checked={v.show_history} onChange={(b) => setV({ ...v, show_history: b })} />
          <ToggleRow label="Documentos e exames" desc="Upload e download de documentos clínicos." checked={v.show_documents} onChange={(b) => setV({ ...v, show_documents: b })} />
          <ToggleRow label="Financeiro / faturas" desc="Consultar pagamentos e boletos." checked={v.show_invoices} onChange={(b) => setV({ ...v, show_invoices: b })} />
          <ToggleRow label="Reagendar consulta" desc="Paciente pode propor novo horário." checked={v.allow_reschedule} onChange={(b) => setV({ ...v, allow_reschedule: b })} />
          <ToggleRow label="Cancelar consulta" desc="Paciente pode cancelar diretamente pelo portal." checked={v.allow_cancel} onChange={(b) => setV({ ...v, allow_cancel: b })} />
        </div>
      </SectionCard>

      <SectionCard
        title="Personalização do portal"
        description="Mensagem de boas-vindas e cor principal exibida ao paciente."
        footer={<Button onClick={() => onSave(v)}>Salvar alterações</Button>}
      >
        <div><Label className="text-xs">Título de boas-vindas</Label><Input value={v.welcome_title} onChange={(e) => setV({ ...v, welcome_title: e.target.value })} /></div>
        <div><Label className="text-xs">Texto de apresentação</Label><Textarea rows={3} value={v.welcome_text} onChange={(e) => setV({ ...v, welcome_text: e.target.value })} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label className="text-xs">Cor de destaque do portal</Label><Input type="color" value={v.portal_color} onChange={(e) => setV({ ...v, portal_color: e.target.value })} className="h-10 w-full" /></div>
          <div className="rounded-lg border border-[hsl(var(--admin-border))] bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-center">
            URL do portal: <code className="ml-2 bg-background px-1.5 py-0.5 rounded">/area-cliente</code>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (b: boolean) => void; }) {
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

function SectionInfo({ title, body }: { title: string; body: string }) {
  return (
    <SectionCard title={title}><p className="text-sm text-muted-foreground">{body}</p></SectionCard>
  );
}
