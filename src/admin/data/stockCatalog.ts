// Catálogo padrão de itens odontológicos para autocompletar o cadastro.
// Cada item já vem com unidade, categoria, mínimo sugerido, custo médio e visual
// (cor + emoji/ícone) — funciona como "imagem" leve, sem depender de geração externa.

export type StockCatalogItem = {
  key: string;
  name: string;
  category: string;
  unit: string;
  min_qty: number;
  cost_cents: number;
  emoji: string;
  /** HSL hue para gerar gradiente da "imagem". */
  hue: number;
  description?: string;
};

export const STOCK_CATALOG: StockCatalogItem[] = [
  // ===== EPI / Descartáveis =====
  { key: "luva-procedimento", name: "Luva de procedimento (caixa)", category: "EPI", unit: "cx", min_qty: 5, cost_cents: 4500, emoji: "🧤", hue: 215 },
  { key: "mascara-cirurgica", name: "Máscara cirúrgica tripla", category: "EPI", unit: "cx", min_qty: 3, cost_cents: 2500, emoji: "😷", hue: 200 },
  { key: "mascara-pff2", name: "Máscara PFF2/N95", category: "EPI", unit: "un", min_qty: 20, cost_cents: 350, emoji: "😷", hue: 220 },
  { key: "touca-descartavel", name: "Touca descartável", category: "EPI", unit: "cx", min_qty: 2, cost_cents: 1800, emoji: "🩹", hue: 190 },
  { key: "babador-descartavel", name: "Babador descartável paciente", category: "EPI", unit: "pct", min_qty: 5, cost_cents: 1200, emoji: "👕", hue: 210 },
  { key: "oculos-protecao", name: "Óculos de proteção", category: "EPI", unit: "un", min_qty: 4, cost_cents: 2500, emoji: "🥽", hue: 195 },
  { key: "campo-cirurgico", name: "Campo cirúrgico estéril", category: "EPI", unit: "un", min_qty: 10, cost_cents: 600, emoji: "🟦", hue: 215 },

  // ===== Anestesia =====
  { key: "anestesico-tubete", name: "Anestésico em tubete", category: "Anestesia", unit: "cx", min_qty: 2, cost_cents: 9000, emoji: "💉", hue: 25 },
  { key: "agulha-gengival", name: "Agulha gengival descartável", category: "Anestesia", unit: "cx", min_qty: 2, cost_cents: 4500, emoji: "🪡", hue: 220 },
  { key: "seringa-carpule", name: "Seringa carpule", category: "Anestesia", unit: "un", min_qty: 3, cost_cents: 4800, emoji: "💉", hue: 210 },
  { key: "anestesico-topico", name: "Anestésico tópico (gel)", category: "Anestesia", unit: "un", min_qty: 5, cost_cents: 2200, emoji: "🧴", hue: 280 },

  // ===== Algodão / Curativo =====
  { key: "rolo-algodao", name: "Rolo de algodão odontológico", category: "Curativo", unit: "pct", min_qty: 10, cost_cents: 800, emoji: "🟫", hue: 35 },
  { key: "gaze-esteril", name: "Gaze estéril", category: "Curativo", unit: "pct", min_qty: 10, cost_cents: 600, emoji: "🩹", hue: 30 },
  { key: "sugador-descartavel", name: "Sugador descartável", category: "Curativo", unit: "pct", min_qty: 10, cost_cents: 1500, emoji: "💧", hue: 195 },
  { key: "fio-sutura", name: "Fio de sutura com agulha", category: "Curativo", unit: "un", min_qty: 5, cost_cents: 1800, emoji: "🪡", hue: 270 },

  // ===== Restauração =====
  { key: "resina-composta", name: "Resina composta (seringa)", category: "Restauração", unit: "un", min_qty: 4, cost_cents: 12000, emoji: "🦷", hue: 50 },
  { key: "acido-condicionante", name: "Ácido fosfórico 37%", category: "Restauração", unit: "un", min_qty: 2, cost_cents: 2500, emoji: "🧪", hue: 200 },
  { key: "adesivo-dentario", name: "Adesivo dentário (bond)", category: "Restauração", unit: "un", min_qty: 2, cost_cents: 4500, emoji: "🧴", hue: 0 },
  { key: "cimento-ionomero", name: "Ionômero de vidro", category: "Restauração", unit: "kit", min_qty: 1, cost_cents: 9500, emoji: "🧱", hue: 40 },
  { key: "matriz-metalica", name: "Matriz metálica", category: "Restauração", unit: "pct", min_qty: 3, cost_cents: 1500, emoji: "🔘", hue: 215 },
  { key: "cunha-madeira", name: "Cunha de madeira", category: "Restauração", unit: "pct", min_qty: 3, cost_cents: 700, emoji: "🪵", hue: 30 },

  // ===== Endodontia =====
  { key: "lima-endodontica", name: "Lima endodôntica K-File", category: "Endodontia", unit: "kit", min_qty: 2, cost_cents: 6500, emoji: "📏", hue: 350 },
  { key: "cone-papel-absorvente", name: "Cone de papel absorvente", category: "Endodontia", unit: "cx", min_qty: 2, cost_cents: 2500, emoji: "📄", hue: 0 },
  { key: "guta-percha", name: "Cone de guta percha", category: "Endodontia", unit: "cx", min_qty: 2, cost_cents: 3500, emoji: "🟧", hue: 15 },
  { key: "hipoclorito-sodio", name: "Hipoclorito de sódio", category: "Endodontia", unit: "un", min_qty: 2, cost_cents: 1500, emoji: "🧪", hue: 100 },
  { key: "eugenol", name: "Eugenol", category: "Endodontia", unit: "un", min_qty: 1, cost_cents: 2200, emoji: "💧", hue: 35 },

  // ===== Instrumentais / Brocas =====
  { key: "broca-alta-rotacao", name: "Broca alta rotação diamantada", category: "Instrumental", unit: "kit", min_qty: 1, cost_cents: 4500, emoji: "🔩", hue: 215 },
  { key: "broca-baixa-rotacao", name: "Broca baixa rotação", category: "Instrumental", unit: "kit", min_qty: 1, cost_cents: 3500, emoji: "🔩", hue: 220 },

  // ===== Moldagem =====
  { key: "moldeira-descartavel", name: "Moldeira descartável", category: "Moldagem", unit: "pct", min_qty: 5, cost_cents: 1800, emoji: "🥄", hue: 210 },
  { key: "alginato", name: "Alginato (sache)", category: "Moldagem", unit: "un", min_qty: 3, cost_cents: 2200, emoji: "🥣", hue: 330 },
  { key: "silicone-moldagem", name: "Silicone de moldagem", category: "Moldagem", unit: "kit", min_qty: 1, cost_cents: 9000, emoji: "🩷", hue: 320 },

  // ===== Higiene / Profilaxia =====
  { key: "pasta-profilatica", name: "Pasta profilática", category: "Profilaxia", unit: "un", min_qty: 2, cost_cents: 1800, emoji: "🪥", hue: 180 },
  { key: "fluor-gel", name: "Flúor gel tópico", category: "Profilaxia", unit: "un", min_qty: 3, cost_cents: 1500, emoji: "🦷", hue: 270 },
  { key: "clorexidina-bochecho", name: "Clorexidina 0,12% bochecho", category: "Profilaxia", unit: "un", min_qty: 2, cost_cents: 2200, emoji: "💧", hue: 195 },

  // ===== Brindes paciente =====
  { key: "escova-dental-brinde", name: "Escova de dentes (brinde)", category: "Brinde", unit: "un", min_qty: 30, cost_cents: 250, emoji: "🪥", hue: 215 },
  { key: "fio-dental-brinde", name: "Fio dental (brinde)", category: "Brinde", unit: "un", min_qty: 30, cost_cents: 200, emoji: "🧵", hue: 290 },
];

export function getCatalogItem(key: string) {
  return STOCK_CATALOG.find((i) => i.key === key) ?? null;
}

/** Gera um background SVG (data URL) com gradiente + emoji centralizado.
 *  Usado quando o item não tem `image_url` próprio. */
export function generateItemImageDataUrl(emoji: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320" viewBox="0 0 800 320">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue}, 80%, 96%)"/>
        <stop offset="100%" stop-color="hsl(${hue}, 60%, 86%)"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stop-color="hsl(${hue}, 80%, 100%)" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="hsl(${hue}, 60%, 90%)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="320" fill="url(#bg)"/>
    <circle cx="400" cy="160" r="180" fill="url(#glow)"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="180">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
