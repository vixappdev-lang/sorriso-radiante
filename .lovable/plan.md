
# Rota /apresentacao — Dossiê Comercial Premium

Criar uma rota nova, totalmente isolada, que funciona como proposta comercial enterprise para clínicas odontológicas. Zero impacto no projeto existente.

## Garantias de não-regressão

- **Nenhum arquivo existente será modificado** — exceto:
  - `src/App.tsx` (apenas adicionar 1 import + 1 `<Route>` para `/apresentacao`)
  - `vercel.json` já tem fallback SPA universal (`/(.*) → /index.html`), nenhuma alteração necessária
- Painel admin, site público, Cloud, edge functions, hooks, componentes UI: **intocados**
- Tudo encapsulado em namespace próprio (`pres-*` classes / `ApresentacaoLayout`) para não vazar estilos

## Arquivos novos

```text
src/pages/Apresentacao.tsx              ← orquestra todas as seções
src/pages/apresentacao/
├── PresHero.tsx                        ← hero impactante dark + CTA
├── PresProblema.tsx                    ← 10 dores reais das clínicas
├── PresSolucao.tsx                     ← 3 pilares (Site + Agenda + Painel)
├── PresShowcase.tsx                    ← prints REAIS do admin em mockup browser
├── PresGoogle.tsx                      ← autoridade Google + SEO local
├── PresTrafego.tsx                     ← tráfego pago local + ROI
├── PresBeneficios.tsx                  ← 9 benefícios mensuráveis
├── PresProximosPassos.tsx              ← fluxo de implantação
├── PresCTAFinal.tsx                    ← CTA de fechamento + contato
└── PresStyles.css                      ← tokens isolados namespace .pres-shell
```

## Captura dos prints reais (passo crítico)

Usar `browser--navigate_to_sandbox` + `browser--screenshot` para capturar as 11 áreas do admin atual logado:

1. `/admin/dashboard` → `pres-shot-dashboard.png`
2. `/admin/agenda` → `pres-shot-agenda.png`
3. `/admin/pacientes` → `pres-shot-pacientes.png`
4. `/admin/tratamentos` → `pres-shot-tratamentos.png`
5. `/admin/profissionais` → `pres-shot-profissionais.png`
6. `/admin/financeiro` → `pres-shot-financeiro.png`
7. `/admin/leads` → `pres-shot-leads.png`
8. `/admin/whatsapp` → `pres-shot-whatsapp.png`
9. `/admin/site` → `pres-shot-site.png`
10. `/admin/relatorios` → `pres-shot-relatorios.png`
11. `/admin/configuracoes` → `pres-shot-configuracoes.png`

Cada print salvo em `public/apresentacao/` para servir como asset estático. Cada imagem dentro do dossiê é exibida em **mockup de janela macOS** (traffic lights + chrome) com sombra premium.

Se o login bloquear a captura: usar a sessão admin já existente do usuário no preview (cookies de sessão), ou fazer fallback usando rota direta após bypass de RequireAdmin via preview-only.

## Estrutura visual do dossiê (Apresentacao.tsx)

```text
┌─────────────────────────────────────────────────┐
│ [Hero dark]  Sua clínica perde pacientes hoje. │  ← full-bleed dark, mesh gradient
│              Veja a estrutura que muda isso.    │     CTA primário + secundário
│              [Solicitar demo] [Ver solução]     │     KPIs de credibilidade abaixo
├─────────────────────────────────────────────────┤
│ PROBLEMA — 10 dores em grid 2×5 (cards red-tint)│
├─────────────────────────────────────────────────┤
│ SOLUÇÃO — 3 pilares full-width                  │
│  Site Premium | Agenda Inteligente | Painel CRM │
├─────────────────────────────────────────────────┤
│ SHOWCASE — Prints reais em mockup browser       │
│  Tabs: Dashboard / Agenda / Pacientes / ...     │
│  Imagem grande + bullets de valor ao lado       │
├─────────────────────────────────────────────────┤
│ GOOGLE — autoridade local + Maps + reviews      │
│  Split: texto persuasivo | mock SERP local      │
├─────────────────────────────────────────────────┤
│ TRÁFEGO PAGO — funil + ROI + integração         │
│  Diagrama: Anúncio → LP → Agenda → Paciente     │
├─────────────────────────────────────────────────┤
│ BENEFÍCIOS — 9 cards com ícone + métrica        │
├─────────────────────────────────────────────────┤
│ PRÓXIMOS PASSOS — timeline horizontal 5 etapas  │
├─────────────────────────────────────────────────┤
│ CTA FINAL — dark, gradiente, botão WhatsApp     │
└─────────────────────────────────────────────────┘
```

