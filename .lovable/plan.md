
# Painel Levii v3 — refino premium + módulos funcionais completos

Continuação direta do v2. **Sem recriar nada**, sem mexer no site público, sem trocar identidade visual. Foco em: (1) elevar visualmente Dashboard/Login/Agenda, (2) tornar funcionais todos os módulos hoje em "ComingSoon", (3) preparar integração Clinicorp real.

## 1. Dashboard — refino visual

- **Remover** o bloco "Resumo financeiro estimado" da parte inferior.
- **`KpiCard` redesenhado**: ícone em quadrado `h-11 w-11 rounded-xl bg-{tom}-50` no topo-esquerda + delta em pílula no topo-direita; número grande `text-[32px] font-semibold tracking-tight tabular-nums`; label discreto abaixo. Padding 24, sombra `0 1px 2px rgba(15,23,42,.04), 0 8px 24px -16px rgba(15,23,42,.08)`.
- **`ChartFrame` v2**: header com mais respiro, gridlines `2 4` claras, tooltip com sombra forte.
- **Tipografia da página inteira** dentro de `.admin-shell`: títulos `font-semibold tracking-[-0.02em]`, números sempre `tabular-nums`.
- **Toolbar global** acima dos KPIs: pílula 7d/30d/90d + Exportar CSV + Atualizar.

```text
[Dashboard]                                  [7d|30d|90d] [Export] [↻]
┌KPI┐ ┌KPI┐ ┌KPI┐ ┌KPI┐ ┌KPI┐
└───┘ └───┘ └───┘ └───┘ └───┘
┌─Área 30d (h=300) ─────────────┐ ┌─Donut ────────┐
└───────────────────────────────┘ └───────────────┘
┌─Próximos 6─┐ ┌─Top procedim.─┐ ┌─Avaliações─┐
└────────────┘ └───────────────┘ └────────────┘
```

## 2. Tela de login — split-screen premium responsivo

- `lg:grid-cols-2`. Mobile: card centralizado (sem aside).
- **Esquerda (lg+)**: painel escuro `bg-[hsl(222_32%_9%)]` com mesh sutil, dois blobs azuis `blur(120px)` (zero neon), logo grande, frase de marca, 3 mini-features (Lock/Activity/Sparkles). Animação CSS pura (gradient slow-pan, sem framer-motion novo).
- **Direita**: card branco com formulário atual ajustado.
- Testado a 375 / 768 / 1024 / 1440.

## 3. Agenda — redesenho

- **Remove** calendário lateral 360px.
- Header: 4 KPIs do dia + filtros (Profissional, Status, Buscar) + toggle **Dia / Semana / Mês**.
- **Visão Dia (default)**: timeline 07h–20h com slots 30min, agendamentos como cards coloridos por status.
- **Visão Semana**: grade 7 colunas × slots.
- **Visão Mês**: calendário compacto com contagem por dia.
- Cards com avatar, hora destacada, paciente, tratamento, profissional, ações inline.
- **Bloqueios**: botão "Bloquear horário" → drawer → grava em `schedule_blocks`.

## 4. Tratamentos — CRUD real em modal

- Migração: adiciona `name, category, description, professional_slug, availability` em `treatments_overrides`.
- Lista combina `TREATMENTS` (catálogo base) + overrides (edits/novos).
- DataTable: nome, categoria, valor, duração, profissional, status (switch), ações.
- KPIs: ativos, inativos, ticket médio, mais procurado.
- Drawer com tabs **Dados** + **Marketing**, ConfirmDialog para excluir.

## 5. Financeiro — completo

- 5 KPIs: A receber, Recebido no mês, Atrasado, Ticket médio, Crescimento MoM.
- **Tabs**: Lançamentos · Orçamentos · Pendências · Relatórios.
- DataTable de `financial_entries` + drawer (Entrada/Saída/Orçamento/Parcelamento → gera N entries).
- Gráficos: AreaChart fluxo mensal · BarChart "Tratamentos mais lucrativos" · Lista "Pacientes mais lucrativos".
- **Auto-criação**: edge function `create-financial-entry` cria entry `pending` quando appointment vai para `done`.

## 6. Leads — Kanban CRM premium

- 7 colunas: Novo · Contato feito · Orçamento enviado · Aguardando retorno · Negociação · Fechado · Perdido.
- Drag-and-drop com `@dnd-kit/core`.
- Card: nome, telefone (botão WhatsApp), origem, tratamento de interesse, valor estimado, dias parado, responsável.
- Drawer detalhe com tabs Dados · Histórico (timeline) · Follow-ups · Conversão (botão "Criar agendamento" pré-preenchido).
- Toggle Kanban / Tabela.
- Migração: adiciona `treatment_interest, estimated_value_cents, next_followup_at` em `leads`.

## 7. Avaliações & Reputação

- KPIs: Média geral · Total · Respondidas · Taxa de resposta · NPS estimado.
- Tabs: Todas · Google · Manuais · Pendentes.
- DataTable + drawer "Responder" (com botão "Pedir avaliação via WhatsApp").
- **Solicitações automáticas**: após X dias de `done`, gera mensagem template + link Google. Configurável.
- Bloco reputação: gráfico de evolução + distribuição 1-5 estrelas.
- **Google Reviews**: campo Place ID + edge function `fetch-google-reviews` (requer Google Places API key — peço via secret se quiser ativar). Sem key, import manual.

