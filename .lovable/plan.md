
# Plano — Painel LyneCloud (correções + novas features pesadas)

Trabalho dividido em 6 frentes. Cada uma é entregável independente, sem mexer no design existente.

---

## 1. UI global — scrollbar transparente em todo o painel

Em `src/index.css`, adicionar regra escopo `.admin-shell` (não vaza pro site):

- `*::-webkit-scrollbar { width: 0; height: 0; }` (Chrome/Safari/Edge)
- `* { scrollbar-width: none; }` (Firefox)
- Mantém scroll funcional, só esconde o trilho. Aplicado também aos `<aside>`, `nav`, `main`, drawers e modais do admin.

---

## 2. Leads / Captação — Kanban funcional

Problema raiz: o `useDraggable` do dnd-kit aplica `transform` no card mas o `KanbanColumn` é um `flex flex-col` com `overflow-y-auto`, e como o sensor está no botão `<GripVertical>` (que tem `onClick stopPropagation`), o gesto de pointer não chega aos `listeners` do dnd-kit em mobile/desktop. Além disso, o status do card é cache otimista do React Query e ao soltar o backend grava mas o UI reverte se a invalidação chega antes do retorno.

**Correções:**
- Remover o "handle" e fazer **o card inteiro** ser arrastável (com `useSortable` para poder reordenar dentro da coluna também).
- Trocar `PointerSensor` por `MouseSensor + TouchSensor` separados, com `activationConstraint: { delay: 120, tolerance: 6 }` no touch (melhor em mobile) e `distance: 4` no mouse.
- Aplicar **update otimista** no React Query antes do `await` (evita o "card volta") e fazer o `mutate` enviar **só** `{ id, status, last_touch_at }` (não reenviar `name` que pode sobrescrever dados).
- Garantir `cancelDrop` quando solto fora de coluna.
- Adicionar feedback visual: coluna alvo ganha borda azul + shadow durante hover; card no overlay com leve rotação.
- Botão de WhatsApp e link clicável dentro do card precisam de `onPointerDown stopPropagation` para não disparar drag.

Resultado: arrastar do desktop e mobile funciona 100%, status atualiza imediatamente sem bug de reversão.

---

## 3. Agenda — refinar cards (sem bagunçar layout)

Atual: cards com cores `bg-amber-50 / bg-blue-50` muito claras → texto some no celular.

**Mudanças no `STATUS_BG` e no `DayTimeline`:**
- Subir saturação dos backgrounds (ex: `bg-amber-100` no lugar de `50`) e aplicar **borda lateral colorida grossa** (4px) usando o accent do status.
- Texto principal sempre `text-slate-900`; subtítulo `text-slate-600` (em vez de `opacity-75` que perde contraste).
- Hora ganha um chip `bg-white/80 backdrop-blur` para destacar.
- Mantém hover-translate e shadow já existentes.
- Mobile: aumentar `min-h-[80px]` e empilhar info em 2 linhas com gap claro.

WeekGrid e MonthCalendar recebem o mesmo refinamento de contraste.

---

## 4. Pacientes — CRUD completo + gerenciamento profundo

A página hoje só lista pacientes derivados de `appointments`. Vai virar um módulo completo, mas mantendo a tabela atual.

**Novidades (dentro do mesmo arquivo + um drawer maior):**
- Botão **"+ Novo paciente"** no header → abre drawer de criação que insere em `patient_accounts` (campos: nome, telefone, email, CPF, data nascimento, endereço estruturado, foto via storage `patient-avatars`, observações).
- Tabela passa a unir **`patient_accounts` + pacientes derivados de appointments** (dedup por telefone), exibindo badge "Cadastrado" vs "Só agendou".
- Drawer de detalhes ganha:
  - Aba **Cadastro** (editar todos os campos, upload de foto, salvar).
  - Aba **Odontograma** (nova tabela `patient_odontogram` — esquema dental SVG simples 32 dentes, clique marca status: hígido / cariado / restaurado / extraído / a tratar; salva em jsonb).
  - Aba **Orçamento rápido** (nova tabela `patient_quotes`: monta linhas a partir de `treatments_overrides` com qtd e desconto; gera total e link público de aceite — slug + token).
  - Aba **Histórico** (já existe, mantém).
  - Aba **Financeiro** (já existe, ganha botão "Gerar cobrança" que cria em `financial_entries`).
  - Aba **Notas** (já existe).
- Editar / excluir paciente direto na tabela (com `ConfirmDialog`).

---

## 5. Quatro features clínicas pedidas

### 5.1 Pré-pagamento no agendamento
Tabela nova `appointment_payments` (id, appointment_id, amount_cents, status, provider, link, paid_at).
- No fluxo `create-appointment` (edge function existente) e em "Novo encaixe", se o tratamento tiver `requires_prepayment = true` (campo novo em `treatments_overrides`), gera um link de pagamento Pix simulado/configurável e bloqueia confirmação até `status='paid'`.
- Painel mostra badge "Pré-pago" no card da agenda.
- Para MVP funcional: gerar QR Pix estático com chave configurável em `clinic_settings` (`pix_key`, `pix_merchant`) usando lib `pix-utils` no client.

### 5.2 Odontograma + Orçamento rápido
Coberto na aba do paciente (item 4). Tabelas `patient_odontogram` e `patient_quotes` + link público `/orcamento/:token` (página standalone com aceite que muda status para `accepted` e dispara WhatsApp de confirmação).

### 5.3 Split de comissão automático
Tabela `commission_rules` (professional_slug, treatment_slug nullable, percent, fixed_cents).
Tabela `commission_entries` (financial_entry_id FK, professional_slug, amount_cents, status pending/paid).
- Trigger `on_financial_entry_paid`: quando uma entry tipo `income` é marcada `paid`, calcula a comissão pela rule mais específica e cria linha em `commission_entries`.
- Nova aba em `/admin/financeiro` chamada **Comissões** lista por profissional, com botão "Marcar paga" e exporta CSV mensal.

