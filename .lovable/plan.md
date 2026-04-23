
# Plano: Site Clínica Levii

Site multi-página completo de clínica odontológica em **português brasileiro**, 100% responsivo (mobile, tablet, desktop), visual altamente profissional com toques sutis de **glassmorphism** (sem neon, sem brilhos exagerados). Integração WhatsApp via **ChatPro** para confirmação automática de agendamentos.

## Direção visual

- **Tema híbrido**:
  - Hero da Home em **dark mode** premium (preto profundo `#0a0a0a` + azul corporativo `#2563eb`), com cartões em vidro fosco sutil (backdrop-blur leve, borda 1px branca a 8% de opacidade).
  - Demais seções e páginas em **light mode clínico** (branco, cinzas suaves, azul como cor de marca, dourado discreto como acento).
- **Glass sutil**: aplicado em header sticky, cards de tratamento em hover, modal de agendamento e botão flutuante WhatsApp. Blur de 12-16px, opacidade controlada, **nada de neon ou glow saturado**.
- **Tipografia**: Montserrat (Google Fonts) — 600/700 para títulos, 400/500 para corpo. Hierarquia 48-64 / 32-40 / 24-28 / 16-18 px.
- **Microinterações**: Framer Motion — fade + translate-y de 20px no scroll, hover scale 1.02 em botões, transições de 200-300ms. Sem efeitos chamativos.
- **Tom de voz**: brasileiro próximo, "você", foco em confiança, segurança, transformação do sorriso.

## Responsividade (obrigatória 100%)

- **Mobile-first** com breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`.
- Menu hamburger em mobile (drawer Shadcn), menu horizontal em desktop.
- Grids adaptativos: 1 col mobile → 2 cols tablet → 3-4 cols desktop.
- Áreas de toque mínimas de 44px, fontes fluidas com `clamp()`.
- Imagens responsivas com `srcset` e lazy loading.
- Modais e formulários full-screen em mobile, centralizados em desktop.
- Teste visual em 375px, 768px e 1280px+ antes da entrega.

## Estrutura (10 rotas)

```text
/                Home (hero dark + seções claras)
/sobre           História, missão, valores, diferenciais
/tratamentos     Grid de tratamentos detalhados
/equipe          Perfil dos dentistas
/tecnologia      Equipamentos e diferenciais técnicos
/galeria         Antes/depois e ambiente
/servicos        Lista completa com faixas de preço
/localizacao     Mapa + horários
/contato         Formulário + WhatsApp + redes
/config          Painel admin ChatPro (protegido por senha)
```

**Agendamento em modal** acessível por qualquer CTA "Agendar consulta" do site (não é rota separada). Header sticky, footer rico, botão flutuante WhatsApp em todas as páginas.

## Conteúdo placeholder realista

- **Tratamentos**: Implantes, Clareamento a Laser, Ortodontia (alinhadores invisíveis), Lentes de Contato Dental, Endodontia, Harmonização Orofacial, Odontopediatria, Próteses, Periodontia, Emergência 24h.
- **Equipe**: 4 dentistas fictícios com nome, CRO, especialidade, formação e foto placeholder profissional.
- **Depoimentos**: 6 depoimentos brasileiros persuasivos com nomes e cidades realistas.
- **Headlines exemplo**: *"O sorriso que você sempre quis está mais perto do que imagina"*, *"Tecnologia de ponta, atendimento humano, resultados que duram"*.

## Modal de Agendamento

Acionado por todos os CTAs principais. Etapas em uma tela única (responsiva, vira tela cheia em mobile):
1. Tratamento desejado (select)
2. Profissional preferido (opcional)
3. Data e horário sugeridos
4. Nome, telefone (com máscara BR), e-mail
5. Botão "Confirmar agendamento"

Validação client-side com **Zod** + React Hook Form. Tela de sucesso com resumo e botão WhatsApp direto.

## Integração ChatPro (WhatsApp)

Backend via **Lovable Cloud** (Supabase) — necessário para guardar credenciais com segurança e persistir agendamentos.

### Rota `/config` (painel admin)
Protegida por senha (verificada server-side via edge function, nunca no client).

Campos do formulário:
- **Instance ID** (instância ChatPro)
- **Token / API Key**
- **Endpoint base** (ex.: `https://v5.chatpro.com.br`)
- **Número padrão da clínica**
- **Mensagem template** com variáveis `{{nome}}`, `{{data}}`, `{{hora}}`, `{{tratamento}}`