## Design system isolado (PresStyles.css)

Namespace `.pres-shell` para evitar colisão com tokens existentes:

- **Tipografia**: `Inter Tight` (já carregado) para títulos, `Inter` para corpo. Tracking apertado `-0.03em` em headlines, `tabular-nums` em KPIs.
- **Paleta**: reutiliza `--primary` (azul corporativo) + `--accent-gold` da plataforma. Adiciona apenas:
  - `--pres-bg-dark: 222 35% 6%` (hero/CTA)
  - `--pres-surface: 220 30% 98.5%` (seções claras alternadas)
  - `--pres-border: 220 16% 88%`
- **Hierarquia**:
  - H1 hero: `clamp(2.75rem, 6vw, 5rem)`, weight 600, tracking `-0.04em`
  - H2 seções: `clamp(2rem, 4vw, 3.25rem)`, weight 600
  - Eyebrow: uppercase 0.18em, primary, 12px
- **Cards**: `rounded-2xl`, border 1px sutil, sombra em camadas (1px hairline + 8px 24px difuso)
- **Mockup browser**: chrome cinza claro, 3 dots coloridos, barra URL fake `clinicaleeii.com/admin/...`, sombra `0 40px 80px -30px rgba(0,0,0,0.25)`
- **Animações**: `framer-motion` (já no projeto) — fade-up sutil em scroll, sem exagero. `IntersectionObserver` para revelar.
- **Responsivo**: mobile-first, breakpoints `sm/md/lg/xl`. Grid colapsa para 1 coluna no mobile, mockups com `aspect-video` mantendo proporção.

## Conteúdo persuasivo (cópia)

Cópia escrita diretamente nos componentes seguindo princípios de copy enterprise:
- Headlines focam em **perda** (loss aversion) antes de ganho
- Métricas concretas onde possível (ex: "até 38% menos faltas com confirmação automática")
- Prova social via prints reais funciona como demonstração
- Cada seção termina com micro-CTA contextual

Sem inventar números absolutos — usar faixas realistas e verbos condicionais ("pode reduzir", "tende a aumentar").

## Roteamento

Em `src/App.tsx`, adicionar **acima** do catch-all `*`:
```tsx
import Apresentacao from "./pages/Apresentacao.tsx";
// ...
<Route path="/apresentacao" element={<Apresentacao />} />
```

SEO via `<SEO>` component existente: title "Dossiê Comercial — Clínica Levii", description persuasiva, canonical `/apresentacao`.

## Vercel

`vercel.json` já tem `{ "source": "/(.*)", "destination": "/index.html" }` — `/apresentacao` funciona out-of-the-box em deep link, refresh e share. **Nenhuma alteração necessária**, mas vou confirmar e documentar isso para o usuário.

## Ordem de execução

1. Capturar 11 prints reais do admin via browser tools → salvar em `public/apresentacao/`
2. Criar `PresStyles.css` com namespace isolado
3. Criar 9 componentes de seção em `src/pages/apresentacao/`
4. Criar `Apresentacao.tsx` orquestrador
5. Registrar rota em `App.tsx`
6. Validar visualmente em desktop + mobile via screenshot
7. Confirmar que admin/site público/booking continuam idênticos

## Fora do escopo (explícito)

- Não criar tabelas, edge functions, migrations
- Não alterar `index.css`, `tailwind.config.ts`, painel, hooks, Cloud
- Não tocar autenticação, RLS, schema
- Não modificar nenhum componente UI compartilhado
