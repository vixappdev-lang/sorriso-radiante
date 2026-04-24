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

// ===== Google (simulação realista de busca) =====
function GoogleSearchSim() {
  const fullQuery = "dentista perto de mim";
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "searching" | "results-bad" | "results-good">("typing");
  const [highlight, setHighlight] = useState(false);

  // Loop completo: digita devagar -> busca -> mostra ruim -> reorganiza -> destaca
  useEffect(() => {
    let timers: number[] = [];
    const run = () => {
      setTyped("");
      setPhase("typing");
      setHighlight(false);

      // digitação caractere por caractere (mais lenta e natural)
      fullQuery.split("").forEach((_, i) => {
        timers.push(window.setTimeout(() => {
          setTyped(fullQuery.slice(0, i + 1));
        }, 350 + i * 160));
      });

      const afterType = 350 + fullQuery.length * 160;
      timers.push(window.setTimeout(() => setPhase("searching"), afterType + 700));
      timers.push(window.setTimeout(() => setPhase("results-bad"), afterType + 2100));
      // permanece no estado "ruim" por mais tempo para fixar a dor
      timers.push(window.setTimeout(() => setPhase("results-good"), afterType + 7800));
      timers.push(window.setTimeout(() => setHighlight(true), afterType + 8400));
      // permanece no estado "bom" por mais tempo para fixar o ganho
      timers.push(window.setTimeout(run, afterType + 16500));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  // Resultados ANTES — Sua Clínica aparece igual aos outros, mas no fim, sem estrutura
  const resultsBefore = [
    {
      name: "OdontoPrime Centro",
      url: "odontoprime.com.br",
      desc: "Implantes, ortodontia e clareamento. Agende online em poucos cliques.",
      rating: 4.7, reviews: 218, sponsored: true, has: true,
    },
    {
      name: "Sorriso e Estética Dental",
      url: "sorrisoestetica.com.br",
      desc: "Clínica odontológica completa. Atendimento humanizado e tecnologia avançada.",
      rating: 4.5, reviews: 156, has: true,
    },
    {
      name: "Clínica DentalCare",
      url: "dentalcare.com.br",
      desc: "Tratamentos estéticos e preventivos. Convênios e parcelamento facilitado.",
      rating: 4.3, reviews: 92, has: true,
    },
    {
      name: "Sua Clínica",
      url: "facebook.com/suaclinica",
      desc: "Página com poucas informações. Sem horários disponíveis e sem agendamento online.",
      rating: 4.0, reviews: 11, has: false, you: true,
    },
  ];
  // Resultados DEPOIS — Sua Clínica em 1º com estrutura completa (mantém o mesmo nome)
  const resultsAfter = [
    {
      name: "Sua Clínica",
      url: "suaclinica.com.br",
      desc: "Odontologia premium. Agendamento online 24h, WhatsApp ativo e avaliações verificadas.",
      rating: 4.9, reviews: 287, sponsored: true, has: true, you: true,
    },
    {
      name: "OdontoPrime Centro",
      url: "odontoprime.com.br",
      desc: "Implantes, ortodontia e clareamento. Agende online em poucos cliques.",
      rating: 4.7, reviews: 218, has: true,
    },
    {
      name: "Sorriso e Estética Dental",
      url: "sorrisoestetica.com.br",
      desc: "Clínica odontológica completa. Atendimento humanizado e tecnologia avançada.",
      rating: 4.5, reviews: 156, has: true,
    },
    {
      name: "Clínica DentalCare",
      url: "dentalcare.com.br",
      desc: "Tratamentos estéticos e preventivos. Convênios e parcelamento facilitado.",
      rating: 4.3, reviews: 92, has: true,
    },
  ];

  const list = phase === "results-good" ? resultsAfter : resultsBefore;
  const showResults = phase === "results-bad" || phase === "results-good";

  return (
    <div className="pres-card" style={{ padding: 0, overflow: "hidden", background: "white" }}>
      {/* Chrome do navegador */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        background: "hsl(220 14% 96%)",
        borderBottom: "1px solid hsl(220 13% 91%)",
      }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div style={{
          flex: 1, marginLeft: 10,
          padding: "5px 12px",
          background: "white",
          border: "1px solid hsl(220 13% 88%)",
          borderRadius: 6,
          fontSize: 11,
          color: "hsl(220 9% 46%)",
          fontFamily: "system-ui, sans-serif",
        }}>
          🔒 google.com/search
        </div>
      </div>

      {/* Header Google */}
      <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid hsl(220 13% 93%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#4285F4" }}>G</span>
            <span style={{ color: "#EA4335" }}>o</span>
            <span style={{ color: "#FBBC05" }}>o</span>
            <span style={{ color: "#4285F4" }}>g</span>
            <span style={{ color: "#34A853" }}>l</span>
            <span style={{ color: "#EA4335" }}>e</span>
          </span>
          <div style={{
            flex: 1,
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 16px",
            border: "1px solid hsl(220 13% 88%)",
            borderRadius: 999,
            boxShadow: "0 1px 6px hsl(220 13% 50% / 0.1)",
            background: "white",
            minHeight: 38,
          }}>
            <Search size={14} color="hsl(220 9% 46%)" />
            <span style={{ fontSize: 14, color: "hsl(220 9% 20%)", fontFamily: "Arial, sans-serif" }}>
              {typed}
              {phase === "typing" && <span className="pres-caret">|</span>}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 22, marginTop: 14, fontSize: 12, color: "hsl(220 9% 46%)" }}>
          {["Tudo", "Mapa", "Imagens", "Notícias", "Vídeos"].map((t, i) => (
            <span key={t} style={{
              paddingBottom: 8,
              borderBottom: i === 0 ? "3px solid #1a73e8" : "3px solid transparent",
              color: i === 0 ? "#1a73e8" : "hsl(220 9% 46%)",
              fontWeight: i === 0 ? 500 : 400,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Estado: Searching */}
      {phase === "searching" && (
        <div style={{ padding: "32px 22px", textAlign: "center" }}>
          <div className="pres-spinner" />
          <div style={{ marginTop: 14, fontSize: 12, color: "hsl(220 9% 46%)" }}>
            Pesquisando clínicas próximas...
          </div>
        </div>
      )}

      {/* Estado: Resultados */}
      {showResults && (
        <div style={{ padding: "16px 22px 22px", minHeight: 380 }}>
          <div style={{ fontSize: 11, color: "hsl(220 9% 46%)", marginBottom: 10 }}>
            Cerca de 24.300 resultados (0,42 segundos)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((r, i) => {
              const isYou = (r as any).you;
              const isFirst = i === 0;
              const isHighlighted = isYou && highlight && phase === "results-good";
              return (
                <div
                  key={r.name + phase}
                  className="pres-google-result"
                  style={{
                    padding: 12,
                    border: isHighlighted ? "1.5px solid hsl(215 85% 55%)" : "1px solid hsl(220 13% 92%)",
                    borderRadius: 10,
                    background: isHighlighted ? "hsl(215 85% 96%)" : "white",
                    boxShadow: isHighlighted ? "0 8px 24px hsl(215 85% 55% / 0.18)" : "none",
                    transition: "all .5s cubic-bezier(.2,.8,.2,1)",
                    animation: `pres-result-in .5s ease ${i * 0.08}s both`,
                    position: "relative",
                  }}
                >
                  {(r as any).sponsored && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#202124", marginBottom: 6 }}>
                      <span style={{ background: "#202124", color: "white", padding: "1px 5px", borderRadius: 3, marginRight: 6, fontSize: 10 }}>Anúncio</span>
                      <span style={{ color: "hsl(220 9% 46%)", fontWeight: 400, fontSize: 11 }}>
                        {isFirst && phase === "results-good" ? "Topo da pesquisa local" : "Resultado patrocinado"}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* URL no topo, padrão Google */}
                      <div style={{ fontSize: 11.5, color: "#202124", lineHeight: 1.3, fontFamily: "Arial, sans-serif" }}>
                        {(r as any).url}
                      </div>
                      {/* Título azul, padrão Google */}
                      <div style={{
                        fontSize: 17, fontWeight: 400, marginTop: 2,
                        color: isHighlighted ? "hsl(215 85% 40%)" : "#1a0dab",
                        lineHeight: 1.25, fontFamily: "Arial, sans-serif",
                      }}>
                        {r.name}
                      </div>
                      {/* Avaliação */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                        <span style={{ color: "#5f6368", fontWeight: 600, fontSize: 12 }}>{r.rating.toFixed(1)}</span>
                        <div style={{ display: "flex", gap: 1 }}>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} size={11} fill={idx < Math.round(r.rating) ? "#fbbc05" : "transparent"} stroke="#fbbc05" strokeWidth={1.5} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11.5, color: "hsl(220 9% 46%)" }}>· {r.reviews} avaliações Google</span>
                      </div>
                      {/* Descrição (snippet) */}
                      <div style={{ marginTop: 6, fontSize: 12.5, color: "#4d5156", lineHeight: 1.5, fontFamily: "Arial, sans-serif" }}>
                        {(r as any).desc}
                      </div>
                      {/* Sinais visuais de estrutura */}
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "hsl(220 9% 46%)" }}>
                        {(r as any).has ? (
                          <>
                            <span style={{ color: "#34A853", fontWeight: 500 }}>● Site profissional</span>
                            <span>· Agendamento online</span>
                            {isHighlighted && <span style={{ color: "#34A853", fontWeight: 500 }}>· WhatsApp ativo</span>}
                          </>
                        ) : (
                          <>
                            <span style={{ color: "#d93025" }}>○ Sem site próprio</span>
                            <span>· Sem agendamento online</span>
                            <span>· Avaliações antigas</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isYou && phase === "results-bad" && (
                    <div style={{
                      position: "absolute", right: 10, top: 10,
                      fontSize: 10, fontWeight: 700,
                      background: "hsl(0 80% 95%)", color: "hsl(0 70% 40%)",
                      padding: "3px 9px", borderRadius: 999, letterSpacing: "0.05em",
                    }}>
                      4ª POSIÇÃO
                    </div>
                  )}
                  {isHighlighted && (
                    <div style={{
                      position: "absolute", right: 10, top: 10,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      background: "hsl(215 85% 55%)", color: "white",
                      padding: "3px 10px", borderRadius: 999,
                    }}>
                      ★ 1º LUGAR
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 16, padding: 12, borderRadius: 10,
            background: phase === "results-good" ? "hsl(152 60% 96%)" : "hsl(0 80% 97%)",
            border: `1px solid ${phase === "results-good" ? "hsl(152 60% 80%)" : "hsl(0 70% 88%)"}`,
            fontSize: 12, color: phase === "results-good" ? "hsl(152 60% 25%)" : "hsl(0 70% 35%)",
            textAlign: "center", fontWeight: 500,
          }}>
            {phase === "results-good"
              ? "Sua clínica subiu para o 1º lugar. 87% dos cliques vão para os 3 primeiros resultados."
              : "Sem site próprio e sem agendamento online, sua clínica fica fora da escolha do paciente."}
          </div>
        </div>
      )}
    </div>
  );
}

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
                { icon: MapPin, title: "Google Maps e Perfil da Empresa", text: "Aparição destacada nas buscas locais e no mapa." },
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

          <div className="pres-reveal">
            <GoogleSearchSim />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .pres-shell #google > .pres-container > div {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pres-shell .pres-caret {
          display: inline-block;
          margin-left: 1px;
          color: #1a73e8;
          animation: pres-blink 1s steps(2) infinite;
          font-weight: 300;
        }
        @keyframes pres-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .pres-shell .pres-spinner {
          width: 28px; height: 28px;
          border: 3px solid hsl(220 13% 90%);
          border-top-color: #1a73e8;
          border-radius: 50%;
          margin: 0 auto;
          animation: pres-spin .8s linear infinite;
        }
        @keyframes pres-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pres-result-in {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
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
        <div className="pres-reveal" style={{ maxWidth: 860 }}>
          <span className="pres-eyebrow"><ChartLine size={12} /> ROI estimado · Projeção de retorno</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            Quanto sua clínica deixa de faturar todo mês sem essa estrutura.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            Projeção de retorno calculada com base em médias reais do mercado odontológico:
            taxa de captação de leads, conversão de WhatsApp, comparecimento e ticket médio.
            Ajuste os campos com a sua realidade e veja a diferença em receita.
          </p>
          <div style={{
            marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 999,
            background: "hsl(var(--pres-primary) / 0.08)",
            color: "hsl(var(--pres-primary))",
            fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em",
          }}>
            <ShieldCheck size={13} /> Estimativa conservadora · margens reais de mercado
          </div>
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

// ===== Live Ops (substitui Benefícios — animação realista) =====
function LiveOps() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  // métricas realistas de uma clínica odontológica de médio porte
  const base = useMemo(() => ({
    pacientes: 312,
    receita: 48700,
    confirmacoes: 92,
    leads: 47,
  }), []);

  const live = useMemo(() => {
    const drift = Math.sin(tick * 0.7) * 0.5 + 0.5;
    return {
      pacientes: base.pacientes + Math.floor(tick / 3),
      receita: base.receita + Math.round(tick * 35 + drift * 120),
      confirmacoes: Math.min(96, base.confirmacoes + Math.round(drift * 2)),
      leads: base.leads + Math.floor(tick / 5),
    };
  }, [tick, base]);

  // feed de eventos realista
  const events = [
    { icon: Calendar, color: "hsl(215 85% 55%)", text: "Novo agendamento · Camila R.", time: "agora" },
    { icon: CheckCircle2, color: "hsl(152 60% 45%)", text: "Confirmação automática enviada", time: "18s" },
    { icon: MessageCircle, color: "hsl(152 60% 45%)", text: "Lead respondeu no WhatsApp", time: "42s" },
    { icon: Star, color: "hsl(38 80% 55%)", text: "Avaliação 5 estrelas no Google", time: "2m" },
    { icon: Wallet, color: "hsl(215 85% 55%)", text: "Pagamento recebido · R$ 480", time: "4m" },
    { icon: Users, color: "hsl(215 85% 55%)", text: "Novo paciente cadastrado", time: "7m" },
    { icon: Target, color: "hsl(38 80% 55%)", text: "Lead avançou para fechamento", time: "11m" },
  ];

  // barras animadas (escala mensal realista)
  const bars = [8, 11, 9, 13, 12, 15, 14, 17, 16, 19, 18, 22];

  return (
    <section className="pres-section" id="live-ops">
      <div className="pres-container">
        <div className="pres-reveal" style={{ maxWidth: 820 }}>
          <span className="pres-eyebrow"><Activity size={12} /> Operação em tempo real</span>
          <h2 className="pres-h2" style={{ marginTop: 20 }}>
            Sua clínica respira em tempo real, e você enxerga tudo acontecendo.
          </h2>
          <p className="pres-lead" style={{ marginTop: 16 }}>
            Cada agendamento, confirmação, pagamento e avaliação aparece no painel no instante em que acontece.
            Pare de operar no escuro, comece a tomar decisão com dado vivo.
          </p>
        </div>

        <div className="pres-reveal pres-card" style={{ marginTop: 48, padding: 0, overflow: "hidden" }}>
          {/* Header do "painel" */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid hsl(var(--pres-border))",
            background: "linear-gradient(180deg, hsl(var(--pres-surface)) 0%, white 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ position: "relative", display: "inline-flex" }}>
                <span className="pres-pulse-dot" />
                <span className="pres-pulse-ring" />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: "hsl(var(--pres-success))", textTransform: "uppercase" }}>
                AO VIVO
              </span>
            </div>
            <div style={{ fontSize: 12, color: "hsl(var(--pres-text-3))", fontFamily: "'SF Mono', monospace" }}>
              lynecloud.com.br/admin
            </div>
          </div>

          <div className="pres-live-grid" style={{ padding: 22 }}>
            {/* KPIs */}
            <div className="pres-live-kpis">
              {[
                { label: "Pacientes ativos", value: live.pacientes, prefix: "", suffix: "" },
                { label: "Faturamento do mês", value: live.receita, prefix: "R$ ", suffix: "" },
                { label: "Taxa confirmação", value: live.confirmacoes, prefix: "", suffix: "%" },
                { label: "Leads no funil", value: live.leads, prefix: "", suffix: "" },
              ].map((k) => (
                <div key={k.label} className="pres-live-kpi">
                  <div style={{ fontSize: 11, color: "hsl(var(--pres-text-3))", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                    {k.label}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "hsl(var(--pres-text))" }}>
                    <AnimatedNumber value={k.value} prefix={k.prefix} suffix={k.suffix} duration={600} />
                  </div>
                  <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "hsl(var(--pres-success))", fontWeight: 600 }}>
                    <TrendingUp size={11} /> em alta
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico animado */}
            <div className="pres-live-chart">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--pres-text))" }}>Agendamentos por dia</div>
                  <div style={{ fontSize: 11, color: "hsl(var(--pres-text-3))", marginTop: 2 }}>Últimos 12 dias</div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "hsl(var(--pres-success))" }}>
                  <ChartLine size={12} /> +24% vs anterior
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      className="pres-bar"
                      style={{
                        width: "100%",
                        height: `${b}%`,
                        background: i === bars.length - 1
                          ? "linear-gradient(180deg, hsl(var(--pres-primary-2)), hsl(var(--pres-primary)))"
                          : "linear-gradient(180deg, hsl(var(--pres-primary) / 0.4), hsl(var(--pres-primary) / 0.18))",
                        borderRadius: 6,
                        animation: `pres-bar-grow .9s cubic-bezier(.2,.8,.2,1) ${i * 0.05}s both`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Feed de eventos */}
            <div className="pres-live-feed">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Atividade ao vivo</div>
                <div style={{ fontSize: 11, color: "hsl(var(--pres-text-3))" }}>Atualizando…</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflow: "hidden" }}>
                {events.map((ev, i) => {
                  const Icon = ev.icon;
                  return (
                    <div
                      key={i}
                      className="pres-event"
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "hsl(var(--pres-surface))",
                        border: "1px solid hsl(var(--pres-border))",
                        animation: `pres-event-in .5s ease ${i * 0.08}s both`,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${ev.color.replace(")", " / 0.12)")}`,
                        color: ev.color,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: "hsl(var(--pres-text))", lineHeight: 1.3 }}>
                        {ev.text}
                      </div>
                      <div style={{ fontSize: 11, color: "hsl(var(--pres-text-3))", fontFamily: "'SF Mono', monospace" }}>
                        {ev.time}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Linha de transformação */}
        <div
          className="pres-reveal"
          style={{
            marginTop: 32,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {[
            { icon: TrendingUp, label: "Mais conversão de leads", v: "+34%" },
            { icon: CheckCircle2, label: "Menos faltas", v: "-27%" },
            { icon: Wallet, label: "Faturamento adicional", v: "+R$ 9,4k/mês" },
            { icon: Star, label: "Reputação no Google", v: "4.9 ★" },
          ].map(({ icon: Icon, label, v }) => (
            <div key={label} className="pres-card pres-card-hover" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div className="pres-icon-box" style={{
                background: "linear-gradient(135deg, hsl(var(--pres-primary) / 0.12), hsl(var(--pres-primary) / 0.04))",
                color: "hsl(var(--pres-primary))",
                width: 44, height: 44, flexShrink: 0,
              }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(var(--pres-text))" }}>{v}</div>
                <div style={{ fontSize: 12, color: "hsl(var(--pres-text-2))", marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pres-shell .pres-pulse-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: hsl(var(--pres-success));
          box-shadow: 0 0 0 0 hsl(var(--pres-success) / 0.6);
          animation: pres-pulse 1.6s ease-out infinite;
          z-index: 2;
        }
        .pres-shell .pres-pulse-ring {
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 2px solid hsl(var(--pres-success) / 0.45);
          animation: pres-ring 1.6s ease-out infinite;
        }
        @keyframes pres-pulse {
          0% { box-shadow: 0 0 0 0 hsl(var(--pres-success) / 0.55); }
          70% { box-shadow: 0 0 0 12px hsl(var(--pres-success) / 0); }
          100% { box-shadow: 0 0 0 0 hsl(var(--pres-success) / 0); }
        }
        @keyframes pres-ring {
          0% { transform: scale(.6); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pres-bar-grow {
          0% { height: 0% !important; opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pres-event-in {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .pres-shell .pres-live-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: 1fr;
        }
        .pres-shell .pres-live-kpis {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, 1fr);
        }
        .pres-shell .pres-live-kpi {
          padding: 16px;
          border-radius: 12px;
          background: hsl(var(--pres-surface));
          border: 1px solid hsl(var(--pres-border));
        }
        .pres-shell .pres-live-chart,
        .pres-shell .pres-live-feed {
          padding: 18px;
          border-radius: 12px;
          background: white;
          border: 1px solid hsl(var(--pres-border));
        }
        @media (min-width: 980px) {
          .pres-shell .pres-live-grid {
            grid-template-columns: 1.1fr 1.3fr 1fr;
            align-items: stretch;
          }
          .pres-shell .pres-live-kpis {
            grid-template-columns: 1fr 1fr;
            align-content: start;
          }
        }
      `}</style>
    </section>
  );
}

// ===== Próximos passos com timeline animada =====
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
          padding: "12px 24px",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 16, color: "white", textDecoration: "none" }}>
          <img
            src="/apresentacao/lynecloud-icon.png"
            alt="LyneCloud"
            style={{ width: 78, height: 78, objectFit: "contain", filter: "drop-shadow(0 8px 22px hsl(215 90% 50% / 0.55))" }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.025em" }}>{BRAND}</div>
            <div style={{ fontSize: 10.5, color: "hsl(0 0% 100% / 0.55)", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 5 }}>
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
      <LiveOps />
      <ProximosPassos />
      <CTAFinal />
      <PremiumFooter />
    </div>
  );
}

