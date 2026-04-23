

# Painel Levii v2 — upgrade premium "estilo dashboard de software pago"

Vou **elevar o painel atual** ao nível visual da imagem de referência (corporativo, claro, hierarquia forte, gráficos refinados, tabelas e ações reais) e **completar funcionalmente cada módulo**. **Não recriar nada do zero** — refino o que já existe, mantendo identidade Levii (azul `--primary`), responsividade total e a integração ChatPro intacta.

## Visão geral do redesign

```text
┌─────────────────┬──────────────────────────────────────────────────────────┐
│ SIDEBAR ESCURA  │  TOPBAR (search global + atalhos + sino + perfil)        │
│ (dark slate)    ├──────────────────────────────────────────────────────────┤
│ Logo + chip     │  H1 forte + subtítulo + filtro de período (top-right)    │
│                 │                                                          │
│ • Dashboard     │  ┌─KPI─┐ ┌─KPI─┐ ┌─KPI─┐ ┌─KPI─┐  ← cards finos,        │
│ • Agenda        │  │trend│ │trend│ │trend│ │trend│    ícone pastel,        │
│ • Pacientes     │  └─────┘ └─────┘ └─────┘ └─────┘    delta colorido       │
│ • Tratamentos   │                                                          │
│ • Profissionais │  ┌─Gráfico área (2/3)──────┐ ┌─Donut status (1/3)─┐     │
│ • Financeiro    │  │ últimos 30 dias         │ │ Total no centro    │     │
│ • Leads         │  │ tooltip rico, eixos     │ │ legenda lateral    │     │
│ • WhatsApp      │  └─────────────────────────┘ └────────────────────┘     │
│ • Avaliações    │                                                          │
│ • Site          │  ┌─Próximos (1/3)─┐ ┌─Procedimentos (1/3)┐ ┌─Reviews─┐  │
│ • Relatórios    │  │ lista + status │ │ barras horizontais │ │ estrelas│  │
│ • Configurações │  └────────────────┘ └────────────────────┘ └─────────┘  │
│                 │                                                          │
│ Ajuda · Perfil  │  ┌─Resumo financeiro (4 mini KPIs em linha)──────────┐  │
│ Sair            │  └─────────────────────────────────────────────────────┘  │
└─────────────────┴──────────────────────────────────────────────────────────┘
```

Mudanças centrais:
- **Tipografia**: corpo continua Montserrat, mas títulos do painel passam a usar **Inter/Geist via system stack** (`font-display` é trocado por `font-sans tracking-tight font-semibold` **só no namespace `/admin`**) — fica com a cara "SaaS premium" da imagem, sem Playfair que dá ar de revista. Site público segue intacto com Playfair.
- **Densidade**: cards 16px de raio, borda `hsl(220 18% 92%)`, sombra `0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.04)`, padding 24px. Espaçamento 20–24px entre blocos.
- **Cores extras** apenas no admin: `--admin-bg: 220 24% 97%`, `--admin-card: 0 0% 100%`, `--admin-border: 220 18% 91%`, `--admin-text: 222 32% 12%`, `--admin-muted: 220 12% 46%`. Acentos pastel para ícones de KPI: azul, verde, amarelo, roxo, laranja — todos light/soft.
- **Sem neon, sem glow exagerado.** Glass só no topbar (blur leve sobre `bg-white/85`).

## Tela de login — redesenho do zero (mas sem mudar fluxo)

Sai o split com aside escuro pesado e frase rotativa. Entra um layout **moderno, claro, centralizado, asymmetric card** estilo **Linear / Vercel / Stripe Dashboard**:

```text
┌───────────────────────────────────────────────────────────────┐
│  [bg: gradient soft + mesh sutil + grid de 1px opacity .04 ] │
│                                                               │
│         ┌────────────────────────────────────────┐            │
│         │  ◆ Logo Levii                          │            │
│         │                                        │            │
│         │  Acesse o painel                       │            │
│         │  Gerencie sua clínica em um só lugar   │            │
│         │                                        │            │
│         │  E-mail        [____________________]  │            │
│         │  Senha         [_______________] 👁    │            │
│         │                                        │            │
│         │  [ Entrar no painel              → ]   │   ← btn    │
│         │                                        │     azul   │
│         │  ─── acesso restrito ───               │     forte  │
│         │                                        │            │
│         │  🛡  Sem cadastro público              │            │
│         │     Solicite acesso à coordenação      │            │
│         └────────────────────────────────────────┘            │
│                                                               │
│         © Clínica Levii · Aracruz/ES · v1.0                  │
└───────────────────────────────────────────────────────────────┘
```

