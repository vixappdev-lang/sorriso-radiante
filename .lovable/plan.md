

# Painel Administrativo Levii — Plano completo

Painel profissional, separado do site público, com **login dedicado** (split-screen com animação à esquerda + formulário à direita), **layout com sidebar fixa**, **dashboard com gráficos interativos** (Recharts) e **dados 100% reais do Supabase** (sem mock). Design clean, glass sutil, zero neon.

## Decisões-chave

- **Acesso restrito por convite**: a tela de login **não tem opção de "criar conta"**. O admin é criado por você (ou por mim, via seed). Auth via Supabase Email+Password.
- **Apenas o que tem dados reais hoje aparece com números**; o restante mostra **estado vazio elegante** ("Nenhum registro ainda — comece adicionando…") com CTA. Nada de gráfico mockado.
- **Migração unificada do `Config` antigo**: o `/config` (ChatPro/QR) vira uma sub-rota dentro do painel (`/admin/whatsapp` e `/admin/configuracoes/integracoes`). Mantém 100% da integração ChatPro funcionando — só muda a casca visual.
- **Site público continua intacto.** Nada do `/`, `/sobre`, `/tratamentos` etc. é tocado.

## Arquitetura de rotas

```text
/admin/login                  → tela split-screen (pública)
/admin                        → redireciona para /admin/dashboard
/admin/dashboard              → visão geral + gráficos
/admin/agenda                 → calendário, bloqueios, confirmações
/admin/pacientes              → cadastro, histórico, observações
/admin/tratamentos            → procedimentos, valores, duração
/admin/profissionais          → dentistas, especialidades, agendas
/admin/financeiro             → pagamentos, pendências, orçamentos, relatórios
/admin/leads                  → captação, funil, follow-up, inativos
/admin/whatsapp               → mensagens auto, lembretes, campanhas + ChatPro
/admin/avaliacoes             → reviews Google, reputação local
/admin/site                   → landing pages, formulários, promoções
/admin/relatorios             → performance, conversão, faltas, cancelamentos
/admin/configuracoes          → horários, feriados, integrações, usuários, branding

/config (legado)              → redireciona para /admin/whatsapp
```

Tudo protegido por `<RequireAdmin>` — sem sessão Supabase válida, redireciona para `/admin/login`.

## Tela de login (split-screen)

```text
┌──────────────────────────┬────────────────────────────┐
│                          │                            │
│   [LADO ESQUERDO]        │   [LADO DIREITO]           │
│   Animação suave:        │   Logo Levii (top)         │
│   - gradiente azul       │                            │
│     animado (CSS)        │   "Bem-vindo de volta"     │
│   - mesh blobs em        │   "Acesse o painel da      │
│     blur lento           │    Clínica Levii"          │
│   - ícone dental         │                            │
│     flutuando (Lucide    │   [ Email          ]       │
│     + framer-motion)     │   [ Senha       👁 ]       │
│   - frase rotativa:      │                            │
│     "Cuidado humano,     │   [   Entrar           ]   │
│      tecnologia          │                            │
│      precisa."           │   ─────  ou  ─────         │
│                          │   "Esqueceu a senha?"      │
│                          │                            │
│                          │   (sem botão "criar conta")│
│                          │                            │
└──────────────────────────┴────────────────────────────┘
```

- **Mobile**: lado esquerdo vira faixa superior reduzida (h-32) com a animação compacta; o formulário ocupa o restante.
- **Animação**: blobs SVG com `animate-pulse-slow` (CSS keyframes próprios, sem libs pesadas), além de `framer-motion` para o fade do título rotativo. Sem neon, paleta `--primary` + `--primary-glow` em opacidade baixa, glass sutil sobre o gradiente.
- **Validação**: `zod` (email + senha mínima). Erros inline. Toast de erro em falhas de auth.

## Layout do painel (com sidebar)

```text
┌──────────┬────────────────────────────────────────────────────┐
│          │  [Topbar]                                          │
│          │   Breadcrumb            🔔(badge)    👤Avatar▾     │
│ SIDEBAR  ├────────────────────────────────────────────────────┤
│ (260px)  │                                                    │
│          │   Conteúdo da página                               │
│ Logo     │   - Cards / gráficos / tabelas                     │
│          │   - Layout em grid 12 colunas, alinhado à esquerda │
│ Dashboard│   - Padding generoso, sem centralização forçada    │
│ Agenda   │                                                    │
│ Pacientes│                                                    │
│ ...      │                                                    │
│          │                                                    │
│ Sair     │                                                    │
└──────────┴────────────────────────────────────────────────────┘
```

- **Sidebar** (Shadcn `Sidebar` com `collapsible="icon"`): grupos colapsáveis, ícones Lucide, item ativo destacado com barra à esquerda em `--primary`. Em mobile, vira drawer.
- **Topbar**: breadcrumb dinâmico, **sino de notificações** (popover com lista de eventos reais — novos agendamentos, novos leads), **avatar do admin** (popover com nome/email + "Sair").
- **Sem centralização**: `container` com `max-w-none` e `px-8`, conteúdo encosta à esquerda do canvas útil.
- **Glass sutil**: topbar com `glass` (blur leve sobre o fundo), cards com `card-elevated`.

## Dashboard — visão geral (com gráficos reais)

Layout em grid:

