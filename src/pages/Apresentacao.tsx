import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Calendar, Users, Activity, Wallet, MessageCircle, Star,
  Globe, BarChart3, Settings, Megaphone, Stethoscope, Search, MapPin, ShieldCheck,
  Zap, TrendingUp, Target, Smartphone, Clock, AlertTriangle, EyeOff,
  PhoneOff, CalendarX, ThumbsDown, BellOff, FileX, MousePointerClick,
  CheckCircle2, ChartLine, Layers, Phone, Crown, Workflow, Award, Building2,
  Instagram, Lock, Infinity as InfinityIcon, KeyRound, Server, HandCoins, Rocket,
} from "lucide-react";
import SEO from "@/components/SEO";
import "./apresentacao/pres-styles.css";

/* ========================================================================
   /apresentacao  ·  Dossiê Comercial Premium  ·  LyneCloud
   Rota isolada. Não usa nem altera nenhum estilo/componente do projeto.
   Namespace: .pres-shell
   ======================================================================== */

const BRAND = "LyneCloud";
const WPP_NUMBER = "5527981120322";
const WPP_LINK = `https://wa.me/${WPP_NUMBER}?text=${encodeURIComponent(
  "Olá! Vim pela apresentação comercial da LyneCloud e quero entender como implantar a estrutura na minha clínica.",
)}`;

// ===== Hook reveal-on-scroll =====
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".pres-shell .pres-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ===== Animated number =====
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 900 }: { value: number; prefix?: string; suffix?: string; duration?: number; }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className="pres-tabular">{prefix}{display.toLocaleString("pt-BR")}{suffix}</span>;
}