### 5.4 Estoque básico
Tabelas `stock_items` (sku, nome, unidade, quantidade_atual, qtd_minima, custo_unitario_cents) e `stock_movements` (item_id, tipo entrada/saida/ajuste, qtd, motivo, appointment_id nullable, created_at).
- Sub-rota nova `/admin/estoque` (entra no sidebar abaixo de Tratamentos).
- Lista com KPIs (itens, abaixo do mínimo, valor total em estoque), botão "Nova entrada" e "Saída", histórico de movimentações.
- Trigger atualiza `quantidade_atual` automaticamente em insert na tabela de movimentos.

---

## 6. WhatsApp — bot conversacional com IA

Adicionar 4ª aba **"Bot/Atendimento"** dentro de `AdminWhatsApp.tsx` (junto com Eventos / Campanhas / Logs).

**Backend:**
- Tabela `whatsapp_bot_config` (id, enabled, persona, system_prompt, fallback_message, business_hours_only, model).
- Tabela `whatsapp_bot_intents` (key, label, trigger_examples text[], response_template, action enum: reply/handoff/schedule/quote).
- Tabela `whatsapp_conversations` (phone, last_message_at, status active/handed_off/closed, ai_enabled).
- Tabela `whatsapp_messages` (conversation_id, direction in/out, body, intent_matched, ai_used).

**Edge function nova `whatsapp-bot-reply`:**
- Recebe webhook do provider (Baileys/ChatPro encaminham mensagens recebidas).
- Carrega histórico (últimas 10 msg) + system_prompt + intents.
- Chama Lovable AI Gateway (`google/gemini-2.5-flash` por padrão) com tool-calling: ferramentas `agendar_consulta`, `enviar_orcamento`, `transferir_humano`, `responder`.
- Responde via `whatsapp-gateway` existente.

**Front da nova aba:**
- Card de status (bot ligado/desligado, modelo, última msg processada).
- Editor de **persona/system prompt** com 3 templates prontos:
  1. *"Atendente humanizada de clínica"* — saúda, identifica intenção (agendar, dúvida, urgência, preço), pede dados, encaminha pro humano se complexo.
  2. *"Recepcionista comercial"* — foco em conversão, sempre tenta marcar avaliação.
  3. *"Pós-venda gentil"* — confirmação, lembrete, pesquisa de satisfação.
- Lista de **intents** com triggers (oi, bom dia, preço, horário, endereço, urgência, cancelar) e resposta — todos pré-preenchidos e editáveis.
- **Toggle "modo humano-like"**: adiciona `delay 1-3s` e "digitando…" antes de responder.
- Aba **Conversas ao vivo**: lista as conversas em curso, permite admin assumir manualmente (desliga ai_enabled da conversa).
- Botão **"Restaurar templates padrão"**.

**Webhook receiver:**
- Server.js da VPS (`vps-whatsapp/server.js`) ganha `sock.ev.on("messages.upsert")` que chama `https://<projeto>.supabase.co/functions/v1/whatsapp-bot-reply` com payload normalizado.

---

## 7. Endurecimento do backend

Para não "reverter sozinho":

- **React Query**: `staleTime: 60_000` + `refetchOnWindowFocus: false` em todos os hooks admin (já tem em alguns), e mutations com `onMutate` (otimista) + `onError` (rollback) em vez de só `onSuccess invalidate`.
- **Migrations**: adicionar triggers `touch_updated_at` em todas as tabelas novas, índices em FKs (`appointment_id`, `patient_phone`, `professional_slug`).
- **Validação Zod** server-side nas edge functions novas (`whatsapp-bot-reply`, etc.).
- **Logs**: tabela `admin_audit_log` (user_id, action, entity, payload, created_at) — trigger em update/delete em `appointments`, `financial_entries`, `commission_entries`. Ajuda a rastrear "quem mudou o quê".
- **RLS**: todas as novas tabelas com `has_role(auth.uid(), 'admin')` para staff e leitura própria onde aplicável.

---

## Detalhes técnicos resumidos (devs)

- Migrations criam: `appointment_payments`, `patient_odontogram`, `patient_quotes`, `commission_rules`, `commission_entries`, `stock_items`, `stock_movements`, `whatsapp_bot_config`, `whatsapp_bot_intents`, `whatsapp_conversations`, `whatsapp_messages`, `admin_audit_log`. Mais coluna `requires_prepayment boolean default false` em `treatments_overrides`.
- Nova rota `/admin/estoque` registrada em `App.tsx` + item no `NAV_ITEMS` do `AdminSidebar`.
- Nova rota pública `/orcamento/:token` para aceite de orçamento.
- Edge functions novas: `whatsapp-bot-reply` (com `verify_jwt = false`).
- Pix: usar `pix-utils` (npm) — geração 100% client/edge, sem PSP.
- Tudo em `src/admin/pages/` segue padrão dos arquivos existentes (KpiCard, PageHeader, EntityDrawer, DataTable, ConfirmDialog).

---

## Ordem de implementação

1. Scrollbar transparente + correção do Kanban (rápido, desbloqueia uso).
2. Refino visual da Agenda.
3. Pacientes CRUD + odontograma + orçamento.
4. Migrations das 4 features clínicas + estoque + comissão + pré-pagamento.
5. WhatsApp bot completo.
6. Auditoria + endurecimento do React Query.

Sem mexer no design atual: só adições e ajustes de contraste. Ao terminar, rodo `tsc --noEmit` e testo o fluxo de drag, criação de paciente e disparo do bot.