```text
[ KPI Agendamentos hoje ] [ KPI Novos pacientes (30d) ] [ KPI Em andamento ] [ KPI Faturamento estimado ]

[ Gráfico: Agendamentos por dia (área, 30 dias)        ] [ Donut: Status dos agendamentos        ]
[ — Recharts AreaChart, dados de appointments          ] [ pending / confirmed / done / cancelled ]

[ Tabela: Próximos agendamentos (7 dias)               ] [ Lista: Notificações importantes        ]
```

- **Fonte de dados**: tudo de `appointments` no Supabase (já existe). Faturamento estimado = soma de `priceFrom` por tratamento × agendamentos confirmados (cálculo no client a partir de `TREATMENTS` em `src/data/clinic.ts`).
- **Avaliações recentes**: usa `TESTIMONIALS` do `clinic.ts` enquanto não há integração Google.
- **Sem dados → estado vazio**: ilustração + texto "Ainda não há agendamentos. Eles aparecerão aqui assim que chegarem pelo site."
- **Gráficos**: `recharts` (já instalado via Shadcn). Tooltips, animações, cores da paleta brand.

## Demais páginas (escopo desta entrega)

| Página | O que entra agora | O que fica como "em breve" |
|---|---|---|
| **Agenda** | Calendário mensal (Shadcn Calendar) com pontos nos dias com agendamento + lista lateral do dia selecionado + ações: confirmar / cancelar / reagendar | Bloqueios de agenda, encaixes (UI pronta, persistência futura) |
| **Pacientes** | Lista derivada de `appointments` (agrupada por phone), busca, drawer de detalhes com histórico | Cadastro completo + documentos (placeholder) |
| **Tratamentos** | CRUD visual lendo `TREATMENTS` (read-only nesta v1, com aviso "edite em `src/data/clinic.ts`") | Persistência em DB futura |
| **Profissionais** | Mesma abordagem dos tratamentos, lendo `DENTISTS` | — |
| **WhatsApp** | **Toda a UI atual de `/config`** migrada (QR, status, teste, template, lista de agendamentos com WhatsApp ✓) | Campanhas, lembretes programados |
| **Financeiro / Leads / Avaliações / Site / Relatórios / Configurações** | Página com header, breadcrumb e **estado vazio bem desenhado** + lista de subitens previstos (cards "em breve" navegáveis) | Implementação completa em iterações futuras |

> Princípio: **nenhum número falso**. Onde não há fonte real, mostro estado vazio profissional, não mock.

## Backend / Auth

1. **Habilitar Supabase Auth Email+Password** (já disponível no Cloud).
2. **Tabela `admin_users`** (apenas marcador, RLS bloqueando client) + **tabela `user_roles`** + enum `app_role` (`admin`) + função `has_role()` security definer — exatamente como dita o padrão obrigatório de roles.
3. **Seed do primeiro admin**: solicito email + senha via tool de secret e crio o usuário no `auth.users` mais a linha em `user_roles`. **Sem signup público.** O componente de login só faz `signInWithPassword`.
4. **Edge function `admin-data`** (nova): centraliza queries privilegiadas para o dashboard (lê `appointments` ignorando RLS via service role) — verifica `has_role(user, 'admin')` antes de responder.
5. **`chatpro-admin` permanece**, mas passa a aceitar **JWT do admin logado** em vez da senha hardcoded. Mantém compatibilidade com a senha como fallback durante a migração.

## Componentes a criar

```text
src/admin/
  layout/
    AdminLayout.tsx        ← Sidebar + Topbar + <Outlet/>
    AdminSidebar.tsx       ← grupos + ícones + item ativo
    AdminTopbar.tsx        ← breadcrumb + sino + avatar
    NotificationsPopover.tsx
    UserMenu.tsx
    RequireAdmin.tsx       ← guard de rota
  pages/
    Login.tsx              ← split-screen
    Dashboard.tsx
    Agenda.tsx
    Pacientes.tsx
    Tratamentos.tsx
    Profissionais.tsx
    Financeiro.tsx
    Leads.tsx
    WhatsApp.tsx           ← absorve Config.tsx
    Avaliacoes.tsx
    Site.tsx
    Relatorios.tsx
    Configuracoes.tsx
  components/
    KpiCard.tsx
    EmptyState.tsx
    AppointmentsAreaChart.tsx
    StatusDonut.tsx
    LoginAside.tsx         ← animação do lado esquerdo
  hooks/
    useAdminSession.ts     ← wrapper do supabase.auth
    useAppointments.ts     ← React Query
```

## Ordem de execução

1. Migração SQL: `app_role` enum + `user_roles` + `has_role()` + RLS de leitura admin em `appointments` e `chatpro_config`.
2. Criar primeiro admin (vou pedir email/senha via secret).
3. `AdminLayout` + `AdminSidebar` + `AdminTopbar` + `RequireAdmin` + rotas.
4. Tela `/admin/login` split-screen com animação.
5. `Dashboard` com gráficos reais (Recharts) ligados aos `appointments`.
6. `Agenda` (calendário + lista do dia + ações).
7. `Pacientes`, `Tratamentos`, `Profissionais` (read-only desta v1).
8. `WhatsApp` absorvendo todo o `Config.tsx` atual + redirect de `/config`.
9. Páginas restantes com estado vazio profissional + estrutura pronta para evoluir.
10. QA responsivo (375 / 768 / 1280) + checagem de que site público segue intacto e ChatPro segue funcionando.

## O que vou pedir antes de começar a codar

- **Email + senha** do primeiro admin (cria você como dono do painel).
- Confirmação de que posso adicionar `framer-motion` (~30kb gz) para a animação do login — se preferir, faço só com CSS puro.

