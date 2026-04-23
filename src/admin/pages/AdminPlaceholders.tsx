import { Wallet, Megaphone, Star, Globe, BarChart3, Settings } from "lucide-react";
import ComingSoonPage from "@/admin/components/ComingSoonPage";

export const AdminFinanceiro = () => (
  <ComingSoonPage
    title="Financeiro"
    description="Gestão completa de pagamentos, orçamentos e relatórios financeiros."
    icon={Wallet}
    modules={[
      { label: "Pagamentos", hint: "Histórico e baixas" },
      { label: "Pendências", hint: "Em aberto e atrasados" },
      { label: "Orçamentos", hint: "Criação e envio" },
      { label: "Parcelamentos", hint: "Planos e cobranças" },
      { label: "Fluxo financeiro", hint: "Entradas e saídas" },
      { label: "Relatórios", hint: "DRE, recebíveis, comissões" },
    ]}
  />
);

export const AdminLeads = () => (
  <ComingSoonPage
    title="Leads & Captação"
    description="Funil comercial, follow-up e recuperação de pacientes inativos."
    icon={Megaphone}
    modules={[
      { label: "Novos contatos", hint: "Site, WhatsApp e indicações" },
      { label: "Origem do lead", hint: "Atribuição por canal" },
      { label: "Funil de conversão", hint: "Etapas e taxa" },
      { label: "Acompanhamento comercial", hint: "Tarefas e responsáveis" },
      { label: "Follow-up", hint: "Cadências automáticas" },
      { label: "Pacientes inativos", hint: "Reativação" },
    ]}
  />
);

export const AdminAvaliacoes = () => (
  <ComingSoonPage
    title="Avaliações & Reputação"
    description="Pedidos automáticos de review e monitoramento de presença local."
    icon={Star}
    modules={[
      { label: "Pedidos de avaliação", hint: "Após atendimento" },
      { label: "Reviews recebidas", hint: "Google e Doctoralia" },
      { label: "Reputação digital", hint: "Score e tendências" },
      { label: "Presença local", hint: "Google Business Profile" },
    ]}
  />
);

export const AdminSite = () => (
  <ComingSoonPage
    title="Site & Landing Pages"
    description="Páginas de captação, formulários e integração com tráfego pago."
    icon={Globe}
    modules={[
      { label: "Páginas de captação", hint: "Editor visual" },
      { label: "Formulários", hint: "Submissões e validação" },
      { label: "Campanhas", hint: "UTMs e testes A/B" },
      { label: "Promoções", hint: "Banners e cupons" },
      { label: "Tráfego pago", hint: "Meta Ads e Google Ads" },
    ]}
  />
);

export const AdminRelatorios = () => (
  <ComingSoonPage
    title="Relatórios"
    description="Performance mensal, conversão, faltas, cancelamentos e crescimento."
    icon={BarChart3}
    modules={[
      { label: "Performance mensal", hint: "Atendimentos e ticket médio" },
      { label: "Conversão", hint: "Lead → orçamento → fechado" },
      { label: "Faltas", hint: "Por profissional e período" },
      { label: "Cancelamentos", hint: "Motivos e taxa" },
      { label: "Retorno por campanha", hint: "ROI por canal" },
      { label: "Crescimento da clínica", hint: "MoM e YoY" },
    ]}
  />
);

export const AdminConfiguracoes = () => (
  <ComingSoonPage
    title="Configurações"
    description="Horários, feriados, integrações, usuários, branding e preferências."
    icon={Settings}
    modules={[
      { label: "Horários gerais", hint: "Agenda padrão" },
      { label: "Feriados", hint: "Calendário oficial" },
      { label: "Dias bloqueados", hint: "Recessos e folgas" },
      { label: "Integrações", hint: "WhatsApp, Google, Pix" },
      { label: "Usuários", hint: "Equipe interna" },
      { label: "Permissões", hint: "Papéis e acessos" },
      { label: "Branding", hint: "Logo, cores e tipografia" },
      { label: "Preferências gerais", hint: "Locale, fuso, moeda" },
    ]}
  />
);