// ===== Premium Footer =====
function PremiumFooter() {
  const year = new Date().getFullYear();
  const links = [
    { label: "Solução", href: "#solucao" },
    { label: "Demonstração", href: "#showcase" },
    { label: "Anúncios", href: "#anuncios" },
    { label: "ROI", href: "#roi" },
    { label: "Operação ao vivo", href: "#live-ops" },
    { label: "Próximos passos", href: "#proximos-passos" },
  ];
  return (
    <footer style={{
      position: "relative",
      background: "hsl(var(--pres-dark))",
      color: "white",
      overflow: "hidden",
      paddingTop: 80,
      paddingBottom: 32,
      marginTop: 0,
    }}>
      {/* Glow background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(60% 50% at 50% 0%, hsl(215 90% 55% / 0.22), transparent 60%)," +
          "radial-gradient(40% 40% at 85% 80%, hsl(38 80% 55% / 0.10), transparent 60%)",
      }} />
      {/* Logo central topo */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <img
          src="/apresentacao/lynecloud-full.png"
          alt="LyneCloud"
          style={{
            width: "auto",
            maxWidth: 220,
            height: "auto",
            filter: "drop-shadow(0 10px 30px hsl(215 90% 50% / 0.45))",
          }}
        />
        <p style={{
          marginTop: 18, maxWidth: 520, padding: "0 24px",
          fontSize: 14, lineHeight: 1.65, color: "hsl(0 0% 100% / 0.7)",
        }}>
          Estrutura digital completa para clínicas odontológicas que querem dominar
          o mercado local com método, tecnologia e zero mensalidade.
        </p>

        <a
          href={WPP_LINK}
          target="_blank"
          rel="noreferrer"
          className="pres-btn pres-btn-primary"
          style={{ marginTop: 24 }}
        >
          <Phone size={16} /> Falar com a LyneCloud <ArrowRight size={14} />
        </a>
      </div>

      <div className="pres-container" style={{ position: "relative", marginTop: 56 }}>
        <div style={{
          display: "grid",
          gap: 40,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(38 80% 70%)" }}>
              Navegação
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 14, color: "hsl(0 0% 100% / 0.75)", textDecoration: "none", transition: "color .2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(0 0% 100% / 0.75)")}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(38 80% 70%)" }}>
              Contato direto
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, color: "hsl(0 0% 100% / 0.85)", textDecoration: "none", fontSize: 14 }}>
                <MessageCircle size={16} color="hsl(152 70% 65%)" />
                (27) 98112-0322
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "hsl(0 0% 100% / 0.7)", fontSize: 14 }}>
                <Clock size={16} color="hsl(38 80% 70%)" />
                Atendimento comercial · Seg–Sex
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "hsl(0 0% 100% / 0.7)", fontSize: 14 }}>
                <ShieldCheck size={16} color="hsl(152 70% 65%)" />
                Sem mensalidade · Painel próprio
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "hsl(38 80% 70%)" }}>
              Garantias
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "hsl(0 0% 100% / 0.75)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={14} color="hsl(152 70% 65%)" /> Implantação em até 14 dias
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={14} color="hsl(152 70% 65%)" /> Treinamento incluso
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={14} color="hsl(152 70% 65%)" /> Painel 100% da clínica
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 56, paddingTop: 24,
          borderTop: "1px solid hsl(0 0% 100% / 0.10)",
          display: "flex", flexWrap: "wrap", gap: 12,
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 12, color: "hsl(0 0% 100% / 0.55)" }}>
            © {year} {BRAND} · Dossiê comercial de implantação · Todos os direitos reservados.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "hsl(0 0% 100% / 0.55)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "hsl(var(--pres-success))", boxShadow: "0 0 10px hsl(var(--pres-success))" }} />
            Sistema operacional em produção
          </div>
        </div>
      </div>
    </footer>
  );
}