- **Mobile-first** real: card 100% width com padding 24px, em desktop fica `max-w-[440px]` centralizado, sem aside lateral.
- Fundo: `bg-[hsl(220_24%_97%)]` + 2 blobs CSS (`::before/::after`) com `blur(80px)` em azul muito suave. Grid de pontos `radial-gradient(circle, rgba(15,23,42,.04) 1px, transparent 1px)` 24×24. Sem framer-motion no fundo (tira peso) — só fade-in do card via Tailwind.
- Inputs `h-12` com sombra interna sutil, label em cima, ícone à esquerda, foco com `ring-2 ring-primary/25 border-primary`.
- Botão `h-12` `bg-gradient-to-b from-primary to-[hsl(215_75%_32%)]` com seta animada no hover.
- Link "primeiro acesso" some por padrão; aparece **só** quando `?bootstrap=1` está na URL (evita poluição visual e abuso). 
- 100% responsivo: `375px` → card sem grudar nas bordas; `1280px+` → mantém centralização.

## Componentes reutilizáveis (novos / refinados)

```text
src/admin/components/
  KpiCard.tsx              ← refeito: layout horizontal, ícone soft, delta com seta
  AdminCard.tsx            ← novo wrapper padrão (header + actions + body + footer)
  DataTable.tsx            ← novo: busca, filtros, paginação, seleção, ações por linha
  FiltersBar.tsx           ← novo: chips de filtro + range de data + status select
  StatusPill.tsx           ← novo: pílulas coloridas consistentes (8 status)
  PageHeader.tsx           ← refinado: título grande + subtítulo + actions à direita
  SectionTitle.tsx         ← novo: título de bloco com "Ver tudo" alinhado
  ConfirmDialog.tsx        ← novo: confirmação padrão para excluir/cancelar
  EntityDrawer.tsx         ← novo: drawer lateral 480px para criar/editar/visualizar
  EmptyState.tsx           ← refinado: ilustração SVG + CTA primário
  TrendSpark.tsx           ← novo: mini sparkline para KPIs
  ChartFrame.tsx           ← novo: card de gráfico com header + período + export
```

`DataTable.tsx` é a peça central: usado em Pacientes, Profissionais, Tratamentos, Financeiro, Leads, Avaliações, Relatórios. Recebe `columns`, `rows`, `actions`, opções de busca/filtro/paginação. Substitui as tabelas soltas atuais.

## Dashboard (refino)

- **5 KPIs em linha** (não 4): Agendamentos hoje · Novos pacientes (30d) · Em andamento · Faturamento estimado · Taxa de confirmação. Cada um com **delta vs período anterior** calculado de verdade a partir do `appointments`.
- **AreaChart** com gradiente azul mais limpo, dots no hover, tooltip custom (card branco com shadow), eixo X mostrando dia + mês curto, gridlines pontilhadas claras.
- **Donut** com `Total` grande no centro + legenda à direita com porcentagens calculadas, igual à referência.
- Bloco novo **"Procedimentos mais realizados"** (barras horizontais a partir do `treatment` em `appointments`).
- **Resumo financeiro** (faturamento estimado, recebimentos previstos = confirmados, pendências = pending, ticket médio) em uma fileira inferior.
- **Período** no canto superior direito (7d / 30d / 90d / Personalizado) controla todos os KPIs e gráficos via state local.

## Cada módulo do menu — escopo funcional

> Padrão de cada página: PageHeader + FiltersBar + (KPIs do módulo) + DataTable + EntityDrawer + ConfirmDialog. Quando não há dado no DB, mostra EmptyState **com CTA "Criar primeiro X"** que abre o drawer.

### Agenda
- Manter calendário + lista do dia (já existe), mas:
  - Cabeçalho com **3 KPIs do dia** (Total, Confirmados, Pendentes).
  - Visões **Dia / Semana / Mês** (toggle).
  - Ações por linha: Confirmar · Concluir · Reagendar (drawer com date+time picker) · Cancelar (Confirm).
  - Botão **"Novo encaixe"** abre drawer e insere em `appointments` com status `confirmed`.
  - **Bloqueios de agenda**: aba lateral, persiste em nova tabela `schedule_blocks (id, date, start_time, end_time, professional_slug, reason)` (RLS admin only).