// ===== Mockup com chrome macOS =====
function Mockup({ src, alt, url }: { src: string; alt: string; url: string }) {
  return (
    <div className="pres-mockup">
      <div className="pres-mockup-bar">
        <span className="pres-mockup-dot" style={{ background: "#ff5f57" }} />
        <span className="pres-mockup-dot" style={{ background: "#febc2e" }} />
        <span className="pres-mockup-dot" style={{ background: "#28c840" }} />
        <div className="pres-mockup-url">{url}</div>
      </div>
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}

// ===== Hero =====
function Hero() {
  return (
    <header className="pres-hero">
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 920 }}>
          <span className="pres-eyebrow">
            <Sparkles size={12} /> Dossiê comercial · Clínicas odontológicas
          </span>
          <h1 className="pres-h1" style={{ marginTop: 24, color: "white" }}>
            Sua clínica pode estar perdendo pacientes <span style={{ color: "hsl(38 80% 70%)" }}>todos os dias</span> sem perceber.
          </h1>
          <p className="pres-lead" style={{ marginTop: 24, color: "hsl(0 0% 100% / 0.75)", maxWidth: 760 }}>
            Site comercial premium, agendamento inteligente, painel administrativo completo
            e integração com Google. A estrutura digital usada por clínicas que dominam
            o mercado local, agora pronta para a sua.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 }}>
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="pres-btn pres-btn-primary">
              Solicitar demonstração <ArrowRight size={16} />
            </a>
            <a href="#solucao" className="pres-btn pres-btn-ghost">
              Ver solução completa
            </a>
          </div>

          {/* Selo Sem Mensalidade */}
          <div
            style={{
              marginTop: 28,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 999,
              background: "linear-gradient(135deg, hsl(152 60% 30% / 0.25), hsl(152 60% 40% / 0.10))",
              border: "1px solid hsl(152 70% 60% / 0.35)",
              backdropFilter: "blur(10px)",
            }}
          >
            <ShieldCheck size={16} color="hsl(152 70% 70%)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>
              Sem mensalidade. O painel é da clínica, para sempre.
            </span>
          </div>

          {/* KPIs de credibilidade */}
          <div
            style={{
              marginTop: 56,
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              maxWidth: 820,
            }}
          >
            {[
              { v: "+38%", l: "menos faltas com confirmação automática" },
              { v: "3x", l: "mais conversão com agendamento direto" },
              { v: "24/7", l: "captação sem depender da recepção" },
              { v: "100%", l: "controle financeiro e operacional" },
            ].map((k) => (
              <div
                key={k.l}
                style={{
                  background: "hsl(0 0% 100% / 0.04)",
                  border: "1px solid hsl(0 0% 100% / 0.10)",
                  borderRadius: 14,
                  padding: 18,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="pres-tabular" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em" }}>
                  {k.v}
                </div>
                <div style={{ fontSize: 12, color: "hsl(0 0% 100% / 0.65)", marginTop: 4, lineHeight: 1.4 }}>
                  {k.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

// ===== Problema =====
const PROBLEMS = [
  { icon: Clock, title: "Demora no atendimento", text: "Pacientes desistem em segundos quando não recebem resposta imediata pelo WhatsApp." },
  { icon: PhoneOff, title: "Dependência total do WhatsApp", text: "Sem agendamento próprio, qualquer falha humana custa pacientes reais." },
  { icon: CalendarX, title: "Agenda desorganizada", text: "Anotações em papel ou planilha geram confusão, retrabalho e horários perdidos." },
  { icon: AlertTriangle, title: "Conflitos de horário", text: "Dois pacientes para o mesmo horário queima credibilidade na primeira impressão." },
  { icon: MousePointerClick, title: "Baixa conversão de leads", text: "Sem funil estruturado, contatos quentes esfriam antes do fechamento." },
  { icon: Search, title: "Pouca autoridade no Google", text: "Quem não aparece nas buscas locais simplesmente não existe para o paciente." },
  { icon: ThumbsDown, title: "Falta de avaliações", text: "Sem prova social ativa, cada visitante pondera duas vezes antes de marcar." },
  { icon: EyeOff, title: "Resultados invisíveis", text: "Sem relatórios reais, decisões viram achismo e o crescimento estagna." },
  { icon: BellOff, title: "Pacientes que não retornam", text: "Sem reativação automática, a base de pacientes vira receita morta." },
  { icon: FileX, title: "Falta de controle comercial", text: "Sem CRM, leads se perdem entre conversas espalhadas em vários números." },
];

function Problema() {
  return (
    <section className="pres-section" id="problema" style={{ background: "hsl(var(--pres-surface))" }}>
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 760 }}>
          <span className="pres-eyebrow"><AlertTriangle size={12} /> O problema invisível</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            10 falhas estruturais que drenam o faturamento da clínica todo mês.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            Não é falta de pacientes. É falta de estrutura para capturar, organizar e converter quem já demonstrou interesse.
          </p>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 56,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {PROBLEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="pres-card pres-card-hover" style={{ padding: 24 }}>
              <div
                className="pres-icon-box"
                style={{
                  background: "hsl(var(--pres-danger) / 0.08)",
                  color: "hsl(var(--pres-danger))",
                  border: "1px solid hsl(var(--pres-danger) / 0.18)",
                }}
              >
                <Icon size={22} />
              </div>
              <h3 className="pres-h3" style={{ marginTop: 16, fontSize: 17 }}>{title}</h3>
              <p style={{ marginTop: 8, fontSize: 14, color: "hsl(var(--pres-text-2))", lineHeight: 1.55 }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Solução (3 pilares) =====
const PILLARS = [
  {
    icon: Globe,
    title: "Site comercial premium",
    subtitle: "Autoridade digital que converte na primeira visita.",
    bullets: [
      "Design profissional alinhado ao posicionamento da clínica",
      "SEO técnico e estrutura otimizada para Google",
      "Páginas de tratamento, equipe, depoimentos e contato",
      "Performance em mobile e velocidade de carregamento",
      "Integração nativa com agendamento e WhatsApp",
    ],
  },
  {
    icon: Calendar,
    title: "Agendamento inteligente",
    subtitle: "Funciona 24/7 sem depender da recepção.",
    bullets: [
      "Quiz multi-step que qualifica e converte",
      "Bloqueio automático de horários ocupados",
      "Confirmação e lembrete por WhatsApp",
      "Sincronização com agenda do profissional",
      "Auto-cancelamento de horários sem confirmação",
    ],
  },
  {
    icon: Layers,
    title: "Painel administrativo premium",
    subtitle: "Toda a operação da clínica em um só lugar.",
    bullets: [
      "Dashboard com KPIs em tempo real",
      "CRM comercial com funil Kanban de leads",
      "Pacientes, tratamentos, profissionais e financeiro",
      "Avaliações, automações e relatórios",
      "Configurações, integrações e controle de usuários",
    ],
  },
];

function Solucao() {
  return (
    <section className="pres-section" id="solucao">
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 760 }}>
          <span className="pres-eyebrow"><CheckCircle2 size={12} /> A solução</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            Três pilares que transformam atendimento em previsibilidade comercial.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            Não é um site. Não é um app. É a infraestrutura digital completa que toda clínica
            séria precisa para crescer com método.
          </p>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 56,
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {PILLARS.map(({ icon: Icon, title, subtitle, bullets }) => (
            <div key={title} className="pres-card pres-card-hover" style={{ padding: 32, display: "flex", flexDirection: "column" }}>
              <div
                className="pres-icon-box"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--pres-primary) / 0.12), hsl(var(--pres-primary) / 0.04))",
                  color: "hsl(var(--pres-primary))",
                  border: "1px solid hsl(var(--pres-primary) / 0.20)",
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                }}
              >
                <Icon size={26} />
              </div>
              <h3 className="pres-h3" style={{ marginTop: 20, fontSize: 22 }}>{title}</h3>
              <p style={{ marginTop: 6, fontSize: 14, color: "hsl(var(--pres-text-2))", lineHeight: 1.5 }}>
                {subtitle}
              </p>
              <div style={{ height: 1, background: "hsl(var(--pres-border))", margin: "20px 0" }} />
              <ul style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
                {bullets.map((b) => (
                  <li key={b} style={{ display: "flex", gap: 10, fontSize: 14, color: "hsl(var(--pres-text))", lineHeight: 1.5 }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0, color: "hsl(var(--pres-success))", marginTop: 2 }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Showcase com prints reais =====
const SHOTS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, file: "/apresentacao/dashboard.png", url: "lynecloud.com.br/admin/dashboard",
    title: "Visão completa em tempo real", desc: "KPIs operacionais, faturamento estimado, agendamentos do dia, taxa de confirmação e gráficos de performance, tudo em uma única tela." },
  { id: "agenda", label: "Agenda", icon: Calendar, file: "/apresentacao/agenda.png", url: "lynecloud.com.br/admin/agenda",
    title: "Agenda profissional sem conflitos", desc: "Visão por dia, semana ou mês, status colorido, encaixes, bloqueios e link público para o paciente agendar sozinho." },
  { id: "pacientes", label: "Pacientes", icon: Users, file: "/apresentacao/pacientes.png", url: "lynecloud.com.br/admin/pacientes",
    title: "Base de pacientes ativa e organizada", desc: "Histórico de visitas, tratamentos realizados, observações clínicas e ações rápidas de contato direto." },
  { id: "tratamentos", label: "Tratamentos", icon: Stethoscope, file: "/apresentacao/tratamentos.png", url: "lynecloud.com.br/admin/tratamentos",
    title: "Catálogo controlado de procedimentos", desc: "Valores, duração, profissional responsável, status e ranking dos mais procurados." },
  { id: "profissionais", label: "Profissionais", icon: Users, file: "/apresentacao/profissionais.png", url: "lynecloud.com.br/admin/profissionais",
    title: "Equipe gerenciada de ponta a ponta", desc: "CRO, especialidades, agenda individual e produtividade por profissional." },
  { id: "financeiro", label: "Financeiro", icon: Wallet, file: "/apresentacao/financeiro.png", url: "lynecloud.com.br/admin/financeiro",
    title: "Controle financeiro real, não planilha", desc: "A receber, recebido no mês, atrasados, ticket médio e crescimento mês contra mês." },
  { id: "leads", label: "Leads & Captação", icon: Target, file: "/apresentacao/leads.png", url: "lynecloud.com.br/admin/leads",
    title: "Funil comercial estilo CRM", desc: "Kanban de leads do primeiro contato ao fechamento, com pipeline e taxa de conversão." },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, file: "/apresentacao/whatsapp.png", url: "lynecloud.com.br/admin/whatsapp",
    title: "Automação de comunicação", desc: "Disparos automáticos de confirmação, lembrete 24h, pós-consulta e campanhas em massa via VPS própria ou ChatPro." },
  { id: "avaliacoes", label: "Avaliações", icon: Star, file: "/apresentacao/avaliacoes.png", url: "lynecloud.com.br/admin/avaliacoes",
    title: "Reputação que vende sozinha", desc: "Convites automáticos, NPS, distribuição de notas e gestão de respostas para Google e site." },
  { id: "site", label: "Site & Landing", icon: Globe, file: "/apresentacao/site.png", url: "lynecloud.com.br/admin/site",
    title: "Site editável sem programador", desc: "Hero, sobre, contato, rodapé e promoções, tudo gerenciado em blocos pelo painel." },
  { id: "relatorios", label: "Relatórios", icon: ChartLine, file: "/apresentacao/relatorios.png", url: "lynecloud.com.br/admin/relatorios",
    title: "Decisões baseadas em dados", desc: "Performance mensal, exportação CSV e métricas operacionais e comerciais auditáveis." },
  { id: "configuracoes", label: "Configurações", icon: Settings, file: "/apresentacao/configuracoes.png", url: "lynecloud.com.br/admin/configuracoes",
    title: "Configuração total da operação", desc: "Dados da clínica, horários, integrações, área do cliente, branding, usuários, webhooks e API." },
];

function Showcase() {
  const [active, setActive] = useState(SHOTS[0].id);
  const current = SHOTS.find((s) => s.id === active) ?? SHOTS[0];

  return (
    <section className="pres-section" id="showcase" style={{ background: "hsl(var(--pres-surface))" }}>
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 820 }}>
          <span className="pres-eyebrow"><Layers size={12} /> Demonstração visual</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            O painel real, em produção, exibindo dados reais.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            Cada tela abaixo é uma captura direta do sistema. Sem mockup, sem ilustração genérica.
            Software pronto para implantação na sua clínica.
          </p>
        </div>

        <div className="pres-reveal" style={{ marginTop: 40 }}>
          <div className="pres-tabs" style={{ overflowX: "auto" }}>
            {SHOTS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`pres-tab ${active === id ? "is-active" : ""}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          key={current.id}
          className="pres-reveal is-visible"
          style={{
            marginTop: 32,
            display: "grid",
            gap: 32,
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          <div style={{ display: "grid", gap: 32, gridTemplateColumns: "minmax(0, 1fr)", alignItems: "start" }}>
            <div className="pres-shell-mockup-wrap" style={{ animation: "step-fade .4s ease both" }}>
              <Mockup src={current.file} alt={`Tela ${current.label}`} url={current.url} />
            </div>
            <div style={{ paddingTop: 8 }}>
              <h3 className="pres-h3" style={{ fontSize: 24 }}>{current.title}</h3>
              <p style={{ marginTop: 12, fontSize: 16, color: "hsl(var(--pres-text-2))", lineHeight: 1.6 }}>
                {current.desc}
              </p>
              <div
                style={{
                  marginTop: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "white",
                  border: "1px solid hsl(var(--pres-border))",
                  fontSize: 12,
                  color: "hsl(var(--pres-text-2))",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--pres-success))" }} />
                Em produção · Captura real do sistema
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .pres-shell #showcase > .pres-container > div:last-child > div {
            grid-template-columns: 1.4fr 1fr;
            gap: 56px !important;
          }
        }
      `}</style>
    </section>
  );
}

// ===== Google =====
function Google() {
  return (
    <section className="pres-section" id="google">
      <div className="pres-container">
        <div
          style={{
            display: "grid",
            gap: 56,
            gridTemplateColumns: "minmax(0, 1fr)",
            alignItems: "center",
          }}
        >
          <div className="pres-reveal">
            <span className="pres-eyebrow"><Search size={12} /> Autoridade no Google</span>
            <h2 className="pres-h2" style={{ marginTop: 20 }}>
              Quem busca por dentista na sua cidade encontra você ou o concorrente.
            </h2>
            <p className="pres-lead" style={{ marginTop: 16 }}>
              92% dos pacientes pesquisam no Google antes de marcar uma consulta. Sem presença local
              forte, sua clínica é invisível para a maioria deles.
            </p>

            <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
              {[
                { icon: MapPin, title: "Google Maps & Perfil da Empresa", text: "Aparição destacada nas buscas locais e no mapa." },
                { icon: Star, title: "Avaliações reais e responsivas", text: "Prova social ativa que decide o paciente em segundos." },
                { icon: TrendingUp, title: "SEO local técnico", text: "Estrutura, conteúdo e velocidade que o Google premia." },
                { icon: Award, title: "Reputação acumulada", text: "Cada paciente satisfeito vira ativo digital permanente." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    className="pres-icon-box"
                    style={{
                      background: "hsl(var(--pres-primary) / 0.08)",
                      color: "hsl(var(--pres-primary))",
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
                    <div style={{ fontSize: 14, color: "hsl(var(--pres-text-2))", marginTop: 2 }}>{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pres-reveal pres-card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "hsl(var(--pres-surface-2))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Search size={14} color="hsl(var(--pres-text-2))" />
              </div>
              <div style={{ flex: 1, padding: "8px 14px", border: "1px solid hsl(var(--pres-border))", borderRadius: 999, fontSize: 13, color: "hsl(var(--pres-text-2))" }}>
                dentista perto de mim
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { name: "Sua Clínica · Odontologia Premium", rating: 4.9, reviews: 287, badge: "PATROCINADO" },
                { name: "Sorriso & Estética Dental", rating: 4.6, reviews: 142 },
                { name: "OdontoCenter Local", rating: 4.2, reviews: 64 },
              ].map((r, i) => (
                <div
                  key={r.name}
                  style={{
                    padding: 14,
                    border: i === 0 ? "1.5px solid hsl(var(--pres-primary) / 0.4)" : "1px solid hsl(var(--pres-border))",
                    borderRadius: 12,
                    background: i === 0 ? "hsl(var(--pres-primary) / 0.04)" : "white",
                  }}
                >
                  {r.badge && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: "hsl(var(--pres-primary))", letterSpacing: "0.1em" }}>
                      {r.badge}
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: r.badge ? 4 : 0 }}>{r.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ color: "hsl(var(--pres-gold))", fontWeight: 600, fontSize: 13 }}>{r.rating}</span>
                    <div style={{ display: "flex", gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={12} fill="hsl(var(--pres-gold))" stroke="hsl(var(--pres-gold))" />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: "hsl(var(--pres-text-3))" }}>· {r.reviews} avaliações</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: "hsl(var(--pres-surface-2))", fontSize: 12, color: "hsl(var(--pres-text-2))", textAlign: "center" }}>
              <strong style={{ color: "hsl(var(--pres-text))" }}>+87%</strong> dos cliques vão para os 3 primeiros resultados.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .pres-shell #google > .pres-container > div {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </section>
  );
}

// ===== Anúncios & Marketing (NOVA SEÇÃO) =====
function Anuncios() {
  const channels = [
    { icon: Instagram, title: "Instagram & Reels", text: "Conteúdo de autoridade que constrói marca local e gera conversa direta no direct." },
    { icon: Megaphone, title: "Meta Ads (Facebook + Instagram)", text: "Anúncios segmentados por bairro, idade e interesse no tratamento certo." },
    { icon: Search, title: "Google Ads de intenção", text: "Captura quem está pesquisando “implante perto de mim” no exato momento da decisão." },
    { icon: MapPin, title: "Mídia local e parcerias", text: "Influência de bairro, parcerias regionais e ativação de comunidade." },
  ];

  const flow = [
    { icon: Megaphone, title: "Anúncio criativo" },
    { icon: Instagram, title: "Curtida, comentário, click" },
    { icon: MessageCircle, title: "Mensagem no WhatsApp" },
    { icon: HandCoins, title: "Atendimento humano que vende" },
    { icon: Calendar, title: "Agendamento manual" },
    { icon: Users, title: "Paciente confirmado" },
  ];

  return (
    <section className="pres-section" id="anuncios">
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 820 }}>
          <span className="pres-eyebrow"><Megaphone size={12} /> Anúncios e captação ativa</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            Quem cuida da imagem, do anúncio e do contato direto com o paciente.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            A LyneCloud não é só software. Cuidamos do Instagram da clínica, dos anúncios que rodam todo dia
            e do fluxo que leva o paciente direto ao seu WhatsApp, onde sua equipe agenda manualmente,
            mantendo o toque humano que fecha tratamento.
          </p>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 48,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {channels.map(({ icon: Icon, title, text }) => (
            <div key={title} className="pres-card pres-card-hover" style={{ padding: 24 }}>
              <div
                className="pres-icon-box"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--pres-primary) / 0.12), hsl(var(--pres-primary) / 0.04))",
                  color: "hsl(var(--pres-primary))",
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginTop: 14 }}>{title}</div>
              <div style={{ fontSize: 13, color: "hsl(var(--pres-text-2))", marginTop: 6, lineHeight: 1.5 }}>
                {text}
              </div>
            </div>
          ))}
        </div>

        {/* Fluxo animado */}
        <div className="pres-reveal" style={{ marginTop: 56 }}>
          <div
            className="pres-card"
            style={{
              padding: 28,
              background: "linear-gradient(135deg, hsl(var(--pres-surface)) 0%, white 100%)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "hsl(var(--pres-primary))", textTransform: "uppercase" }}>
              Fluxo completo de aquisição
            </div>
            <div style={{ fontWeight: 600, fontSize: 18, marginTop: 8, color: "hsl(var(--pres-text))" }}>
              Do anúncio no Instagram até o paciente confirmado na cadeira.
            </div>

            <div className="pres-flow" style={{ marginTop: 24 }}>
              {flow.map(({ icon: Icon, title }, i) => (
                <div key={title} className="pres-flow-step">
                  <div className="pres-flow-bubble">
                    <Icon size={20} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--pres-text))", textAlign: "center", marginTop: 10, lineHeight: 1.3, maxWidth: 130 }}>
                    {title}
                  </div>
                  {i < flow.length - 1 && <div className="pres-flow-arrow" aria-hidden />}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "hsl(var(--pres-surface-2))", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <ShieldCheck size={20} color="hsl(var(--pres-success))" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13.5, color: "hsl(var(--pres-text))", lineHeight: 1.5 }}>
                <strong>Agendamento manual e humano:</strong> seu paciente entra em contato direto pelo WhatsApp
                da clínica. Sua equipe atende, qualifica, encanta e marca. O sistema apenas registra,
                organiza e dispara confirmações. Tecnologia a serviço da relação, nunca no lugar dela.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pres-shell .pres-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          position: relative;
        }
        .pres-shell .pres-flow-step {
          flex: 1 1 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-width: 120px;
        }
        .pres-shell .pres-flow-bubble {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: white;
          border: 1.5px solid hsl(var(--pres-primary) / 0.3);
          color: hsl(var(--pres-primary));
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 22px -10px hsl(var(--pres-primary) / 0.45);
          animation: pres-pop .8s ease both;
          position: relative;
          z-index: 2;
        }
        .pres-shell .pres-flow-step:nth-child(2) .pres-flow-bubble { animation-delay: .08s; }
        .pres-shell .pres-flow-step:nth-child(3) .pres-flow-bubble { animation-delay: .16s; }
        .pres-shell .pres-flow-step:nth-child(4) .pres-flow-bubble { animation-delay: .24s; }
        .pres-shell .pres-flow-step:nth-child(5) .pres-flow-bubble { animation-delay: .32s; }
        .pres-shell .pres-flow-step:nth-child(6) .pres-flow-bubble { animation-delay: .40s; }

        .pres-shell .pres-flow-arrow {
          position: absolute;
          top: 28px;
          right: -10px;
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, hsl(var(--pres-primary) / 0.5), hsl(var(--pres-primary) / 0));
        }
        .pres-shell .pres-flow-arrow::after {
          content: "";
          position: absolute;
          right: 0; top: -3px;
          width: 8px; height: 8px;
          border-top: 2px solid hsl(var(--pres-primary) / 0.5);
          border-right: 2px solid hsl(var(--pres-primary) / 0.5);
          transform: rotate(45deg);
        }
        @media (max-width: 720px) {
          .pres-shell .pres-flow-arrow { display: none; }
        }
        @keyframes pres-pop {
          0% { transform: scale(.6); opacity: 0; }
          70% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

// ===== ROI Calculator (NOVA SEÇÃO INTERATIVA) =====
function RoiCalculator() {
  const [visitas, setVisitas] = useState(800);     // visitas mensais
  const [taxaContato, setTaxaContato] = useState(8);     // % visitas → contato WhatsApp
  const [taxaAgenda, setTaxaAgenda] = useState(45);      // % contatos → agendam
  const [taxaShow, setTaxaShow] = useState(70);          // % agendados → comparecem
  const [ticket, setTicket] = useState(900);             // R$ por paciente

  // Cenário SEM estrutura — performance reduzida
  const semEstrutura = useMemo(() => {
    const contatos = visitas * (taxaContato / 100) * 0.45;
    const agendados = contatos * (taxaAgenda / 100) * 0.55;
    const compareceram = agendados * (taxaShow / 100) * 0.7;
    const receita = compareceram * ticket;
    return {
      contatos: Math.round(contatos),
      agendados: Math.round(agendados),
      compareceram: Math.round(compareceram),
      receita: Math.round(receita),
    };
  }, [visitas, taxaContato, taxaAgenda, taxaShow, ticket]);

  const comEstrutura = useMemo(() => {
    const contatos = visitas * (taxaContato / 100);
    const agendados = contatos * (taxaAgenda / 100);
    const compareceram = agendados * (taxaShow / 100);
    const receita = compareceram * ticket;
    return {
      contatos: Math.round(contatos),
      agendados: Math.round(agendados),
      compareceram: Math.round(compareceram),
      receita: Math.round(receita),
    };
  }, [visitas, taxaContato, taxaAgenda, taxaShow, ticket]);

  const ganho = comEstrutura.receita - semEstrutura.receita;
  const ganhoAnual = ganho * 12;

  const Slider = ({ label, value, onChange, min, max, step, suffix, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix?: string; hint?: string; }) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--pres-text))" }}>{label}</label>
        <span className="pres-tabular" style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--pres-primary))" }}>
          {value.toLocaleString("pt-BR")}{suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pres-range"
      />
      {hint && <div style={{ fontSize: 11, color: "hsl(var(--pres-text-3))", marginTop: 4 }}>{hint}</div>}
    </div>
  );

  return (
    <section className="pres-section" id="roi" style={{ background: "hsl(var(--pres-surface))" }}>
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 820 }}>
          <span className="pres-eyebrow"><ChartLine size={12} /> ROI inteligente</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            Veja, em tempo real, o que sua clínica deixa na mesa todo mês.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            Ajuste os números da sua realidade. O simulador compara o cenário atual sem estrutura
            com o cenário com a infraestrutura LyneCloud rodando.
          </p>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 48,
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          {/* Controles */}
          <div className="pres-card" style={{ padding: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", color: "hsl(var(--pres-text-2))", textTransform: "uppercase" }}>
              Sua realidade
            </div>
            <div style={{ display: "grid", gap: 22, marginTop: 20 }}>
              <Slider label="Visitas no Instagram, site e Google por mês" value={visitas} onChange={setVisitas} min={100} max={5000} step={50} hint="Pessoas que descobrem sua clínica de alguma forma." />
              <Slider label="Visitas que entram em contato" value={taxaContato} onChange={setTaxaContato} min={1} max={25} step={1} suffix="%" hint="Quantas tomam atitude e mandam mensagem." />
              <Slider label="Contatos que agendam" value={taxaAgenda} onChange={setTaxaAgenda} min={10} max={90} step={1} suffix="%" hint="Conversão do atendimento ao agendamento." />
              <Slider label="Agendados que comparecem" value={taxaShow} onChange={setTaxaShow} min={30} max={100} step={1} suffix="%" hint="Taxa de presença real (sem no-show)." />
              <Slider label="Ticket médio por paciente" value={ticket} onChange={setTicket} min={150} max={4000} step={50} suffix=" R$" hint="Valor médio que cada paciente gera." />
            </div>
          </div>

          {/* Resultados comparativos */}
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
            {/* SEM */}
            <div
              className="pres-card"
              style={{
                padding: 24,
                borderColor: "hsl(var(--pres-danger) / 0.25)",
                background: "linear-gradient(180deg, hsl(var(--pres-danger) / 0.04), white)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={16} color="hsl(var(--pres-danger))" />
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(var(--pres-danger))" }}>
                  Hoje, sem estrutura
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 28, fontWeight: 700, color: "hsl(var(--pres-text))" }}>
                <AnimatedNumber value={semEstrutura.receita} prefix="R$ " />
              </div>
              <div style={{ fontSize: 12, color: "hsl(var(--pres-text-2))", marginTop: 4 }}>
                Receita estimada por mês
              </div>
              <div style={{ marginTop: 14, display: "grid", gap: 6, fontSize: 12.5, color: "hsl(var(--pres-text-2))" }}>
                <div>{semEstrutura.contatos} contatos · {semEstrutura.agendados} agendados · {semEstrutura.compareceram} comparecem</div>
              </div>
            </div>

            {/* COM */}
            <div
              className="pres-card"
              style={{
                padding: 24,
                borderColor: "hsl(var(--pres-success) / 0.4)",
                background: "linear-gradient(180deg, hsl(var(--pres-success) / 0.06), white)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 80% at 100% 0%, hsl(var(--pres-success) / 0.10), transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={16} color="hsl(var(--pres-success))" />
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(var(--pres-success))" }}>
                    Com a estrutura LyneCloud
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 32, fontWeight: 700, color: "hsl(var(--pres-text))" }}>
                  <AnimatedNumber value={comEstrutura.receita} prefix="R$ " />
                </div>
                <div style={{ fontSize: 12, color: "hsl(var(--pres-text-2))", marginTop: 4 }}>
                  Receita potencial por mês
                </div>
                <div style={{ marginTop: 14, display: "grid", gap: 6, fontSize: 12.5, color: "hsl(var(--pres-text))" }}>
                  <div>{comEstrutura.contatos} contatos · {comEstrutura.agendados} agendados · {comEstrutura.compareceram} comparecem</div>
                </div>
              </div>
            </div>

            {/* Ganho */}
            <div
              className="pres-card"
              style={{
                padding: 24,
                background: "linear-gradient(135deg, hsl(var(--pres-primary)), hsl(var(--pres-primary-2)))",
                color: "white",
                borderColor: "transparent",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.85 }}>
                Receita extra recuperada
              </div>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 18 }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>
                    <AnimatedNumber value={ganho} prefix="R$ " />
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>por mês</div>
                </div>
                <div style={{ height: 32, width: 1, background: "hsl(0 0% 100% / 0.25)" }} />
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                    <AnimatedNumber value={ganhoAnual} prefix="R$ " />
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>por ano</div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 12.5, opacity: 0.9, lineHeight: 1.5 }}>
                Estimativa conservadora baseada em ganhos típicos de conversão, redução de no-show
                e captação contínua via Instagram, Google e WhatsApp.
              </div>
            </div>
          </div>
        </div>

        <div className="pres-reveal" style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a href={WPP_LINK} target="_blank" rel="noreferrer" className="pres-btn pres-btn-primary">
            Quero esse resultado na minha clínica <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .pres-shell #roi > .pres-container > div:nth-child(2) {
            grid-template-columns: 1.05fr 1fr !important;
            align-items: start;
          }
        }
        .pres-shell .pres-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, hsl(var(--pres-primary)) 0%, hsl(var(--pres-primary)) var(--p, 50%), hsl(var(--pres-border)) var(--p, 50%));
          outline: none;
          cursor: pointer;
        }
        .pres-shell .pres-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid hsl(var(--pres-primary));
          box-shadow: 0 4px 10px -2px hsl(var(--pres-primary) / 0.4);
          cursor: pointer;
          transition: transform .15s ease;
        }
        .pres-shell .pres-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .pres-shell .pres-range::-moz-range-thumb {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid hsl(var(--pres-primary));
          box-shadow: 0 4px 10px -2px hsl(var(--pres-primary) / 0.4);
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}

