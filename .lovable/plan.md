

# Plano — Onda V4: WhatsApp VPS, Booking Quiz, Tipografia, Auto-cancel

## 1. Tipografia premium (estilo apps modernos)

Adotar o stack que apps top usam (Stripe, Linear, Vercel, Notion):
- **Primária**: `Inter` (já carregada) + `Inter Tight` para títulos — substitui Playfair/Montserrat na Área do Cliente, Booking, Review.
- Carregar `Inter Tight` no `index.html` (Google Fonts).
- No Tailwind, criar classe `font-app` (Inter Tight) para aplicar **somente** nas páginas públicas/cliente — admin e site institucional permanecem inalterados (zero quebra visual).
- Tracking ajustado (`-0.02em` em headings) e features OpenType (`cv11`, `ss01`) ativadas via `font-feature-settings` no CSS — visual igual ao Linear/Vercel.

## 2. Área do Cliente — refino profissional

Manter estrutura, refinar superfície:
- Sidebar com ícones maiores, labels `Inter Tight 600`, indicador ativo em barra lateral azul + bg suave.
- Topbar com avatar real (iniciais sobre gradiente), notificação bell (placeholder).
- Cards com sombra `shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.04)]` (estilo Stripe), border `border-slate-200/70`.
- Home: hero saudação dinâmica ("Bom dia, Lucas"), card de próxima consulta destacado com countdown, atalhos em grid (Agendar, Faturas, Histórico, Suporte).
- Estados vazios ilustrados (não só ícone solto).
- Mobile: bottom nav fixo com 5 ícones (Apple-like).

## 3. Avaliação pública — redesign moderno

- Fundo: gradiente sutil `from-slate-50 via-white to-blue-50/40` + blob decorativo blur.
- Card central com `backdrop-blur` + borda gradiente 1px.
- Estrelas: tamanho `h-12`, animação spring on hover, glow dourado quando preenchidas.
- Tipografia hierarquizada (Inter Tight 36px / 18px / 14px).
- Após enviar: confete sutil (CSS) + card sucesso com avatar do profissional.
- Footer com logo + selo "powered by Clínica Levii".

## 4. Agendamento público — formato Quiz (4 etapas)

Substituir layout 2-colunas por **stepper vertical** estilo Typeform/Cal.com:

```text
┌─────────────────────────────────────────────┐
│  ●─────●─────○─────○      [×]               │
│  Tratamento  Pro  Data/Hora  Confirmação    │
├─────────────────────────────────────────────┤
│  [conteúdo da etapa atual — fade transition]│
│                                             │
│              [Voltar]  [Continuar →]        │
└─────────────────────────────────────────────┘
```

Etapas:
1. **Tratamento** — cards visuais clicáveis (ícone + nome + duração).
2. **Profissional** — cards com foto + especialidade.
3. **Data & Horário** — calendário grande + grid de horários (slots ocupados riscados).
4. **Seus dados + Confirmação** — form + resumo lateral grudado, botão "Confirmar agendamento".

Animação de transição entre etapas (fade-slide), barra de progresso topo, botão "Voltar" sempre disponível, validação por etapa antes de avançar.

## 5. WhatsApp — Aba refeita (ChatPro + VPS própria)

### 5.1 Pesquisa de bibliotecas gratuitas (resultado)

Avaliei alternativas **100% gratuitas, não-oficiais, self-hosted**:

| Lib | Base | Estabilidade | Veredito |
|---|---|---|---|
| **Baileys** (`@whiskeysockets/baileys`) | WebSocket Multi-Device direto (sem Chromium) | **Excelente** — mantida ativamente, usada em produção por milhares | ✅ **Escolhida** |
| whatsapp-web.js | Puppeteer/Chromium | Pesada (1GB RAM), cai com updates do WA Web | ❌ |
| venom-bot | Puppeteer | Abandonware parcial | ❌ |
| wppconnect | Puppeteer | Boa, mas pesada | ❌ |

**Baileys** é a melhor opção: leve (~80MB RAM), sem browser, sessão persistente em arquivo, suporta MD (multi-device), envio/recebimento de mídia, grupos, status de leitura. Compatível com PM2 para 24/7 sem cair.

### 5.2 Arquitetura

```text
┌─────────────────┐  HTTPS+JWT   ┌──────────────────┐
│  Painel Levii   │ ───────────► │  VPS (Node+Bail) │
│ (Edge Function) │ ◄─────────── │   PM2 + Nginx    │
└─────────────────┘   webhooks   └──────────────────┘
        │                                  │
        ▼                                  ▼
   Supabase DB                      session/ (auth)
```

### 5.3 Entregáveis