### Pacientes
- DataTable a partir do agrupamento por telefone (já existe lógica) + busca + filtro por última visita + paginação 20/pg.
- Linha clicável → **EntityDrawer** com: dados, histórico de agendamentos (todos do mesmo telefone), observações internas (nova tabela `patient_notes (phone, note, created_at, created_by)`), botão **"Enviar WhatsApp"** que abre `https://wa.me/...`.

### Tratamentos
- DataTable lendo `TREATMENTS` + futura tabela `treatments_overrides (slug, price_from, duration, active)` para edições persistirem **sem mexer no `clinic.ts` do site**.
- Ações: Editar (drawer), Ativar/Desativar (switch), Visualizar.
- Card de KPIs: total ativos, ticket médio, mais procurado (do `appointments`).

### Profissionais (atendendo o pedido específico)
- Nova tabela `professionals (id, name, slug, specialty, cro, photo_url, email, phone, status, weekly_hours, notes_internal, created_at)` + relação `professional_schedules (professional_id, weekday 0-6, start, end)`.
- Página com **DataTable + cards toggle**:
  - Cadastro completo (Drawer com tabs: Dados · Especialidade · Agenda semanal · Permissões · Observações).
  - Status ativo/inativo (switch na tabela).
  - Coluna **Produtividade** = nº de agendamentos confirmados/concluídos no período (calculado de `appointments.professional`).
  - **Desempenho individual**: drawer mostra mini gráfico de atendimentos por mês (bar chart pequeno).
  - **Permissões**: combo (admin/agenda_only/leitura) — gravado em `user_roles` quando o profissional tem login.
- Seed inicial: importa `DENTISTS` do `clinic.ts` na primeira carga (idempotente via `upsert` por slug).

### Financeiro
- Nova tabela `financial_entries (id, type 'income'|'expense', appointment_id?, amount_cents, description, due_date, paid_at, status 'pending'|'paid'|'overdue', method)`.
- KPIs: A receber · Recebido no mês · Atrasado · Ticket médio.
- DataTable de lançamentos + filtros (status, período, profissional) + ações Marcar como pago / Editar / Excluir.
- Bloco **"Orçamentos"** (drawer rápido para criar) — versão MVP, salva em `financial_entries` como `pending`.
- Gráfico de área (recebido por dia) + barras (entradas vs saídas mensais).

### Leads & Captação
- Nova tabela `leads (id, name, phone, email, source, status 'novo'|'contato'|'orçamento'|'fechado'|'perdido', notes, created_at, last_touch_at, owner)`.
- **Funil Kanban** (4–5 colunas, drag-and-drop com `@dnd-kit/core`).
- DataTable alternativa + filtros por origem/status/responsável.
- Form de criação (drawer) + ação "converter em paciente" → cria appointment.

### WhatsApp
- Manter toda a lógica ChatPro atual (nada quebra).
- **Remover a "senha de integração"** local e passar a chamar a edge function com o JWT do admin (já está logado). Mantém compat: se a function ainda exigir senha, mantemos um modal silencioso só na primeira chamada e gravamos no `localStorage` por sessão.
- Visual reformatado para o padrão Card+Tabs do resto do painel.
- Adiciona aba **"Disparos em massa"** (lista de pacientes selecionáveis + template). Usa o endpoint `send_test` em loop com throttle.

### Avaliações
- Tabela `reviews (id, patient_name, rating, comment, source 'google'|'manual', created_at, replied_at)`.
- KPIs: Média geral · Total · Respondidas · Pendentes de resposta.
- DataTable com filtro por estrelas/origem; ação "Responder" (drawer).
- Importação manual via botão (formulário) — automação Google fica para depois com CTA "em breve" honesto.

### Site & Landing
- Tabela `site_promotions (id, title, slug, description, cta_label, cta_url, active, starts_at, ends_at)`.
- DataTable + drawer de criação. Mostra preview do banner.
- Bloco "Formulários recebidos" lê os próprios `appointments` (já é o form do site) com filtros por origem.

### Relatórios
- Página com **seletor de relatório** (Performance · Conversão · Faltas · Cancelamentos · Crescimento) e período.
- Cada relatório = 2 KPIs + 1 gráfico + 1 DataTable exportável (CSV via `papaparse` no client).
- Botão **"Exportar CSV"** e **"Imprimir"** no header.