// ===== Sem Mensalidade (NOVA SEÇÃO) =====
function SemMensalidade() {
  const items = [
    { icon: InfinityIcon, title: "Painel próprio para sempre", text: "Você é dono do sistema. Sem aluguel, sem reféns de plataforma." },
    { icon: KeyRound, title: "Acesso e dados na sua mão", text: "Banco de dados, contas e domínio sob o nome da clínica." },
    { icon: Server, title: "Hospedagem otimizada", text: "Infraestrutura performática inclusa. Sem surpresas, sem upsell." },
    { icon: Lock, title: "Sem assinatura recorrente", text: "Investimento único de implantação. Suporte e evolução opcionais." },
  ];

  return (
    <section className="pres-section" id="sem-mensalidade" style={{ background: "hsl(var(--pres-dark))", color: "white", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", inset: 0,
          background:
            "radial-gradient(50% 50% at 20% 30%, hsl(152 70% 40% / 0.18), transparent 60%)," +
            "radial-gradient(50% 50% at 85% 70%, hsl(215 85% 55% / 0.20), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div className="pres-container" style={{ position: "relative" }}>
        <div className="pres-reveal" style={{ maxWidth: 820 }}>
          <span className="pres-eyebrow" style={{ color: "hsl(152 70% 70%)", background: "hsl(0 0% 100% / 0.06)", borderColor: "hsl(0 0% 100% / 0.12)" }}>
            <ShieldCheck size={12} /> Modelo de propriedade
          </span>
          <h2 className="pres-h2" style={{ marginTop: 20, color: "white" }}>
            Não é assinatura. O painel é da sua clínica, definitivamente.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16, color: "hsl(0 0% 100% / 0.78)" }}>
            Diferente das plataformas que cobram para sempre, a LyneCloud entrega a estrutura completa
            como ativo da clínica. Você implanta uma vez, opera com autonomia total e nunca depende
            de uma mensalidade para continuar funcionando.
          </p>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 48,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {items.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              style={{
                padding: 24,
                background: "hsl(0 0% 100% / 0.04)",
                border: "1px solid hsl(0 0% 100% / 0.10)",
                borderRadius: 16,
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "hsl(152 70% 50% / 0.16)",
                  border: "1px solid hsl(152 70% 50% / 0.30)",
                  color: "hsl(152 70% 75%)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginTop: 14 }}>{title}</div>
              <div style={{ fontSize: 13.5, color: "hsl(0 0% 100% / 0.72)", marginTop: 6, lineHeight: 1.5 }}>
                {text}
              </div>
            </div>
          ))}
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 32,
            padding: 22,
            borderRadius: 14,
            background: "hsl(0 0% 100% / 0.05)",
            border: "1px solid hsl(0 0% 100% / 0.12)",
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Rocket size={22} color="hsl(38 80% 70%)" />
          <div style={{ fontSize: 14, color: "hsl(0 0% 100% / 0.85)", flex: 1, minWidth: 240 }}>
            <strong style={{ color: "white" }}>Investimento único de implantação.</strong> Suporte
            premium e gestão de tráfego pago são contratos opcionais, transparentes, sem amarras.
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Tráfego pago local =====
function Trafego() {
  const steps = [
    { icon: Megaphone, title: "Anúncio local", text: "Google Ads e Meta segmentados por bairro e intenção." },
    { icon: MousePointerClick, title: "Landing page", text: "Página otimizada para o tratamento anunciado." },
    { icon: Calendar, title: "Agendamento", text: "Quiz que qualifica e marca em poucos cliques." },
    { icon: Users, title: "Paciente ativo", text: "Confirmação e lembrete automático até a consulta." },
    { icon: TrendingUp, title: "ROI mensurável", text: "Cada real investido rastreado até o caixa." },
  ];

  return (
    <section className="pres-section" id="trafego" style={{ background: "hsl(var(--pres-dark-2))", color: "white", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(50% 50% at 80% 30%, hsl(215 85% 50% / 0.20), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div className="pres-container" style={{ position: "relative" }}>
        <div className="pres-reveal" style={{ maxWidth: 820 }}>
          <span className="pres-eyebrow" style={{ color: "hsl(38 80% 70%)", background: "hsl(0 0% 100% / 0.06)", borderColor: "hsl(0 0% 100% / 0.12)" }}>
            <Zap size={12} /> Tráfego pago local
          </span>
          <h2 className="pres-h2" style={{ marginTop: 20, color: "white" }}>
            Anúncio sem estrutura é dinheiro queimando todo dia.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16, color: "hsl(0 0% 100% / 0.75)" }}>
            Clínicas que investem em anúncios sem landing page, rastreamento e funil completo
            perdem entre 60% e 80% do potencial. A estrutura abaixo recupera cada lead.
          </p>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 56,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            position: "relative",
          }}
        >
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              style={{
                padding: 24,
                background: "hsl(0 0% 100% / 0.04)",
                border: "1px solid hsl(0 0% 100% / 0.10)",
                borderRadius: 16,
                backdropFilter: "blur(10px)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "hsl(215 85% 55% / 0.20)",
                  border: "1px solid hsl(215 85% 55% / 0.4)",
                  color: "hsl(215 90% 75%)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {i + 1}
              </div>
              <div style={{ marginTop: 14, color: "hsl(38 80% 70%)" }}><Icon size={20} /></div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: "hsl(0 0% 100% / 0.65)", marginTop: 4, lineHeight: 1.5 }}>
                {text}
              </div>
            </div>
          ))}
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 40,
            padding: 24,
            background: "hsl(0 0% 100% / 0.04)",
            border: "1px solid hsl(0 0% 100% / 0.10)",
            borderRadius: 14,
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <ShieldCheck size={22} color="hsl(152 70% 60%)" />
          <div style={{ fontSize: 14, color: "hsl(0 0% 100% / 0.85)", flex: 1, minWidth: 240 }}>
            <strong style={{ color: "white" }}>Integração nativa:</strong> a estrutura entregue já conecta anúncio, landing, agenda e CRM. Você acompanha custo por lead, custo por agendamento e ROI real direto no painel.
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Benefícios =====
const BENEFITS = [
  { icon: Users, label: "Mais pacientes" },
  { icon: TrendingUp, label: "Mais conversão" },
  { icon: CheckCircle2, label: "Menos faltas" },
  { icon: Workflow, label: "Mais organização" },
  { icon: Crown, label: "Mais autoridade" },
  { icon: Star, label: "Mais avaliações" },
  { icon: Wallet, label: "Mais faturamento" },
  { icon: Target, label: "Menos oportunidades perdidas" },
  { icon: ChartLine, label: "Crescimento previsível" },
];