**A) Script da VPS (`vps-whatsapp/`)** — pasta nova no repo, pronta pra `git clone` na VPS:
- `server.js`: Express + Baileys, endpoints `/qr`, `/status`, `/send`, `/disconnect`, `/webhook-out`. Auth via Bearer token (gerado no painel).
- `ecosystem.config.js`: PM2 com restart automático, logs rotativos, memory limit.
- `install.sh`: instala Node 20, PM2, Nginx + Certbot, configura firewall, cria systemd, gera token.
- `README.md`: passo-a-passo Ubuntu 22.04 (5 min de setup).
- Retry exponencial em desconexões, salva sessão em `auth/` (Baileys multi-file), reconexão automática, dedup de mensagens.

**B) Aba WhatsApp do painel — reorganizada em 3 sub-abas separadas** (config nunca interfere na conexão):

```text
┌─ Conexão ──┬─ Configuração ──┬─ Campanhas ──┐
│ ChatPro    │ Templates       │ Cobranças    │
│ VPS Própria│ Webhook URL     │ Aniversários │
│ QR + Status│ Auto-cancel ✓   │ Reativação   │
└────────────┴─────────────────┴──────────────┘
```

- **Conexão**: card duplo (ChatPro / VPS), seletor "provedor ativo" (radio), QR live, status pulsante, botão desconectar.
- **Configuração**: templates de mensagem (`{{nome}}`, `{{data}}`, `{{hora}}`, `{{tratamento}}`) com preview, switches de eventos (confirmação, lembrete 24h, cancelamento, pós-consulta).
- **Campanhas**: lista de campanhas com tipo (cobrança / aniversário / reativação), filtros de público (status fatura, dias inativos), agendamento, dry-run, métricas (enviadas/entregues/respostas).

**C) Edge Functions novas**:
- `whatsapp-gateway`: roteia envios para o provedor ativo (ChatPro ou VPS), com fallback.
- `whatsapp-vps-proxy`: proxy autenticado para a VPS (mantém token server-side).
- `whatsapp-campaigns-run`: cron que dispara campanhas elegíveis.

**D) Tabelas novas**:
- `whatsapp_providers` (id, type, config jsonb, active, status, last_seen)
- `whatsapp_campaigns` (id, name, type, template, audience_filter jsonb, schedule, active, stats)
- `whatsapp_messages_log` (id, provider, to, template, status, sent_at, response)

## 6. Auto-cancel no WhatsApp (Agenda)

Trigger no painel: ao mudar status para `cancelled`, dispara `whatsapp-gateway` com template de cancelamento (do provedor ativo). Edge function:

```text
on cancel(appt) →
  provider = active_provider()
  template = settings.cancel_template
  msg = render(template, appt)
  provider.send(appt.phone, msg)
  log + toast no painel
```

Fallback: se VPS off, usa ChatPro; se ambos off, marca log "skipped".

## 7. Agenda — refino visual (lista inferior)

- Linha do tempo (DayTimeline) com **rail vertical** azul à esquerda e cards "flutuantes" ao lado de cada hora.
- Status pills coloridas com ponto pulsante para `pending`.
- Separador horário com label sticky.
- Hover revela ações inline (confirmar/cancelar/whatsapp) sem precisar abrir drawer.
- Lista de "Próximos agendamentos" embaixo: tabela compacta com avatares + status + ações rápidas.

## 8. Detalhes técnicos

- **Fonts**: adicionar `Inter Tight` ao link do Google Fonts no `index.html`.
- **Tailwind**: nova chave `fontFamily.app` = Inter Tight; classe `font-app` aplicada via wrapper nas rotas `/area-cliente`, `/agendar/*`, `/avaliar/*`.
- **Migrations**: 3 tabelas novas + índices (provider+to, campaign_id+status).
- **Secrets**: `VPS_WHATSAPP_URL`, `VPS_WHATSAPP_TOKEN` (pedidos via `add_secret` somente após VPS provisionada — instruído no README).
- **VPS pasta**: `vps-whatsapp/` com README detalhado; nada quebra no deploy do site (pasta ignorada pelo Vite).
- **Validação**: `tsc --noEmit` + lint após cada onda.

## 9. Ordem de execução (sem bagunçar)

1. Tipografia (fonts + tokens) — base visual.
2. Avaliação pública redesign.
3. Booking quiz multi-step.
4. Área do Cliente refino + bottom nav mobile.
5. Migrations WhatsApp + Edge functions gateway.
6. Aba WhatsApp 3 sub-abas + UI Campanhas.
7. Pasta `vps-whatsapp/` (Baileys + PM2 + install.sh + README).
8. Auto-cancel hook na Agenda.
9. Refino visual DayTimeline + lista.

Cada passo validado isoladamente antes do próximo. Zero alteração no admin atual fora dos pontos pedidos.