### Configurações
- Tabs: **Horários · Feriados · Integrações · Usuários · Branding · Preferências**.
- Horários: tabela `clinic_hours (weekday, open, close, is_open)`.
- Feriados: tabela `clinic_holidays (date, label)`.
- Usuários: lista de `auth.users` com seus papéis em `user_roles` — admin pode promover/rebaixar (chamada a uma nova edge function `admin-users` com service role).
- Integrações: card ChatPro (status/config rápida) + cards "Google · Pix · Meta Ads" como "em breve" honesto.
- Branding e Preferências: read-only nesta v2 (tema, locale, fuso) — preparado para gravar.

## Backend / migrações necessárias

Uma migração SQL única adiciona:

```text
- professionals               (+ RLS admin manage / public read se precisar futuro)
- professional_schedules
- patient_notes
- schedule_blocks
- treatments_overrides
- financial_entries
- leads
- reviews
- site_promotions
- clinic_hours
- clinic_holidays
```

Todas com **RLS**: admins (`has_role(auth.uid(), 'admin')`) podem CRUD; demais bloqueados. Nenhuma tem foreign key para `auth.users` (segue regra do projeto).

Edge function nova: **`admin-users`** (lista usuários, atribui role) — usa `SUPABASE_SERVICE_ROLE_KEY`, valida `has_role` antes de qualquer ação.

## Hooks / data layer

```text
src/admin/hooks/
  useAppointments.ts       (existe — manter)
  useProfessionals.ts      (CRUD via supabase + react-query)
  useLeads.ts
  useFinance.ts
  useReviews.ts
  usePatientNotes.ts
  useClinicSettings.ts     (horários, feriados, branding)
  useAdminMutations.ts     (helpers genéricos invalidate + toast)
  useDashboardStats.ts     (centraliza cálculos do dashboard, cache 60s)
```

Padrão: React Query com `staleTime` 30–60s, `invalidateQueries` após mutação, toasts unificados.

## Responsividade

- **Sidebar** vira drawer abaixo de `lg` (já existe).
- **DataTables**: em `<md` viram **lista de cards** (uma row = um card empilhado, com 2 ações principais visíveis e menu `⋮` para o resto).
- **KPIs**: `grid-cols-2` em mobile, `grid-cols-3` em tablet, `grid-cols-5` em desktop.
- **Gráficos**: `h-64` mobile, `h-72` desktop; `ResponsiveContainer` em todos.
- **Drawers**: `w-full` em mobile, `w-[480px]` em desktop.
- Testes manuais: 375 / 768 / 1280 / 1536.

## Ordem de execução (8 etapas, sem regressão)

1. **Tokens + utilitários do admin** (`--admin-*` em `index.css`, classe `font-admin`, `card-admin`, `btn-admin`).
2. **Componentes base novos** (`AdminCard`, `DataTable`, `FiltersBar`, `StatusPill`, `EntityDrawer`, `ConfirmDialog`, `ChartFrame`, `TrendSpark`).
3. **Refazer `AdminLogin`** (novo layout centralizado, sem aside) e **`LoginAside` removido** (ou mantido como `unused` deprecated).
4. **Topbar refinado** + sidebar com hover/active mais sutil (espaçamento, ícone com fundo soft no ativo).
5. **Dashboard v2** (5 KPIs com trend, ChartFrame nos 2 gráficos, novo bloco de procedimentos, resumo financeiro, seletor de período).
6. **Migração SQL** (todas as tabelas novas + RLS).
7. **Páginas funcionais** na ordem: Profissionais → Agenda → Pacientes → Tratamentos → WhatsApp (refino) → Financeiro → Leads → Avaliações → Site → Relatórios → Configurações.
8. **QA**: 375/768/1280/1536, checagem de que site público (`/`, `/sobre`, `/tratamentos`…) e ChatPro continuam funcionando, e seed inicial dos profissionais a partir de `DENTISTS`.

## O que não muda (garantias)

- Site público (`/`, `/sobre`, `/tratamentos`, `/galeria`, `/equipe`, `/servicos`, `/localizacao`, `/contato`) **não é tocado**.
- Integração ChatPro segue **idêntica** — só a casca visual muda e o gating por senha vira gating por sessão admin.
- Identidade Levii (azul `--primary`, dourado discreto) preservada — o "premium" vem de hierarquia, espaçamento e densidade, não de troca de paleta.
- Nenhum dado mockado: tudo o que aparecer com número vem do Supabase. Onde ainda não há dado, **EmptyState com CTA real** que cria o primeiro registro.