## 8. Site & Landing Pages — editor de conteúdo

- Tabela `site_content (key text PK, value jsonb)`. Site lê via React Query com fallback para `clinic.ts`. **Zero quebra**.
- Painel com seções: Hero · Sobre · Tratamentos · Equipe · Galeria · FAQ · Localização · Contato · Footer. Form inline por seção.
- Botão "Ver no site" abre `/` em nova aba.
- **Promoções** (já existe `site_promotions`): DataTable + drawer + preview.
- **Landing pages**: tabela `landing_pages (slug, title, content jsonb, active)`, rota `/lp/:slug` no site.

## 9. Relatórios

- Seletor: tipo (Performance · Conversão · Faltas · Cancelamentos · ROI · Origem · Top tratamento · Por profissional · Crescimento) + período + profissional.
- Cada relatório = 2 KPIs + 1 gráfico + 1 tabela exportável.
- **Export CSV** via `papaparse`, **Imprimir** via CSS print.
- Tudo derivado de `appointments` + `financial_entries` + `leads`.

## 10. Configurações — reorganização modular

Layout `lg:grid-cols-[240px_1fr]`: sub-sidebar + área de conteúdo.

Seções: **Geral · Horários · Feriados · Integrações · Usuários & Permissões · Branding · APIs Externas · Webhooks · Segurança · Notificações.**

- **Usuários**: edge function `admin-users` (lista + promove/rebaixa via service role).
- **Branding**: cores e fonte com preview ao vivo.
- **Notificações**: toggles do sino do topbar.

## 11. Integração Clinicorp (preparada para credenciais reais)

- Migração `external_integrations (provider PK, config jsonb, secrets_set, last_sync_at, status, error)`.
- Edge function `clinicorp-sync`: `test_connection`, `pull_appointments`, `push_appointment`, `webhook_in`.
- Migração `appointments`: adicionar `external_id`, `external_source` (dedup).
- UI em **Configurações → APIs Externas**: form (endpoint, token, clinic_id), botão "Testar conexão", switch "Sync automática (15min)" via `pg_cron`, logs.
- **Secrets `CLINICORP_TOKEN`, `CLINICORP_CLINIC_ID`**: peço via add_secret quando você confirmar que tem as credenciais. Sem elas, status "configurado, aguardando credenciais" — sem mocks, honesto.

## 12. API própria + Webhooks

- Edge function `public-api` autenticada por `X-API-Key`: `GET/POST /appointments`, `GET /patients`.
- Tabela `api_keys (id, label, key_hash, scopes, last_used_at)`. Geração na UI.
- Tabela `webhook_endpoints (url, events[], secret, active)`. Edge function `dispatch-webhook` envia POST assinado HMAC-SHA256 quando appointment muda de status.

## 13. Componentes globais

- **DataTable**: filtros (FiltersBar), ordenação clicável, seleção múltipla, ações em massa.
- **EntityDrawer**: variante `wide` (640px).
- **StatusPill**: novos status (active/inactive/overdue/paid/pending/won/lost).

## Migrações SQL (uma única)

```text
ALTER appointments    + external_id, external_source
ALTER treatments_overrides + name, category, description, professional_slug, availability text[]
ALTER leads           + treatment_interest, estimated_value_cents, next_followup_at
CREATE site_content (key text PK, value jsonb)
CREATE landing_pages
CREATE external_integrations
CREATE api_keys
CREATE webhook_endpoints
CREATE clinic_settings (key/value para config geral)
```

Todas com RLS `has_role(auth.uid(), 'admin')`. `site_content`, `landing_pages` ativos, `professionals` ativos: leitura pública.

## Edge functions novas

`clinicorp-sync` · `admin-users` · `create-financial-entry` · `fetch-google-reviews` (opcional) · `public-api` · `dispatch-webhook`.

## Dependências

`@dnd-kit/core` + `@dnd-kit/sortable` (Kanban) · `papaparse` + `@types/papaparse` (CSV).

## Ordem de execução

1. Refino visual (KpiCard v2, ChartFrame v2, login split, remover bloco financeiro, agenda timeline + semana/mês).
2. Migrações SQL.
3. Tratamentos CRUD.
4. Financeiro completo + auto-criação.
5. Leads Kanban.
6. Avaliações.
7. Site & Landing (com leitura no site público).
8. Relatórios + CSV.
9. Configurações modular + APIs Externas + Clinicorp + API própria + webhooks.
10. QA 375 / 768 / 1280 / 1536 e checagem de site público intacto.

## O que não muda

- Site público intacto (só ganha leitura opcional de `site_content` como override; sem cadastro, segue idêntico).
- ChatPro / WhatsApp segue funcionando.
- Identidade visual Levii preservada.
- Zero mocks: tudo lê do Supabase. Sem dado → EmptyState com CTA real.

## Observações honestas

- **Clinicorp**: estrutura completa pronta; sincroniza só após você fornecer `CLINICORP_TOKEN` e `CLINICORP_CLINIC_ID` (peço via secret na hora de ativar).
- **Google Reviews automático**: requer Google Places API Key (peço via secret se quiser). Sem ela, import manual.
- **2FA**: usa o nativo do Supabase Auth.
- **API própria + Webhooks**: 100% funcionais.