Ações:
- **Salvar configuração** → grava em tabela `chatpro_config`
- **Gerar QR Code** → chama edge function que aciona endpoint ChatPro e exibe QR escaneável
- **Verificar status** → polling mostrando *Desconectado* / *Aguardando QR* / *Conectado* (badge com cor)
- **Desconectar instância**
- **Enviar mensagem de teste**

### Fluxo de agendamento
1. Visitante envia o modal.
2. Edge function `create-appointment`:
   - Valida com Zod
   - Salva em tabela `appointments`
   - Chama ChatPro `/send_message` enviando confirmação para o telefone do paciente
   - Envia notificação para o número da clínica
3. Modal mostra tela de sucesso com resumo.

### Tabelas (Lovable Cloud)
- `chatpro_config` — singleton (id fixo) com credenciais, endpoint, template
- `appointments` — id, nome, telefone, email, tratamento, profissional, data, hora, status, criado_em
- **RLS**: leitura/escrita apenas via edge functions (service role). Painel `/config` autentica via senha → edge function valida.

### Edge functions
- `chatpro-save-config` — valida e salva credenciais (requer senha admin)
- `chatpro-qrcode` — gera/retorna QR Code
- `chatpro-status` — consulta status da instância
- `chatpro-test-message` — envia mensagem de teste
- `create-appointment` — cria agendamento + dispara confirmação WhatsApp
- `admin-login` — valida senha admin e retorna token de sessão

## Detalhes técnicos

- **Stack**: React 18 + TypeScript + Vite + Tailwind + Shadcn/UI + Framer Motion + React Hook Form + Zod + Lucide Icons + React Router + TanStack Query.
- **Design tokens** em `index.css` (HSL) e `tailwind.config.ts` — variantes light/dark, classe `.glass` reutilizável.
- **SEO**: componente `<SEO>` por página, sitemap.xml, robots.txt, JSON-LD `Dentist` schema na Home.
- **Acessibilidade WCAG AA**: contraste ≥4.5:1, focus visible, alt text, navegação por teclado, ARIA labels.
- **Performance**: lazy loading de imagens, code splitting por rota, fontes com `display: swap`.
- **WhatsApp flutuante**: link `wa.me` com mensagem pré-preenchida.
- **Imagens**: placeholders Unsplash (clínica odontológica, dentistas, sorrisos) com lazy loading.
- **Senha admin**: armazenada como secret `ADMIN_PASSWORD` no Lovable Cloud, validada server-side.

## Ordem de implementação

1. Design system (cores, fontes, tokens, classe `.glass`) + Header, Footer, WhatsApp flutuante, layout base 100% responsivo
2. Home completa (hero dark + seções claras + modal de agendamento)
3. Páginas institucionais (Sobre, Tratamentos, Equipe, Tecnologia, Galeria, Serviços, Localização, Contato)
4. Ativar Lovable Cloud + criar tabelas + RLS + edge functions ChatPro
5. Página `/config` (painel admin com login, QR Code, status, teste)
6. Modal de agendamento integrado ao backend (salva + dispara WhatsApp)
7. SEO, sitemap, polish final, QA visual em 375 / 768 / 1280px

## O que vou pedir depois

- Logotipo da Clínica Levii (se tiver) — senão crio um wordmark elegante
- Telefone, endereço e Instagram reais (ou uso placeholders coerentes)
- Credenciais ChatPro (Instance ID, Token, Endpoint) — você cola direto no `/config` quando estiver pronto
- Senha de admin para proteger o `/config`