function Beneficios() {
  return (
    <section className="pres-section" id="beneficios">
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 760 }}>
          <span className="pres-eyebrow"><Sparkles size={12} /> Benefícios reais</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            O que muda na sua clínica nos primeiros 60 dias.
          </h2>
        </div>

        <div
          className="pres-reveal"
          style={{
            marginTop: 48,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {BENEFITS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="pres-card pres-card-hover"
              style={{ padding: 24, display: "flex", alignItems: "center", gap: 14 }}
            >
              <div
                className="pres-icon-box"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--pres-primary) / 0.12), hsl(var(--pres-primary) / 0.04))",
                  color: "hsl(var(--pres-primary))",
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Próximos passos =====
const STEPS = [
  { icon: Search, title: "Análise", text: "Diagnóstico da clínica e do mercado local." },
  { icon: Building2, title: "Estrutura", text: "Personalização de site, painel e fluxos." },
  { icon: Layers, title: "Implantação", text: "Configuração completa do sistema." },
  { icon: Workflow, title: "Integração", text: "Google, WhatsApp, anúncios e métricas." },
  { icon: Crown, title: "Ativação", text: "Operação rodando e sua equipe treinada." },
];

function ProximosPassos() {
  return (
    <section className="pres-section" id="proximos-passos" style={{ background: "hsl(var(--pres-surface))" }}>
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 760 }}>
          <span className="pres-eyebrow"><Workflow size={12} /> Próximos passos</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            Da decisão à operação rodando, em 5 etapas claras.
          </h2>
        </div>

        <div className="pres-reveal pres-timeline" style={{ marginTop: 56 }}>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} style={{ position: "relative", textAlign: "center" }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "white",
                  border: "1.5px solid hsl(var(--pres-primary) / 0.3)",
                  color: "hsl(var(--pres-primary))",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 2,
                  boxShadow: "0 8px 20px -8px hsl(var(--pres-primary) / 0.3)",
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, color: "hsl(var(--pres-primary))", letterSpacing: "0.12em" }}>
                ETAPA {i + 1}
              </div>
              <div style={{ fontWeight: 600, fontSize: 17, marginTop: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: "hsl(var(--pres-text-2))", marginTop: 6, lineHeight: 1.5, maxWidth: 200, marginInline: "auto" }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== CTA Final =====
function CTAFinal() {
  return (
    <section className="pres-section">
      <div className="pres-container">
        <div className="pres-reveal pres-cta-final">
          <span className="pres-eyebrow" style={{ color: "hsl(38 80% 70%)", background: "hsl(0 0% 100% / 0.06)", borderColor: "hsl(0 0% 100% / 0.12)" }}>
            <Sparkles size={12} /> Próximo passo
          </span>
          <h2 className="pres-h2" style={{ marginTop: 20, color: "white", maxWidth: 760 }}>
            Pronto para parar de perder pacientes e começar a crescer com método?
          </h2>
          <p className="pres-lead" style={{ marginTop: 16, color: "hsl(0 0% 100% / 0.75)", maxWidth: 640 }}>
            Agende uma demonstração gratuita. Mostramos o sistema em funcionamento e
            desenhamos a estrutura ideal para a sua clínica.
          </p>
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="pres-btn pres-btn-primary">
              <Phone size={16} /> Falar pelo WhatsApp <ArrowRight size={16} />
            </a>
            <a href="#showcase" className="pres-btn pres-btn-ghost">
              Rever demonstração visual
            </a>
          </div>

          <div
            style={{
              marginTop: 40,
              paddingTop: 32,
              borderTop: "1px solid hsl(0 0% 100% / 0.10)",
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {[
              { icon: ShieldCheck, label: "Sem mensalidade" },
              { icon: Smartphone, label: "100% responsivo" },
              { icon: Zap, label: "Setup em até 14 dias" },
              { icon: Award, label: "Suporte dedicado" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, color: "hsl(0 0% 100% / 0.85)", fontSize: 14 }}>
                <Icon size={18} color="hsl(38 80% 70%)" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Top Bar minimalista =====
function TopBar() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "hsl(var(--pres-dark) / 0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid hsl(0 0% 100% / 0.08)",
      }}
    >
      <div
        className="pres-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "white", textDecoration: "none" }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, hsl(var(--pres-primary)), hsl(var(--pres-primary-2)))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{BRAND}</div>
            <div style={{ fontSize: 10, color: "hsl(0 0% 100% / 0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Dossiê comercial
            </div>
          </div>
        </Link>
        <a href={WPP_LINK} target="_blank" rel="noreferrer" className="pres-btn pres-btn-primary" style={{ padding: "10px 16px", fontSize: 13 }}>
          Solicitar demo <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

// ===== Página principal =====
export default function Apresentacao() {
  useReveal();

  return (
    <div className="pres-shell">
      <SEO
        title={`${BRAND} · Estrutura digital completa para clínicas odontológicas`}
        description="Site comercial premium, agendamento inteligente, painel administrativo e integração Google. Sem mensalidade. O painel é da clínica, para sempre."
        canonical="/apresentacao"
      />
      <TopBar />
      <Hero />
      <Problema />
      <Solucao />
      <Showcase />
      <Anuncios />
      <RoiCalculator />
      <Google />
      <Trafego />
      <SemMensalidade />
      <Beneficios />
      <ProximosPassos />
      <CTAFinal />

      <footer style={{ borderTop: "1px solid hsl(var(--pres-border))", padding: "32px 0", textAlign: "center", fontSize: 13, color: "hsl(var(--pres-text-3))" }}>
        <div className="pres-container">
          © {new Date().getFullYear()} {BRAND} · Dossiê comercial de implantação
        </div>
      </footer>
    </div>
  );
}
